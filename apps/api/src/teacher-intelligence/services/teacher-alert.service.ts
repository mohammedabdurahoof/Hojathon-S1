import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertSeverity, AlertStatus, AlertType } from '@prisma/client';
import { StudentRiskService } from './student-risk.service';
import { RiskLevel } from '@ai-remedial/types';

@Injectable()
export class TeacherAlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: StudentRiskService,
  ) {}

  async generateAlertsForTeacher(teacherId: string) {
    const classGroups = await this.prisma.classGroup.findMany({
      where: { teacherId },
      include: {
        enrollments: { include: { student: true } },
      },
    });

    const generatedAlerts: any[] = [];

    for (const classGroup of classGroups) {
      for (const env of classGroup.enrollments) {
        const risk = await this.riskService.calculateStudentRisk(env.student.id);

        if (risk.riskLevel === RiskLevel.CRITICAL) {
          // Check if an unread alert already exists for this student & type
          const existing = await this.prisma.teacherAlert.findFirst({
            where: {
              teacherId,
              studentId: risk.studentId,
              type: AlertType.STUDENT_CRITICAL,
              status: AlertStatus.UNREAD,
            },
          });

          if (!existing) {
            const alert = await this.prisma.teacherAlert.create({
              data: {
                teacherId,
                classId: classGroup.id,
                studentId: risk.studentId,
                type: AlertType.STUDENT_CRITICAL,
                severity: AlertSeverity.CRITICAL,
                title: `Critical Risk Alert: ${risk.studentName}`,
                message: `Student risk score reached ${risk.riskScore}/100. Primary cause: ${risk.primaryRootCause}`,
                metadata: {
                  riskScore: risk.riskScore,
                  evidence: risk.evidence,
                  primaryRootCause: risk.primaryRootCause,
                },
              },
            });
            generatedAlerts.push(alert);
          }
        } else if (risk.riskLevel === RiskLevel.AT_RISK) {
          const existing = await this.prisma.teacherAlert.findFirst({
            where: {
              teacherId,
              studentId: risk.studentId,
              type: AlertType.STUDENT_AT_RISK,
              status: AlertStatus.UNREAD,
            },
          });

          if (!existing) {
            const alert = await this.prisma.teacherAlert.create({
              data: {
                teacherId,
                classId: classGroup.id,
                studentId: risk.studentId,
                type: AlertType.STUDENT_AT_RISK,
                severity: AlertSeverity.HIGH,
                title: `At Risk Alert: ${risk.studentName}`,
                message: `Student risk score is ${risk.riskScore}/100. ${risk.primaryRootCause}`,
                metadata: {
                  riskScore: risk.riskScore,
                  evidence: risk.evidence,
                },
              },
            });
            generatedAlerts.push(alert);
          }
        }
      }
    }

    return generatedAlerts;
  }

  async getAlerts(teacherId: string, status?: AlertStatus, severity?: AlertSeverity) {
    const where: any = { teacherId };
    if (status) where.status = status;
    if (severity) where.severity = severity;

    return this.prisma.teacherAlert.findMany({
      where,
      include: {
        student: true,
        classGroup: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlertStatus(alertId: string, teacherId: string, status: AlertStatus) {
    const alert = await this.prisma.teacherAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    if (alert.teacherId !== teacherId) {
      throw new NotFoundException(`Alert not found for this teacher`);
    }

    return this.prisma.teacherAlert.update({
      where: { id: alertId },
      data: {
        status,
        resolvedAt: status === AlertStatus.RESOLVED ? new Date() : alert.resolvedAt,
      },
    });
  }
}
