import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssessmentBlueprintService } from './services/assessment-blueprint.service';
import { AssessmentBuilderService } from './services/assessment-builder.service';
import { AssessmentAttemptService } from './services/assessment-attempt.service';
import { AssessmentScoringService } from './services/assessment-scoring.service';
import { AssessmentAnalyticsService } from './services/assessment-analytics.service';
import { AdaptiveAssessmentService } from './services/adaptive-assessment.service';
import { AssessmentRecommendationService } from './services/assessment-recommendation.service';
import { InterventionAssessmentService } from './services/intervention-assessment.service';
import { DifficultyCalibrationService } from './services/difficulty-calibration.service';
import { CreateBlueprintDto, UpdateBlueprintDto } from './dto/blueprint.dto';
import {
  CreateAssessmentFromBlueprintDto,
  StartAssessmentAttemptDto,
  SubmitAttemptAnswerDto,
  SubmitAssessmentAttemptDto,
} from './dto/assessment-attempt-api.dto';
import {
  StartAdaptiveAssessmentDto,
  SubmitAdaptiveAnswerDto,
  MasteryCheckDto,
} from './dto/adaptive-assessment-api.dto';

@Controller()
export class AssessmentEngineController {
  constructor(
    private readonly blueprintService: AssessmentBlueprintService,
    private readonly builderService: AssessmentBuilderService,
    private readonly attemptService: AssessmentAttemptService,
    private readonly scoringService: AssessmentScoringService,
    private readonly analyticsService: AssessmentAnalyticsService,
    private readonly adaptiveService: AdaptiveAssessmentService,
    private readonly recommendationService: AssessmentRecommendationService,
    private readonly interventionService: InterventionAssessmentService,
    private readonly calibrationService: DifficultyCalibrationService,
  ) {}

  // ─── Blueprints ────────────────────────────────────────────────────────────

  @Post('assessments/blueprints')
  createBlueprint(@Body() dto: CreateBlueprintDto) {
    return this.blueprintService.create(dto);
  }

  @Get('assessments/blueprints')
  listBlueprints(@Query('subjectId') subjectId?: string) {
    return this.blueprintService.findAll(subjectId);
  }

  @Get('assessments/blueprints/:id')
  getBlueprint(@Param('id') id: string) {
    return this.blueprintService.findOne(id);
  }

  @Patch('assessments/blueprints/:id')
  updateBlueprint(@Param('id') id: string, @Body() dto: UpdateBlueprintDto) {
    return this.blueprintService.update(id, dto);
  }

  @Post('assessments/blueprints/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishBlueprint(@Param('id') id: string) {
    return this.blueprintService.publish(id);
  }

  @Post('assessments/blueprints/:id/archive')
  @HttpCode(HttpStatus.OK)
  archiveBlueprint(@Param('id') id: string) {
    return this.blueprintService.archive(id);
  }

  // ─── Assessment Build ──────────────────────────────────────────────────────

  @Post('assessments/build')
  buildFromBlueprint(@Body() dto: CreateAssessmentFromBlueprintDto) {
    return this.builderService.buildFromBlueprint(dto);
  }

  // ─── Assessment Attempts ───────────────────────────────────────────────────

  @Post('assessments/:id/start')
  startAttempt(
    @Param('id') assessmentId: string,
    @Body() dto: StartAssessmentAttemptDto,
  ) {
    return this.builderService.startAttempt(assessmentId, dto.studentId);
  }

  @Post('assessments/attempts/:id/answer')
  submitAnswer(
    @Param('id') attemptId: string,
    @Body() dto: SubmitAttemptAnswerDto & { studentId: string },
  ) {
    return this.attemptService.submitSingleAnswer(attemptId, dto.studentId, dto);
  }

  @Post('assessments/attempts/:id/submit')
  @HttpCode(HttpStatus.OK)
  submitAttempt(
    @Param('id') attemptId: string,
    @Body() dto: SubmitAssessmentAttemptDto & { studentId: string },
  ) {
    return this.attemptService.submitAttempt(attemptId, dto.studentId, dto);
  }

  @Get('assessments/attempts/:id')
  getAttempt(
    @Param('id') attemptId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.attemptService.getAttempt(attemptId, studentId);
  }

  @Get('assessments/attempts/:id/result')
  getAttemptResult(
    @Param('id') attemptId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.attemptService.getAttemptResult(attemptId, studentId);
  }

  @Get('assessments/:id/analytics')
  getAnalytics(@Param('id') assessmentId: string) {
    return this.analyticsService.getAssessmentAnalytics(assessmentId);
  }

  @Get('assessments/attempts/:id/score')
  getScore(@Param('id') attemptId: string) {
    return this.scoringService.computeResults(attemptId);
  }

  // ─── Adaptive Assessments ─────────────────────────────────────────────────

  @Post('adaptive-assessments/start')
  startAdaptive(@Body() dto: StartAdaptiveAssessmentDto) {
    return this.adaptiveService.start(dto);
  }

  @Post('adaptive-assessments/:id/answer')
  submitAdaptiveAnswer(
    @Param('id') attemptId: string,
    @Body() dto: SubmitAdaptiveAnswerDto & { studentId: string },
  ) {
    return this.adaptiveService.submitAnswer(attemptId, dto.studentId, dto);
  }

  @Get('adaptive-assessments/:id/state')
  getAdaptiveState(
    @Param('id') attemptId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.adaptiveService.getState(attemptId, studentId);
  }

  @Post('adaptive-assessments/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeAdaptive(
    @Param('id') attemptId: string,
    @Body() body: { studentId: string },
  ) {
    return this.adaptiveService.complete(attemptId, body.studentId);
  }

  // ─── Mastery Check ────────────────────────────────────────────────────────

  @Post('students/:studentId/mastery-check')
  masteryCheck(
    @Param('studentId') studentId: string,
    @Body() dto: MasteryCheckDto,
  ) {
    return this.adaptiveService.start({
      studentId,
      subjectId: dto.conceptId, // will be overridden by focusConceptId
      focusConceptId: dto.conceptId,
    });
  }

  // ─── Assessment Recommendations ───────────────────────────────────────────

  @Get('students/:studentId/assessment-recommendations')
  getRecommendations(@Param('studentId') studentId: string) {
    return this.recommendationService.recommendForStudent(studentId);
  }

  // ─── Intervention Comparison ──────────────────────────────────────────────

  @Post('interventions/:interventionId/comparison')
  compareIntervention(
    @Param('interventionId') interventionId: string,
    @Body()
    body: {
      beforeAttemptId: string;
      afterAttemptId: string;
      conceptId: string;
    },
  ) {
    return this.interventionService.compare(
      interventionId,
      body.beforeAttemptId,
      body.afterAttemptId,
      body.conceptId,
    );
  }

  @Get('interventions/:interventionId/comparison')
  getComparisons(@Param('interventionId') interventionId: string) {
    return this.interventionService.getComparisons(interventionId);
  }

  // ─── Difficulty Calibration ───────────────────────────────────────────────

  @Get('questions/:id/calibration')
  calibrateQuestion(@Param('id') questionId: string) {
    return this.calibrationService.calibrateQuestion(questionId);
  }

  @Post('questions/calibration/batch')
  @HttpCode(HttpStatus.OK)
  runBatchCalibration() {
    return this.calibrationService.runBatchCalibration();
  }

  @Get('questions/:id/statistics')
  getQuestionStatistics(@Param('id') questionId: string) {
    return this.calibrationService.calibrateQuestion(questionId);
  }
}
