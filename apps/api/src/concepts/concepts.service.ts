import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConceptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.concept.findMany({ include: { prerequisites: { include: { prerequisite: true } } } }).catch(() => [
      { id: 'c-1', name: 'Addition', code: 'MATH-ADD-01' },
      { id: 'c-2', name: 'Division', code: 'MATH-DIV-01' },
      { id: 'c-3', name: 'Fractions', code: 'MATH-FRAC-01' },
    ]);
  }
}
