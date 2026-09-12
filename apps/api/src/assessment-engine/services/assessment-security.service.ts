import { Injectable, Logger } from '@nestjs/common';
import { SanitizedQuestion, FullQuestion } from '../types/assessment-engine.types';

@Injectable()
export class AssessmentSecurityService {
  private readonly logger = new Logger(AssessmentSecurityService.name);

  /**
   * Strip sensitive fields from a question before sending to student.
   * This is a hard security boundary — must never be bypassed.
   */
  sanitizeQuestion(question: any): SanitizedQuestion {
    // Destructure sensitive fields and return clean object
    const {
      answer,
      explanation,
      distractorMisconceptions,
      qualityScore,
      sourceMetadata,
      metadata,
      createdBy,
      aiGenerated,
      source,
      status,
      ...safe
    } = question;

    return safe as SanitizedQuestion;
  }

  sanitizeQuestions(questions: any[]): SanitizedQuestion[] {
    return questions.map((q) => this.sanitizeQuestion(q));
  }

  /**
   * Verify the student owns the given attempt.
   * Returns true if ownership is valid.
   */
  verifyAttemptOwnership(attempt: { studentId: string }, studentId: string): boolean {
    return attempt.studentId === studentId;
  }

  /**
   * Check if an attempt is still in a submittable state.
   */
  isAttemptSubmittable(attemptState: string): boolean {
    return ['IN_PROGRESS', 'NOT_STARTED'].includes(attemptState);
  }

  /**
   * Check if timer is still valid (not expired).
   * @param startedAt Attempt start time
   * @param durationMinutes Maximum allowed duration
   */
  isWithinTimer(startedAt: Date, durationMinutes: number): boolean {
    const now = Date.now();
    const elapsed = now - startedAt.getTime();
    const allowedMs = durationMinutes * 60 * 1000;
    // Allow 30-second grace window
    return elapsed <= allowedMs + 30_000;
  }

  /**
   * Redact answer-leaking fields from a raw AI-generated question candidate
   * before persisting (ensure correctAnswer is stored only in `answer` field).
   */
  normalizeAiGeneratedQuestion(raw: any): Partial<FullQuestion> {
    return {
      text: raw.text,
      type: raw.type ?? 'MULTIPLE_CHOICE',
      options: raw.options ?? null,
      answer: raw.answer,
      explanation: raw.explanation ?? null,
      estimatedTimeSeconds: raw.estimatedTimeSeconds ?? 60,
      distractorMisconceptions: raw.distractorMisconceptions ?? null,
    };
  }
}
