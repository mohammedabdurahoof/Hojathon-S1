export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const QuestionType = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const AssessmentPurpose = {
  DIAGNOSTIC: 'DIAGNOSTIC',
  PRACTICE: 'PRACTICE',
  REMEDIAL: 'REMEDIAL',
  FINAL: 'FINAL',
} as const;
export type AssessmentPurpose = (typeof AssessmentPurpose)[keyof typeof AssessmentPurpose];

export const AssessmentStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type AssessmentStatus = (typeof AssessmentStatus)[keyof typeof AssessmentStatus];

export const LearningPlanStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
} as const;
export type LearningPlanStatus = (typeof LearningPlanStatus)[keyof typeof LearningPlanStatus];

export const LearningPlanItemStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  MASTERED: 'MASTERED',
} as const;
export type LearningPlanItemStatus = (typeof LearningPlanItemStatus)[keyof typeof LearningPlanItemStatus];

export const MessageRole = {
  SYSTEM: 'SYSTEM',
  ASSISTANT: 'ASSISTANT',
  STUDENT: 'STUDENT',
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const DocumentStatus = {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DocumentVisibility = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type DocumentVisibility = (typeof DocumentVisibility)[keyof typeof DocumentVisibility];

export const AssociationStatus = {
  SUGGESTED: 'SUGGESTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
} as const;
export type AssociationStatus = (typeof AssociationStatus)[keyof typeof AssociationStatus];

export type TutorResponseType = 'QUESTION' | 'EXPLANATION' | 'HINT' | 'FEEDBACK' | 'ENCOURAGEMENT';
export type TutorNextAction = 'ANSWER' | 'CONTINUE' | 'PRACTICE' | 'ASSESS';

export interface TutorResponseDto {
  type: TutorResponseType;
  message: string;
  conceptId: string;
  difficulty: number;
  requiresStudentResponse: boolean;
  nextAction: TutorNextAction;
  sources?: RAGSourceCitationDto[];
}

export interface RAGSourceCitationDto {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageNumber: number | null;
  sectionTitle: string | null;
}

export interface DocumentChunkDto {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber?: number | null;
  sectionTitle?: string | null;
  score?: number;
}

export interface DocumentDto {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  version: number;
  curriculumYear: string;
  createdAt: string;
  updatedAt: string;
}

export type EvaluationStatus = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNCLEAR';

export interface LessonSectionDto {
  type: 'OBJECTIVE' | 'EXPLANATION' | 'EXAMPLE' | 'GUIDED_PRACTICE' | 'INDEPENDENT_PRACTICE';
  content: string;
  question?: string;
  options?: string[];
  answer?: string;
}

export interface LessonDto {
  concept: string;
  objective: string;
  prerequisiteCheck?: string;
  sections: LessonSectionDto[];
}

export interface EvaluationResultDto {
  correct: boolean;
  status: EvaluationStatus;
  score: number;
  confidence: number;
  feedback: string;
  misconception?: string | null;
  hint?: string | null;
}

export const EvidenceSource = {
  DIAGNOSTIC: 'DIAGNOSTIC',
  PRACTICE: 'PRACTICE',
  TUTOR: 'TUTOR',
  REMEDIAL: 'REMEDIAL',
  ASSESSMENT: 'ASSESSMENT',
  AI_EVALUATION: 'AI_EVALUATION',
} as const;
export type EvidenceSource = (typeof EvidenceSource)[keyof typeof EvidenceSource];

export const MasteryHistoryReason = {
  INITIAL_ASSESSMENT: 'INITIAL_ASSESSMENT',
  CORRECT_ANSWER: 'CORRECT_ANSWER',
  INCORRECT_ANSWER: 'INCORRECT_ANSWER',
  REMEDIAL_SUCCESS: 'REMEDIAL_SUCCESS',
  REMEDIAL_FAILURE: 'REMEDIAL_FAILURE',
  ASSESSMENT_RESULT: 'ASSESSMENT_RESULT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
} as const;
export type MasteryHistoryReason = (typeof MasteryHistoryReason)[keyof typeof MasteryHistoryReason];

export const MisconceptionCategory = {
  ARITHMETIC_ERROR: 'ARITHMETIC_ERROR',
  SIGN_ERROR: 'SIGN_ERROR',
  PLACE_VALUE_ERROR: 'PLACE_VALUE_ERROR',
  FRACTION_DENOMINATOR_ERROR: 'FRACTION_DENOMINATOR_ERROR',
  FRACTION_NUMERATOR_ERROR: 'FRACTION_NUMERATOR_ERROR',
  UNIT_CONVERSION_ERROR: 'UNIT_CONVERSION_ERROR',
  FORMULA_RECALL_ERROR: 'FORMULA_RECALL_ERROR',
  CONCEPT_CONFUSION: 'CONCEPT_CONFUSION',
  PREREQUISITE_GAP: 'PREREQUISITE_GAP',
  PROCEDURAL_ERROR: 'PROCEDURAL_ERROR',
  READING_COMPREHENSION_ERROR: 'READING_COMPREHENSION_ERROR',
  CARELESS_ERROR: 'CARELESS_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
export type MisconceptionCategory = (typeof MisconceptionCategory)[keyof typeof MisconceptionCategory];

export const LearningRecommendationType = {
  CONTINUE: 'CONTINUE',
  PRACTICE: 'PRACTICE',
  REMEDIATE: 'REMEDIATE',
  REVIEW_PREREQUISITE: 'REVIEW_PREREQUISITE',
  REASSESS: 'REASSESS',
  ADVANCE: 'ADVANCE',
  REVIEW_LATER: 'REVIEW_LATER',
} as const;
export type LearningRecommendationType = (typeof LearningRecommendationType)[keyof typeof LearningRecommendationType];

export const AdaptiveSessionStatus = {
  STARTED: 'STARTED',
  DIAGNOSING: 'DIAGNOSING',
  TEACHING: 'TEACHING',
  PRACTICING: 'PRACTICING',
  REMEDIATING: 'REMEDIATING',
  REASSESSING: 'REASSESSING',
  COMPLETED: 'COMPLETED',
} as const;
export type AdaptiveSessionStatus = (typeof AdaptiveSessionStatus)[keyof typeof AdaptiveSessionStatus];

export const LearningEventType = {
  QUESTION_SHOWN: 'QUESTION_SHOWN',
  QUESTION_ANSWERED: 'QUESTION_ANSWERED',
  HINT_REQUESTED: 'HINT_REQUESTED',
  MISCONCEPTION_DETECTED: 'MISCONCEPTION_DETECTED',
  MASTERY_UPDATED: 'MASTERY_UPDATED',
  CONCEPT_MASTERED: 'CONCEPT_MASTERED',
  REMEDIATION_STARTED: 'REMEDIATION_STARTED',
  REASSESSMENT_STARTED: 'REASSESSMENT_STARTED',
  REVIEW_SCHEDULED: 'REVIEW_SCHEDULED',
  REVIEW_COMPLETED: 'REVIEW_COMPLETED',
  CONCEPT_REGRESSED: 'CONCEPT_REGRESSED',
} as const;
export type LearningEventType = (typeof LearningEventType)[keyof typeof LearningEventType];

export const QuestionObjectiveType = {
  RECALL: 'RECALL',
  PROCEDURAL: 'PROCEDURAL',
  APPLICATION: 'APPLICATION',
  TRANSFER: 'TRANSFER',
} as const;
export type QuestionObjectiveType = (typeof QuestionObjectiveType)[keyof typeof QuestionObjectiveType];

export interface MasteryInputDto {
  previousMastery: number;
  correctness: boolean;
  difficulty: number;
  responseTimeMs?: number | null;
  attemptNumber?: number;
  confidence?: number;
  hintsUsed?: number;
}

export interface MasteryOutputDto {
  masteryScore: number;
  confidence: number;
  evidence: Record<string, any>;
}

export interface MasteryEvidenceDto {
  id: string;
  studentId: string;
  conceptId: string;
  source: EvidenceSource;
  correctness: boolean;
  score: number;
  difficulty: number;
  responseTimeMs?: number | null;
  hintsUsed: number;
  attemptNumber: number;
  misconception?: string | null;
  confidence: number;
  createdAt: string;
}

export interface MisconceptionDto {
  id: string;
  studentId: string;
  conceptId: string;
  category: MisconceptionCategory;
  description: string;
  confidence: number;
  occurrenceCount: number;
  resolved: boolean;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export interface ReviewScheduleDto {
  id: string;
  studentId: string;
  conceptId: string;
  nextReviewAt: string;
  intervalDays: number;
  reviewCount: number;
  lastReviewedAt?: string | null;
  status: string;
}

export interface LearningStateDto {
  studentId: string;
  currentConcept?: any;
  mastery: number;
  confidence: number;
  masteryStatus: string;
  activeMisconceptions: MisconceptionDto[];
  recommendedAction: LearningRecommendationType;
  recommendedDifficulty: number;
  dueReviews: ReviewScheduleDto[];
  recentPerformance: {
    totalAnswers: number;
    accuracy: number;
    difficultyBreakdown: Record<number, number>;
  };
}

export interface AdaptiveSessionDto {
  id: string;
  studentId: string;
  learningPlanId?: string | null;
  conceptId: string;
  currentDifficulty: number;
  status: AdaptiveSessionStatus;
  recommendedAction: LearningRecommendationType;
  mastery: number;
  confidence: number;
  currentQuestion?: any;
}

export const ClassGroupStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ClassGroupStatus = (typeof ClassGroupStatus)[keyof typeof ClassGroupStatus];

export const RiskLevel = {
  ON_TRACK: 'ON_TRACK',
  WATCH: 'WATCH',
  AT_RISK: 'AT_RISK',
  CRITICAL: 'CRITICAL',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const InterventionType = {
  INDIVIDUAL_REMEDIATION: 'INDIVIDUAL_REMEDIATION',
  GROUP_REMEDIATION: 'GROUP_REMEDIATION',
  PREREQUISITE_REVIEW: 'PREREQUISITE_REVIEW',
  ADDITIONAL_PRACTICE: 'ADDITIONAL_PRACTICE',
  TEACHER_EXPLANATION: 'TEACHER_EXPLANATION',
  ASSESSMENT: 'ASSESSMENT',
  REVIEW: 'REVIEW',
  PEER_SUPPORT: 'PEER_SUPPORT',
  CURRICULUM_REVIEW: 'CURRICULUM_REVIEW',
} as const;
export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];

export const InterventionStatus = {
  RECOMMENDED: 'RECOMMENDED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DISMISSED: 'DISMISSED',
} as const;
export type InterventionStatus = (typeof InterventionStatus)[keyof typeof InterventionStatus];

export const InterventionOutcome = {
  SUCCESSFUL: 'SUCCESSFUL',
  PARTIALLY_SUCCESSFUL: 'PARTIALLY_SUCCESSFUL',
  UNSUCCESSFUL: 'UNSUCCESSFUL',
  INCONCLUSIVE: 'INCONCLUSIVE',
} as const;
export type InterventionOutcome = (typeof InterventionOutcome)[keyof typeof InterventionOutcome];

export const AlertSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const AlertType = {
  STUDENT_AT_RISK: 'STUDENT_AT_RISK',
  STUDENT_CRITICAL: 'STUDENT_CRITICAL',
  CLASS_BOTTLENECK: 'CLASS_BOTTLENECK',
  MISCONCEPTION_CLUSTER: 'MISCONCEPTION_CLUSTER',
  MASTERY_REGRESSION: 'MASTERY_REGRESSION',
  REMEDIATION_FAILURE: 'REMEDIATION_FAILURE',
  REVIEW_OVERDUE: 'REVIEW_OVERDUE',
  INTERVENTION_NEEDED: 'INTERVENTION_NEEDED',
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const AlertStatus = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];

export interface RiskReasonDto {
  type?: string;
  factor?: string;
  concept?: string;
  category?: string;
  description: string;
  severity?: AlertSeverity;
  weight?: number;
  score?: number;
}

export interface StudentRiskProfileDto {
  studentId: string;
  studentName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reasons?: RiskReasonDto[];
  evidenceCount?: number;
  primaryRootCause?: string;
  evidence?: string[];
  breakdown?: RiskReasonDto[];
  recommendedAction?: string;
}

export interface ClassOverviewDto {
  classId: string;
  className: string;
  academicYear?: string;
  grade?: number;
  subjectName?: string;
  studentCount?: number;
  totalStudents?: number;
  activeStudents?: number;
  averageMastery: number;
  averageConfidence?: number;
  studentsAtRisk?: number;
  strugglingStudentsCount?: number;
  studentsNeedingIntervention?: number;
  masteredConceptPercentage?: number;
  developingConceptPercentage?: number;
  weakConceptPercentage?: number;
  criticalConceptPercentage?: number;
  dueReviews?: number;
  activeMisconceptions?: number;
  riskDistribution?: {
    ON_TRACK: number;
    WATCH: number;
    AT_RISK: number;
    CRITICAL: number;
  };
  topConceptsNeedingAttention?: Array<{
    conceptId: string;
    conceptName: string;
    averageMastery: number;
    strugglingStudentsCount: number;
  }>;
  activeInterventionsCount?: number;
}

export interface InterventionDto {
  id: string;
  teacherId: string;
  classId?: string | null;
  studentId?: string | null;
  conceptId?: string | null;
  type: InterventionType;
  reason: string;
  recommendation?: string | null;
  status: InterventionStatus;
  priority: AlertSeverity;
  beforeMastery?: number | null;
  afterMastery?: number | null;
  outcome?: InterventionOutcome | null;
  targetMastery?: number | null;
  practiceCount?: number | null;
  teacherNotes?: string | null;
  createdAt: string;
}

export interface TeacherAlertDto {
  id: string;
  teacherId: string;
  studentId?: string | null;
  classId?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
}

export interface TeacherDashboardDto {
  teacherId?: string;
  totalClasses?: number;
  totalStudents?: number;
  strugglingStudentsCount?: number;
  activeInterventionsCount?: number;
  unreadAlertsCount?: number;
  riskDistribution?: {
    ON_TRACK: number;
    WATCH: number;
    AT_RISK: number;
    CRITICAL: number;
  };
  urgentStudents?: Array<{
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    riskLevel: RiskLevel;
    riskScore: number;
    primaryRootCause: string;
  }>;
  classes?: ClassOverviewDto[];
  summary?: {
    totalStudents: number;
    onTrack: number;
    watch: number;
    atRisk: number;
    critical: number;
  };
  topBottlenecks?: any[];
  topMisconceptions?: any[];
  priorityStudents?: StudentRiskProfileDto[];
  recommendedInterventions?: InterventionDto[];
  alerts?: TeacherAlertDto[];
}
