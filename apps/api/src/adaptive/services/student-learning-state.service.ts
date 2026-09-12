import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MisconceptionService } from './misconception.service';
import { LearningRecommendationService } from './learning-recommendation.service';
import { SpacedReviewService } from './spaced-review.service';
import { DifficultyService } from './difficulty.service';

@Injectable()
export class StudentLearningStateService {
  private readonly logger = new Logger(StudentLearningStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly misconceptionService: MisconceptionService,
    private readonly recommendationService: LearningRecommendationService,
    private readonly spacedReviewService: SpacedReviewService,
    private readonly difficultyService: DifficultyService,
  ) {}

  /**
   * Aggregate complete student learning state
   */
  async getStudentLearningState(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    // Fetch active learning plan item
    const activePlan = await this.prisma.learningPlan.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: {
        items: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS', 'REMEDIATION', 'REVIEW'] } },
          orderBy: { order: 'asc' },
          take: 1,
          include: { concept: true },
        },
      },
    });

    const activeItem = activePlan?.items[0] ?? null;
    const currentConcept = activeItem?.concept ?? null;

    let masteryScore = 0.5;
    let confidence = 0.5;
    let conceptId = currentConcept?.id;

    if (conceptId) {
      const mRecord = await this.prisma.mastery.findUnique({
        where: { studentId_conceptId: { studentId, conceptId } },
      });
      if (mRecord) {
        masteryScore = mRecord.masteryScore;
        confidence = mRecord.confidence;
      }
    }

    const activeMisconceptions = await this.misconceptionService.getActiveMisconceptions(studentId, conceptId);
    const dueReviews = await this.spacedReviewService.getDueReviews(studentId);

    const recResult = conceptId
      ? await this.recommendationService.getRecommendation(studentId, conceptId)
      : { recommendation: 'PRACTICE' as const, reason: 'General practice', recommendedDifficulty: 2 };

    const recommendedDifficulty = this.difficultyService.getInitialDifficulty(masteryScore);

    // Calculate recent performance stats
    const recentEvidence = await this.prisma.masteryEvidence.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalAnswers = recentEvidence.length;
    const correctCount = recentEvidence.filter((e) => e.correctness).length;
    const accuracy = totalAnswers > 0 ? Number((correctCount / totalAnswers).toFixed(2)) : 0.0;

    const difficultyBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const e of recentEvidence) {
      difficultyBreakdown[e.difficulty] = (difficultyBreakdown[e.difficulty] || 0) + 1;
    }

    let masteryStatus = 'DEVELOPING';
    if (masteryScore < 0.40) masteryStatus = 'CRITICAL';
    else if (masteryScore < 0.60) masteryStatus = 'WEAK';
    else if (masteryScore >= 0.80) masteryStatus = 'MASTERED';

    return {
      studentId,
      studentName: student.user?.name ?? 'Student',
      gradeLevel: student.gradeLevel,
      currentConcept,
      mastery: Number(masteryScore.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      masteryStatus,
      learningPlanItem: activeItem,
      activeMisconceptions,
      recommendedAction: recResult.recommendation,
      recommendedDifficulty,
      dueReviews,
      recentPerformance: {
        totalAnswers,
        accuracy,
        difficultyBreakdown,
      },
    };
  }
}
