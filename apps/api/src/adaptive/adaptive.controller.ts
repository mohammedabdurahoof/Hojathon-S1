import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdaptiveService } from './adaptive.service';
import { StudentLearningStateService } from './services/student-learning-state.service';
import { MisconceptionService } from './services/misconception.service';
import { SpacedReviewService } from './services/spaced-review.service';
import { LearningRecommendationService } from './services/learning-recommendation.service';
import { MasteryService } from '../mastery/mastery.service';
import { PrismaService } from '../prisma/prisma.service';
import { StartAdaptiveSessionDto, SubmitAdaptiveAnswerDto, RequestHintDto } from './dto/adaptive-api.dto';

@ApiTags('Adaptive Learning')
@Controller()
export class AdaptiveController {
  constructor(
    private readonly adaptiveService: AdaptiveService,
    private readonly learningStateService: StudentLearningStateService,
    private readonly misconceptionService: MisconceptionService,
    private readonly spacedReviewService: SpacedReviewService,
    private readonly recommendationService: LearningRecommendationService,
    private readonly masteryService: MasteryService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('adaptive/sessions')
  @ApiOperation({ summary: 'Start a new adaptive learning session' })
  async startSession(@Body() dto: StartAdaptiveSessionDto) {
    return this.adaptiveService.startSession(dto.studentId, dto.conceptId, dto.learningPlanId);
  }

  @Get('adaptive/sessions/:id')
  @ApiOperation({ summary: 'Get adaptive session status and history' })
  async getSession(@Param('id') id: string) {
    return this.prisma.adaptiveSession.findUnique({
      where: { id },
      include: {
        concept: true,
        turns: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  @Post('adaptive/sessions/:id/respond')
  @ApiOperation({ summary: 'Submit an answer turn in an adaptive session' })
  async submitAnswer(@Param('id') id: string, @Body() dto: SubmitAdaptiveAnswerDto) {
    return this.adaptiveService.submitAnswer(id, dto.questionId, dto.studentAnswer, dto.responseTimeMs);
  }

  @Post('adaptive/sessions/:id/hint')
  @ApiOperation({ summary: 'Request a guided hint for a question' })
  async requestHint(@Param('id') id: string, @Body() dto: RequestHintDto) {
    return this.adaptiveService.requestHint(id, dto.questionId);
  }

  @Post('adaptive/sessions/:id/complete')
  @ApiOperation({ summary: 'Complete an adaptive learning session' })
  async completeSession(@Param('id') id: string) {
    return this.adaptiveService.completeSession(id);
  }

  @Get('students/:studentId/learning-state')
  @ApiOperation({ summary: 'Get complete aggregated student learning state' })
  async getLearningState(@Param('studentId') studentId: string) {
    return this.learningStateService.getStudentLearningState(studentId);
  }

  @Get('students/:studentId/mastery-history')
  @ApiOperation({ summary: 'Get complete student mastery update audit log' })
  async getMasteryHistory(@Param('studentId') studentId: string) {
    return this.prisma.masteryHistory.findMany({
      where: { studentId },
      include: { concept: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('students/:studentId/misconceptions')
  @ApiOperation({ summary: 'Get student misconceptions (active and resolved)' })
  async getMisconceptions(@Param('studentId') studentId: string) {
    return this.misconceptionService.getActiveMisconceptions(studentId);
  }

  @Get('students/:studentId/reviews')
  @ApiOperation({ summary: 'Get student due spaced reviews' })
  async getDueReviews(@Param('studentId') studentId: string) {
    return this.spacedReviewService.getDueReviews(studentId);
  }

  @Get('students/:studentId/recommendations')
  @ApiOperation({ summary: 'Get student current learning recommendation for concept' })
  async getRecommendation(
    @Param('studentId') studentId: string,
    @Query('conceptId') conceptId: string,
  ) {
    return this.recommendationService.getRecommendation(studentId, conceptId);
  }

  @Get('concepts/:conceptId/mastery')
  @ApiOperation({ summary: 'Get mastery distribution across all students for a concept' })
  async getConceptMasteryDistribution(@Param('conceptId') conceptId: string) {
    return this.prisma.mastery.findMany({
      where: { conceptId },
      include: { student: { include: { user: true } } },
      orderBy: { masteryScore: 'desc' },
    });
  }
}
