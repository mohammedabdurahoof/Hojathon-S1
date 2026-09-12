import { Injectable } from '@nestjs/common';
import { MasteryStrategy, MasteryCalculationInput, MasteryCalculationResult } from './mastery-strategy.interface';

@Injectable()
export class WeightedAccuracyStrategy implements MasteryStrategy {
  readonly name = 'weighted_accuracy';

  calculateMastery(input: MasteryCalculationInput): MasteryCalculationResult {
    const accuracyScore = input.correctness ? 1.0 : 0.0;
    
    // Weight adjustment based on question difficulty: Level 1 (0.8x) to Level 5 (1.2x)
    const difficultyMultiplier = 0.8 + (input.difficulty - 1) * 0.1;
    const weightedAccuracy = accuracyScore * difficultyMultiplier;

    // Default production scoring: 0.70 * previousMastery + 0.30 * weightedAccuracy
    let newMastery = input.previousMastery * 0.70 + weightedAccuracy * 0.30;
    newMastery = Math.max(0.0, Math.min(1.0, Number(newMastery.toFixed(4))));

    // Confidence scaling based on attempts & hint usage
    const attempts = input.attemptNumber ?? 1;
    const hintPenalty = (input.hintsUsed ?? 0) * 0.05;
    let confidence = Math.min(1.0, Math.max(0.1, attempts / 10.0 - hintPenalty));
    confidence = Number(confidence.toFixed(4));

    return {
      masteryScore: newMastery,
      confidence,
      evidence: {
        strategy: this.name,
        difficultyMultiplier,
        weightedAccuracy,
        hintPenalty,
      },
    };
  }
}
