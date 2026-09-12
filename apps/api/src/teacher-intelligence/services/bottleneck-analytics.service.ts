import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BottleneckItemDto {
  conceptId: string;
  conceptName: string;
  conceptCode: string;
  affectedStudentCount: number;
  blockedDownstreamConceptCount: number;
  impactScore: number;
  rootPrerequisiteId?: string;
  rootPrerequisiteName?: string;
  description: string;
}

@Injectable()
export class BottleneckAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async detectClassBottlenecks(classId: string): Promise<BottleneckItemDto[]> {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classGroupId: classId },
      select: { studentId: true },
    });

    if (enrollments.length === 0) {
      return [];
    }

    const studentIds = enrollments.map((e) => e.studentId);

    // Get all masteries for students in this class
    const masteries = await this.prisma.mastery.findMany({
      where: { studentId: { in: studentIds } },
      include: { concept: true },
    });

    const lowMasteryEntries = masteries.filter((m) => m.masteryScore < 0.6);
    const lowMasteryConceptIds = Array.from(new Set(lowMasteryEntries.map((m) => m.conceptId)));

    if (lowMasteryConceptIds.length === 0) {
      return [];
    }

    // Find all prerequisite connections involving these low-mastery concepts
    const prereqs = await this.prisma.conceptPrerequisite.findMany({
      where: {
        OR: [
          { conceptId: { in: lowMasteryConceptIds } },
          { prerequisiteId: { in: lowMasteryConceptIds } },
        ],
      },
      include: {
        concept: true,
        prerequisite: true,
      },
    });

    // Map: prerequisiteId -> list of target concepts that depend on it
    const downstreamMap = new Map<string, string[]>();
    for (const p of prereqs) {
      const existing = downstreamMap.get(p.prerequisiteId) || [];
      existing.push(p.conceptId);
      downstreamMap.set(p.prerequisiteId, existing);
    }

    const bottlenecks: BottleneckItemDto[] = [];

    // Analyze each low-mastery concept to see if it acts as a bottleneck
    for (const conceptId of lowMasteryConceptIds) {
      const affectedStudentIds = new Set(
        lowMasteryEntries.filter((m) => m.conceptId === conceptId).map((m) => m.studentId),
      );
      const downstreamConcepts = downstreamMap.get(conceptId) || [];
      
      const concept = masteries.find((m) => m.conceptId === conceptId)?.concept;
      if (!concept) continue;

      const affectedStudentCount = affectedStudentIds.size;
      const blockedDownstreamConceptCount = downstreamConcepts.length;
      const impactScore = affectedStudentCount * (blockedDownstreamConceptCount + 1) * 10;

      if (affectedStudentCount > 0) {
        bottlenecks.push({
          conceptId: concept.id,
          conceptName: concept.name,
          conceptCode: concept.code,
          affectedStudentCount,
          blockedDownstreamConceptCount,
          impactScore,
          description: `${affectedStudentCount} student(s) stuck on this concept, blocking ${blockedDownstreamConceptCount} downstream concept(s).`,
        });
      }
    }

    bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
    return bottlenecks;
  }
}
