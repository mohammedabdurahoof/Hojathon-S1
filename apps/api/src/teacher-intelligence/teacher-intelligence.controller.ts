import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TeacherIntelligenceService } from './teacher-intelligence.service';
import {
  CreateInterventionDto,
  UpdateInterventionDto,
  UpdateAlertStatusDto,
  AiTeacherQueryDto,
} from './dto/teacher-intelligence-api.dto';
import { AlertSeverity, AlertStatus, InterventionStatus } from '@prisma/client';

@ApiTags('Teacher Intelligence')
@Controller('teacher-intelligence')
export class TeacherIntelligenceController {
  constructor(private readonly teacherIntelligenceService: TeacherIntelligenceService) {}

  private extractTeacherId(teacherIdQuery?: string, headerTeacherId?: string): string {
    const id = teacherIdQuery || headerTeacherId;
    if (!id) {
      throw new BadRequestException('teacherId parameter or x-teacher-id header is required');
    }
    return id;
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get teacher intelligence dashboard overview' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async getDashboard(
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.getDashboardOverview(teacherId);
  }

  @Get('classes/:classId/overview')
  @ApiOperation({ summary: 'Get class analytics overview' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async getClassOverview(
    @Param('classId') classId: string,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.classAnalyticsService.getClassOverview(classId, teacherId);
  }

  @Get('classes/:classId/bottlenecks')
  @ApiOperation({ summary: 'Detect bottleneck concepts for a class' })
  async getClassBottlenecks(@Param('classId') classId: string) {
    return this.teacherIntelligenceService.bottleneckService.detectClassBottlenecks(classId);
  }

  @Get('classes/:classId/misconceptions')
  @ApiOperation({ summary: 'Get clustered misconception analytics for a class' })
  async getClassMisconceptions(@Param('classId') classId: string) {
    return this.teacherIntelligenceService.misconceptionService.getClassMisconceptions(classId);
  }

  @Get('classes/:classId/groups')
  @ApiOperation({ summary: 'Get dynamic student cohorts (risk, gap, mastery based)' })
  @ApiQuery({ name: 'strategy', required: false, enum: ['RISK', 'GAP'] })
  async getStudentGroups(
    @Param('classId') classId: string,
    @Query('strategy') strategy?: 'RISK' | 'GAP',
  ) {
    if (strategy === 'GAP') {
      return this.teacherIntelligenceService.groupingService.getGapBasedGroups(classId);
    }
    return this.teacherIntelligenceService.groupingService.getRiskBasedGroups(classId);
  }

  @Get('classes/:classId/recommendations')
  @ApiOperation({ summary: 'Generate actionable remediation recommendations for a class' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async getClassRecommendations(
    @Param('classId') classId: string,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.recommendationService.generateClassRecommendations(classId, teacherId);
  }

  @Get('students/:studentId/risk')
  @ApiOperation({ summary: 'Get comprehensive risk profile and evidence breakdown for a student' })
  async getStudentRisk(@Param('studentId') studentId: string) {
    return this.teacherIntelligenceService.riskService.calculateStudentRisk(studentId);
  }

  @Get('students/:studentId/progress')
  @ApiOperation({ summary: 'Get historical progression and gap closure analytics for a student' })
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.teacherIntelligenceService.progressService.getStudentProgressHistory(studentId);
  }

  @Get('concepts/:conceptId')
  @ApiOperation({ summary: 'Get concept performance analytics across students or class' })
  @ApiQuery({ name: 'classId', required: false, type: String })
  async getConceptAnalytics(
    @Param('conceptId') conceptId: string,
    @Query('classId') classId?: string,
  ) {
    return this.teacherIntelligenceService.conceptAnalyticsService.getConceptAnalytics(conceptId, classId);
  }

  @Post('interventions')
  @ApiOperation({ summary: 'Create a new teacher intervention' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async createIntervention(
    @Body() dto: CreateInterventionDto,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.interventionService.createIntervention(teacherId, dto);
  }

  @Get('interventions')
  @ApiOperation({ summary: 'List all interventions assigned by teacher' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'classId', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InterventionStatus })
  async getInterventions(
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: InterventionStatus,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.interventionService.getInterventionsForTeacher(
      teacherId,
      classId,
      studentId,
      status,
    );
  }

  @Get('interventions/:id')
  @ApiOperation({ summary: 'Get details of a specific intervention' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async getInterventionById(
    @Param('id') id: string,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.interventionService.getInterventionById(id, teacherId);
  }

  @Patch('interventions/:id')
  @ApiOperation({ summary: 'Update intervention status and evaluate mastery outcome' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async updateIntervention(
    @Param('id') id: string,
    @Body() dto: UpdateInterventionDto,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.interventionService.updateIntervention(id, teacherId, dto);
  }

  @Post('alerts/scan')
  @ApiOperation({ summary: 'Trigger automatic alert scanning for teacher classes' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async scanAlerts(
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.alertService.generateAlertsForTeacher(teacherId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get teacher alerts' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiQuery({ name: 'severity', required: false, enum: AlertSeverity })
  async getAlerts(
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: AlertSeverity,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.alertService.getAlerts(teacherId, status, severity);
  }

  @Patch('alerts/:id')
  @ApiOperation({ summary: 'Update alert status (READ, RESOLVED, DISMISSED)' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async updateAlertStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAlertStatusDto,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.alertService.updateAlertStatus(id, teacherId, dto.status);
  }

  @Post('ai/ask')
  @ApiOperation({ summary: 'Ask factual AI assistant queries grounded in teacher telemetry' })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  async askAi(
    @Body() dto: AiTeacherQueryDto,
    @Query('teacherId') teacherIdQuery?: string,
    @Headers('x-teacher-id') headerTeacherId?: string,
  ) {
    const teacherId = this.extractTeacherId(teacherIdQuery, headerTeacherId);
    return this.teacherIntelligenceService.aiService.answerTeacherQuery(
      teacherId,
      dto.query,
      dto.classId,
      dto.studentId,
    );
  }
}
