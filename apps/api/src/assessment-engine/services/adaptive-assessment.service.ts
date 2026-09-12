import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MasteryService } from '../../mastery/mastery.service';
import { AssessmentSecurityService } from './assessment-security.service';
import { QuestionSelectionService } from './question-selection.service';
import { DifficultyCalibrationService } from './difficulty-calibration.service';
import {
  AssessmentAttemptState,
  AssessmentStatus,
  AssessmentPurpose,
  EvaluatedBy,
  EvidenceSource,
  QuestionStatus,
} from '@prisma/client';
import { StartAdaptiveAssessmentDto, SubmitAdaptiveAnswerDto } from '../dto/adaptive-assessment-api.dto';
import { AdaptiveState, ConceptPerformance } from '../types/assessment-engine.types';

const MIN_QUESTIONS = 10;
const MAX_QUESTIONS = 25;
const HIGH_CONFIDENCE_THRESHOLD = 0.85;
const MASTERY_THRESHOLD = 0.75;

@Injectable()
export class AdaptiveAssessmentService {
  private readonly logger = new Logger(AdaptiveAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryService,
    private readonly securityService: AssessmentSecurityService,
    private readonly questionSelectionService: QuestionSelectionService,
    private readonly calibrationService: DifficultyCalibrationService,
  ) {}

