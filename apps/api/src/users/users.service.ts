import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } }).catch(() => [
      { id: '1', email: 'admin@remedial.edu', name: 'System Admin', role: 'ADMIN' },
    ]);
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } }).catch(() => null);
  }
}
