import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrerequisiteReviewService } from './prerequisite-review.service';
import { LearningRecommendationType } from '@prisma/client';

export interface LearningRecommendationResult {
  recommendation: LearningRecommendationType;
  reason: string;
  targetConceptId: string;
  recommendedDifficulty: number;
  prerequisiteConceptId?: string | null;
}

@Injectable()
export class LearningRecommendationService {
  private readonly logger = new Logger(LearningRecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prerequisiteReviewService: PrerequisiteReviewService,
  ) {}

  /**
   * Determine transparent, rule-based learning recommendation
   */
  async getRecommendation(studentId: string, conceptId: string): Promise<LearningRecommendationResult> {
    const masteryRecord = await this.prisma.mastery.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    });

    const masteryScore = masteryRecord ? masteryRecord.masteryScore : 0.0;
    const confidence = masteryRecord ? masteryRecord.confidence : 0.5;

    // 1. Check prerequisite review recommendation
    const prereqCheck = await this.prerequisiteReviewService.evaluatePrerequisiteReview(studentId, conceptId);
    if (prereqCheck.shouldReview && prereqCheck.prerequisiteConceptId) {
      return {
        recommendation: LearningRecommendationType.REVIEW_PREREQUISITE,
        reason: prereqCheck.reason ?? 'Prerequisite review required before proceeding',
        targetConceptId: conceptId,
        recommendedDifficulty: 1,
        prerequisiteConceptId: prereqCheck.prerequisiteConceptId,
      };
    }

    // 2. Check active misconceptions
    const activeMisconception = await this.prisma.misconception.findFirst({
      where: { studentId, conceptId, resolved: false },
    });

    if (activeMisconception) {
      return {
        recommendation: LearningRecommendationType.REMEDIATE,
        reason: `Active misconception detected: ${activeMisconception.description}`,
        targetConceptId: conceptId,
        recommendedDifficulty: Math.max(1, (masteryRecord?.attempts ?? 1) > 3 ? 1 : 2),
      };
    }

    // 3. Evaluate mastery score & confidence
    if (masteryScore >= 0.80 && confidence >= 0.75) {
      return {
        recommendation: LearningRecommendationType.ADVANCE,
        reason: `Concept mastered (${(masteryScore * 100).toFixed(0)}% mastery, ${(confidence * 100).toFixed(0)}% confidence)`,
        targetConceptId: conceptId,
        recommendedDifficulty: 4,
      };
    }

    if (masteryScore >= 0.70 && confidence < 0.75) {
      return {
        recommendation: LearningRecommendationType.REASSESS,
        reason: 'Mastery score is high but needs additional evidence confirmation',
        targetConceptId: conceptId,
        recommendedDifficulty: 3,
      };
    }

    if (masteryScore >= 0.40) {
      return {
        recommendation: LearningRecommendationType.PRACTICE,
        reason: 'Developing mastery; continue practice to build consistency',
        targetConceptId: conceptId,
        recommendedDifficulty: 2,
      };
    }

    return {
      recommendation: LearningRecommendationType.REMEDIATE,
      reason: 'Critical mastery gap; step-by-step remediation recommended',
      targetConceptId: conceptId,
      recommendedDifficulty: 1,
    };
  }
}
