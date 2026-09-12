import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LearningPlansService } from './learning-plans.service';

@ApiTags('Learning Plans')
@Controller('learning-plans')
export class LearningPlansController {
  constructor(private readonly learningPlansService: LearningPlansService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get personalized learning plan for student' })
  async findByStudent(@Param('studentId') studentId: string) {
    return this.learningPlansService.findByStudent(studentId);
  }
}
