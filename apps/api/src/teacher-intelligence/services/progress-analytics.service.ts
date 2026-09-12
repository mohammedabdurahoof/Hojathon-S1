import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProgressHistory(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const masteries = await this.prisma.mastery.findMany({
      where: { studentId },
      include: { concept: true },
    });

    const histories = await this.prisma.masteryHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });

    const sessions = await this.prisma.adaptiveSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    const totalConcepts = masteries.length;
    const masteredConcepts = masteries.filter((m) => m.masteryScore >= 0.8).length;
    const inProgressConcepts = masteries.filter((m) => m.masteryScore >= 0.6 && m.masteryScore < 0.8).length;
    const strugglingConcepts = masteries.filter((m) => m.masteryScore < 0.6).length;

    const gapClosureRate = totalConcepts > 0 ? masteredConcepts / totalConcepts : 0;

    return {
      studentId: student.id,
      studentName: student.user?.name || 'Student',
      totalConceptsAssessed: totalConcepts,
      masteredConceptsCount: masteredConcepts,
      inProgressConceptsCount: inProgressConcepts,
      strugglingConceptsCount: strugglingConcepts,
      gapClosureRate: Math.round(gapClosureRate * 100) / 100,
      totalSessionsCompleted: sessions.filter((s) => s.status === 'COMPLETED').length,
      totalAssessmentsCompleted: attempts.length,
      recentHistory: histories.slice(-20).map((h) => ({
        conceptId: h.conceptId,
        score: h.newScore,
        change: h.newScore - h.previousScore,
        reason: h.reason,
        timestamp: h.createdAt,
      })),
    };
  }
}
