import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConceptAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getConceptAnalytics(conceptId: string, classId?: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
      },
    });

    if (!concept) {
      throw new NotFoundException(`Concept with ID ${conceptId} not found`);
    }

    let studentIds: string[] | undefined;
    if (classId) {
      const classEnrollments = await this.prisma.studentClassEnrollment.findMany({
        where: { classGroupId: classId },
        select: { studentId: true },
      });
      studentIds = classEnrollments.map((e) => e.studentId);
    }

    const masteryWhere: any = { conceptId };
    if (studentIds) {
      masteryWhere.studentId = { in: studentIds };
    }

    const masteries = await this.prisma.mastery.findMany({
      where: masteryWhere,
      include: { student: true },
    });

    const totalAssessed = masteries.length;
    const strugglingStudents = masteries.filter((m) => m.masteryScore < 0.6);
    const averageMastery = totalAssessed > 0
      ? masteries.reduce((sum, m) => sum + m.masteryScore, 0) / totalAssessed
      : 0;

    // Prerequisite failure rates
    const prereqIds = concept.prerequisites.map((p) => p.prerequisiteId);
    const prereqMasteryWhere: any = { conceptId: { in: prereqIds } };
    if (studentIds) {
      prereqMasteryWhere.studentId = { in: studentIds };
    }

    const prereqMasteries = await this.prisma.mastery.findMany({
      where: prereqMasteryWhere,
    });

    const prereqFailures = concept.prerequisites.map((p) => {
      const pm = prereqMasteries.filter((m) => m.conceptId === p.prerequisiteId);
      const failingCount = pm.filter((m) => m.masteryScore < 0.6).length;
      return {
        prerequisiteId: p.prerequisite.id,
        prerequisiteName: p.prerequisite.name,
        prerequisiteCode: p.prerequisite.code,
        assessedCount: pm.length,
        failingCount,
        failureRate: pm.length > 0 ? failingCount / pm.length : 0,
      };
    });

    // Misconceptions for this concept
    const misconceptionWhere: any = { conceptId };
    if (studentIds) {
      misconceptionWhere.studentId = { in: studentIds };
    }

    const misconceptions = await this.prisma.misconceptionLog.findMany({
      where: misconceptionWhere,
    });

    return {
      conceptId: concept.id,
      conceptName: concept.name,
      conceptCode: concept.code,
      totalAssessed,
      averageMastery: Math.round(averageMastery * 100) / 100,
      strugglingCount: strugglingStudents.length,
      strugglingRate: totalAssessed > 0 ? strugglingStudents.length / totalAssessed : 0,
      prerequisiteFailures: prereqFailures,
      misconceptionCount: misconceptions.length,
    };
  }
}
