import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssessmentScoringService {
  private readonly logger = new Logger(AssessmentScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute final assessment results from completed attempt answers.
   * This is the authoritative scoring function — deterministic, no AI involvement.
   */
  async computeResults(attemptId: string) {
    const answers = await this.prisma.assessmentAnswer.findMany({
      where: { attemptId },
      include: {
        question: {
          include: { concept: true },
        },
      },
    });

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) return null;

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const conceptMap = new Map<
      string,
      {
        conceptId: string;
        conceptName: string;
        total: number;
        correct: number;
        totalMarks: number;
        earnedMarks: number;
        accuracy: number;
      }
    >();

    const objectiveMap = new Map<
      string,
      { total: number; correct: number; accuracy: number }
    >();

    for (const ans of answers) {
      totalScore += ans.score;
      if (ans.isCorrect) correctCount++;
      else incorrectCount++;

      // Per-concept breakdown
      const conceptId = ans.question.conceptId;
      const cp = conceptMap.get(conceptId) ?? {
        conceptId,
        conceptName: ans.question.concept?.name ?? 'Unknown',
        total: 0,
        correct: 0,
        totalMarks: 0,
        earnedMarks: 0,
        accuracy: 0,
      };
      cp.total++;
      cp.totalMarks += ans.question.marks;
      if (ans.isCorrect) {
        cp.correct++;
        cp.earnedMarks += ans.score;
      }
      cp.accuracy = cp.correct / cp.total;
      conceptMap.set(conceptId, cp);

      // Per-objective breakdown
      const obj = ans.question.objective;
      const op = objectiveMap.get(obj) ?? { total: 0, correct: 0, accuracy: 0 };
      op.total++;
      if (ans.isCorrect) op.correct++;
      op.accuracy = op.correct / op.total;
      objectiveMap.set(obj, op);
    }

    const totalQ = answers.length;
    const percentage =
      attempt.assessment.totalMarks > 0
        ? (totalScore / attempt.assessment.totalMarks) * 100
        : totalQ > 0
        ? (correctCount / totalQ) * 100
        : 0;

    const passed =
      attempt.assessment.passingScore !== null
        ? percentage >= (attempt.assessment.passingScore ?? 50)
        : percentage >= 50;

    return {
      attemptId,
      assessmentId: attempt.assessmentId,
      studentId: attempt.studentId,
      totalScore,
      totalMarks: attempt.assessment.totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      conceptBreakdown: Array.from(conceptMap.values()),
      objectiveBreakdown: Array.from(objectiveMap.entries()).map(([obj, data]) => ({
        objective: obj,
        ...data,
      })),
    };
  }
}
