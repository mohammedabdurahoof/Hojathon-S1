import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComparisonResult } from '../types/assessment-engine.types';
import { InterventionOutcome } from '@prisma/client';

@Injectable()
export class InterventionAssessmentService {
  private readonly logger = new Logger(InterventionAssessmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compare pre- and post-intervention assessment performance for a student.
   * Requires that assessments were taken before and after the intervention.
   */
  async compare(
    interventionId: string,
    beforeAttemptId: string,
    afterAttemptId: string,
    conceptId: string,
  ): Promise<ComparisonResult> {
    const before = await this.prisma.assessmentAttempt.findUnique({
      where: { id: beforeAttemptId },
      include: {
        answers: { include: { question: true } },
      },
    });
    const after = await this.prisma.assessmentAttempt.findUnique({
      where: { id: afterAttemptId },
      include: {
        answers: { include: { question: true } },
      },
    });

    if (!before) throw new NotFoundException(`Before-attempt "${beforeAttemptId}" not found`);
    if (!after) throw new NotFoundException(`After-attempt "${afterAttemptId}" not found`);

    // Compute concept-specific scores for the comparison
    const computeConceptScore = (attempt: typeof before): number => {
      const conceptAnswers = attempt.answers.filter(
        (a) => a.question.conceptId === conceptId,
      );
      if (conceptAnswers.length === 0) return 0;
      const correct = conceptAnswers.filter((a) => a.isCorrect).length;
      return correct / conceptAnswers.length;
    };

    const beforeScore = computeConceptScore(before);
    const afterScore = computeConceptScore(after);
    const improvement = afterScore - beforeScore;

    // Compute confidence change from mastery history
    const beforeMastery = await this.prisma.mastery.findUnique({
      where: {
        studentId_conceptId: {
          studentId: before.studentId,
          conceptId,
        },
      },
    });
    const confidenceChange = beforeMastery ? afterScore - beforeMastery.confidence : 0;

    // Determine outcome
    let outcome: InterventionOutcome;
    let analysisNotes: string;

    if (improvement >= 0.20) {
      outcome = InterventionOutcome.SUCCESSFUL;
      analysisNotes = `Significant improvement of ${(improvement * 100).toFixed(0)}% on concept ${conceptId}.`;
    } else if (improvement >= 0.05) {
      outcome = InterventionOutcome.PARTIALLY_SUCCESSFUL;
      analysisNotes = `Marginal improvement of ${(improvement * 100).toFixed(0)}%. Continue reinforcement.`;
    } else if (improvement >= -0.05) {
      outcome = InterventionOutcome.INCONCLUSIVE;
      analysisNotes = `No significant change (${(improvement * 100).toFixed(0)}%). Reconsider intervention strategy.`;
    } else {
      outcome = InterventionOutcome.UNSUCCESSFUL;
      analysisNotes = `Performance declined by ${(Math.abs(improvement) * 100).toFixed(0)}%. Intervention was ineffective — escalate.`;
    }

    // Persist comparison record
    await this.prisma.interventionAssessmentComparison.create({
      data: {
        interventionId,
        conceptId,
        beforeAssessmentId: before.assessmentId,
        afterAssessmentId: after.assessmentId,
        beforeScore,
        afterScore,
        improvement,
        confidenceChange,
        outcome,
      },
    });

    return {
      interventionId,
      conceptId,
      beforeScore,
      afterScore,
      improvement,
      confidenceChange,
      outcome: outcome as any,
      analysisNotes,
    };
  }

  async getComparisons(interventionId: string) {
    return this.prisma.interventionAssessmentComparison.findMany({
      where: { interventionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
