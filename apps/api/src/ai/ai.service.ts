import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateTextOptions, GenerateStructuredOutputOptions } from './interfaces/ai-provider.interface';
import { MockAIProvider } from './providers/mock-ai.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private provider: AIProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockAIProvider,
  ) {
    const providerName = this.configService.get<string>('AI_PROVIDER', 'openai');
    this.logger.log(`AiService initialized with configured provider: ${providerName} (falling back to MockAIProvider in Phase 1)`);
    this.provider = this.mockProvider;
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    return this.provider.generateText(options);
  }

  async generateStructuredOutput<T = any>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    return this.provider.generateStructuredOutput<T>(options);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }
}
