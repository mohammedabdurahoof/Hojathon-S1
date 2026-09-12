import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LearningPlansService } from './learning-plans.service';

@ApiTags('Learning Plans')
@Controller('students/:studentId/learning-plans')
export class LearningPlansController {
  constructor(private readonly learningPlansService: LearningPlansService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a remedial learning plan for student based on root knowledge gap analysis' })
  @ApiQuery({ name: 'targetConceptId', required: false })
  async generateLearningPlan(
    @Param('studentId') studentId: string,
    @Query('targetConceptId') targetConceptId?: string,
  ) {
    return this.learningPlansService.generateLearningPlan(studentId, targetConceptId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all learning plans for a student' })
  async findByStudent(@Param('studentId') studentId: string) {
    return this.learningPlansService.findByStudent(studentId);
  }
}
