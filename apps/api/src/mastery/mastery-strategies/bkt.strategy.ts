import { Injectable } from '@nestjs/common';
import { MasteryStrategy, MasteryCalculationInput, MasteryCalculationResult } from './mastery-strategy.interface';

@Injectable()
export class BktStrategy implements MasteryStrategy {
  readonly name = 'bkt';

  // Standard Bayesian Knowledge Tracing parameters
  private readonly pLearn = 0.15; // P(T): probability of transitioning from unlearned to learned
  private readonly pGuess = 0.20; // P(G): probability of guessing correctly despite not knowing
  private readonly pSlip = 0.10;  // P(S): probability of making a mistake despite knowing

  calculateMastery(input: MasteryCalculationInput): MasteryCalculationResult {
    const priorL = Math.max(0.01, Math.min(0.99, input.previousMastery));

    let posteriorL: number;
    if (input.correctness) {
      // P(L | Correct)
      const num = priorL * (1 - this.pSlip);
      const den = priorL * (1 - this.pSlip) + (1 - priorL) * this.pGuess;
      posteriorL = num / den;
    } else {
      // P(L | Incorrect)
      const num = priorL * this.pSlip;
      const den = priorL * this.pSlip + (1 - priorL) * (1 - this.pGuess);
      posteriorL = num / den;
    }

    // Transition update: P(L_new) = P(L | Obs) + (1 - P(L | Obs)) * P(T)
    let updatedL = posteriorL + (1 - posteriorL) * this.pLearn;
    updatedL = Math.max(0.0, Math.min(1.0, Number(updatedL.toFixed(4))));

    const attempts = input.attemptNumber ?? 1;
    const confidence = Number(Math.min(1.0, 0.4 + attempts * 0.1).toFixed(4));

    return {
      masteryScore: updatedL,
      confidence,
      evidence: {
        strategy: this.name,
        priorKnowledge: priorL,
        posteriorKnowledge: posteriorL,
        pLearn: this.pLearn,
        pGuess: this.pGuess,
        pSlip: this.pSlip,
      },
    };
  }
}
