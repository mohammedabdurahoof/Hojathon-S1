import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubjects() {
    return this.prisma.subject.findMany({ include: { chapters: { include: { topics: true } } } }).catch(() => [
      { id: 'sbj-1', name: 'Mathematics', code: 'MATH-101', description: 'Foundational mathematics' },
    ]);
  }
}
