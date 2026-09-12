import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentRiskService } from './services/student-risk.service';
import { ClassAnalyticsService } from './services/class-analytics.service';
import { ConceptAnalyticsService } from './services/concept-analytics.service';
import { BottleneckAnalyticsService } from './services/bottleneck-analytics.service';
import { MisconceptionAnalyticsService } from './services/misconception-analytics.service';
import { StudentGroupingService } from './services/student-grouping.service';
import { ProgressAnalyticsService } from './services/progress-analytics.service';
import { InterventionService } from './services/intervention.service';
import { TeacherRecommendationService } from './services/teacher-recommendation.service';
import { TeacherAlertService } from './services/teacher-alert.service';
import { TeacherAiService } from './services/teacher-ai.service';
import { TeacherDashboardDto, RiskLevel } from '@ai-remedial/types';

@Injectable()
export class TeacherIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    public readonly riskService: StudentRiskService,
    public readonly classAnalyticsService: ClassAnalyticsService,
    public readonly conceptAnalyticsService: ConceptAnalyticsService,
    public readonly bottleneckService: BottleneckAnalyticsService,
    public readonly misconceptionService: MisconceptionAnalyticsService,
    public readonly groupingService: StudentGroupingService,
    public readonly progressService: ProgressAnalyticsService,
    public readonly interventionService: InterventionService,
    public readonly recommendationService: TeacherRecommendationService,
    public readonly alertService: TeacherAlertService,
    public readonly aiService: TeacherAiService,
  ) {}

  async getDashboardOverview(teacherId: string): Promise<TeacherDashboardDto> {
    const classes = await this.prisma.classGroup.findMany({
      where: { teacherId, status: 'ACTIVE' },
      include: {
        enrollments: { include: { student: true } },
      },
    });

    const classOverviews = await Promise.all(
      classes.map((c) => this.classAnalyticsService.getClassOverview(c.id, teacherId)),
    );

    const totalStudents = classOverviews.reduce((sum, c) => sum + (c.totalStudents || c.studentCount || 0), 0);
    const strugglingStudentsCount = classOverviews.reduce((sum, c) => sum + (c.strugglingStudentsCount || 0), 0);
    const activeInterventionsCount = classOverviews.reduce((sum, c) => sum + (c.activeInterventionsCount || 0), 0);

    const alerts = await this.alertService.getAlerts(teacherId, 'UNREAD');
    const unreadAlertsCount = alerts.length;

    // Aggregate overall risk distribution across all classes
    const riskDistribution = {
      ON_TRACK: classOverviews.reduce((sum, c) => sum + (c.riskDistribution?.ON_TRACK || 0), 0),
      WATCH: classOverviews.reduce((sum, c) => sum + (c.riskDistribution?.WATCH || 0), 0),
      AT_RISK: classOverviews.reduce((sum, c) => sum + (c.riskDistribution?.AT_RISK || 0), 0),
      CRITICAL: classOverviews.reduce((sum, c) => sum + (c.riskDistribution?.CRITICAL || 0), 0),
    };

    // Urgent students requiring attention (AT_RISK or CRITICAL)
    const urgentStudents: Array<{
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      riskLevel: RiskLevel;
      riskScore: number;
      primaryRootCause: string;
    }> = [];

    for (const c of classes) {
      for (const env of c.enrollments) {
        const risk = await this.riskService.calculateStudentRisk(env.student.id);
        if (risk.riskLevel === RiskLevel.CRITICAL || risk.riskLevel === RiskLevel.AT_RISK) {
          urgentStudents.push({
            studentId: risk.studentId,
            studentName: risk.studentName,
            classId: c.id,
            className: c.name,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            primaryRootCause: risk.primaryRootCause || 'Unresolved prerequisite gap',
          });
        }
      }
    }

    urgentStudents.sort((a, b) => b.riskScore - a.riskScore);

    return {
      teacherId,
      totalClasses: classes.length,
      totalStudents,
      strugglingStudentsCount,
      activeInterventionsCount,
      unreadAlertsCount,
      riskDistribution,
      urgentStudents: urgentStudents.slice(0, 10),
      classes: classOverviews,
    };
  }
}
