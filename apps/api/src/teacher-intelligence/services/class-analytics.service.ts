import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentRiskService } from './student-risk.service';
import { ClassOverviewDto, RiskLevel } from '@ai-remedial/types';

@Injectable()
export class ClassAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: StudentRiskService,
  ) {}

  async getClassOverview(classId: string, teacherId: string): Promise<ClassOverviewDto> {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          include: { student: true },
        },
        subject: true,
        interventions: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'RECOMMENDED'] } },
        },
      },
    });

    if (!classGroup) {
      throw new NotFoundException(`Class group with ID ${classId} not found`);
    }

    if (classGroup.teacherId !== teacherId) {
      throw new ForbiddenException(`Teacher does not have authorization to view this class`);
    }

    const students = classGroup.enrollments.map((e) => e.student);
    const studentCount = students.length;

    const riskProfiles = await Promise.all(students.map((s) => this.riskService.calculateStudentRisk(s.id)));

    const riskDistribution = {
      ON_TRACK: riskProfiles.filter((r) => r.riskLevel === RiskLevel.ON_TRACK).length,
      WATCH: riskProfiles.filter((r) => r.riskLevel === RiskLevel.WATCH).length,
      AT_RISK: riskProfiles.filter((r) => r.riskLevel === RiskLevel.AT_RISK).length,
      CRITICAL: riskProfiles.filter((r) => r.riskLevel === RiskLevel.CRITICAL).length,
    };

    const strugglingStudentsCount = riskDistribution.AT_RISK + riskDistribution.CRITICAL;

    // Average class mastery across all enrolled students' masteries
    const studentIds = students.map((s) => s.id);
    const masteries = await this.prisma.mastery.findMany({
      where: { studentId: { in: studentIds } },
    });

    const averageMastery = masteries.length > 0
      ? masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length
      : 0;

    // Top struggling concepts in this class
    const conceptMasteryMap = new Map<string, { conceptId: string; totalScore: number; count: number }>();
    for (const m of masteries) {
      const existing = conceptMasteryMap.get(m.conceptId) || { conceptId: m.conceptId, totalScore: 0, count: 0 };
      existing.totalScore += m.masteryScore;
      existing.count += 1;
      conceptMasteryMap.set(m.conceptId, existing);
    }

    const conceptStats = Array.from(conceptMasteryMap.values()).map((c) => ({
      conceptId: c.conceptId,
      avgScore: c.totalScore / c.count,
    }));
    conceptStats.sort((a, b) => a.avgScore - b.avgScore);

    const topConceptIds = conceptStats.slice(0, 5).map((c) => c.conceptId);
    const topConcepts = await this.prisma.concept.findMany({
      where: { id: { in: topConceptIds } },
    });

    const topConceptsNeedingAttention = topConcepts.map((concept) => {
      const stat = conceptStats.find((s) => s.conceptId === concept.id);
      const strugglingCount = masteries.filter((m) => m.conceptId === concept.id && m.masteryScore < 0.6).length;
      return {
        conceptId: concept.id,
        conceptName: concept.name,
        averageMastery: stat ? Math.round(stat.avgScore * 100) / 100 : 0,
        strugglingStudentsCount: strugglingCount,
      };
    });

    return {
      classId: classGroup.id,
      className: classGroup.name,
      academicYear: classGroup.academicYear,
      grade: classGroup.grade,
      subjectName: classGroup.subject?.name || 'General',
      totalStudents: studentCount,
      averageMastery: Math.round(averageMastery * 100) / 100,
      strugglingStudentsCount,
      riskDistribution,
      topConceptsNeedingAttention,
      activeInterventionsCount: classGroup.interventions.length,
    };
  }
}
