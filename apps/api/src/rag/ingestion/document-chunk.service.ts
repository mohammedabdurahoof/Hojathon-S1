import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChunkResult {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionTitle: string | null;
  pageNumber: number | null;
}

@Injectable()
export class DocumentChunkService {
  private readonly logger = new Logger(DocumentChunkService.name);
  private readonly chunkSizeTokens: number;
  private readonly chunkOverlapTokens: number;

  constructor(private readonly configService: ConfigService) {
    this.chunkSizeTokens = Number(this.configService.get<string>('RAG_CHUNK_SIZE', '700'));
    this.chunkOverlapTokens = Number(this.configService.get<string>('RAG_CHUNK_OVERLAP', '100'));
  }

  cleanText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  createChunks(rawText: string, defaultPageNumber: number | null = null): ChunkResult[] {
    const text = this.cleanText(rawText);
    if (!text) return [];

    // Character length approximation: ~4 characters per token
    const targetChunkChars = this.chunkSizeTokens * 4;
    const overlapChars = this.chunkOverlapTokens * 4;

    // Split by Markdown headings or paragraphs
    const paragraphs = text.split(/(?=\n#{1,4}\s+|\n\n)/g);

    const chunks: ChunkResult[] = [];
    let currentChunkText = '';
    let currentSectionTitle: string | null = null;
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      // Check if paragraph is a heading
      const headingMatch = trimmedPara.match(/^(#{1,4}\s+.+)$/m);
      if (headingMatch) {
        currentSectionTitle = headingMatch[1].replace(/^#{1,4}\s+/, '').trim();
      }

      if (currentChunkText.length + trimmedPara.length > targetChunkChars && currentChunkText.length > 0) {
        // Finalize current chunk
        chunks.push({
          chunkIndex,
          content: currentChunkText.trim(),
          tokenCount: Math.ceil(currentChunkText.length / 4),
          sectionTitle: currentSectionTitle,
          pageNumber: defaultPageNumber,
        });

        chunkIndex++;

        // Keep overlap text
        const overlapStart = Math.max(0, currentChunkText.length - overlapChars);
        currentChunkText = currentChunkText.substring(overlapStart) + '\n\n' + trimmedPara;
      } else {
        currentChunkText += (currentChunkText.length > 0 ? '\n\n' : '') + trimmedPara;
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        chunkIndex,
        content: currentChunkText.trim(),
        tokenCount: Math.ceil(currentChunkText.length / 4),
        sectionTitle: currentSectionTitle,
        pageNumber: defaultPageNumber,
      });
    }

    this.logger.log(`Created ${chunks.length} semantic chunks from text of length ${text.length}`);
    return chunks;
  }
}
