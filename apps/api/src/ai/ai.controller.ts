import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateTextDto } from './dto/generate-text.dto';
import { GenerateEmbeddingDto } from './dto/generate-embedding.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-text')
  @ApiOperation({ summary: 'Generate AI text response abstraction' })
  @ApiResponse({ status: 200, description: 'Generated text result' })
  async generateText(@Body() dto: GenerateTextDto) {
    const response = await this.aiService.generateText({
      prompt: dto.prompt,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
    });
    return { result: response };
  }

  @Post('generate-embedding')
  @ApiOperation({ summary: 'Generate text vector embedding abstraction' })
  @ApiResponse({ status: 200, description: 'Embedding vector array' })
  async generateEmbedding(@Body() dto: GenerateEmbeddingDto) {
    const embedding = await this.aiService.generateEmbedding(dto.text);
    return {
      dimensions: embedding.length,
      embedding,
    };
  }
}
