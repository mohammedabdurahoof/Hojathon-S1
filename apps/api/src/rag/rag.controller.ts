import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { IngestDocumentDto } from './dto/ingest-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('RAG')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest document into RAG architecture' })
  @ApiResponse({ status: 201, description: 'Ingestion confirmation' })
  async ingestDocument(@Body() dto: IngestDocumentDto) {
    return this.ragService.ingestDocument(dto.title, dto.content, dto.type);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search vector context via RAG pipeline' })
  @ApiResponse({ status: 200, description: 'Vector search results' })
  async searchContext(@Body() dto: SearchQueryDto) {
    return this.ragService.searchContext(dto.query, dto.topK);
  }
}
