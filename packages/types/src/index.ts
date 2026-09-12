export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

export enum AssessmentPurpose {
  DIAGNOSTIC = 'DIAGNOSTIC',
  PRACTICE = 'PRACTICE',
  REMEDIAL = 'REMEDIAL',
  FINAL = 'FINAL',
}

export enum AssessmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum LearningPlanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum LearningPlanItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  MASTERED = 'MASTERED',
}

export enum MessageRole {
  SYSTEM = 'SYSTEM',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentVisibility {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AssociationStatus {
  SUGGESTED = 'SUGGESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

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

export enum EvidenceSource {
  DIAGNOSTIC = 'DIAGNOSTIC',
  PRACTICE = 'PRACTICE',
  TUTOR = 'TUTOR',
  REMEDIAL = 'REMEDIAL',
  ASSESSMENT = 'ASSESSMENT',
  AI_EVALUATION = 'AI_EVALUATION',
}

export enum MasteryHistoryReason {
  INITIAL_ASSESSMENT = 'INITIAL_ASSESSMENT',
  CORRECT_ANSWER = 'CORRECT_ANSWER',
  INCORRECT_ANSWER = 'INCORRECT_ANSWER',
  REMEDIAL_SUCCESS = 'REMEDIAL_SUCCESS',
  REMEDIAL_FAILURE = 'REMEDIAL_FAILURE',
  ASSESSMENT_RESULT = 'ASSESSMENT_RESULT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum MisconceptionCategory {
  ARITHMETIC_ERROR = 'ARITHMETIC_ERROR',
  SIGN_ERROR = 'SIGN_ERROR',
  PLACE_VALUE_ERROR = 'PLACE_VALUE_ERROR',
  FRACTION_DENOMINATOR_ERROR = 'FRACTION_DENOMINATOR_ERROR',
  FRACTION_NUMERATOR_ERROR = 'FRACTION_NUMERATOR_ERROR',
  UNIT_CONVERSION_ERROR = 'UNIT_CONVERSION_ERROR',
  FORMULA_RECALL_ERROR = 'FORMULA_RECALL_ERROR',
  CONCEPT_CONFUSION = 'CONCEPT_CONFUSION',
  PREREQUISITE_GAP = 'PREREQUISITE_GAP',
  PROCEDURAL_ERROR = 'PROCEDURAL_ERROR',
  READING_COMPREHENSION_ERROR = 'READING_COMPREHENSION_ERROR',
  CARELESS_ERROR = 'CARELESS_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export enum LearningRecommendationType {
  CONTINUE = 'CONTINUE',
  PRACTICE = 'PRACTICE',
  REMEDIATE = 'REMEDIATE',
  REVIEW_PREREQUISITE = 'REVIEW_PREREQUISITE',
  REASSESS = 'REASSESS',
  ADVANCE = 'ADVANCE',
  REVIEW_LATER = 'REVIEW_LATER',
}

export enum AdaptiveSessionStatus {
  STARTED = 'STARTED',
  DIAGNOSING = 'DIAGNOSING',
  TEACHING = 'TEACHING',
  PRACTICING = 'PRACTICING',
  REMEDIATING = 'REMEDIATING',
  REASSESSING = 'REASSESSING',
  COMPLETED = 'COMPLETED',
}

export enum LearningEventType {
  QUESTION_SHOWN = 'QUESTION_SHOWN',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  HINT_REQUESTED = 'HINT_REQUESTED',
  MISCONCEPTION_DETECTED = 'MISCONCEPTION_DETECTED',
  MASTERY_UPDATED = 'MASTERY_UPDATED',
  CONCEPT_MASTERED = 'CONCEPT_MASTERED',
  REMEDIATION_STARTED = 'REMEDIATION_STARTED',
  REASSESSMENT_STARTED = 'REASSESSMENT_STARTED',
  REVIEW_SCHEDULED = 'REVIEW_SCHEDULED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  CONCEPT_REGRESSED = 'CONCEPT_REGRESSED',
}

export enum QuestionObjectiveType {
  RECALL = 'RECALL',
  PROCEDURAL = 'PROCEDURAL',
  APPLICATION = 'APPLICATION',
  TRANSFER = 'TRANSFER',
}

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

export enum ClassGroupStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum RiskLevel {
  ON_TRACK = 'ON_TRACK',
  WATCH = 'WATCH',
  AT_RISK = 'AT_RISK',
  CRITICAL = 'CRITICAL',
}

export enum InterventionType {
  INDIVIDUAL_REMEDIATION = 'INDIVIDUAL_REMEDIATION',
  GROUP_REMEDIATION = 'GROUP_REMEDIATION',
  PREREQUISITE_REVIEW = 'PREREQUISITE_REVIEW',
  ADDITIONAL_PRACTICE = 'ADDITIONAL_PRACTICE',
  TEACHER_EXPLANATION = 'TEACHER_EXPLANATION',
  ASSESSMENT = 'ASSESSMENT',
  REVIEW = 'REVIEW',
  PEER_SUPPORT = 'PEER_SUPPORT',
  CURRICULUM_REVIEW = 'CURRICULUM_REVIEW',
}

export enum InterventionStatus {
  RECOMMENDED = 'RECOMMENDED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISMISSED = 'DISMISSED',
}

export enum InterventionOutcome {
  SUCCESSFUL = 'SUCCESSFUL',
  PARTIALLY_SUCCESSFUL = 'PARTIALLY_SUCCESSFUL',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  INCONCLUSIVE = 'INCONCLUSIVE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertType {
  STUDENT_AT_RISK = 'STUDENT_AT_RISK',
  STUDENT_CRITICAL = 'STUDENT_CRITICAL',
  CLASS_BOTTLENECK = 'CLASS_BOTTLENECK',
  MISCONCEPTION_CLUSTER = 'MISCONCEPTION_CLUSTER',
  MASTERY_REGRESSION = 'MASTERY_REGRESSION',
  REMEDIATION_FAILURE = 'REMEDIATION_FAILURE',
  REVIEW_OVERDUE = 'REVIEW_OVERDUE',
  INTERVENTION_NEEDED = 'INTERVENTION_NEEDED',
}

export enum AlertStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

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



