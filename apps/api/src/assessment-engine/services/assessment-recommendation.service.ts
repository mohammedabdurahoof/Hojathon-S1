import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssessmentRecommendation } from '../types/assessment-engine.types';
import { AssessmentPurpose } from '@prisma/client';

const MASTERY_THRESHOLD = 0.75;
const LOW_CONFIDENCE_THRESHOLD = 0.50;

@Injectable()
export class AssessmentRecommendationService {
  private readonly logger = new Logger(AssessmentRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recommend the next assessment type for a student per concept.
   * Based on mastery score, confidence, and recent attempt history.
   */
  async recommendForStudent(studentId: string): Promise<AssessmentRecommendation[]> {
    const masteries = await this.prisma.mastery.findMany({
      where: { studentId },
      include: { concept: true },
      orderBy: { masteryScore: 'asc' },
    });

    const recommendations: AssessmentRecommendation[] = [];

    for (const mastery of masteries) {
      const rec = this.computeRecommendation(mastery);
      if (rec) recommendations.push(rec);
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });
  }

  private computeRecommendation(mastery: any): AssessmentRecommendation | null {
    const { masteryScore, confidence, conceptId } = mastery;

    // Low mastery: needs remediation assessment
    if (masteryScore < 0.40) {
      return {
        studentId: mastery.studentId,
        conceptId,
        recommendedPurpose: AssessmentPurpose.REMEDIAL,
        reason: `Mastery is critically low (${(masteryScore * 100).toFixed(0)}%). Remedial practice needed.`,
        priority: 'HIGH',
        masteryScore,
        confidence,
      };
    }

    // Low confidence despite decent mastery → needs reassessment
    if (masteryScore >= 0.40 && masteryScore < MASTERY_THRESHOLD && confidence < LOW_CONFIDENCE_THRESHOLD) {
      return {
        studentId: mastery.studentId,
        conceptId,
        recommendedPurpose: AssessmentPurpose.REASSESSMENT,
        reason: `Low confidence (${(confidence * 100).toFixed(0)}%) in mastery estimate. Reassessment recommended.`,
        priority: 'MEDIUM',
        masteryScore,
        confidence,
      };
    }

    // Near mastery threshold → mastery check
    if (masteryScore >= 0.60 && masteryScore < MASTERY_THRESHOLD) {
      return {
        studentId: mastery.studentId,
        conceptId,
        recommendedPurpose: AssessmentPurpose.MASTERY_CHECK,
        reason: `Student is near mastery threshold (${(masteryScore * 100).toFixed(0)}%). Mastery check recommended.`,
        priority: 'MEDIUM',
        masteryScore,
        confidence,
      };
    }

    // High mastery → transfer assessment to verify generalization
    if (masteryScore >= MASTERY_THRESHOLD && confidence >= 0.70) {
      return {
        studentId: mastery.studentId,
        conceptId,
        recommendedPurpose: AssessmentPurpose.TRANSFER_ASSESSMENT,
        reason: `Mastery achieved (${(masteryScore * 100).toFixed(0)}%). Transfer assessment to validate generalization.`,
        priority: 'LOW',
        masteryScore,
        confidence,
      };
    }

    return null;
  }
}
