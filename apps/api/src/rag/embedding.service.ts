import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly aiService: AiService) {}

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.log(`Generating embedding for text chunk length ${text.length}`);
    return this.aiService.generateEmbedding(text);
  }
}
