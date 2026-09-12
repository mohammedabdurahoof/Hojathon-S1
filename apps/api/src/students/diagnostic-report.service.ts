import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningGapService } from './learning-gap.service';

@Injectable()
export class DiagnosticReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningGapService: LearningGapService,
  ) {}

  async generateDiagnosticReport(studentId: string, attemptId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            subject: true,
          },
        },
        responses: {
          include: {
            question: {
              include: {
                concept: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      throw new NotFoundException(`Assessment attempt "${attemptId}" for student "${studentId}" not found.`);
    }

    // Concept performance breakdown in this attempt
    const conceptMap = new Map<string, { conceptId: string; conceptName: string; conceptCode: string; total: number; correct: number }>();

    for (const resp of attempt.responses) {
      const c = resp.question.concept;
      const existing = conceptMap.get(c.id) || {
        conceptId: c.id,
        conceptName: c.name,
        conceptCode: c.code,
        total: 0,
        correct: 0,
      };

      existing.total += 1;
      if (resp.isCorrect) existing.correct += 1;
      conceptMap.set(c.id, existing);
    }

    const conceptPerformance = Array.from(conceptMap.values()).map((cp) => ({
      conceptId: cp.conceptId,
      conceptCode: cp.conceptCode,
      conceptName: cp.conceptName,
      correct: cp.correct,
      total: cp.total,
      accuracy: cp.total > 0 ? (cp.correct / cp.total) * 100 : 0,
    }));

    // Retrieve global learning gaps and root gaps for student
    const weakConcepts = await this.learningGapService.findLearningGaps(studentId);
    const rootLearningGaps = await this.learningGapService.findRootGaps(studentId);

    // Recommended learning sequence
    const recommendedSequence = rootLearningGaps.map((rg, idx) => ({
      order: idx + 1,
      conceptId: rg.rootPrerequisiteId,
      conceptName: rg.rootPrerequisiteName,
      currentMastery: (rg.rootPrerequisiteMastery * 100).toFixed(1) + '%',
      reason: `Primary Root Deficit for ${rg.targetConceptName}`,
    }));

    return {
      reportTitle: `Student Diagnostic Report - ${student.user.name}`,
      studentId: student.id,
      studentName: student.user.name,
      studentEmail: student.user.email,
      attemptId: attempt.id,
      assessmentTitle: attempt.assessment.title,
      subject: attempt.assessment.subject.name,
      overallSummary: {
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        percentage: attempt.percentage ? Number(attempt.percentage.toFixed(1)) : 0,
        status: attempt.status,
        completedAt: attempt.completedAt,
      },
      attemptConceptPerformance: conceptPerformance,
      globalWeakConcepts: weakConcepts,
      rootLearningGaps,
      recommendedSequence,
    };
  }
}
