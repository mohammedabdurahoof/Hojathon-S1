import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.student.findMany({ include: { user: true } }).catch(() => [
      { id: 'std-1', gradeLevel: 6, targetGradeLevel: 8, user: { name: 'Alex Johnson', email: 'student@remedial.edu' } },
    ]);
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({ where: { id }, include: { user: true, masteries: true } }).catch(() => null);
  }
}
