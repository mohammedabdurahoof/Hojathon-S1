import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '../providers/openai.provider';
import { SYSTEM_SAFETY_RULES } from '../prompts/system-safety.prompt';
import { EvaluationResultDto, EvaluationStatus } from '@ai-remedial/types';

@Injectable()
export class EvaluatorAgent {
  private readonly logger = new Logger(EvaluatorAgent.name);

  constructor(private readonly aiProvider: OpenAIProvider) {}

  async evaluateAnswer(params: {
    questionText: string;
    expectedAnswer: string;
    studentAnswer: string;
    conceptName?: string;
  }): Promise<EvaluationResultDto> {
    this.logger.log(`EvaluatorAgent evaluating answer: "${params.studentAnswer}" for question: "${params.questionText.substring(0, 30)}..."`);

    const systemPrompt = `
${SYSTEM_SAFETY_RULES}

You are the AI Academic Evaluator. Your job is to evaluate student answers, assign accuracy scores, detect specific conceptual misconceptions, and provide helpful hints.

RULES:
1. Distinguish status: "CORRECT", "PARTIALLY_CORRECT", "INCORRECT", "UNCLEAR".
2. If student answer is incorrect, identify any underlying conceptual MISCONCEPTION (e.g., adding numerators and denominators directly when adding fractions).
3. Do NOT immediately reveal the exact correct answer when the student is wrong! Provide a subtle hint to encourage another attempt.
4. Output MUST strictly match JSON schema:
{
  "correct": boolean,
  "status": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "UNCLEAR",
  "score": number (0.0 to 1.0),
  "confidence": number (0.0 to 1.0),
  "feedback": "Encouraging feedback text",
  "misconception": "Description of student misconception or null",
  "hint": "Guided hint for next attempt or null"
}
`;

    const prompt = `
Question: "${params.questionText}"
Expected Correct Answer: "${params.expectedAnswer}"
Student Submitted Answer: "${params.studentAnswer}"
Concept Context: "${params.conceptName ?? 'General'}"

Evaluate the student's submission.
`;

    return this.aiProvider.generateStructuredOutput<EvaluationResultDto>({
      prompt,
      systemPrompt,
      schemaName: 'EvaluatorSchema',
      validator: (raw) => this.validateEvaluationResult(raw),
    });
  }

  private validateEvaluationResult(raw: any): EvaluationResultDto {
    const validStatuses: EvaluationStatus[] = ['CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'UNCLEAR'];

    const status: EvaluationStatus = validStatuses.includes(raw?.status) ? raw.status : raw?.correct ? 'CORRECT' : 'INCORRECT';
    const correct = typeof raw?.correct === 'boolean' ? raw.correct : status === 'CORRECT';
    const score = typeof raw?.score === 'number' && raw.score >= 0 && raw.score <= 1 ? raw.score : correct ? 1.0 : 0.0;
    const confidence = typeof raw?.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1 ? raw.confidence : 0.9;

    return {
      correct,
      status,
      score,
      confidence,
      feedback: typeof raw?.feedback === 'string' ? raw.feedback : correct ? 'Great job!' : 'Not quite right. Try again with this hint.',
      misconception: typeof raw?.misconception === 'string' ? raw.misconception : null,
      hint: typeof raw?.hint === 'string' ? raw.hint : null,
    };
  }
}
