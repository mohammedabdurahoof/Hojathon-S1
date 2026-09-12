import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DifficultyService {
  private readonly logger = new Logger(DifficultyService.name);

  /**
   * Determine initial question difficulty (1 to 5) based on current mastery score
   */
  getInitialDifficulty(masteryScore: number): number {
    if (masteryScore < 0.30) return 1;
    if (masteryScore < 0.50) return 2;
    if (masteryScore < 0.70) return 3;
    if (masteryScore < 0.85) return 4;
    return 5;
  }

  /**
   * Adjust question difficulty after student response without aggressive oscillation
   */
  adjustDifficulty(params: {
    currentDifficulty: number;
    isCorrect: boolean;
    confidence: number;
    hasMisconception: boolean;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
  }): number {
    const { currentDifficulty, isCorrect, confidence, hasMisconception, consecutiveCorrect, consecutiveIncorrect } = params;

    let targetDifficulty = currentDifficulty;

    if (isCorrect) {
      // Increase difficulty if consecutive correct answers >= 2 or confidence is high
      if (consecutiveCorrect >= 2 || confidence >= 0.75) {
        targetDifficulty = Math.min(5, currentDifficulty + 1);
      }
    } else {
      // Decrease difficulty if student has misconception or consecutive incorrect answers >= 2
      if (hasMisconception || consecutiveIncorrect >= 2) {
        targetDifficulty = Math.max(1, currentDifficulty - 1);
      }
    }

    this.logger.log(
      `Difficulty adjustment: ${currentDifficulty} -> ${targetDifficulty} (Correct: ${isCorrect}, Misconception: ${hasMisconception})`,
    );

    return targetDifficulty;
  }
}