  /**
   * Start an adaptive assessment session.
   * Creates an adaptive Assessment + Attempt with initial state.
   */
  async start(dto: StartAdaptiveAssessmentDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new BadRequestException(`Student "${dto.studentId}" not found`);

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new BadRequestException(`Subject "${dto.subjectId}" not found`);

    // Get student mastery to determine starting difficulty
    const masteries = await this.masteryService.findByStudent(dto.studentId);
    const avgMastery =
      masteries.length > 0
        ? masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length
        : 0.5;

    const startingDifficulty = avgMastery < 0.3 ? 1 : avgMastery < 0.5 ? 2 : avgMastery < 0.7 ? 3 : 4;

    // Get all concepts for the subject to target
    const concepts = await this.prisma.concept.findMany({
      where: {
        topic: { chapter: { subjectId: dto.subjectId } },
        ...(dto.focusConceptId ? { id: dto.focusConceptId } : {}),
      },
      take: 15,
    });

    if (concepts.length === 0) {
      throw new BadRequestException('No concepts found for this subject');
    }

    const conceptIds = concepts.map((c) => c.id);

    // Create adaptive assessment record
    const assessment = await this.prisma.assessment.create({
      data: {
        title: `Adaptive Assessment - ${subject.name}`,
        subjectId: dto.subjectId,
        purpose: AssessmentPurpose.ADAPTIVE,
        duration: 60,
        totalMarks: MAX_QUESTIONS * 1.0,
        isAdaptive: true,
        adaptiveConfig: {
          minQuestions: MIN_QUESTIONS,
          maxQuestions: MAX_QUESTIONS,
          confidenceThreshold: HIGH_CONFIDENCE_THRESHOLD,
          startingDifficulty,
          conceptIds,
        },
        isActive: true,
      },
    });

    const initialState: AdaptiveState = {
      questionsAsked: 0,
      answeredConceptIds: [],
      currentDifficulty: startingDifficulty,
      masteryEstimates: Object.fromEntries(masteries.map((m) => [m.conceptId, m.masteryScore])),
      confidenceEstimates: Object.fromEntries(masteries.map((m) => [m.conceptId, m.confidence])),
      shouldStop: false,
    };

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId: dto.studentId,
        status: AssessmentStatus.IN_PROGRESS,
        state: AssessmentAttemptState.IN_PROGRESS,
        totalQuestions: 0,
        adaptiveState: initialState as any,
      },
    });

    // Select and serve first question
    const firstQuestion = await this.selectNextQuestion(
      dto.studentId,
      conceptIds,
      [],
      startingDifficulty,
      initialState.masteryEstimates,
    );

    if (!firstQuestion) {
      throw new BadRequestException('No available questions found for adaptive assessment');
    }

    await this.questionSelectionService.recordExposure(
      dto.studentId,
      firstQuestion.id,
      firstQuestion.conceptId,
    );

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      currentDifficulty: startingDifficulty,
      questionsAsked: 1,
      nextQuestion: this.securityService.sanitizeQuestion(firstQuestion),
      state: initialState,
    };
  }

  /**
   * Submit an answer in an adaptive assessment.
   * Selects next question or triggers stopping rules.
   */
  async submitAnswer(attemptId: string, studentId: string, dto: SubmitAdaptiveAnswerDto) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
    if (attempt.studentId !== studentId) throw new ForbiddenException('Access denied');
    if (attempt.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Attempt is already completed');
    }

    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException(`Question "${dto.questionId}" not found`);

    const isCorrect =
      dto.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    // Record the answer
    await this.prisma.assessmentAnswer.create({
      data: {
        attemptId,
        questionId: dto.questionId,
        answer: dto.answer,
        isCorrect,
        score: isCorrect ? question.marks : 0,
        responseTimeMs: dto.responseTimeMs ?? 0,
        hintsUsed: dto.hintsUsed ?? 0,
        evaluatedBy: EvaluatedBy.RULE_ENGINE,
      },
    });

    // Update mastery estimate via MasteryService
    await this.masteryService.recordSingleInteractionMastery({
      studentId,
      conceptId: question.conceptId,
      correctness: isCorrect,
      difficulty: question.difficulty,
      source: EvidenceSource.ASSESSMENT,
      questionId: dto.questionId,
      responseTimeMs: dto.responseTimeMs,
      hintsUsed: dto.hintsUsed ?? 0,
    });

    // Update statistics
    this.calibrationService
      .updateStatistics(dto.questionId, isCorrect, dto.responseTimeMs ?? 0)
      .catch((e) => this.logger.error('Stats update error', e));

    // Retrieve updated state
    const state = (attempt.adaptiveState as unknown as AdaptiveState) ?? {
      questionsAsked: 0,
      answeredConceptIds: [],
      currentDifficulty: 3,
      masteryEstimates: {},
      confidenceEstimates: {},
      shouldStop: false,
    };

    state.questionsAsked = (state.questionsAsked ?? 0) + 1;
    if (!state.answeredConceptIds.includes(question.conceptId)) {
      state.answeredConceptIds.push(question.conceptId);
    }

    // Adjust difficulty based on correctness
    if (isCorrect) {
      state.currentDifficulty = Math.min(5, state.currentDifficulty + 1);
    } else {
      state.currentDifficulty = Math.max(1, state.currentDifficulty - 1);
    }

    // Refresh mastery estimates
    const updatedMastery = await this.masteryService.findByStudentAndConcept(
      studentId,
      question.conceptId,
    );
    if (updatedMastery) {
      state.masteryEstimates[question.conceptId] = updatedMastery.masteryScore;
      state.confidenceEstimates[question.conceptId] = updatedMastery.confidence;
    }

    // Evaluate stopping rules
    const allAnsweredMastery = await this.masteryService.findByStudent(studentId);
    const avgConfidence =
      allAnsweredMastery.length > 0
        ? allAnsweredMastery.reduce((sum, m) => sum + m.confidence, 0) / allAnsweredMastery.length
        : 0;

    const adaptiveConfig = attempt.assessment.adaptiveConfig as any;
    const conceptIds = adaptiveConfig?.conceptIds ?? [];
    const allAnswered = await this.prisma.assessmentAnswer.findMany({ where: { attemptId } });

    if (
      state.questionsAsked >= MAX_QUESTIONS ||
      (state.questionsAsked >= MIN_QUESTIONS && avgConfidence >= HIGH_CONFIDENCE_THRESHOLD) ||
      (state.questionsAsked >= MIN_QUESTIONS && state.answeredConceptIds.length >= conceptIds.length)
    ) {
      state.shouldStop = true;
      state.stopReason =
        state.questionsAsked >= MAX_QUESTIONS
          ? 'max_questions'
          : avgConfidence >= HIGH_CONFIDENCE_THRESHOLD
          ? 'high_confidence'
          : 'all_concepts_covered';
    }

    // Update attempt state
    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        adaptiveState: state as any,
        totalQuestions: state.questionsAsked,
      },
    });

    if (state.shouldStop) {
      return {
        attemptId,
        complete: true,
        questionsAsked: state.questionsAsked,
        stopReason: state.stopReason,
        nextQuestion: null,
        message: 'Adaptive assessment complete. Submit to see results.',
      };
    }

    // Select next question
    const answeredIds = allAnswered.map((a) => a.questionId);
    const nextQuestion = await this.selectNextQuestion(
      studentId,
      conceptIds,
      answeredIds,
      state.currentDifficulty,
      state.masteryEstimates,
    );

    if (!nextQuestion) {
      return {
        attemptId,
        complete: true,
        questionsAsked: state.questionsAsked,
        stopReason: 'all_concepts_covered',
        nextQuestion: null,
        message: 'No more questions available.',
      };
    }

    await this.questionSelectionService.recordExposure(
      studentId,
      nextQuestion.id,
      nextQuestion.conceptId,
    );

    return {
      attemptId,
      complete: false,
      questionsAsked: state.questionsAsked,
      currentDifficulty: state.currentDifficulty,
      nextQuestion: this.securityService.sanitizeQuestion(nextQuestion),
    };
  }

  /**
   * Get current adaptive session state.
   */
  async getState(attemptId: string, studentId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });
    if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
    if (attempt.studentId !== studentId) throw new ForbiddenException('Access denied');
    return {
      attemptId: attempt.id,
      questionsAsked: attempt.totalQuestions,
      status: attempt.status,
      state: attempt.adaptiveState,
    };
  }

  /**
   * Complete an adaptive assessment attempt and compute results.
   */
  async complete(attemptId: string, studentId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        answers: { include: { question: { include: { concept: true } } } },
      },
    });
    if (!attempt) throw new NotFoundException(`Attempt "${attemptId}" not found`);
    if (attempt.studentId !== studentId) throw new ForbiddenException('Access denied');
    if (attempt.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Attempt is already completed');
    }

    let totalScore = 0;
    let correctCount = 0;
    const conceptPerf = new Map<string, ConceptPerformance>();

    for (const ans of attempt.answers) {
      totalScore += ans.score;
      if (ans.isCorrect) correctCount++;
      const cId = ans.question.conceptId;
      const cp = conceptPerf.get(cId) ?? {
        conceptId: cId,
        total: 0,
        correct: 0,
        accuracy: 0,
        totalMarks: 0,
        earnedMarks: 0,
      };
      cp.total++;
      cp.totalMarks += ans.question.marks;
      if (ans.isCorrect) {
        cp.correct++;
        cp.earnedMarks += ans.score;
      }
      cp.accuracy = cp.correct / cp.total;
      conceptPerf.set(cId, cp);
    }

    const totalQ = attempt.answers.length;
    const percentage = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        incorrectAnswers: totalQ - correctCount,
        status: AssessmentStatus.COMPLETED,
        state: AssessmentAttemptState.COMPLETED,
        completedAt: new Date(),
        conceptsCovered: Array.from(conceptPerf.keys()),
      },
    });

    return {
      attemptId,
      status: 'COMPLETED',
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      percentage: Math.round(percentage * 100) / 100,
      score: totalScore,
      conceptPerformance: Array.from(conceptPerf.values()),
    };
  }

  /**
   * Select the next question for adaptive testing.
   * Targets concepts with lowest mastery confidence (most uncertainty).
   */
  private async selectNextQuestion(
    studentId: string,
    conceptIds: string[],
    excludeIds: string[],
    targetDifficulty: number,
    masteryEstimates: Record<string, number>,
  ) {
    // Prioritize concepts with lowest mastery score
    const sortedConcepts = [...conceptIds].sort(
      (a, b) => (masteryEstimates[a] ?? 0.5) - (masteryEstimates[b] ?? 0.5),
    );

    // Try each concept in priority order
    for (const conceptId of sortedConcepts) {
      const questions = await this.questionSelectionService.selectQuestions({
        conceptIds: [conceptId],
        excludeQuestionIds: excludeIds,
        studentId,
        targetDifficulty,
        difficultyRange: 1,
        limit: 1,
        respectExposure: true,
      });

      if (questions.length > 0) {
        return questions[0];
      }
    }

    // Fallback: try any concept, ignore exposure
    const questions = await this.questionSelectionService.selectQuestions({
      conceptIds,
      excludeQuestionIds: excludeIds,
      targetDifficulty,
      difficultyRange: 2,
      limit: 1,
      respectExposure: false,
    });

    return questions.length > 0 ? questions[0] : null;
  }
}
