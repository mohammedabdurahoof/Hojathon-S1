import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { LearningGapService } from './learning-gap.service';
import { DiagnosticReportService } from './diagnostic-report.service';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly learningGapService: LearningGapService,
    private readonly diagnosticReportService: DiagnosticReportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  async findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student details by ID' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':studentId/learning-gaps')
  @ApiOperation({ summary: 'Identify all weak concepts (mastery < 0.70) for a student' })
  async getLearningGaps(@Param('studentId') studentId: string) {
    return this.learningGapService.findLearningGaps(studentId);
  }

  @Get(':studentId/root-gaps')
  @ApiOperation({ summary: 'Identify primary root prerequisite gaps for a student' })
  @ApiQuery({ name: 'targetConceptId', required: false })
  async getRootGaps(
    @Param('studentId') studentId: string,
    @Query('targetConceptId') targetConceptId?: string,
  ) {
    return this.learningGapService.findRootGaps(studentId, targetConceptId);
  }

  @Get(':studentId/diagnostic-report/:attemptId')
  @ApiOperation({ summary: 'Generate detailed diagnostic report for a student assessment attempt' })
  async getDiagnosticReport(
    @Param('studentId') studentId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.diagnosticReportService.generateDiagnosticReport(studentId, attemptId);
  }
}
