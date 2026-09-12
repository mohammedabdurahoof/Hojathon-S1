import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';

@ApiTags('Curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get()
  @ApiOperation({ summary: 'Get all curriculum subjects with chapters and topics' })
  async getSubjects() {
    return this.curriculumService.getSubjects();
  }
}
