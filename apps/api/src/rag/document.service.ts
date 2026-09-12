import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async chunkDocument(content: string, chunkSize: number = 500): Promise<string[]> {
    this.logger.log(`Chunking document of total length ${content.length}`);
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    return chunks.length > 0 ? chunks : [content];
  }
}
