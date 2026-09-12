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

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

