import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MasteryService } from './mastery.service';

@ApiTags('Mastery')
@Controller('mastery')
export class MasteryController {
  constructor(private readonly masteryService: MasteryService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get mastery levels for a student' })
  async findByStudent(@Param('studentId') studentId: string) {
    return this.masteryService.findByStudent(studentId);
  }
}
