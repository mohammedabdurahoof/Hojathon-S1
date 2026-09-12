import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskLevel, RiskReasonDto, StudentRiskProfileDto } from '@ai-remedial/types';

@Injectable()
export class StudentRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStudentRisk(studentId: string): Promise<StudentRiskProfileDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        masteries: {
          include: { concept: true },
        },
        adaptiveSessions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        misconceptionLogs: {
          include: { concept: true },
          orderBy: { createdAt: 'desc' },
        },
        assessmentAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const masteries = student.masteries || [];
    const recentSessions = student.adaptiveSessions || [];
    const misconceptions = student.misconceptionLogs || [];
    const attempts = student.assessmentAttempts || [];

    const evidence: string[] = [];
    const breakdown: RiskReasonDto[] = [];

    // 1. Low Mastery (weight: 25)
    const lowMasteryCount = masteries.filter((m) => m.masteryScore < 0.6).length;
    const totalConceptsAssessed = masteries.length || 1;
    const lowMasteryRatio = Math.min(1, lowMasteryCount / Math.max(1, totalConceptsAssessed));
    const lowMasteryScore = Math.round(lowMasteryRatio * 25);

    if (lowMasteryCount > 0) {
      const msg = `Struggling with ${lowMasteryCount} concept(s) below 60% mastery threshold`;
      evidence.push(msg);
      breakdown.push({ factor: 'Low Mastery', weight: 25, score: lowMasteryScore, description: msg });
    }

    // 2. Prerequisite Gaps (weight: 20)
    const lowMasteryConceptIds = masteries.filter((m) => m.masteryScore < 0.6).map((m) => m.conceptId);
    let prereqGapCount = 0;
    if (lowMasteryConceptIds.length > 0) {
      const prereqs = await this.prisma.conceptPrerequisite.findMany({
        where: { conceptId: { in: lowMasteryConceptIds } },
      });
      prereqGapCount = prereqs.length;
    }
    const prereqScore = Math.min(20, prereqGapCount * 5);
    if (prereqGapCount > 0) {
      const msg = `Has ${prereqGapCount} unresolved prerequisite gap(s) affecting target concepts`;
      evidence.push(msg);
      breakdown.push({ factor: 'Prerequisite Gaps', weight: 20, score: prereqScore, description: msg });
    }

    // 3. Recent Performance Drop (weight: 15)
    let recentAccuracy = 1.0;
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
      recentAccuracy = totalScore / (attempts.length * 100);
    }
    const recentPerfScore = Math.round((1 - recentAccuracy) * 15);
    if (recentAccuracy < 0.65) {
      const msg = `Recent assessment accuracy is low (${Math.round(recentAccuracy * 100)}%)`;
      evidence.push(msg);
      breakdown.push({ factor: 'Recent Performance', weight: 15, score: recentPerfScore, description: msg });
    }

    // 4. Misconceptions (weight: 15)
    const activeMisconceptions = misconceptions.length;
    const misconceptionScore = Math.min(15, activeMisconceptions * 5);
    if (activeMisconceptions > 0) {
      const msg = `Logged ${activeMisconceptions} recurring concept misconception(s)`;
      evidence.push(msg);
      breakdown.push({ factor: 'Misconceptions', weight: 15, score: misconceptionScore, description: msg });
    }

    // 5. Stagnation / Slow Progress (weight: 10)
    const recentSessionDates = recentSessions.map((s) => s.createdAt.getTime());
    const now = Date.now();
    const daysSinceLastSession = recentSessionDates.length > 0 ? (now - Math.max(...recentSessionDates)) / (1000 * 3600 * 24) : 10;
    const stagnationScore = Math.min(10, Math.round(daysSinceLastSession));
    if (daysSinceLastSession > 3) {
      const msg = `No active learning sessions for ${Math.round(daysSinceLastSession)} days`;
      evidence.push(msg);
      breakdown.push({ factor: 'Stagnation', weight: 10, score: stagnationScore, description: msg });
    }

    // 6. Regression (weight: 10)
    const regressedCount = masteries.filter((m) => m.masteryScore < (m.confidence || 0.8) - 0.2).length;
    const regressionScore = Math.min(10, regressedCount * 5);
    if (regressedCount > 0) {
      const msg = `Demonstrates mastery regression on ${regressedCount} previously learned concept(s)`;
      evidence.push(msg);
      breakdown.push({ factor: 'Mastery Regression', weight: 10, score: regressionScore, description: msg });
    }

    // 7. Inactivity (weight: 5)
    const inactivityScore = daysSinceLastSession > 7 ? 5 : 0;
    if (daysSinceLastSession > 7) {
      const msg = `Inactive for over 1 week`;
      evidence.push(msg);
      breakdown.push({ factor: 'Inactivity', weight: 5, score: inactivityScore, description: msg });
    }

    const totalRawScore = lowMasteryScore + prereqScore + recentPerfScore + misconceptionScore + stagnationScore + regressionScore + inactivityScore;
    const riskScore = Math.min(100, Math.max(0, totalRawScore));

    // Determine risk level (strictly requiring >= 3 evidence items for AT_RISK or CRITICAL)
    let riskLevel: RiskLevel = RiskLevel.ON_TRACK;
    if (riskScore >= 75 && evidence.length >= 3) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (riskScore >= 50 && evidence.length >= 3) {
      riskLevel = RiskLevel.AT_RISK;
    } else if (riskScore >= 25 || evidence.length >= 1) {
      riskLevel = RiskLevel.WATCH;
    }

    let primaryRootCause = 'Progressing on track with current curriculum';
    let recommendedAction = 'Continue current adaptive learning schedule';

    if (prereqGapCount > 0 && lowMasteryCount > 0) {
      primaryRootCause = 'Unresolved prerequisite foundation gap';
      recommendedAction = 'Assign prerequisite review intervention for foundational concepts';
    } else if (activeMisconceptions >= 2) {
      primaryRootCause = 'Persistent conceptual misconceptions';
      recommendedAction = 'Schedule teacher 1-on-1 explanation or targeted AI lesson';
    } else if (daysSinceLastSession > 5) {
      primaryRootCause = 'Engagement drop & learning stagnation';
      recommendedAction = 'Send student review reminder and assign short practice session';
    } else if (regressedCount > 0) {
      primaryRootCause = 'Mastery retention decay over time';
      recommendedAction = 'Assign spaced review session on decayed concepts';
    }

    return {
      studentId: student.id,
      studentName: student.user?.name || 'Student',
      riskScore,
      riskLevel,
      primaryRootCause,
      evidence,
      breakdown,
      recommendedAction,
    };
  }
}
