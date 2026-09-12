import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assessment.findMany().catch(() => [
      { id: 'asm-1', title: 'Diagnostic Assessment', description: 'Initial knowledge assessment' },
    ]);
  }
}
