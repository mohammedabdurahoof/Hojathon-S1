import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/create-question.dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new question' })
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions with optional filters for conceptId or difficulty' })
  @ApiQuery({ name: 'conceptId', required: false })
  @ApiQuery({ name: 'difficulty', required: false, type: Number })
  async findAll(
    @Query('conceptId') conceptId?: string,
    @Query('difficulty') difficulty?: number,
  ) {
    return this.questionsService.findAll({ conceptId, difficulty });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete question by ID' })
  async delete(@Param('id') id: string) {
    return this.questionsService.delete(id);
  }
}
