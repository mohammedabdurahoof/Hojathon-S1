import {
  QuestionType,
  QuestionObjective,
  QuestionSource,
  QuestionStatus,
  AssessmentPurpose,
  BlueprintStatus,
  EvaluatedBy,
} from '@prisma/client';

/** Sanitized question returned to students — no answer or explanation */
export interface SanitizedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: number;
  objective: QuestionObjective;
  options: any;
  marks: number;
  estimatedTimeSeconds: number;
  conceptId: string;
}

/** Internal full question with answer data (server-side only) */
export interface FullQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: number;
  objective: QuestionObjective;
  options: any;
  answer: string;
  explanation?: string;
  marks: number;
  estimatedTimeSeconds: number;
  conceptId: string;
  source: QuestionSource;
  status: QuestionStatus;
  distractorMisconceptions?: any;
}

/** Result of scoring a single answer */
export interface AnswerScoringResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  evaluatedBy: EvaluatedBy;
  misconception?: string;
}

/** Concept-level performance summary */
export interface ConceptPerformance {
  conceptId: string;
  total: number;
  correct: number;
  accuracy: number;
  totalMarks: number;
  earnedMarks: number;
}

/** Adaptive selection state */
export interface AdaptiveState {
  questionsAsked: number;
  answeredConceptIds: string[];
  currentDifficulty: number;
  masteryEstimates: Record<string, number>;
  confidenceEstimates: Record<string, number>;
  shouldStop: boolean;
  stopReason?: 'high_confidence' | 'max_questions' | 'all_concepts_covered';
}

/** Quality validation result for AI-generated questions */
export interface QualityValidationResult {
  passed: boolean;
  score: number; // 0-12
  failedChecks: string[];
  warnings: string[];
}

/** Blueprint distribution spec */
export interface DifficultyDistribution {
  easy: number;   // percentage 0-100
  medium: number;
  hard: number;
}

export interface ObjectiveDistribution {
  recall: number;
  understanding: number;
  procedural: number;
  application: number;
  transfer: number;
  reasoning: number;
}

/** Assessment recommendation output */
export interface AssessmentRecommendation {
  studentId: string;
  conceptId: string;
  recommendedPurpose: AssessmentPurpose;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  masteryScore: number;
  confidence: number;
}

/** Intervention comparison result */
export interface ComparisonResult {
  interventionId: string;
  conceptId: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  confidenceChange: number;
  outcome: 'SUCCESSFUL' | 'PARTIALLY_SUCCESSFUL' | 'UNSUCCESSFUL' | 'INCONCLUSIVE';
  analysisNotes: string;
}

/** Difficulty calibration result */
export interface CalibrationResult {
  questionId: string;
  currentDifficulty: number;
  suggestedDifficulty: number;
  empiricalAccuracy: number;
  discriminationIndex: number;
  requiresRecalibration: boolean;
}
