import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, GenerateTextOptions, GenerateStructuredOutputOptions } from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';
  private readonly logger = new Logger(MockAIProvider.name);

  async generateText(options: GenerateTextOptions): Promise<string> {
    this.logger.log(`[MockAI] Generating text for prompt: "${options.prompt.substring(0, 40)}..."`);
    return `[Mock AI Response] Placeholder completion for: "${options.prompt}"`;
  }

  async generateStructuredOutput<T = any>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    this.logger.log(`[MockAI] Generating structured output for prompt: "${options.prompt.substring(0, 40)}..."`);
    return {
      status: 'success',
      mockResult: `Structured completion for: ${options.prompt}`,
    } as unknown as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.log(`[MockAI] Generating 1536-dimensional mock embedding for text length ${text.length}`);
    // Mock 1536-dimensional float vector for OpenAI compatibility
    return new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 2);
  }
}
