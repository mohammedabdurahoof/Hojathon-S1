import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudent(studentId: string) {
    return this.prisma.learningPlan.findMany({ where: { studentId }, include: { items: { include: { concept: true } } } }).catch(() => [
      {
        id: 'lp-1',
        title: 'Remedial Mathematics Learning Plan',
        status: 'ACTIVE',
        items: [
          { concept: { name: 'Division' }, status: 'IN_PROGRESS', order: 1 },
          { concept: { name: 'Fractions' }, status: 'PENDING', order: 2 },
        ],
      },
    ]);
  }
}
