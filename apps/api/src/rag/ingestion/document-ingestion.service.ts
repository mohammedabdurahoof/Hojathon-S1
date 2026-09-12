import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { DocumentParserService } from './document-parser.service';
import { DocumentChunkService } from './document-chunk.service';
import { AiService } from '../../ai/ai.service';
import { DocumentStatus, DocumentVisibility, AssociationStatus } from '@prisma/client';

export interface UploadDocumentParams {
  title: string;
  description?: string;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  uploadedBy?: string;
  curriculumYear?: string;
}

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly parserService: DocumentParserService,
    private readonly chunkService: DocumentChunkService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Upload and process a document into the RAG system
   */
  async ingestDocument(params: UploadDocumentParams) {
    if (!params.fileBuffer || params.fileBuffer.length === 0) {
      throw new BadRequestException('Cannot ingest empty file.');
    }

    const storageKey = `docs/${Date.now()}_${params.fileName}`;
    await this.storageService.upload(storageKey, params.fileBuffer, params.mimeType);

    const doc = await this.prisma.document.create({
      data: {
        title: params.title,
        description: params.description,
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileSize: params.fileBuffer.length,
        storageKey,
        subjectId: params.subjectId,
        chapterId: params.chapterId,
        topicId: params.topicId,
        uploadedBy: params.uploadedBy ?? 'admin',
        status: DocumentStatus.PROCESSING,
        visibility: DocumentVisibility.DRAFT,
        curriculumYear: params.curriculumYear ?? '2026',
      },
    });

    // Run processing
    await this.processDocumentContent(doc.id, params.fileBuffer);

    return this.prisma.document.findUnique({
      where: { id: doc.id },
      include: {
        subject: true,
        chunks: {
          take: 5,
        },
      },
    });
  }

  /**
   * Process/Reprocess document text extraction, chunking, embedding, and concept association
   */
  async processDocumentContent(documentId: string, fileBuffer?: Buffer) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException(`Document with ID "${documentId}" not found.`);
    }

    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PROCESSING },
      });

      const buffer = fileBuffer ?? (await this.storageService.download(doc.storageKey));
      const parseResult = await this.parserService.parseDocument(buffer, doc.mimeType, doc.fileName);

      const chunks = this.chunkService.createChunks(parseResult.text, parseResult.pageNumber);

      // Idempotency: Delete previous chunks belonging to this document version
      await this.prisma.documentChunk.deleteMany({
        where: { documentId: doc.id },
      });

      // Fetch concepts to run automatic concept association suggestions
      const allConcepts = await this.prisma.concept.findMany();

      for (const chunkData of chunks) {
        // Generate embedding via AI provider
        const embeddingVector = await this.aiService.generateEmbedding(chunkData.content);

        const createdChunk = await this.prisma.documentChunk.create({
          data: {
            documentId: doc.id,
            chunkIndex: chunkData.chunkIndex,
            content: chunkData.content,
            tokenCount: chunkData.tokenCount,
            pageNumber: chunkData.pageNumber,
            sectionTitle: chunkData.sectionTitle,
            subjectId: doc.subjectId,
            chapterId: doc.chapterId,
            topicId: doc.topicId,
            embedding: JSON.stringify(embeddingVector),
            metadata: {
              charLength: chunkData.content.length,
            },
          },
        });

        // Rule-based automatic concept association suggestion
        for (const concept of allConcepts) {
          const lowerContent = chunkData.content.toLowerCase();
          const lowerName = concept.name.toLowerCase();
          const lowerCode = concept.code.toLowerCase();

          if (lowerContent.includes(lowerName) || lowerContent.includes(lowerCode)) {
            await this.prisma.curriculumContent.upsert({
              where: {
                conceptId_documentChunkId: {
                  conceptId: concept.id,
                  documentChunkId: createdChunk.id,
                },
              },
              update: {
                associationStatus: AssociationStatus.SUGGESTED,
              },
              create: {
                conceptId: concept.id,
                documentChunkId: createdChunk.id,
                relevanceScore: 0.85,
                isPrimary: false,
                associationStatus: AssociationStatus.SUGGESTED,
              },
            });
          }
        }
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.PROCESSED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully processed document "${doc.id}" into ${chunks.length} chunks`);
    } catch (e: any) {
      this.logger.error(`Document processing failed for "${documentId}": ${e.message}`);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED },
      });
      throw e;
    }
  }

  async publishDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException(`Document "${documentId}" not found.`);

    if (doc.status !== DocumentStatus.PROCESSED) {
      throw new BadRequestException(`Cannot publish document "${documentId}" with status "${doc.status}". Must be PROCESSED.`);
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: { visibility: DocumentVisibility.PUBLISHED },
    });
  }
}
