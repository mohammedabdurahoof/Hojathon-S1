import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningEventType } from '@prisma/client';

@Injectable()
export class SpacedReviewService {
  private readonly logger = new Logger(SpacedReviewService.name);
  private readonly defaultIntervals = [1, 3, 7, 14, 30];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule or update spaced review for a concept after mastery or successful review
   */
  async scheduleSpacedReview(studentId: string, conceptId: string, isSuccessful: boolean) {
    const existing = await this.prisma.reviewSchedule.findFirst({
      where: { studentId, conceptId },
    });

    const now = new Date();

    if (!existing) {
      const nextReviewAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day initial
      const created = await this.prisma.reviewSchedule.create({
        data: {
          studentId,
          conceptId,
          nextReviewAt,
          intervalDays: 1,
          reviewCount: 0,
          status: 'PENDING',
        },
      });

      await this.prisma.learningEvent.create({
        data: {
          studentId,
          conceptId,
          eventType: LearningEventType.REVIEW_SCHEDULED,
          metadata: { scheduleId: created.id, nextReviewAt, intervalDays: 1 },
        },
      });

      return created;
    }

    let newIntervalDays: number;
    let newReviewCount: number;

    if (isSuccessful) {
      newReviewCount = existing.reviewCount + 1;
      const index = Math.min(newReviewCount, this.defaultIntervals.length - 1);
      newIntervalDays = this.defaultIntervals[index];
    } else {
      // Reset interval to 1 day on failed review
      newReviewCount = 0;
      newIntervalDays = 1;
    }

    const nextReviewAt = new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.reviewSchedule.update({
      where: { id: existing.id },
      data: {
        nextReviewAt,
        intervalDays: newIntervalDays,
        reviewCount: newReviewCount,
        lastReviewedAt: now,
        status: isSuccessful ? 'COMPLETED' : 'FAILED_RETRY',
      },
    });

    await this.prisma.learningEvent.create({
      data: {
        studentId,
        conceptId,
        eventType: LearningEventType.REVIEW_COMPLETED,
        metadata: { scheduleId: updated.id, isSuccessful, newIntervalDays, nextReviewAt },
      },
    });

    this.logger.log(
      `Updated spaced review for student ${studentId} concept ${conceptId}: success=${isSuccessful}, interval=${newIntervalDays} days`,
    );

    return updated;
  }

  /**
   * Detect regression when a previously mastered concept score drops below 0.70
   */
  async detectRegression(studentId: string, conceptId: string, currentScore: number) {
    if (currentScore >= 0.70) return null;

    // Check if concept was previously marked mastered or achieved >= 0.80 in history
    const highestPastHistory = await this.prisma.masteryHistory.findFirst({
      where: {
        studentId,
        conceptId,
        newScore: { gte: 0.80 },
      },
    });

    if (highestPastHistory) {
      // Regression detected!
      const event = await this.prisma.learningEvent.create({
        data: {
          studentId,
          conceptId,
          eventType: LearningEventType.CONCEPT_REGRESSED,
          metadata: {
            previousHigh: highestPastHistory.newScore,
            currentScore,
          },
        },
      });

      // Schedule urgent 1-day review
      await this.scheduleSpacedReview(studentId, conceptId, false);

      this.logger.warn(`Regression detected for student ${studentId} on concept ${conceptId}: fell from ${highestPastHistory.newScore.toFixed(2)} to ${currentScore.toFixed(2)}`);
      return event;
    }

    return null;
  }

  /**
   * Fetch due reviews for a student
   */
  async getDueReviews(studentId: string) {
    const now = new Date();
    return this.prisma.reviewSchedule.findMany({
      where: {
        studentId,
        nextReviewAt: { lte: now },
      },
      include: { concept: true },
      orderBy: { nextReviewAt: 'asc' },
    });
  }
}
