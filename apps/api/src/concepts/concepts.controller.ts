import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConceptsService } from './concepts.service';

@ApiTags('Concepts')
@Controller('concepts')
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all learning concepts with prerequisite graph references' })
  async findAll() {
    return this.conceptsService.findAll();
  }
}
