import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    // Validate concept exists
    const concept = await this.prisma.concept.findUnique({ where: { id: dto.conceptId } });
    if (!concept) {
      throw new BadRequestException(`Concept with ID "${dto.conceptId}" does not exist.`);
    }

    return this.prisma.question.create({ data: dto });
  }

  async findAll(query?: { conceptId?: string; difficulty?: number }) {
    const where: any = {};
    if (query?.conceptId) {
      where.conceptId = query.conceptId;
    }
    if (query?.difficulty) {
      where.difficulty = Number(query.difficulty);
    }

    return this.prisma.question.findMany({
      where,
      include: { concept: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { concept: true },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID "${id}" not found.`);
    }
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);
    if (dto.conceptId) {
      const concept = await this.prisma.concept.findUnique({ where: { id: dto.conceptId } });
      if (!concept) {
        throw new BadRequestException(`Concept with ID "${dto.conceptId}" does not exist.`);
      }
    }

    return this.prisma.question.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.question.delete({ where: { id } });
  }
}
