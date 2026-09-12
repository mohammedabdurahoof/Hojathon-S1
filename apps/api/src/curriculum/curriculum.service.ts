import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/create-chapter.dto';
import { CreateTopicDto, UpdateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // --- SUBJECTS CRUD ---
  async createSubject(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({ where: { code: dto.code } }).catch(() => null);
    if (existing) {
      throw new BadRequestException(`Subject with code "${dto.code}" already exists.`);
    }
    return this.prisma.subject.create({ data: dto });
  }

  async findAllSubjects() {
    return this.prisma.subject.findMany({
      include: {
        chapters: {
          include: {
            topics: true,
          },
        },
      },
    });
  }

  async findSubjectById(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        chapters: {
          include: {
            topics: true,
          },
        },
      },
    });
    if (!subject) throw new NotFoundException(`Subject with ID "${id}" not found.`);
    return subject;
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findSubjectById(id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async deleteSubject(id: string) {
    await this.findSubjectById(id);
    return this.prisma.subject.delete({ where: { id } });
  }

  // --- CHAPTERS CRUD ---
  async createChapter(dto: CreateChapterDto) {
    return this.prisma.chapter.create({ data: dto });
  }

  async findAllChapters() {
    return this.prisma.chapter.findMany({ include: { topics: true } });
  }

  async findChapterById(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { topics: true, subject: true },
    });
    if (!chapter) throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    return chapter;
  }

  async updateChapter(id: string, dto: UpdateChapterDto) {
    await this.findChapterById(id);
    return this.prisma.chapter.update({ where: { id }, data: dto });
  }

  async deleteChapter(id: string) {
    await this.findChapterById(id);
    return this.prisma.chapter.delete({ where: { id } });
  }

  // --- TOPICS CRUD ---
  async createTopic(dto: CreateTopicDto) {
    return this.prisma.topic.create({ data: dto });
  }

  async findAllTopics() {
    return this.prisma.topic.findMany({ include: { concepts: true } });
  }

  async findTopicById(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { concepts: true, chapter: true },
    });
    if (!topic) throw new NotFoundException(`Topic with ID "${id}" not found.`);
    return topic;
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    await this.findTopicById(id);
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  async deleteTopic(id: string) {
    await this.findTopicById(id);
    return this.prisma.topic.delete({ where: { id } });
  }
}
