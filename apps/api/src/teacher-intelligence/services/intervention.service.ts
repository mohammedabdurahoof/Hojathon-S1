import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterventionDto, UpdateInterventionDto } from '../dto/teacher-intelligence-api.dto';
import { InterventionOutcome, InterventionStatus } from '@prisma/client';

@Injectable()
export class InterventionService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntervention(teacherId: string, dto: CreateInterventionDto) {
    let beforeMastery: number | null = null;

    if (dto.studentId && dto.conceptId) {
      const currentMastery = await this.prisma.mastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId: dto.studentId,
            conceptId: dto.conceptId,
          },
        },
      });
      if (currentMastery) {
        beforeMastery = currentMastery.masteryScore;
      }
    }

    const intervention = await this.prisma.intervention.create({
      data: {
        teacherId,
        classId: dto.classId,
        studentId: dto.studentId,
        conceptId: dto.conceptId,
        type: dto.type,
        reason: dto.reason,
        recommendation: dto.recommendation,
        priority: dto.priority || 'MEDIUM',
        targetMastery: dto.targetMastery || 0.8,
        practiceCount: dto.practiceCount || 5,
        beforeMastery,
        teacherNotes: dto.teacherNotes,
        status: InterventionStatus.ASSIGNED,
        startedAt: new Date(),
      },
      include: {
        teacher: true,
        student: true,
        concept: true,
        classGroup: true,
      },
    });

    return intervention;
  }

  async getInterventionsForTeacher(teacherId: string, classId?: string, studentId?: string, status?: InterventionStatus) {
    const where: any = { teacherId };

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    return this.prisma.intervention.findMany({
      where,
      include: {
        student: true,
        concept: true,
        classGroup: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInterventionById(id: string, teacherId: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: {
        teacher: true,
        student: true,
        concept: true,
        classGroup: true,
      },
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention with ID ${id} not found`);
    }

    if (intervention.teacherId !== teacherId) {
      throw new ForbiddenException(`Teacher does not have access to this intervention`);
    }

    return intervention;
  }

  async updateIntervention(id: string, teacherId: string, dto: UpdateInterventionDto) {
    const existing = await this.getInterventionById(id, teacherId);

    const dataToUpdate: any = {};

    if (dto.status) {
      dataToUpdate.status = dto.status;
      if (dto.status === InterventionStatus.COMPLETED) {
        dataToUpdate.completedAt = new Date();
      }
    }

    if (dto.teacherNotes !== undefined) {
      dataToUpdate.teacherNotes = dto.teacherNotes;
    }

    // Evaluate outcome if afterMastery is provided or if status is set to COMPLETED
    if (dto.afterMastery !== undefined || dto.status === InterventionStatus.COMPLETED) {
      let afterMastery = dto.afterMastery;

      if (afterMastery === undefined && existing.studentId && existing.conceptId) {
        const latestMastery = await this.prisma.mastery.findUnique({
          where: {
            studentId_conceptId: {
              studentId: existing.studentId,
              conceptId: existing.conceptId,
            },
          },
        });
        if (latestMastery) {
          afterMastery = latestMastery.masteryScore;
        }
      }

      if (afterMastery !== undefined) {
        dataToUpdate.afterMastery = afterMastery;

        const before = existing.beforeMastery ?? 0;
        const delta = afterMastery - before;

        let outcome: InterventionOutcome = InterventionOutcome.INCONCLUSIVE;
        if (delta >= 0.2 || afterMastery >= (existing.targetMastery || 0.8)) {
          outcome = InterventionOutcome.SUCCESSFUL;
        } else if (delta >= 0.05) {
          outcome = InterventionOutcome.PARTIALLY_SUCCESSFUL;
        } else if (delta < 0.05 && (dto.status === InterventionStatus.COMPLETED || existing.status === InterventionStatus.COMPLETED)) {
          outcome = InterventionOutcome.UNSUCCESSFUL;
        }

        dataToUpdate.outcome = outcome;
      }
    }

    return this.prisma.intervention.update({
      where: { id },
      data: dataToUpdate,
      include: {
        student: true,
        concept: true,
        classGroup: true,
      },
    });
  }
}
