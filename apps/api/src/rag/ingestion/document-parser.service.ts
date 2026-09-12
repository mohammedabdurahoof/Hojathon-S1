import { Injectable, Logger } from '@nestjs/common';

export interface DocumentParser {
  supports(mimeType: string, fileName?: string): boolean;
  extractText(buffer: Buffer): Promise<{ text: string; pageNumber?: number | null }>;
}

@Injectable()
export class TextDocumentParser implements DocumentParser {
  supports(mimeType: string, fileName?: string): boolean {
    return mimeType.includes('text/plain') || (fileName ? fileName.endsWith('.txt') : false);
  }

  async extractText(buffer: Buffer): Promise<{ text: string; pageNumber?: number | null }> {
    return { text: buffer.toString('utf-8'), pageNumber: null };
  }
}

@Injectable()
export class MarkdownDocumentParser implements DocumentParser {
  supports(mimeType: string, fileName?: string): boolean {
    return (
      mimeType.includes('text/markdown') ||
      mimeType.includes('text/x-markdown') ||
      (fileName ? fileName.endsWith('.md') : false)
    );
  }

  async extractText(buffer: Buffer): Promise<{ text: string; pageNumber?: number | null }> {
    return { text: buffer.toString('utf-8'), pageNumber: null };
  }
}

@Injectable()
export class PdfDocumentParser implements DocumentParser {
  private readonly logger = new Logger(PdfDocumentParser.name);

  supports(mimeType: string, fileName?: string): boolean {
    return mimeType.includes('application/pdf') || (fileName ? fileName.endsWith('.pdf') : false);
  }

  async extractText(buffer: Buffer): Promise<{ text: string; pageNumber?: number | null }> {
    try {
      // Dynamic require or fallback parser for PDF text extraction
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        pageNumber: data.numpages ?? 1,
      };
    } catch (e: any) {
      this.logger.warn(`PDF parsing fallback mode: ${e.message}`);
      const rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return { text: rawText, pageNumber: 1 };
    }
  }
}

@Injectable()
export class DocumentParserService {
  private parsers: DocumentParser[];

  constructor(
    private readonly textParser: TextDocumentParser,
    private readonly markdownParser: MarkdownDocumentParser,
    private readonly pdfParser: PdfDocumentParser,
  ) {
    this.parsers = [this.textParser, this.markdownParser, this.pdfParser];
  }

  async parseDocument(buffer: Buffer, mimeType: string, fileName?: string) {
    const parser = this.parsers.find((p) => p.supports(mimeType, fileName));
    if (!parser) {
      throw new Error(`Unsupported document format for mimeType "${mimeType}" or file "${fileName}".`);
    }
    return parser.extractText(buffer);
  }
}
