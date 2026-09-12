import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentVisibility } from '@prisma/client';

export interface VectorSearchOptions {
  queryEmbedding: number[];
  conceptId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  limit?: number;
  minimumScore?: number;
  onlyPublished?: boolean;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  pageNumber: number | null;
  sectionTitle: string | null;
  documentTitle: string;
  conceptId: string | null;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PostgreSQL pgvector / Cosine similarity search over document chunks
   */
  async search(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const limit = options.limit ?? 5;
    const minScore = options.minimumScore ?? 0.50;
    const onlyPublished = options.onlyPublished ?? true;

    // Filter document chunks by scoping criteria
    const where: any = {};

    if (onlyPublished) {
      where.document = { visibility: DocumentVisibility.PUBLISHED };
    }

    if (options.conceptId) {
      // Look for chunks linked directly or via CurriculumContent
      where.OR = [
        { conceptId: options.conceptId },
        { curriculumContents: { some: { conceptId: options.conceptId } } },
      ];
    } else if (options.topicId) {
      where.topicId = options.topicId;
    } else if (options.chapterId) {
      where.chapterId = options.chapterId;
    } else if (options.subjectId) {
      where.subjectId = options.subjectId;
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where,
      include: {
        document: true,
      },
    });

    const results: VectorSearchResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;

      let chunkVector: number[] = [];
      try {
        chunkVector = JSON.parse(chunk.embedding);
      } catch (e) {
        continue;
      }

      const score = this.cosineSimilarity(options.queryEmbedding, chunkVector);

      if (score >= minScore) {
        results.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          content: chunk.content,
          score,
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          documentTitle: chunk.document.title,
          conceptId: chunk.conceptId,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Helper: Cosine similarity between two float vectors
   */
  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length === 0 || v2.length === 0 || v1.length !== v2.length) return 0;
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
