import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DocumentIngestionService } from './ingestion/document-ingestion.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { CurriculumGroundingService } from './curriculum/curriculum-grounding.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentBodyDto, RagHybridSearchDto, AssociateConceptChunkDto } from './dto/rag-api.dto';
import { AssociationStatus } from '@prisma/client';

@ApiTags('RAG')
@Controller('rag')
export class RagController {
  constructor(
    private readonly ingestionService: DocumentIngestionService,
    private readonly retrievalService: RetrievalService,
    private readonly groundingService: CurriculumGroundingService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('documents')
  @ApiOperation({ summary: 'Upload and process a curriculum document (PDF, TXT, Markdown)' })
  async uploadDocument(@Body() dto: UploadDocumentBodyDto) {
    const fileBuffer = Buffer.from(dto.content, 'utf-8');
    return this.ingestionService.ingestDocument({
      title: dto.title,
      description: dto.description,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      fileBuffer,
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      topicId: dto.topicId,
    });
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all curriculum documents with status and visibility filters' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'visibility', required: false })
  async findAllDocuments(
    @Query('subjectId') subjectId?: string,
    @Query('visibility') visibility?: string,
  ) {
    const where: any = {};
    if (subjectId) where.subjectId = subjectId;
    if (visibility) where.visibility = visibility;

    return this.prisma.document.findMany({
      where,
      include: {
        subject: true,
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document details and chunk previews' })
  async findOneDocument(@Param('id') id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        subject: true,
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });
  }

  @Patch('documents/:id/publish')
  @ApiOperation({ summary: 'Publish document making it accessible for student AI tutoring' })
  async publishDocument(@Param('id') id: string) {
    return this.ingestionService.publishDocument(id);
  }

  @Post('documents/:id/reprocess')
  @ApiOperation({ summary: 'Trigger document reprocessing and embedding generation' })
  async reprocessDocument(@Param('id') id: string) {
    await this.ingestionService.processDocumentContent(id);
    return { success: true, message: `Document "${id}" reprocessed successfully.` };
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document and all associated chunks' })
  async deleteDocument(@Param('id') id: string) {
    return this.prisma.document.delete({ where: { id } });
  }

  @Post('search')
  @ApiOperation({ summary: 'Perform PostgreSQL pgvector hybrid search over curriculum chunks' })
  async search(@Body() dto: RagHybridSearchDto) {
    return this.retrievalService.retrieve({
      studentId: dto.studentId,
      query: dto.query,
      conceptId: dto.conceptId,
      limit: dto.limit ?? 5,
      onlyPublished: true,
    });
  }

  @Post('concepts/:conceptId/associate')
  @ApiOperation({ summary: 'Manually associate a document chunk with a concept' })
  async associateChunkWithConcept(
    @Param('conceptId') conceptId: string,
    @Body() dto: AssociateConceptChunkDto,
  ) {
    return this.prisma.curriculumContent.upsert({
      where: {
        conceptId_documentChunkId: {
          conceptId,
          documentChunkId: dto.documentChunkId,
        },
      },
      update: {
        associationStatus: AssociationStatus.CONFIRMED,
        isPrimary: dto.isPrimary ?? false,
      },
      create: {
        conceptId,
        documentChunkId: dto.documentChunkId,
        relevanceScore: 1.0,
        isPrimary: dto.isPrimary ?? false,
        associationStatus: AssociationStatus.CONFIRMED,
      },
    });
  }
}
