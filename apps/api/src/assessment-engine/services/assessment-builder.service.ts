import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssessmentSecurityService } from './assessment-security.service';
import { QuestionSelectionService } from './question-selection.service';
import { AssessmentStatus, AssessmentAttemptState, QuestionStatus } from '@prisma/client';
import { CreateAssessmentFromBlueprintDto } from '../dto/assessment-attempt-api.dto';

@Injectable()
export class AssessmentBuilderService {
  private readonly logger = new Logger(AssessmentBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: AssessmentSecurityService,
    private readonly questionSelectionService: QuestionSelectionService,
  ) {}

  /**
   * Build an assessment from a published blueprint.
   * Selects questions respecting concept distribution and difficulty distribution.
   */
  async buildFromBlueprint(dto: CreateAssessmentFromBlueprintDto) {
    const blueprint = await this.prisma.assessmentBlueprint.findUnique({
      where: { id: dto.blueprintId },
      include: { subject: true },
    });
    if (!blueprint) throw new NotFoundException(`Blueprint "${dto.blueprintId}" not found`);
    if (blueprint.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED blueprints can be used to build assessments');
    }

    const conceptDist = blueprint.conceptDistribution as Record<string, number>;
    const diffDist = blueprint.difficultyDistribution as { easy: number; medium: number; hard: number };

    // Create assessment record
    const assessment = await this.prisma.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        subjectId: blueprint.subjectId,
        blueprintId: blueprint.id,
        targetGrade: blueprint.targetGrade,
        purpose: blueprint.purpose,
        duration: blueprint.durationMinutes,
        totalMarks: blueprint.totalMarks,
        passingScore: blueprint.passingScore,
        isAdaptive: dto.isAdaptive ?? false,
        isActive: true,
      },
    });

    // Select questions per concept based on distribution
    const totalQ = blueprint.totalQuestions;
    const allSelectedIds: string[] = [];
    const questionEntries: { assessmentId: string; questionId: string; order: number }[] = [];
    let orderIndex = 1;

    for (const [conceptId, percentage] of Object.entries(conceptDist)) {
      const conceptQuestionCount = Math.round((percentage / 100) * totalQ);
      if (conceptQuestionCount === 0) continue;

      // Determine difficulty mix
      const easyCount = Math.round((diffDist.easy / 100) * conceptQuestionCount);
      const hardCount = Math.round((diffDist.hard / 100) * conceptQuestionCount);
      const mediumCount = conceptQuestionCount - easyCount - hardCount;

      const difficultyBatches = [
        { target: 2, count: easyCount },
        { target: 3, count: mediumCount },
        { target: 4, count: hardCount },
      ];

      for (const batch of difficultyBatches) {
        if (batch.count <= 0) continue;

        const selected = await this.questionSelectionService.selectQuestions({
          conceptIds: [conceptId],
          excludeQuestionIds: allSelectedIds,
          targetDifficulty: batch.target,
          limit: batch.count,
        });

        for (const q of selected) {
          allSelectedIds.push(q.id);
          questionEntries.push({
            assessmentId: assessment.id,
            questionId: q.id,
            order: orderIndex++,
          });
        }
      }
    }

    if (questionEntries.length === 0) {
      await this.prisma.assessment.delete({ where: { id: assessment.id } });
      throw new BadRequestException(
        'No questions found matching the blueprint criteria. Add published questions first.',
      );
    }

    await this.prisma.assessmentQuestion.createMany({ data: questionEntries });

    // Create AssessmentConcept records for tracking
    const assessmentConceptData = Object.entries(conceptDist).map(([conceptId, percentage]) => ({
      assessmentId: assessment.id,
      conceptId,
      questionTarget: Math.round((percentage / 100) * totalQ),
      marksTarget: (percentage / 100) * blueprint.totalMarks,
      minimumQuestions: 1,
    }));
    await this.prisma.assessmentConcept.createMany({ data: assessmentConceptData });

    this.logger.log(
      `Built assessment ${assessment.id} with ${questionEntries.length} questions from blueprint ${dto.blueprintId}`,
    );

    return this.prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        subject: true,
        blueprint: true,
        questions: { include: { question: { include: { concept: true } } }, orderBy: { order: 'asc' } },
        concepts: { include: { concept: true } },
      },
    });
  }

  /**
   * Start an assessment attempt for a student.
   * Returns sanitized questions (no answers).
   */
  async startAttempt(assessmentId: string, studentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) throw new NotFoundException(`Assessment "${assessmentId}" not found`);
    if (!assessment.isActive) throw new BadRequestException('This assessment is not currently active');

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new BadRequestException(`Student "${studentId}" not found`);

    // Create attempt
    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        studentId,
        status: AssessmentStatus.IN_PROGRESS,
        state: AssessmentAttemptState.IN_PROGRESS,
        totalQuestions: assessment.questions.length,
      },
    });

    // Snapshot question versions for audit integrity
    await this.snapshotQuestionVersions(assessment.questions.map((aq) => aq.question));

    // Record exposure events
    for (const aq of assessment.questions) {
      await this.questionSelectionService.recordExposure(
        studentId,
        aq.question.id,
        aq.question.conceptId,
      );
    }

    const sanitizedQuestions = assessment.questions.map((aq) => ({
      ...aq,
      question: this.securityService.sanitizeQuestion(aq.question),
    }));

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      title: assessment.title,
      durationMinutes: assessment.duration,
      totalQuestions: assessment.questions.length,
      totalMarks: assessment.totalMarks,
      startedAt: attempt.startedAt,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Snapshot current question text/options/answer for audit integrity.
   * If a version already exists at this exact content, skip creation.
   */
  private async snapshotQuestionVersions(questions: any[]): Promise<void> {
    for (const q of questions) {
      const latestVersion = await this.prisma.questionVersion.findFirst({
        where: { questionId: q.id },
        orderBy: { version: 'desc' },
      });

      const versionNumber = latestVersion ? latestVersion.version + 1 : 1;
      // Only create a new version if content has changed
      if (!latestVersion || latestVersion.text !== q.text || latestVersion.correctAnswer !== q.answer) {
        await this.prisma.questionVersion.create({
          data: {
            questionId: q.id,
            version: versionNumber,
            text: q.text,
            options: q.options,
            correctAnswer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            distractorMisconceptions: q.distractorMisconceptions,
          },
        });
      }
    }
  }
}
