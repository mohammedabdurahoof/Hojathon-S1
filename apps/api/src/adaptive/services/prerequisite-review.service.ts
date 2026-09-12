import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PrerequisiteReviewRecommendation {
  shouldReview: boolean;
  prerequisiteConceptId: string | null;
  prerequisiteConceptName: string | null;
  reason: string | null;
  currentMastery: number;
}

@Injectable()
export class PrerequisiteReviewService {
  private readonly logger = new Logger(PrerequisiteReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detect if a student struggling on a target concept should fall back to prerequisite review
   */
  async evaluatePrerequisiteReview(studentId: string, conceptId: string): Promise<PrerequisiteReviewRecommendation> {
    const currentMasteryRecord = await this.prisma.mastery.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    });

    const currentMastery = currentMasteryRecord ? currentMasteryRecord.masteryScore : 0.0;

    // Check last 4 attempts for this concept
    const recentEvidence = await this.prisma.masteryEvidence.findMany({
      where: { studentId, conceptId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const incorrectCount = recentEvidence.filter((e) => e.correctness === false).length;

    // Trigger prerequisite review if student has >= 3 incorrect attempts or mastery < 0.40
    if (incorrectCount < 3 && currentMastery >= 0.40) {
      return {
        shouldReview: false,
        prerequisiteConceptId: null,
        prerequisiteConceptName: null,
        reason: null,
        currentMastery,
      };
    }

    // Find direct prerequisites for target concept
    const prerequisites = await this.prisma.conceptPrerequisite.findMany({
      where: { conceptId },
      include: { prerequisite: true },
    });

    if (prerequisites.length === 0) {
      return {
        shouldReview: false,
        prerequisiteConceptId: null,
        prerequisiteConceptName: null,
        reason: 'No direct prerequisites defined for concept',
        currentMastery,
      };
    }

    // Find the prerequisite with the lowest student mastery score
    let weakestPrereq: any = null;
    let lowestMastery = 1.0;

    for (const prereq of prerequisites) {
      const prereqMastery = await this.prisma.mastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: prereq.prerequisiteId,
          },
        },
      });

      const score = prereqMastery ? prereqMastery.masteryScore : 0.0;
      if (score < lowestMastery) {
        lowestMastery = score;
        weakestPrereq = prereq.prerequisite;
      }
    }

    if (weakestPrereq && lowestMastery < 0.70) {
      this.logger.log(
        `Prerequisite review recommended for student ${studentId}: fallback from ${conceptId} to ${weakestPrereq.id} (${weakestPrereq.name})`,
      );
      return {
        shouldReview: true,
        prerequisiteConceptId: weakestPrereq.id,
        prerequisiteConceptName: weakestPrereq.name,
        reason: `Student has repeated failures on target concept (${currentMastery.toFixed(2)}) and prerequisite ${weakestPrereq.name} is unmastered (${lowestMastery.toFixed(2)}).`,
        currentMastery,
      };
    }

    return {
      shouldReview: false,
      prerequisiteConceptId: null,
      prerequisiteConceptName: null,
      reason: null,
      currentMastery,
    };
  }
}
