import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { DocumentService } from './document.service';
import { EmbeddingService } from './embedding.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [RagController],
  providers: [RagService, DocumentService, EmbeddingService],
  exports: [RagService],
})
export class RagModule {}
