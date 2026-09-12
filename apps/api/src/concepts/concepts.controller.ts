import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ConceptsService } from './concepts.service';
import { CreateConceptDto, UpdateConceptDto, AddPrerequisiteDto } from './dto/create-concept.dto';

@ApiTags('Concepts')
@Controller('concepts')
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new concept' })
  async create(@Body() dto: CreateConceptDto) {
    return this.conceptsService.createConcept(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all concepts with optional filtering by subject, chapter, or topic' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'chapterId', required: false })
  @ApiQuery({ name: 'topicId', required: false })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('topicId') topicId?: string,
  ) {
    return this.conceptsService.findAll({ subjectId, chapterId, topicId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get concept by ID' })
  async findOne(@Param('id') id: string) {
    return this.conceptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update concept by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateConceptDto) {
    return this.conceptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete concept by ID' })
  async delete(@Param('id') id: string) {
    return this.conceptsService.delete(id);
  }

  // --- PREREQUISITES ---

  @Post(':id/prerequisites')
  @ApiOperation({ summary: 'Add prerequisite to concept (with cycle detection)' })
  async addPrerequisite(@Param('id') id: string, @Body() dto: AddPrerequisiteDto) {
    return this.conceptsService.addPrerequisite(id, dto.prerequisiteId);
  }

  @Get(':id/prerequisites')
  @ApiOperation({ summary: 'Get prerequisites for concept' })
  async getPrerequisites(@Param('id') id: string) {
    return this.conceptsService.getPrerequisites(id);
  }

  @Delete(':id/prerequisites/:prerequisiteId')
  @ApiOperation({ summary: 'Remove prerequisite from concept' })
  async removePrerequisite(
    @Param('id') id: string,
    @Param('prerequisiteId') prerequisiteId: string,
  ) {
    return this.conceptsService.removePrerequisite(id, prerequisiteId);
  }
}
