import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto, StartAssessmentDto, SubmitAssessmentDto } from './dto/create-assessment.dto';

@ApiTags('Assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assessment' })
  async create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assessments' })
  async findAll() {
    return this.assessmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by ID with attached questions' })
  async findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start assessment attempt (sanitizes correct answers)' })
  async startAssessment(@Param('id') id: string, @Body() dto: StartAssessmentDto) {
    return this.assessmentsService.startAssessment(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit assessment responses, calculate score, and update student concept masteries' })
  async submitAssessment(@Param('id') id: string, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentsService.submitAssessment(id, dto);
  }
}
