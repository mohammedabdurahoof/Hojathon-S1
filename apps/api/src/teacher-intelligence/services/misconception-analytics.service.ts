import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface MisconceptionClusterDto {
  conceptId: string;
  conceptName: string;
  misconception: string;
  occurrenceCount: number;
  affectedStudentCount: number;
  affectedStudentIds: string[];
  recommendedTeachingStrategy: string;
}

@Injectable()
export class MisconceptionAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassMisconceptions(classId: string): Promise<MisconceptionClusterDto[]> {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classGroupId: classId },
      select: { studentId: true },
    });

    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) return [];

    const logs = await this.prisma.misconceptionLog.findMany({
      where: { studentId: { in: studentIds } },
      include: { concept: true },
      orderBy: { createdAt: 'desc' },
    });

    const clusterMap = new Map<string, {
      conceptId: string;
      conceptName: string;
      misconception: string;
      occurrences: number;
      students: Set<string>;
    }>();

    for (const log of logs) {
      const key = `${log.conceptId}:::${log.misconception.trim().toLowerCase()}`;
      const existing = clusterMap.get(key) || {
        conceptId: log.conceptId,
        conceptName: log.concept?.name || 'Concept',
        misconception: log.misconception,
        occurrences: 0,
        students: new Set<string>(),
      };
      existing.occurrences += 1;
      existing.students.add(log.studentId);
      clusterMap.set(key, existing);
    }

    const clusters: MisconceptionClusterDto[] = Array.from(clusterMap.values()).map((item) => ({
      conceptId: item.conceptId,
      conceptName: item.conceptName,
      misconception: item.misconception,
      occurrenceCount: item.occurrences,
      affectedStudentCount: item.students.size,
      affectedStudentIds: Array.from(item.students),
      recommendedTeachingStrategy: `Review foundational rule for "${item.misconception}" using counter-examples during group remediation.`,
    }));

    clusters.sort((a, b) => b.affectedStudentCount - a.affectedStudentCount || b.occurrenceCount - a.occurrenceCount);
    return clusters;
  }
}
