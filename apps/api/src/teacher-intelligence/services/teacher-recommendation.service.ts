import { Injectable } from '@nestjs/common';
import { StudentRiskService } from './student-risk.service';
import { BottleneckAnalyticsService } from './bottleneck-analytics.service';
import { MisconceptionAnalyticsService } from './misconception-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskLevel } from '@ai-remedial/types';

export interface TeacherRecommendationDto {
  recommendationId: string;
  type: 'INDIVIDUAL_REMEDIATION' | 'GROUP_REMEDIATION' | 'PREREQUISITE_REVIEW' | 'PLAN_MODIFICATION';
  targetType: 'STUDENT' | 'CLASS' | 'GROUP';
  targetId: string;
  targetName: string;
  conceptId?: string;
  conceptName?: string;
  title: string;
  rationale: string;
  actionItems: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable()
export class TeacherRecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: StudentRiskService,
    private readonly bottleneckService: BottleneckAnalyticsService,
    private readonly misconceptionService: MisconceptionAnalyticsService,
  ) {}

  async generateClassRecommendations(classId: string, teacherId: string): Promise<TeacherRecommendationDto[]> {
    const enrollments = await this.prisma.studentClassEnrollment.findMany({
      where: { classGroupId: classId },
      include: { student: true },
    });

    const recommendations: TeacherRecommendationDto[] = [];

    // 1. High Risk Student Recommendations
    for (const env of enrollments) {
      const risk = await this.riskService.calculateStudentRisk(env.student.id);
      if (risk.riskLevel === RiskLevel.CRITICAL || risk.riskLevel === RiskLevel.AT_RISK) {
        recommendations.push({
          recommendationId: `rec-student-${risk.studentId}`,
          type: 'INDIVIDUAL_REMEDIATION',
          targetType: 'STUDENT',
          targetId: risk.studentId,
          targetName: risk.studentName,
          title: `Assign 1-on-1 Remediation for ${risk.studentName}`,
          rationale: `Student has risk level ${risk.riskLevel} (${risk.riskScore}/100) due to: ${risk.primaryRootCause || 'unresolved gaps'}`,
          actionItems: [
            `Schedule 15-min diagnostic review on root prerequisite gaps`,
            `Assign 5 adaptive practice questions targeting struggling concepts`,
            risk.recommendedAction || 'Schedule review session',
          ],
          priority: risk.riskLevel === RiskLevel.CRITICAL ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // 2. Bottleneck Concept Recommendations
    const bottlenecks = await this.bottleneckService.detectClassBottlenecks(classId);
    for (const b of bottlenecks.slice(0, 3)) {
      recommendations.push({
        recommendationId: `rec-bottleneck-${b.conceptId}`,
        type: 'PREREQUISITE_REVIEW',
        targetType: 'CLASS',
        targetId: classId,
        targetName: 'Class Cohort',
        conceptId: b.conceptId,
        conceptName: b.conceptName,
        title: `Conduct Whole-Class Review for Bottleneck: ${b.conceptName}`,
        rationale: `This concept is blocking ${b.affectedStudentCount} students and ${b.blockedDownstreamConceptCount} downstream topics.`,
        actionItems: [
          `Allocate 20 mins of class time to re-teach ${b.conceptName}`,
          `Provide visual examples and guided step-by-step problem solving`,
          `Inject prerequisite review item into student learning plans`,
        ],
        priority: 'HIGH',
      });
    }

    // 3. Misconception Cluster Recommendations
    const misconceptions = await this.misconceptionService.getClassMisconceptions(classId);
    for (const m of misconceptions.slice(0, 2)) {
      if (m.affectedStudentCount >= 2) {
        recommendations.push({
          recommendationId: `rec-misconception-${m.conceptId}`,
          type: 'GROUP_REMEDIATION',
          targetType: 'GROUP',
          targetId: m.conceptId,
          targetName: `Group struggling with ${m.conceptName}`,
          conceptId: m.conceptId,
          conceptName: m.conceptName,
          title: `Address Common Misconception: "${m.misconception}"`,
          rationale: `Observed in ${m.affectedStudentCount} students across ${m.occurrenceCount} attempts.`,
          actionItems: [
            `Form small group with affected students (${m.affectedStudentCount} students)`,
            `Use counter-examples to clarify "${m.misconception}"`,
          ],
          priority: 'MEDIUM',
        });
      }
    }

    return recommendations;
  }
}
