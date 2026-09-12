export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateStructuredOutputOptions<T = any> extends GenerateTextOptions {
  schema?: Record<string, any>;
}

export interface AIProvider {
  name: string;
  generateText(options: GenerateTextOptions): Promise<string>;
  generateStructuredOutput<T = any>(options: GenerateStructuredOutputOptions<T>): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
}
