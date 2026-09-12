import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MasteryService } from '../../mastery/mastery.service';
import { DifficultyCalibrationService } from './difficulty-calibration.service';
import { QuestionSelectionService } from './question-selection.service';
import { AssessmentSecurityService } from './assessment-security.service';
import {
  AssessmentStatus,
  AssessmentAttemptState,
  EvaluatedBy,
  EvidenceSource,
} from '@prisma/client';
import { SubmitAttemptAnswerDto, SubmitAssessmentAttemptDto } from '../dto/assessment-attempt-api.dto';
import { AnswerScoringResult, ConceptPerformance } from '../types/assessment-engine.types';

@Injectable()
export class AssessmentAttemptService {
  private readonly logger = new Logger(AssessmentAttemptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryService,
    private readonly calibrationService: DifficultyCalibrationService,
    private readonly questionSelectionService: QuestionSelectionService,
    private readonly securityService: AssessmentSecurityService,
  ) {}

  /**
   * Submit a single answer during an in-progress attempt.
   * Records the answer and updates question statistics (< 300ms target for non-AI path).
   */
  async submitSingleAnswer(attemptId: string, studentId: string, dto: SubmitAttemptAnswerDto) {
    const attempt = await this.getActiveAttempt(attemptId, studentId);

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException(`Question "${dto.questionId}" not found`);

    // Check for duplicate answer submission
    const existingAnswer = await this.prisma.assessmentAnswer.findFirst({
      where: { attemptId, questionId: dto.questionId },
    });
    if (existingAnswer) {
      throw new BadRequestException('Question has already been answered in this attempt');
    }

    // Score the answer (deterministic rule engine)
    const isCorrect =
      dto.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
    const score = isCorrect ? question.marks : 0;

    // Persist AssessmentAnswer
    await this.prisma.assessmentAnswer.create({
      data: {
        attemptId,
        questionId: dto.questionId,
        answer: dto.answer,
        isCorrect,
        score,
        responseTimeMs: dto.responseTimeMs ?? 0,
        hintsUsed: dto.hintsUsed ?? 0,
        evaluatedBy: EvaluatedBy.RULE_ENGINE,
      },
    });

    // Update question statistics asynchronously (fire and forget)
    this.calibrationService
      .updateStatistics(dto.questionId, isCorrect, dto.responseTimeMs ?? 0)
      .catch((e) => this.logger.error('Failed to update question statistics', e));

    // Record exposure answer
    this.questionSelectionService
      .recordExposureAnswer(studentId, dto.questionId, isCorrect ? 'CORRECT' : 'INCORRECT')
      .catch((e) => this.logger.error('Failed to record exposure answer', e));

    return { questionId: dto.questionId, isCorrect, score };
  }

  /**
   * Submit and finalise an assessment attempt.
   * Scores all answered questions, updates mastery, and computes results.
   */
  async submitAttempt(attemptId: string, studentId: string, dto: SubmitAssessmentAttemptDto) {
    const attempt = await this.getActiveAttempt(attemptId, studentId);

    // Process any answers passed in the bulk submission DTO
    if (dto.answers && dto.answers.length > 0) {
      for (const answerDto of dto.answers) {
        const existing = await this.prisma.assessmentAnswer.findFirst({
          where: { attemptId, questionId: answerDto.questionId },
        });
        if (!existing) {
          const question = await this.prisma.question.findUnique({
            where: { id: answerDto.questionId },
          });
          if (question) {
            const isCorrect =
              answerDto.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
            await this.prisma.assessmentAnswer.create({
              data: {
                attemptId,
                questionId: answerDto.questionId,
                answer: answerDto.answer,
                isCorrect,
                score: isCorrect ? question.marks : 0,
                responseTimeMs: answerDto.responseTimeMs ?? 0,
                hintsUsed: answerDto.hintsUsed ?? 0,
                evaluatedBy: EvaluatedBy.RULE_ENGINE,
              },
            });
          }
        }
      }
    }

    // Retrieve all recorded answers
    const answers = await this.prisma.assessmentAnswer.findMany({
      where: { attemptId },
      include: { question: { include: { concept: true } } },
    });

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: attempt.assessmentId },
    });

    // Compute scores
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const conceptPerf = new Map<string, ConceptPerformance>();

    for (const ans of answers) {
      totalScore += ans.score;
      if (ans.isCorrect) correctCount++;
      else incorrectCount++;

      const cId = ans.question.conceptId;
      const existing = conceptPerf.get(cId) ?? {
        conceptId: cId,
        total: 0,
        correct: 0,
        accuracy: 0,
        totalMarks: 0,
        earnedMarks: 0,
      };
      existing.total++;
      existing.totalMarks += ans.question.marks;
      if (ans.isCorrect) {
        existing.correct++;
        existing.earnedMarks += ans.score;
      }
      existing.accuracy = existing.correct / existing.total;
      conceptPerf.set(cId, existing);
    }

    const totalQuestions = answers.length;
    const percentage =
      assessment && assessment.totalMarks > 0
        ? (totalScore / assessment.totalMarks) * 100
        : totalQuestions > 0
        ? (correctCount / totalQuestions) * 100
        : 0;

    // Update attempt to COMPLETED
    const updatedAttempt = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        status: AssessmentStatus.COMPLETED,
        state: AssessmentAttemptState.COMPLETED,
        completedAt: new Date(),
        conceptsCovered: Array.from(conceptPerf.keys()),
      },
    });

    // Update mastery scores for each concept (deterministic engine)
    const conceptUpdates = Array.from(conceptPerf.values()).map((cp) => ({
      conceptId: cp.conceptId,
      totalQuestions: cp.total,
      correctAnswers: cp.correct,
      source: EvidenceSource.ASSESSMENT,
    }));

    await this.masteryService.updateStudentMasteryForConcepts(studentId, conceptUpdates);

    this.logger.log(
      `Attempt ${attemptId} submitted: score=${totalScore}, correct=${correctCount}/${totalQuestions}`,
    );

    return {
      attemptId,
      studentId,
      assessmentId: attempt.assessmentId,
      status: 'COMPLETED',
      score: totalScore,
      percentage: Math.round(percentage * 100) / 100,
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      completedAt: updatedAttempt.completedAt,
      conceptPerformance: Array.from(conceptPerf.values()),
    };
  }

  async getAttempt(attemptId: string, studentId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { include: { subject: true } },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                difficulty: true,
                conceptId: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
    if (attempt.studentId !== studentId) throw new ForbiddenException('Access denied');

    return attempt;
  }

  async getAttemptResult(attemptId: string, studentId: string) {
    const attempt = await this.getAttempt(attemptId, studentId);
    if (attempt.status !== AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Assessment is not yet completed');
    }
    return attempt;
  }

  private async getActiveAttempt(attemptId: string, studentId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
    if (!this.securityService.verifyAttemptOwnership(attempt, studentId)) {
      throw new ForbiddenException('You do not own this assessment attempt');
    }
    if (!this.securityService.isAttemptSubmittable(attempt.state)) {
      throw new BadRequestException(`Attempt is in state "${attempt.state}" and cannot accept answers`);
    }
    return attempt;
  }
}
