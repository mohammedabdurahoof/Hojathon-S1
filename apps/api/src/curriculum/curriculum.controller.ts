import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/create-chapter.dto';
import { CreateTopicDto, UpdateTopicDto } from './dto/create-topic.dto';

@ApiTags('Curriculum')
@Controller()
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // --- SUBJECTS ENDPOINTS ---
  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.curriculumService.createSubject(dto);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  async findAllSubjects() {
    return this.curriculumService.findAllSubjects();
  }

  @Get('subjects/:id')
  @ApiOperation({ summary: 'Get subject by ID' })
  async findSubjectById(@Param('id') id: string) {
    return this.curriculumService.findSubjectById(id);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update subject by ID' })
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.curriculumService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Delete subject by ID' })
  async deleteSubject(@Param('id') id: string) {
    return this.curriculumService.deleteSubject(id);
  }

  // --- CHAPTERS ENDPOINTS ---
  @Post('chapters')
  @ApiOperation({ summary: 'Create a new chapter' })
  async createChapter(@Body() dto: CreateChapterDto) {
    return this.curriculumService.createChapter(dto);
  }

  @Get('chapters')
  @ApiOperation({ summary: 'Get all chapters' })
  async findAllChapters() {
    return this.curriculumService.findAllChapters();
  }

  @Get('chapters/:id')
  @ApiOperation({ summary: 'Get chapter by ID' })
  async findChapterById(@Param('id') id: string) {
    return this.curriculumService.findChapterById(id);
  }

  @Patch('chapters/:id')
  @ApiOperation({ summary: 'Update chapter by ID' })
  async updateChapter(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.curriculumService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @ApiOperation({ summary: 'Delete chapter by ID' })
  async deleteChapter(@Param('id') id: string) {
    return this.curriculumService.deleteChapter(id);
  }

  // --- TOPICS ENDPOINTS ---
  @Post('topics')
  @ApiOperation({ summary: 'Create a new topic' })
  async createTopic(@Body() dto: CreateTopicDto) {
    return this.curriculumService.createTopic(dto);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get all topics' })
  async findAllTopics() {
    return this.curriculumService.findAllTopics();
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async findTopicById(@Param('id') id: string) {
    return this.curriculumService.findTopicById(id);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update topic by ID' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.curriculumService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete topic by ID' })
  async deleteTopic(@Param('id') id: string) {
    return this.curriculumService.deleteTopic(id);
  }
}
