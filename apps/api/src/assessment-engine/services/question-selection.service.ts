import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionObjective, QuestionStatus } from '@prisma/client';

export interface SelectionCriteria {
  conceptIds: string[];
  excludeQuestionIds?: string[];
  studentId?: string;
  targetDifficulty?: number;
  difficultyRange?: number; // ±range around target
  objective?: QuestionObjective;
  limit?: number;
  respectExposure?: boolean;
}

@Injectable()
export class QuestionSelectionService {
  private readonly logger = new Logger(QuestionSelectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Select optimal questions for an assessment attempt.
   *
   * Priority order:
   * 1. Match requested concept IDs
   * 2. Avoid recently-exposed questions (if studentId provided)
   * 3. Match target difficulty (±difficultyRange)
   * 4. Match objective if specified
   * 5. Only PUBLISHED + active questions
   */
  async selectQuestions(criteria: SelectionCriteria): Promise<any[]> {
    const {
      conceptIds,
      excludeQuestionIds = [],
      studentId,
      targetDifficulty,
      difficultyRange = 1,
      objective,
      limit = 20,
      respectExposure = true,
    } = criteria;

    // Collect recent exposure history for this student
    let recentlyExposedIds: string[] = [];
    if (studentId && respectExposure) {
      const recent = await this.prisma.questionExposure.findMany({
        where: {
          studentId,
          conceptId: { in: conceptIds },
          shownAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // last 14 days
          },
        },
        select: { questionId: true },
      });
      recentlyExposedIds = recent.map((e) => e.questionId);
    }

    const allExcluded = [...new Set([...excludeQuestionIds, ...recentlyExposedIds])];

    const where: any = {
      conceptId: { in: conceptIds },
      status: QuestionStatus.PUBLISHED,
      isActive: true,
      id: allExcluded.length > 0 ? { notIn: allExcluded } : undefined,
    };

    if (targetDifficulty !== undefined) {
      where.difficulty = {
        gte: Math.max(1, targetDifficulty - difficultyRange),
        lte: Math.min(5, targetDifficulty + difficultyRange),
      };
    }

    if (objective) {
      where.objective = objective;
    }

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        concept: true,
        statistics: true,
      },
      take: limit * 2, // Fetch extra for ranking
      orderBy: { createdAt: 'desc' },
    });

    // Rank by information value: prefer questions with fewer exposures and higher discrimination
    const ranked = questions.sort((a, b) => {
      const discA = (a.statistics?.discriminationIndex ?? 0.3);
      const discB = (b.statistics?.discriminationIndex ?? 0.3);
      const expA = (a.statistics?.attempts ?? 0);
      const expB = (b.statistics?.attempts ?? 0);

      // Prefer higher discrimination and lower exposure (underrepresented questions)
      const scoreA = discA - expA * 0.001;
      const scoreB = discB - expB * 0.001;
      return scoreB - scoreA;
    });

    return ranked.slice(0, limit);
  }

  /**
   * Record question exposure event for a student.
   */
  async recordExposure(studentId: string, questionId: string, conceptId: string): Promise<void> {
    await this.prisma.questionExposure.create({
      data: { studentId, questionId, conceptId },
    });
  }

  /**
   * Record a question answer result on the exposure record.
   */
  async recordExposureAnswer(
    studentId: string,
    questionId: string,
    result: 'CORRECT' | 'INCORRECT' | 'PARTIAL',
  ): Promise<void> {
    const exposure = await this.prisma.questionExposure.findFirst({
      where: { studentId, questionId },
      orderBy: { shownAt: 'desc' },
    });
    if (exposure) {
      await this.prisma.questionExposure.update({
        where: { id: exposure.id },
        data: { answeredAt: new Date(), result },
      });
    }
  }
}
