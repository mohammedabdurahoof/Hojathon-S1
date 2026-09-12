export interface MasteryCalculationInput {
  previousMastery: number;
  correctness: boolean;
  difficulty: number; // 1 to 5
  responseTimeMs?: number | null;
  attemptNumber?: number;
  confidence?: number;
  hintsUsed?: number;
}

export interface MasteryCalculationResult {
  masteryScore: number;
  confidence: number;
  evidence: Record<string, any>;
}

export interface MasteryStrategy {
  readonly name: string;
  calculateMastery(input: MasteryCalculationInput): MasteryCalculationResult;
}
