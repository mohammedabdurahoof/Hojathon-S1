import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, GenerateTextOptions, GenerateStructuredOutputOptions } from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';
  private readonly logger = new Logger(MockAIProvider.name);

  async generateText(options: GenerateTextOptions): Promise<string> {
    this.logger.log(`[MockAI] Generating text response for prompt`);
    return `[AI Tutor Response] Let's work on this step-by-step. What do you get when you find a common denominator?`;
  }

  async generateStructuredOutput<T = any>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    const prompt = options.prompt || '';
    this.logger.log(`[MockAI] Generating structured JSON for schema: ${options.schemaName || 'default'}`);

    // If prompt is for Answer Evaluation
    if (prompt.includes('evaluat') || options.schemaName === 'EvaluatorSchema') {
      const isIncorrect = prompt.includes('2/5') || prompt.includes('wrong');
      if (isIncorrect) {
        return {
          correct: false,
          status: 'INCORRECT',
          score: 0.0,
          confidence: 0.95,
          feedback: 'Not quite right. Notice how you added both the top and bottom numbers directly.',
          misconception: 'Student is adding numerators and denominators directly without finding a common denominator.',
          hint: 'Remember: Before adding fractions, you must convert them so they share the same common denominator!',
        } as unknown as T;
      }
      return {
        correct: true,
        status: 'CORRECT',
        score: 1.0,
        confidence: 0.98,
        feedback: 'Excellent job! You correctly solved the problem.',
        misconception: null,
        hint: null,
      } as unknown as T;
    }

    // If prompt is for Tutor response
    if (prompt.includes('tutor') || options.schemaName === 'TutorSchema') {
      return {
        type: 'QUESTION',
        message: 'Welcome! Let\'s work on Fractions. If you have 1/2 of a pizza and another 1/2 of a pizza, how much pizza do you have in total?',
        conceptId: 'MATH-FRAC',
        difficulty: 2,
        requiresStudentResponse: true,
        nextAction: 'ANSWER',
      } as unknown as T;
    }

    // If prompt is for Lesson Generation
    if (prompt.includes('lesson') || options.schemaName === 'LessonSchema') {
      return {
        concept: 'Fractions',
        objective: 'Student will learn to add fractions with unlike denominators',
        prerequisiteCheck: 'Requires solid understanding of division and multiplication tables.',
        sections: [
          { type: 'OBJECTIVE', content: 'Understand denominators and LCD (Least Common Denominator).' },
          { type: 'EXPLANATION', content: 'To add fractions with different denominators, first convert them to equivalent fractions with a matching denominator.' },
          { type: 'EXAMPLE', content: 'For 1/2 + 1/3, the common denominator is 6. 1/2 becomes 3/6 and 1/3 becomes 2/6. Sum = 5/6.' },
          { type: 'GUIDED_PRACTICE', content: 'What is 1/4 + 1/2?', question: 'Convert 1/2 to 2/4 and add 1/4 + 2/4.', options: ['2/4', '3/4', '2/6', '3/6'], answer: '3/4' },
          { type: 'INDEPENDENT_PRACTICE', content: 'Try solving 1/3 + 1/6 on your own.' },
        ],
      } as unknown as T;
    }

    // If prompt is for Practice Generation
    if (prompt.includes('practice') || options.schemaName === 'PracticeSchema') {
      return [
        {
          conceptId: 'MATH-FRAC',
          type: 'MULTIPLE_CHOICE',
          difficulty: 2,
          question: 'What is 1/3 + 1/3?',
          options: ['2/6', '2/3', '1/6', '3/3'],
          correctAnswer: '2/3',
          explanation: 'When denominators are identical, simply add the numerators: 1 + 1 = 2.',
        },
      ] as unknown as T;
    }

    return {
      status: 'success',
      result: 'Mock structured output',
    } as unknown as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 2);
  }
}
