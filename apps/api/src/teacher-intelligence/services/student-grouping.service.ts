import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentRiskService } from './student-risk.service';
import { RiskLevel } from '@ai-remedial/types';

export interface DynamicStudentGroupDto {
  groupId: string;
  groupName: string;
  strategy: 'GAP_BASED' | 'RISK_BASED' | 'MASTERY_BASED';
  targetConceptId?: string;
  targetConceptName?: string;
  studentCount: number;
  students: Array<{ studentId: string; name: string; score?: number }>;
  recommendedAction: string;
}

@Injectable()
export class StudentGroupingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: StudentRiskService,
  ) {}

  async getRiskBasedGroups(classId: string): Promise<DynamicStudentGroupDto[]> {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classGroupId: classId },
      include: { student: true },
    });

    const profiles = await Promise.all(
      enrollments.map((e) => this.riskService.calculateStudentRisk(e.student.id)),
    );

    const levels = [RiskLevel.CRITICAL, RiskLevel.AT_RISK, RiskLevel.WATCH, RiskLevel.ON_TRACK];
    const groups: DynamicStudentGroupDto[] = [];

    for (const level of levels) {
      const levelProfiles = profiles.filter((p) => p.riskLevel === level);
      if (levelProfiles.length > 0) {
        groups.push({
          groupId: `risk-group-${level.toLowerCase()}`,
          groupName: `${level.replace('_', ' ')} Group`,
          strategy: 'RISK_BASED',
          studentCount: levelProfiles.length,
          students: levelProfiles.map((p) => ({
            studentId: p.studentId,
            name: p.studentName,
          })),
          recommendedAction:
            level === RiskLevel.CRITICAL || level === RiskLevel.AT_RISK
              ? 'Urgent teacher intervention and daily remedial sessions required.'
              : level === RiskLevel.WATCH
              ? 'Monitor progress weekly and assign targeted practice exercises.'
              : 'Continue standard curriculum progression.',
        });
      }
    }

    return groups;
  }

  async getGapBasedGroups(classId: string): Promise<DynamicStudentGroupDto[]> {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classGroupId: classId },
      include: { student: { include: { user: true } } },
    });

    const studentIds = enrollments.map((e) => e.student.id);
    if (studentIds.length === 0) return [];

    // Find masteries below 0.60
    const lowMasteries = await this.prisma.mastery.findMany({
      where: { studentId: { in: studentIds }, masteryScore: { lt: 0.6 } },
      include: { concept: true },
    });

    const conceptMap = new Map<string, { conceptName: string; students: Map<string, string> }>();
    for (const m of lowMasteries) {
      const student = enrollments.find((e) => e.student.id === m.studentId)?.student;
      if (!student) continue;

      const existing = conceptMap.get(m.conceptId) || {
        conceptName: m.concept.name,
        students: new Map<string, string>(),
      };
      existing.students.set(student.id, student.user?.name || 'Student');
      conceptMap.set(m.conceptId, existing);
    }

    const groups: DynamicStudentGroupDto[] = [];
    for (const [conceptId, data] of conceptMap.entries()) {
      if (data.students.size >= 1) {
        groups.push({
          groupId: `gap-group-${conceptId}`,
          groupName: `Remediation Cohort: ${data.conceptName}`,
          strategy: 'GAP_BASED',
          targetConceptId: conceptId,
          targetConceptName: data.conceptName,
          studentCount: data.students.size,
          students: Array.from(data.students.entries()).map(([studentId, name]) => ({
            studentId,
            name,
          })),
          recommendedAction: `Group instruction focused on resolving root gaps in ${data.conceptName}`,
        });
      }
    }

    groups.sort((a, b) => b.studentCount - a.studentCount);
    return groups;
  }
}
