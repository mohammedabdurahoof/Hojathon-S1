import { Injectable, Logger } from '@nestjs/common';
import { VectorSearchService } from './vector-search.service';
import { KeywordSearchService } from './keyword-search.service';
import { AiService } from '../../ai/ai.service';

export interface HybridSearchContext {
  studentId?: string;
  query: string;
  conceptId?: string;
  subjectId?: string;
  prerequisiteConceptIds?: string[];
  limit?: number;
  minimumScore?: number;
  onlyPublished?: boolean;
}

export interface HybridSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  semanticScore: number;
  keywordScore: number;
  conceptMatchScore: number;
  pageNumber: number | null;
  sectionTitle: string | null;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly keywordSearchService: KeywordSearchService,
    private readonly aiService: AiService,
  ) {}

  async retrieve(context: HybridSearchContext): Promise<HybridSearchResult[]> {
    const limit = context.limit ?? 5;
    this.logger.log(`Hybrid retrieval running for query: "${context.query}" (conceptId="${context.conceptId ?? 'N/A'}")`);

    // 1. Generate Query Vector Embedding
    const queryEmbedding = await this.aiService.generateEmbedding(context.query);

    // 2. Perform Vector Search & Keyword Search concurrently
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearchService.search({
        queryEmbedding,
        conceptId: context.conceptId,
        subjectId: context.subjectId,
        limit: limit * 2,
        minimumScore: context.minimumScore ?? 0.40,
        onlyPublished: context.onlyPublished ?? true,
      }),
      this.keywordSearchService.search({
        query: context.query,
        conceptId: context.conceptId,
        limit: limit * 2,
        onlyPublished: context.onlyPublished ?? true,
      }),
    ]);

    // 3. Deduplicate and Merge Results
    const map = new Map<string, { vectorRes?: any; keywordRes?: any }>();

    for (const vr of vectorResults) {
      map.set(vr.chunkId, { vectorRes: vr });
    }
    for (const kr of keywordResults) {
      const existing = map.get(kr.chunkId) || {};
      map.set(kr.chunkId, { ...existing, keywordRes: kr });
    }

    const merged: HybridSearchResult[] = [];

    for (const [chunkId, item] of map.entries()) {
      const vRes = item.vectorRes;
      const kRes = item.keywordRes;

      const semanticScore = vRes?.score ?? 0.0;
      const keywordScore = kRes?.score ?? 0.0;
      const docTitle = vRes?.documentTitle ?? kRes?.documentTitle ?? 'Curriculum Document';
      const content = vRes?.content ?? kRes?.content ?? '';
      const docId = vRes?.documentId ?? kRes?.documentId ?? '';
      const pageNumber = vRes?.pageNumber ?? kRes?.pageNumber ?? null;
      const sectionTitle = vRes?.sectionTitle ?? kRes?.sectionTitle ?? null;
      const chunkConceptId = vRes?.conceptId ?? kRes?.conceptId ?? null;

      // Concept Match Score Calculation
      let conceptMatchScore = 0.30;
      if (context.conceptId && chunkConceptId === context.conceptId) {
        conceptMatchScore = 1.0;
      } else if (context.prerequisiteConceptIds && chunkConceptId && context.prerequisiteConceptIds.includes(chunkConceptId)) {
        conceptMatchScore = 0.70;
      }

      // Hybrid Deterministic Formula: 0.70 * semantic + 0.20 * conceptMatch + 0.10 * keyword
      const finalScore = semanticScore * 0.70 + conceptMatchScore * 0.20 + keywordScore * 0.10;

      merged.push({
        chunkId,
        documentId: docId,
        documentTitle: docTitle,
        content,
        score: Number(finalScore.toFixed(3)),
        semanticScore: Number(semanticScore.toFixed(3)),
        keywordScore: Number(keywordScore.toFixed(3)),
        conceptMatchScore: Number(conceptMatchScore.toFixed(3)),
        pageNumber,
        sectionTitle,
      });
    }

    return merged.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
