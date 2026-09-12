import { Injectable, Logger } from '@nestjs/common';
import { FullQuestion, QualityValidationResult } from '../types/assessment-engine.types';
import { PrismaService } from '../../prisma/prisma.service';
import { checkDuplicate } from '../utils/duplicate-detection.util';

@Injectable()
export class QuestionQualityService {
  private readonly logger = new Logger(QuestionQualityService.name);
  private readonly PASSING_SCORE = 9; // out of 12

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run 12-point quality validation for AI-generated questions.
   * Returns detailed pass/fail with score and failed check descriptions.
   */
  async validate(question: Partial<FullQuestion>, conceptId: string): Promise<QualityValidationResult> {
    const failedChecks: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // 1. Non-empty question text (min 15 chars)
    if (question.text && question.text.trim().length >= 15) {
      score++;
    } else {
      failedChecks.push('CHECK_01: Question text is too short or empty (min 15 chars)');
    }

    // 2. Answer is not empty
    if (question.answer && question.answer.trim().length > 0) {
      score++;
    } else {
      failedChecks.push('CHECK_02: Correct answer is empty');
    }

    // 3. For MCQ: has at least 3 options
    if (question.type === 'MULTIPLE_CHOICE') {
      const opts = Array.isArray(question.options) ? question.options : [];
      if (opts.length >= 3) {
        score++;
      } else {
        failedChecks.push('CHECK_03: MCQ must have at least 3 options');
      }
    } else {
      score++; // Non-MCQ types skip this check
    }

    // 4. For MCQ: has at most 6 options
    if (question.type === 'MULTIPLE_CHOICE') {
      const opts = Array.isArray(question.options) ? question.options : [];
      if (opts.length <= 6) {
        score++;
      } else {
        failedChecks.push('CHECK_04: MCQ has too many options (max 6)');
      }
    } else {
      score++;
    }

    // 5. For MCQ: correct answer is one of the options
    if (question.type === 'MULTIPLE_CHOICE') {
      const opts = Array.isArray(question.options) ? question.options.map((o: string) => o.trim()) : [];
      const answer = question.answer?.trim() ?? '';
      const isAnswerInOptions = opts.some(
        (opt: string) => opt === answer || opt.startsWith(answer),
      );
      if (isAnswerInOptions) {
        score++;
      } else {
        failedChecks.push('CHECK_05: Correct answer is not among the provided options');
      }
    } else {
      score++;
    }

    // 6. Question text does not contain the answer verbatim
    if (question.text && question.answer) {
      const textLower = question.text.toLowerCase();
      const answerLower = question.answer.toLowerCase().trim();
      if (answerLower.length > 3 && textLower.includes(answerLower)) {
        failedChecks.push('CHECK_06: Question text appears to leak the answer');
      } else {
        score++;
      }
    } else {
      score++;
    }

    // 7. Explanation is provided
    if (question.explanation && question.explanation.trim().length > 20) {
      score++;
    } else {
      failedChecks.push('CHECK_07: Explanation is missing or too short (min 20 chars)');
      warnings.push('Consider adding a detailed explanation referencing the correct answer and why distractors are wrong');
    }

    // 8. Estimated time is reasonable (10s to 600s)
    const time = question.estimatedTimeSeconds ?? 0;
    if (time >= 10 && time <= 600) {
      score++;
    } else {
      failedChecks.push('CHECK_08: Estimated time is unreasonable (must be 10–600 seconds)');
    }

    // 9. Distractor misconceptions provided for MCQ
    if (question.type === 'MULTIPLE_CHOICE') {
      const dm = question.distractorMisconceptions as Record<string, string> | null;
      if (dm && Object.keys(dm).length >= 2) {
        score++;
      } else {
        failedChecks.push('CHECK_09: MCQ must have distractor misconception mappings for at least 2 wrong options');
        warnings.push('Distractor misconceptions help identify specific student errors');
      }
    } else {
      score++;
    }

    // 10. No duplicate MCQ options
    if (question.type === 'MULTIPLE_CHOICE') {
      const opts = Array.isArray(question.options)
        ? question.options.map((o: string) => o.toLowerCase().trim())
        : [];
      const unique = new Set(opts);
      if (unique.size === opts.length) {
        score++;
      } else {
        failedChecks.push('CHECK_10: Duplicate options detected in MCQ');
      }
    } else {
      score++;
    }

    // 11. Concept exists in DB
    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (concept) {
      score++;
    } else {
      failedChecks.push(`CHECK_11: Concept ID "${conceptId}" does not exist in the curriculum`);
    }

    // 12. Near-duplicate detection
    if (question.text) {
      const existingTexts = await this.getExistingQuestionTexts(conceptId);
      const dupResult = checkDuplicate(question.text, existingTexts);
      if (dupResult.isDuplicate) {
        failedChecks.push(
          `CHECK_12: Question is too similar to an existing question (similarity: ${(dupResult.similarity * 100).toFixed(1)}%)`,
        );
      } else {
        score++;
      }
    } else {
      score++;
    }

    const passed = score >= this.PASSING_SCORE && failedChecks.length === 0;

    this.logger.log(`Quality validation: score=${score}/12, passed=${passed}`);

    return { passed, score, failedChecks, warnings };
  }

  private async getExistingQuestionTexts(conceptId: string): Promise<string[]> {
    const questions = await this.prisma.question.findMany({
      where: { conceptId, isActive: true },
      select: { text: true },
    });
    return questions.map((q) => q.text);
  }
}
