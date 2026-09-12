import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PracticeAgent } from '../../ai/agents/practice.agent';
import { QuestionType } from '@prisma/client';
import { QuestionObjectiveType } from '@ai-remedial/types';

export interface SelectAdaptiveQuestionParams {
  studentId: string;
  conceptId: string;
  difficulty: number; // 1 to 5
  objective?: QuestionObjectiveType;
  misconceptionDescription?: string | null;
}

@Injectable()
export class AdaptiveQuestionService {
  private readonly logger = new Logger(AdaptiveQuestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly practiceAgent: PracticeAgent,
  ) {}

  /**
   * Select an unseen database question or dynamically generate one using PracticeAgent
   */
  async getNextQuestion(params: SelectAdaptiveQuestionParams) {
    const { studentId, conceptId, difficulty } = params;

    // Fetch questions already shown to student for this concept
    const previousExposures = await this.prisma.questionExposure.findMany({
      where: { studentId, conceptId },
      select: { questionId: true },
    });

    const exposedQuestionIds = previousExposures.map((e) => e.questionId);

    // Try finding an unexposed database question with matching difficulty
    const candidateQuestions = await this.prisma.question.findMany({
      where: {
        conceptId,
        id: { notIn: exposedQuestionIds },
        difficulty: {
          gte: Math.max(1, difficulty - 1),
          lte: Math.min(5, difficulty + 1),
        },
      },
      take: 5,
    });

    let selectedQuestion: any = null;

    if (candidateQuestions.length > 0) {
      selectedQuestion = candidateQuestions[Math.floor(Math.random() * candidateQuestions.length)];
    } else {
      // Fallback: Generate question dynamically using PracticeAgent
      const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
      const generated = await this.practiceAgent.generatePracticeQuestions({
        conceptId,
        conceptName: concept?.name ?? 'Target Concept',
        difficulty,
        count: 1,
      });

      if (generated && generated.length > 0) {
        const item = generated[0];
        // Create in database so it receives a permanent ID
        selectedQuestion = await this.prisma.question.create({
          data: {
            conceptId,
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty,
            text: item.question,
            options: item.options,
            answer: item.correctAnswer,
            explanation: item.explanation,
          },
        });
      } else {
        // Fallback to existing question even if previously seen
        selectedQuestion = await this.prisma.question.findFirst({
          where: { conceptId },
        });
      }
    }

    if (selectedQuestion) {
      // Record exposure to avoid duplicate questions
      await this.prisma.questionExposure.create({
        data: {
          studentId,
          questionId: selectedQuestion.id,
          conceptId,
        },
      });
    }

    return selectedQuestion;
  }
}
