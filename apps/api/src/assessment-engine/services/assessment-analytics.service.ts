import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssessmentAnalyticsService {
  private readonly logger = new Logger(AssessmentAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Comprehensive analytics for a teacher about a specific assessment.
   */
  async getAssessmentAnalytics(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                concept: true,
                statistics: true,
              },
            },
          },
        },
        attempts: {
          where: { status: 'COMPLETED' },
          include: {
            answers: {
              include: { question: { include: { concept: true } } },
            },
          },
        },
        concepts: { include: { concept: true } },
      },
    });

    if (!assessment) throw new NotFoundException(`Assessment "${assessmentId}" not found`);

    const completedAttempts = assessment.attempts;
    const totalAttempts = completedAttempts.length;

    if (totalAttempts === 0) {
      return {
        assessmentId,
        title: assessment.title,
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
        conceptPerformance: [],
        questionDifficulty: [],
        distractorAnalysis: [],
      };
    }

    // Overall stats
    const scores = completedAttempts.map((a) => a.score ?? 0);
    const percentages = completedAttempts.map((a) => a.percentage ?? 0);
    const averageScore = scores.reduce((s, v) => s + v, 0) / totalAttempts;
    const averagePercentage = percentages.reduce((s, v) => s + v, 0) / totalAttempts;
    const passed = completedAttempts.filter(
      (a) => (a.percentage ?? 0) >= (assessment.passingScore ?? 50),
    ).length;
    const passRate = (passed / totalAttempts) * 100;

    // Per-concept performance
    const conceptMap = new Map<
      string,
      { conceptId: string; conceptName: string; total: number; correct: number }
    >();

    for (const attempt of completedAttempts) {
      for (const ans of attempt.answers) {
        const cId = ans.question.conceptId;
        const cp = conceptMap.get(cId) ?? {
          conceptId: cId,
          conceptName: ans.question.concept?.name ?? 'Unknown',
          total: 0,
          correct: 0,
        };
        cp.total++;
        if (ans.isCorrect) cp.correct++;
        conceptMap.set(cId, cp);
      }
    }

    const conceptPerformance = Array.from(conceptMap.values()).map((cp) => ({
      ...cp,
      accuracy: cp.total > 0 ? (cp.correct / cp.total) * 100 : 0,
    }));

    // Per-question difficulty analysis
    const questionMap = new Map<
      string,
      {
        questionId: string;
        text: string;
        expectedDifficulty: number;
        total: number;
        correct: number;
        avgResponseTimeMs: number;
      }
    >();

    for (const attempt of completedAttempts) {
      for (const ans of attempt.answers) {
        const qId = ans.question.id;
        const qd = questionMap.get(qId) ?? {
          questionId: qId,
          text: ans.question.text.substring(0, 80) + '...',
          expectedDifficulty: ans.question.difficulty,
          total: 0,
          correct: 0,
          avgResponseTimeMs: 0,
        };
        qd.total++;
        if (ans.isCorrect) qd.correct++;
        qd.avgResponseTimeMs =
          (qd.avgResponseTimeMs * (qd.total - 1) + ans.responseTimeMs) / qd.total;
        questionMap.set(qId, qd);
      }
    }

    const questionDifficulty = Array.from(questionMap.values()).map((qd) => ({
      ...qd,
      empiricalAccuracy: qd.total > 0 ? (qd.correct / qd.total) * 100 : 0,
    }));

    // Distractor analysis for MCQ questions
    const distractorMap = new Map<string, Record<string, number>>();
    for (const attempt of completedAttempts) {
      for (const ans of attempt.answers) {
        if (!ans.isCorrect && ans.question.type === 'MULTIPLE_CHOICE') {
          const qId = ans.question.id;
          const distMap = distractorMap.get(qId) ?? {};
          distMap[ans.answer] = (distMap[ans.answer] ?? 0) + 1;
          distractorMap.set(qId, distMap);
        }
      }
    }

    const distractorAnalysis = Array.from(distractorMap.entries()).map(([qId, choices]) => ({
      questionId: qId,
      distractorChoiceFrequency: choices,
    }));

    return {
      assessmentId,
      title: assessment.title,
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      conceptPerformance,
      questionDifficulty,
      distractorAnalysis,
    };
  }
}
