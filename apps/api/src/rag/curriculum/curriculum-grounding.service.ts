import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { RedisService } from '../../common/redis.service';

export interface GroundedContextParams {
  studentId: string;
  conceptId: string;
  query: string;
  limit?: number;
}

export interface GroundedChunkSource {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber: number | null;
  sectionTitle: string | null;
  score: number;
}

export interface GroundedContextResponse {
  conceptId: string;
  conceptName: string;
  query: string;
  retrievedChunks: GroundedChunkSource[];
  sourcesCount: number;
  isCached: boolean;
}

@Injectable()
export class CurriculumGroundingService {
  private readonly logger = new Logger(CurriculumGroundingService.name);
  private cache = new Map<string, { data: GroundedContextResponse; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly redisService: RedisService,
  ) {}

  async getGroundedContext(params: GroundedContextParams): Promise<GroundedContextResponse> {
    const student = await this.prisma.student.findUnique({ where: { id: params.studentId } });
    if (!student) {
      throw new NotFoundException(`Student "${params.studentId}" not found.`);
    }

    const concept = await this.prisma.concept.findUnique({
      where: { id: params.conceptId },
      include: { prerequisites: true },
    });
    if (!concept) {
      throw new NotFoundException(`Concept "${params.conceptId}" not found.`);
    }

    const normalizedQuery = params.query.trim().toLowerCase();
    const cacheKey = `rag:${params.conceptId}:${normalizedQuery}`;

    // Redis / Memory Cache Check
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log(`Cache hit for grounded RAG query key: ${cacheKey}`);
      return { ...cached.data, isCached: true };
    }

    const prereqIds = concept.prerequisites.map((p) => p.prerequisiteId);

    // Hybrid retrieval restricting student queries strictly to PUBLISHED documents
    const hybridChunks = await this.retrievalService.retrieve({
      studentId: params.studentId,
      query: params.query,
      conceptId: params.conceptId,
      prerequisiteConceptIds: prereqIds,
      limit: params.limit ?? 5,
      onlyPublished: true,
    });

    const sources: GroundedChunkSource[] = hybridChunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      content: c.content,
      pageNumber: c.pageNumber,
      sectionTitle: c.sectionTitle,
      score: c.score,
    }));

    const response: GroundedContextResponse = {
      conceptId: concept.id,
      conceptName: concept.name,
      query: params.query,
      retrievedChunks: sources,
      sourcesCount: sources.length,
      isCached: false,
    };

    // Store in cache (30 min TTL)
    this.cache.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + 1800 * 1000,
    });

    return response;
  }
}
