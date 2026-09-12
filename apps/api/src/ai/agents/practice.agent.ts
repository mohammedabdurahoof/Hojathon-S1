import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '../providers/openai.provider';
import { SYSTEM_SAFETY_RULES } from '../prompts/system-safety.prompt';

export interface GeneratedQuestionItem {
  conceptId: string;
  type: string;
  difficulty: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

@Injectable()
export class PracticeAgent {
  private readonly logger = new Logger(PracticeAgent.name);

  constructor(private readonly aiProvider: OpenAIProvider) {}

  async generatePracticeQuestions(params: {
    conceptId: string;
    conceptName: string;
    count: number;
    difficulty: number;
  }): Promise<GeneratedQuestionItem[]> {
    this.logger.log(`PracticeAgent generating ${params.count} questions for concept "${params.conceptName}" (diff=${params.difficulty})`);

    const systemPrompt = `
${SYSTEM_SAFETY_RULES}

You are an AI Practice Generator. Generate ${params.count} multiple-choice question(s) for concept "${params.conceptName}".
Difficulty Level: ${params.difficulty} out of 5.

OUTPUT FORMAT: JSON array of question objects matching:
[
  {
    "conceptId": "${params.conceptId}",
    "type": "MULTIPLE_CHOICE",
    "difficulty": ${params.difficulty},
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact matching string from options array",
    "explanation": "Clear step-by-step solution"
  }
]
`;

    const prompt = `Generate ${params.count} unique practice question(s) for concept: ${params.conceptName}.`;

    const raw = await this.aiProvider.generateStructuredOutput<any[]>({
      prompt,
      systemPrompt,
      schemaName: 'PracticeSchema',
    });

    const items = Array.isArray(raw) ? raw : [raw];
    return items.map((item) => this.validateQuestionItem(item, params.conceptId, params.difficulty));
  }

  private validateQuestionItem(raw: any, conceptId: string, defaultDifficulty: number): GeneratedQuestionItem {
    const questionText = typeof raw?.question === 'string' && raw.question.length > 5 ? raw.question : 'What is the value of the given expression?';
    const options = Array.isArray(raw?.options) && raw.options.length >= 2 ? raw.options : ['Option A', 'Option B', 'Option C', 'Option D'];
    const correctAnswer = typeof raw?.correctAnswer === 'string' && options.includes(raw.correctAnswer) ? raw.correctAnswer : options[0];

    return {
      conceptId: typeof raw?.conceptId === 'string' ? raw.conceptId : conceptId,
      type: 'MULTIPLE_CHOICE',
      difficulty: typeof raw?.difficulty === 'number' && raw.difficulty >= 1 && raw.difficulty <= 5 ? raw.difficulty : defaultDifficulty,
      question: questionText,
      options,
      correctAnswer,
      explanation: typeof raw?.explanation === 'string' ? raw.explanation : `Correct answer is ${correctAnswer}.`,
    };
  }
}
