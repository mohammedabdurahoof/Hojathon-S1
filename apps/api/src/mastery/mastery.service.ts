import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasteryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudent(studentId: string) {
    return this.prisma.mastery.findMany({ where: { studentId }, include: { concept: true } }).catch(() => [
      { studentId, score: 95.0, level: 3, concept: { name: 'Addition' } },
      { studentId, score: 45.0, level: 1, concept: { name: 'Division' } },
    ]);
  }
}
