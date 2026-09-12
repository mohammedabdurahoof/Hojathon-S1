import { Module, forwardRef } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { DocumentService } from './document.service';
import { EmbeddingService } from './embedding.service';
import {
  DocumentParserService,
  TextDocumentParser,
  MarkdownDocumentParser,
  PdfDocumentParser,
} from './ingestion/document-parser.service';
import { DocumentChunkService } from './ingestion/document-chunk.service';
import { DocumentIngestionService } from './ingestion/document-ingestion.service';
import { VectorSearchService } from './retrieval/vector-search.service';
import { KeywordSearchService } from './retrieval/keyword-search.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { CurriculumGroundingService } from './curriculum/curriculum-grounding.service';
import { DocumentProcessingProcessor } from '../queues/document-processing.processor';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [RagController],
  providers: [
    RagService,
    DocumentService,
    EmbeddingService,
    TextDocumentParser,
    MarkdownDocumentParser,
    PdfDocumentParser,
    DocumentParserService,
    DocumentChunkService,
    DocumentIngestionService,
    VectorSearchService,
    KeywordSearchService,
    RetrievalService,
    CurriculumGroundingService,
    DocumentProcessingProcessor,
  ],
  exports: [
    RagService,
    CurriculumGroundingService,
    RetrievalService,
    DocumentIngestionService,
  ],
})
export class RagModule {}

