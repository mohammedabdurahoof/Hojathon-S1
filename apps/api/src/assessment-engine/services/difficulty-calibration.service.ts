import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalibrationResult } from '../types/assessment-engine.types';

@Injectable()
export class DifficultyCalibrationService {
  private readonly logger = new Logger(DifficultyCalibrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calibrate difficulty for a single question based on its statistics.
   * Uses item response theory approximation:
   *   - Accuracy > 0.85 → question too easy → lower difficulty
   *   - Accuracy < 0.30 → question too hard → raise difficulty
   *   - Good discrimination (>0.2) → keep
   */
  async calibrateQuestion(questionId: string): Promise<CalibrationResult> {
    const stats = await this.prisma.questionStatistics.findUnique({
      where: { questionId },
      include: { question: true },
    });

    if (!stats || stats.attempts < 10) {
      return {
        questionId,
        currentDifficulty: stats?.question?.difficulty ?? 3,
        suggestedDifficulty: stats?.question?.difficulty ?? 3,
        empiricalAccuracy: stats ? stats.accuracy : 0,
        discriminationIndex: stats?.discriminationIndex ?? 0,
        requiresRecalibration: false,
      };
    }

    const accuracy = stats.accuracy;
    const currentDifficulty = stats.question.difficulty;
    let suggestedDifficulty = currentDifficulty;

    // Map accuracy to difficulty (1-5 scale)
    if (accuracy > 0.85) {
      suggestedDifficulty = Math.max(1, currentDifficulty - 1);
    } else if (accuracy > 0.70) {
      suggestedDifficulty = Math.max(1, currentDifficulty - 1);
    } else if (accuracy < 0.30) {
      suggestedDifficulty = Math.min(5, currentDifficulty + 1);
    } else if (accuracy < 0.45) {
      suggestedDifficulty = Math.min(5, currentDifficulty + 1);
    }

    const requiresRecalibration =
      suggestedDifficulty !== currentDifficulty ||
      (stats.discriminationIndex !== null && stats.discriminationIndex < 0.1);

    return {
      questionId,
      currentDifficulty,
      suggestedDifficulty,
      empiricalAccuracy: accuracy,
      discriminationIndex: stats.discriminationIndex ?? 0,
      requiresRecalibration,
    };
  }

  /**
   * Update empirical statistics for a question after each answer submission.
   * Called by AssessmentScoringService after each answer is recorded.
   */
  async updateStatistics(
    questionId: string,
    isCorrect: boolean,
    responseTimeMs: number,
  ): Promise<void> {
    const existing = await this.prisma.questionStatistics.findUnique({ where: { questionId } });

    if (!existing) {
      await this.prisma.questionStatistics.create({
        data: {
          questionId,
          attempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          incorrectAttempts: isCorrect ? 0 : 1,
          accuracy: isCorrect ? 1.0 : 0.0,
          averageResponseTimeMs: responseTimeMs,
        },
      });
    } else {
      const newAttempts = existing.attempts + 1;
      const newCorrect = existing.correctAttempts + (isCorrect ? 1 : 0);
      const newIncorrect = existing.incorrectAttempts + (isCorrect ? 0 : 1);
      const newAccuracy = newCorrect / newAttempts;
      const newAvgTime =
        (existing.averageResponseTimeMs * existing.attempts + responseTimeMs) / newAttempts;

      await this.prisma.questionStatistics.update({
        where: { questionId },
        data: {
          attempts: newAttempts,
          correctAttempts: newCorrect,
          incorrectAttempts: newIncorrect,
          accuracy: newAccuracy,
          averageResponseTimeMs: newAvgTime,
          lastCalculatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Batch calibration for all questions with sufficient data.
   * Returns a list of questions requiring difficulty updates.
   */
  async runBatchCalibration(): Promise<CalibrationResult[]> {
    const stats = await this.prisma.questionStatistics.findMany({
      where: { attempts: { gte: 10 } },
      include: { question: true },
    });

    const results: CalibrationResult[] = [];

    for (const stat of stats) {
      const result = await this.calibrateQuestion(stat.questionId);
      if (result.requiresRecalibration) {
        results.push(result);
      }
    }

    this.logger.log(
      `Batch calibration complete: ${results.length} questions require recalibration`,
    );
    return results;
  }
}
