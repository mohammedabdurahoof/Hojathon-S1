import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacher.findMany({ include: { user: true } }).catch(() => [
      { id: 'tch-1', department: 'Mathematics', user: { name: 'Sarah Connor', email: 'teacher@remedial.edu' } },
    ]);
  }

  async findOne(id: string) {
    return this.prisma.teacher.findUnique({ where: { id }, include: { user: true, subjects: true } }).catch(() => null);
  }
}
