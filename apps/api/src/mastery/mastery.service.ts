import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WeightedAccuracyStrategy } from './mastery-strategies/weighted-accuracy.strategy';
import { BktStrategy } from './mastery-strategies/bkt.strategy';
import { MasteryStrategy } from './mastery-strategies/mastery-strategy.interface';
import { EvidenceSource, MasteryHistoryReason } from '@prisma/client';

export interface ConceptAccuracyUpdate {
  conceptId: string;
  totalQuestions: number;
  correctAnswers: number;
  difficulty?: number;
  source?: EvidenceSource;
}

export interface SingleInteractionUpdate {
  studentId: string;
  conceptId: string;
  correctness: boolean;
  score?: number;
  difficulty?: number;
  source?: EvidenceSource;
  questionId?: string;
  responseTimeMs?: number | null;
  hintsUsed?: number;
  misconception?: string | null;
  reason?: MasteryHistoryReason;
}

@Injectable()
export class MasteryService {
  private readonly logger = new Logger(MasteryService.name);
  private strategy: MasteryStrategy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly weightedAccuracyStrategy: WeightedAccuracyStrategy,
    private readonly bktStrategy: BktStrategy,
  ) {
    const strategyName = this.configService.get<string>('MASTERY_STRATEGY', 'weighted_accuracy');
    this.strategy = strategyName === 'bkt' ? this.bktStrategy : this.weightedAccuracyStrategy;
    this.logger.log(`MasteryService initialized with strategy: ${this.strategy.name}`);
  }

  /**
   * Update student mastery scores for each concept evaluated in an assessment attempt
   */
  async updateStudentMasteryForConcepts(studentId: string, conceptUpdates: ConceptAccuracyUpdate[]) {
    const results: any[] = [];

    for (const update of conceptUpdates) {
      if (update.totalQuestions === 0) continue;

      const currentAccuracy = update.correctAnswers / update.totalQuestions;
      const isCorrect = currentAccuracy >= 0.70;

      const existingMastery = await this.prisma.mastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: update.conceptId,
          },
        },
      });

      const previousMastery = existingMastery ? existingMastery.masteryScore : 0.5;
      const previousAttempts = existingMastery ? existingMastery.attempts : 0;
      const previousCorrect = existingMastery ? existingMastery.correctAttempts : 0;

      const newTotalAttempts = previousAttempts + update.totalQuestions;
      const newTotalCorrect = previousCorrect + update.correctAnswers;

      const calcResult = this.strategy.calculateMastery({
        previousMastery,
        correctness: isCorrect,
        difficulty: update.difficulty ?? 2,
        attemptNumber: newTotalAttempts,
      });

      const updatedRecord = await this.prisma.mastery.upsert({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: update.conceptId,
          },
        },
        update: {
          masteryScore: calcResult.masteryScore,
          attempts: newTotalAttempts,
          correctAttempts: newTotalCorrect,
          confidence: calcResult.confidence,
          lastAssessedAt: new Date(),
        },
        create: {
          studentId,
          conceptId: update.conceptId,
          masteryScore: calcResult.masteryScore,
          attempts: newTotalAttempts,
          correctAttempts: newTotalCorrect,
          confidence: calcResult.confidence,
          lastAssessedAt: new Date(),
        },
      });

      // Save MasteryEvidence
      const evidence = await this.prisma.masteryEvidence.create({
        data: {
          studentId,
          conceptId: update.conceptId,
          source: update.source ?? EvidenceSource.ASSESSMENT,
          correctness: isCorrect,
          score: currentAccuracy,
          difficulty: update.difficulty ?? 2,
          attemptNumber: newTotalAttempts,
          confidence: calcResult.confidence,
        },
      });

      // Save MasteryHistory
      await this.prisma.masteryHistory.create({
        data: {
          studentId,
          conceptId: update.conceptId,
          previousScore: previousMastery,
          newScore: calcResult.masteryScore,
          reason: isCorrect ? MasteryHistoryReason.CORRECT_ANSWER : MasteryHistoryReason.INCORRECT_ANSWER,
          evidenceId: evidence.id,
        },
      });

      this.logger.log(
        `Updated student ${studentId} concept ${update.conceptId}: prev=${previousMastery.toFixed(2)}, newScore=${calcResult.masteryScore.toFixed(2)}, conf=${calcResult.confidence.toFixed(2)}`,
      );

      results.push(updatedRecord);
    }

    return results;
  }

  /**
   * Single interaction evidence-based mastery update (e.g. adaptive session question answer)
   */
  async recordSingleInteractionMastery(params: SingleInteractionUpdate) {
    const existing = await this.prisma.mastery.findUnique({
      where: {
        studentId_conceptId: {
          studentId: params.studentId,
          conceptId: params.conceptId,
        },
      },
    });

    const previousMastery = existing ? existing.masteryScore : 0.5;
    const previousAttempts = existing ? existing.attempts : 0;
    const previousCorrect = existing ? existing.correctAttempts : 0;

    const newAttempts = previousAttempts + 1;
    const newCorrect = previousCorrect + (params.correctness ? 1 : 0);

    const calcResult = this.strategy.calculateMastery({
      previousMastery,
      correctness: params.correctness,
      difficulty: params.difficulty ?? 2,
      responseTimeMs: params.responseTimeMs,
      attemptNumber: newAttempts,
      confidence: existing ? existing.confidence : 0.5,
      hintsUsed: params.hintsUsed ?? 0,
    });

    const updated = await this.prisma.mastery.upsert({
      where: {
        studentId_conceptId: {
          studentId: params.studentId,
          conceptId: params.conceptId,
        },
      },
      update: {
        masteryScore: calcResult.masteryScore,
        attempts: newAttempts,
        correctAttempts: newCorrect,
        confidence: calcResult.confidence,
        lastAssessedAt: new Date(),
      },
      create: {
        studentId: params.studentId,
        conceptId: params.conceptId,
        masteryScore: calcResult.masteryScore,
        attempts: newAttempts,
        correctAttempts: newCorrect,
        confidence: calcResult.confidence,
        lastAssessedAt: new Date(),
      },
    });

    const evidence = await this.prisma.masteryEvidence.create({
      data: {
        studentId: params.studentId,
        conceptId: params.conceptId,
        questionId: params.questionId,
        source: params.source ?? EvidenceSource.PRACTICE,
        correctness: params.correctness,
        score: params.score ?? (params.correctness ? 1.0 : 0.0),
        difficulty: params.difficulty ?? 2,
        responseTimeMs: params.responseTimeMs,
        hintsUsed: params.hintsUsed ?? 0,
        attemptNumber: newAttempts,
        misconception: params.misconception,
        confidence: calcResult.confidence,
      },
    });

    await this.prisma.masteryHistory.create({
      data: {
        studentId: params.studentId,
        conceptId: params.conceptId,
        previousScore: previousMastery,
        newScore: calcResult.masteryScore,
        reason: params.reason ?? (params.correctness ? MasteryHistoryReason.CORRECT_ANSWER : MasteryHistoryReason.INCORRECT_ANSWER),
        evidenceId: evidence.id,
      },
    });

    return {
      mastery: updated,
      evidence,
      calculated: calcResult,
    };
  }

  async findByStudent(studentId: string) {
    return this.prisma.mastery.findMany({
      where: { studentId },
      include: { concept: true },
      orderBy: { masteryScore: 'asc' },
    });
  }

  async findByStudentAndConcept(studentId: string, conceptId: string) {
    return this.prisma.mastery.findUnique({
      where: {
        studentId_conceptId: {
          studentId,
          conceptId,
        },
      },
      include: { concept: true },
    });
  }
}

