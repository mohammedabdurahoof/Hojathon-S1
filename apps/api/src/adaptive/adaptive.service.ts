import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryService } from '../mastery/mastery.service';
import { DifficultyService } from './services/difficulty.service';
import { MisconceptionService } from './services/misconception.service';
import { LearningRecommendationService } from './services/learning-recommendation.service';
import { AdaptiveQuestionService } from './services/adaptive-question.service';
import { SpacedReviewService } from './services/spaced-review.service';
import { AdaptivePlanService } from './services/adaptive-plan.service';
import { EvaluatorAgent } from '../ai/agents/evaluator.agent';
import { AdaptiveSessionStatus, LearningRecommendationType, EvidenceSource, LearningEventType } from '@prisma/client';

@Injectable()
export class AdaptiveService {
  private readonly logger = new Logger(AdaptiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryService,
    private readonly difficultyService: DifficultyService,
    private readonly misconceptionService: MisconceptionService,
    private readonly recommendationService: LearningRecommendationService,
    private readonly questionService: AdaptiveQuestionService,
    private readonly spacedReviewService: SpacedReviewService,
    private readonly adaptivePlanService: AdaptivePlanService,
    private readonly evaluatorAgent: EvaluatorAgent,
  ) {}

  /**
   * Start a new adaptive learning session
   */
  async startSession(studentId: string, conceptId: string, learningPlanId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Student "${studentId}" not found.`);

    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept) throw new NotFoundException(`Concept "${conceptId}" not found.`);

    const masteryRecord = await this.prisma.mastery.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    });

    const masteryScore = masteryRecord ? masteryRecord.masteryScore : 0.5;
    const initialDifficulty = this.difficultyService.getInitialDifficulty(masteryScore);
    const recResult = await this.recommendationService.getRecommendation(studentId, conceptId);

    let initialStatus: AdaptiveSessionStatus = AdaptiveSessionStatus.PRACTICING;
    if (recResult.recommendation === LearningRecommendationType.REMEDIATE) {
      initialStatus = AdaptiveSessionStatus.REMEDIATING;
    } else if (recResult.recommendation === LearningRecommendationType.REVIEW_PREREQUISITE) {
      initialStatus = AdaptiveSessionStatus.DIAGNOSING;
    }

    const session = await this.prisma.adaptiveSession.create({
      data: {
        studentId,
        conceptId,
        learningPlanId: learningPlanId ?? null,
        currentDifficulty: initialDifficulty,
        status: initialStatus,
        recommendedAction: recResult.recommendation,
      },
      include: {
        concept: true,
        turns: true,
      },
    });

    // Get initial question for session
    const activeMisconception = await this.prisma.misconception.findFirst({
      where: { studentId, conceptId, resolved: false },
    });

    const currentQuestion = await this.questionService.getNextQuestion({
      studentId,
      conceptId,
      difficulty: initialDifficulty,
      misconceptionDescription: activeMisconception?.description ?? null,
    });

    // Record turn in session
    await this.prisma.adaptiveSessionTurn.create({
      data: {
        sessionId: session.id,
        questionId: currentQuestion?.id ?? null,
        questionText: currentQuestion?.text ?? null,
      },
    });

    // Log LearningEvent
    await this.prisma.learningEvent.create({
      data: {
        studentId,
        conceptId,
        eventType: LearningEventType.REMEDIATION_STARTED,
        metadata: { sessionId: session.id, initialStatus, initialDifficulty },
      },
    });

    this.logger.log(`Started adaptive session ${session.id} for student ${studentId} on concept ${concept.name}`);

    return {
      session,
      mastery: masteryScore,
      confidence: masteryRecord?.confidence ?? 0.5,
      recommendedAction: recResult.recommendation,
      difficulty: initialDifficulty,
      currentQuestion,
    };
  }

  /**
   * Process student answer submission in adaptive session
   */
  async submitAnswer(sessionId: string, questionId: string, studentAnswer: string, responseTimeMs?: number) {
    const session = await this.prisma.adaptiveSession.findUnique({
      where: { id: sessionId },
      include: { concept: true },
    });

    if (!session) throw new NotFoundException(`Adaptive session "${sessionId}" not found.`);
    if (session.status === AdaptiveSessionStatus.COMPLETED) {
      throw new BadRequestException(`Adaptive session "${sessionId}" is already completed.`);
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);

    // Run AI Evaluation
    const evalResult = await this.evaluatorAgent.evaluateAnswer({
      questionText: question.text,
      expectedAnswer: question.answer,
      studentAnswer,
      conceptName: session.concept.name,
    });

    const isCorrect = evalResult.correct;

    // Record misconception if detected
    let misconceptionRecord = null;
    if (!isCorrect && evalResult.misconception) {
      misconceptionRecord = await this.misconceptionService.recordMisconception({
        studentId: session.studentId,
        conceptId: session.conceptId,
        description: evalResult.misconception,
      });
    }

    // Update Mastery & Evidence
    const masteryUpdate = await this.masteryService.recordSingleInteractionMastery({
      studentId: session.studentId,
      conceptId: session.conceptId,
      questionId,
      correctness: isCorrect,
      score: evalResult.score,
      difficulty: session.currentDifficulty,
      source: EvidenceSource.PRACTICE,
      responseTimeMs,
      hintsUsed: 0,
      misconception: evalResult.misconception ?? null,
    });

    // Check misconception resolution if correct
    if (isCorrect) {
      await this.misconceptionService.updateMisconceptionResolution(session.studentId, session.conceptId);
    }

    // Calculate difficulty adjustment
    const recentTurns = await this.prisma.adaptiveSessionTurn.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const consecutiveCorrect = isCorrect ? recentTurns.filter((t) => t.isCorrect === true).length + 1 : 0;
    const consecutiveIncorrect = !isCorrect ? recentTurns.filter((t) => t.isCorrect === false).length + 1 : 0;

    const nextDifficulty = this.difficultyService.adjustDifficulty({
      currentDifficulty: session.currentDifficulty,
      isCorrect,
      confidence: masteryUpdate.mastery.confidence,
      hasMisconception: !!evalResult.misconception,
      consecutiveCorrect,
      consecutiveIncorrect,
    });

    // Determine next session status & recommendation
    const recResult = await this.recommendationService.getRecommendation(session.studentId, session.conceptId);

    let nextStatus: AdaptiveSessionStatus = session.status;
    if (recResult.recommendation === LearningRecommendationType.ADVANCE && masteryUpdate.mastery.masteryScore >= 0.80) {
      nextStatus = AdaptiveSessionStatus.COMPLETED;
      await this.adaptivePlanService.applyPlanProposal({
        studentId: session.studentId,
        conceptId: session.conceptId,
        action: 'MARK_READY_TO_ADVANCE',
      });
      await this.spacedReviewService.scheduleSpacedReview(session.studentId, session.conceptId, true);
    } else if (!isCorrect) {
      nextStatus = AdaptiveSessionStatus.REMEDIATING;
    } else {
      nextStatus = AdaptiveSessionStatus.PRACTICING;
    }

    // Update Session
    await this.prisma.adaptiveSession.update({
      where: { id: sessionId },
      data: {
        currentDifficulty: nextDifficulty,
        status: nextStatus,
        recommendedAction: recResult.recommendation,
      },
    });

    // Update Turn
    await this.prisma.adaptiveSessionTurn.create({
      data: {
        sessionId,
        questionId,
        questionText: question.text,
        studentAnswer,
        isCorrect,
        score: evalResult.score,
        misconception: evalResult.misconception ?? null,
        hint: evalResult.hint ?? null,
        nextAction: recResult.recommendation,
      },
    });

    // Get next question if session continues
    let nextQuestion = null;
    if (nextStatus !== AdaptiveSessionStatus.COMPLETED) {
      nextQuestion = await this.questionService.getNextQuestion({
        studentId: session.studentId,
        conceptId: session.conceptId,
        difficulty: nextDifficulty,
        misconceptionDescription: evalResult.misconception ?? null,
      });
    }

    return {
      evaluation: evalResult,
      isCorrect,
      score: evalResult.score,
      misconception: evalResult.misconception,
      hint: evalResult.hint,
      mastery: masteryUpdate.mastery.masteryScore,
      confidence: masteryUpdate.mastery.confidence,
      nextDifficulty,
      nextStatus,
      recommendedAction: recResult.recommendation,
      nextQuestion,
    };
  }

  /**
   * Request guided hint for a question in an adaptive session
   */
  async requestHint(sessionId: string, questionId: string) {
    const session = await this.prisma.adaptiveSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Adaptive session "${sessionId}" not found.`);

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);

    await this.prisma.learningEvent.create({
      data: {
        studentId: session.studentId,
        conceptId: session.conceptId,
        eventType: LearningEventType.HINT_REQUESTED,
        metadata: { sessionId, questionId },
      },
    });

    const hintText = question.explanation
      ? `Hint: Think about ${question.explanation.substring(0, 100)}...`
      : `Hint: Break down the problem step by step and verify your arithmetic.`;

    return {
      questionId,
      hintLevel: 1,
      hintText,
    };
  }

  /**
   * Complete an adaptive session
   */
  async completeSession(sessionId: string) {
    const session = await this.prisma.adaptiveSession.update({
      where: { id: sessionId },
      data: { status: AdaptiveSessionStatus.COMPLETED },
      include: { concept: true },
    });

    const mastery = await this.prisma.mastery.findUnique({
      where: { studentId_conceptId: { studentId: session.studentId, conceptId: session.conceptId } },
    });

    return {
      sessionId: session.id,
      status: session.status,
      finalMastery: mastery?.masteryScore ?? 0.5,
      confidence: mastery?.confidence ?? 0.5,
      completedAt: session.updatedAt,
    };
  }
}
