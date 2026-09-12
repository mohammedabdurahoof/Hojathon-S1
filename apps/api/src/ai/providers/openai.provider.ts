import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateTextOptions, GenerateStructuredOutputOptions } from '../interfaces/ai-provider.interface';
import { MockAIProvider } from './mock-ai.provider';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAIProvider';
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockAIProvider,
  ) {
    this.apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.model = this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
    this.embeddingModel = this.configService.get<string>('AI_EMBEDDING_MODEL', 'text-embedding-3-small');

    if (!this.apiKey || this.apiKey.includes('your_openai_api_key_here')) {
      this.logger.warn(`OpenAI API key not set. OpenAIProvider will use MockAIProvider fallback mode.`);
    } else {
      this.logger.log(`OpenAIProvider initialized with model: ${this.model}, embeddingModel: ${this.embeddingModel}`);
    }
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    if (!this.apiKey || this.apiKey.includes('your_openai_api_key_here')) {
      return this.mockProvider.generateText(options);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: options.prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAI API error ${response.status}: ${errorText}`);
        return this.mockProvider.generateText(options);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content ?? '';
    } catch (error: any) {
      this.logger.error(`Failed OpenAI call, using fallback: ${error.message}`);
      return this.mockProvider.generateText(options);
    }
  }

  async generateStructuredOutput<T = any>(options: GenerateStructuredOutputOptions<T>): Promise<T> {
    if (!this.apiKey || this.apiKey.includes('your_openai_api_key_here')) {
      const result = await this.mockProvider.generateStructuredOutput<T>(options);
      if (options.validator) {
        return options.validator(result);
      }
      return result;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            ...(options.systemPrompt
              ? [{ role: 'system', content: `${options.systemPrompt}\nIMPORTANT: You must respond in valid JSON format matching the requested schema.` }]
              : [{ role: 'system', content: 'You are a helpful assistant. Respond in valid JSON.' }]),
            { role: 'user', content: options.prompt },
          ],
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 1500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAI API JSON error ${response.status}: ${errorText}`);
        return this.mockProvider.generateStructuredOutput<T>(options);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content);

      if (options.validator) {
        return options.validator(parsed);
      }
      return parsed as T;
    } catch (error: any) {
      this.logger.error(`Failed OpenAI structured JSON call, using fallback: ${error.message}`);
      return this.mockProvider.generateStructuredOutput<T>(options);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey || this.apiKey.includes('your_openai_api_key_here')) {
      return this.mockProvider.generateEmbedding(text);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        return this.mockProvider.generateEmbedding(text);
      }

      const data = await response.json();
      return data.data[0]?.embedding ?? [];
    } catch (error: any) {
      return this.mockProvider.generateEmbedding(text);
    }
  }
}
