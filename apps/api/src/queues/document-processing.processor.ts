import { Injectable, Logger } from '@nestjs/common';
import { DocumentIngestionService } from '../rag/ingestion/document-ingestion.service';
import { RedisService } from '../common/redis.service';

export interface DocumentJobData {
  documentId: string;
}

@Injectable()
export class DocumentProcessingProcessor {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);

  constructor(
    private readonly ingestionService: DocumentIngestionService,
    private readonly redisService: RedisService,
  ) {
    this.logger.log('Initialized BullMQ DocumentProcessingProcessor queue handler');
  }

  async processJob(jobData: DocumentJobData) {
    this.logger.log(`Processing document job for documentId "${jobData.documentId}"`);
    try {
      await this.ingestionService.processDocumentContent(jobData.documentId);
      this.logger.log(`Job completed for documentId "${jobData.documentId}"`);
      return { success: true, documentId: jobData.documentId };
    } catch (e: any) {
      this.logger.error(`Job failed for documentId "${jobData.documentId}": ${e.message}`);
      throw e;
    }
  }
}
