import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentVisibility } from '@prisma/client';

export interface KeywordSearchOptions {
  query: string;
  conceptId?: string;
  limit?: number;
  onlyPublished?: boolean;
}

export interface KeywordSearchResult {
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
export class KeywordSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(options: KeywordSearchOptions): Promise<KeywordSearchResult[]> {
    const limit = options.limit ?? 5;
    const words = options.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) return [];

    const where: any = {
      document: options.onlyPublished ? { visibility: DocumentVisibility.PUBLISHED } : undefined,
    };

    if (options.conceptId) {
      where.OR = [
        { conceptId: options.conceptId },
        { curriculumContents: { some: { conceptId: options.conceptId } } },
      ];
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where,
      include: { document: true },
    });

    const results: KeywordSearchResult[] = [];

    for (const chunk of chunks) {
      const contentLower = chunk.content.toLowerCase();
      let matches = 0;
      for (const w of words) {
        if (contentLower.includes(w)) matches++;
      }

      if (matches > 0) {
        const score = matches / words.length;
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
}
