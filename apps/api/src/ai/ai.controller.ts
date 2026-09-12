import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiObservabilityService } from './services/ai-observability.service';
import {
  CreateAiSessionDto,
  SendSessionMessageDto,
  GenerateLessonDto,
  GeneratePracticeDto,
  EvaluateAnswerDto,
} from './dto/ai-session.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly orchestratorService: AiOrchestratorService,
    private readonly observabilityService: AiObservabilityService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Start or retrieve an interactive AI tutoring session' })
  async createSession(@Body() dto: CreateAiSessionDto) {
    return this.orchestratorService.startSession(dto.studentId, dto.conceptId, dto.learningPlanId);
  }

  @Post('sessions/:id/message')
  @ApiOperation({ summary: 'Send student message in active AI tutoring session' })
  async sendMessage(@Param('id') id: string, @Body() dto: SendSessionMessageDto) {
    return this.orchestratorService.sendMessage(id, dto.studentId, dto.message);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get AI session details and conversation history' })
  async getSession(@Param('id') id: string) {
    return this.orchestratorService.getSession(id);
  }

  @Post('lessons/generate')
  @ApiOperation({ summary: 'Generate structured remedial lesson content' })
  async generateLesson(@Body() dto: GenerateLessonDto) {
    return this.orchestratorService.generateLesson(dto.studentId, dto.conceptId);
  }

  @Post('practice/generate')
  @ApiOperation({ summary: 'Generate validated practice questions for a concept' })
  async generatePractice(@Body() dto: GeneratePracticeDto) {
    return this.orchestratorService.generatePractice(dto.studentId, dto.conceptId, dto.count, dto.difficulty);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate student answer, detect misconceptions, and forward evidence to MasteryService' })
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    return this.orchestratorService.evaluateAnswer({
      studentId: dto.studentId,
      conceptId: dto.conceptId,
      questionText: dto.question,
      expectedAnswer: dto.expectedAnswer,
      studentAnswer: dto.studentAnswer,
    });
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI observability metrics, token counts, and latency statistics' })
  async getUsageMetrics() {
    return this.observabilityService.getUsageMetrics();
  }
}
