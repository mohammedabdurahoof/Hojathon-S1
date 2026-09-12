import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConceptAccuracyUpdate {
  conceptId: string;
  totalQuestions: number;
  correctAnswers: number;
}

@Injectable()
export class MasteryService {
  private readonly logger = new Logger(MasteryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update student mastery scores for each concept evaluated in an assessment attempt
   */
  async updateStudentMasteryForConcepts(studentId: string, conceptUpdates: ConceptAccuracyUpdate[]) {
    const results: any[] = [];

    for (const update of conceptUpdates) {
      if (update.totalQuestions === 0) continue;

      const currentAccuracy = update.correctAnswers / update.totalQuestions;

      // Retrieve existing mastery record or initialize default
      const existingMastery = await this.prisma.mastery.findUnique({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: update.conceptId,
          },
        },
      });

      const previousMastery = existingMastery ? existingMastery.masteryScore : 0.5; // Default baseline if first attempt
      const previousAttempts = existingMastery ? existingMastery.attempts : 0;
      const previousCorrect = existingMastery ? existingMastery.correctAttempts : 0;

      // Transparent scoring formula: newMastery = (previousMastery * 0.7) + (currentAccuracy * 0.3)
      let newMasteryScore = previousMastery * 0.7 + currentAccuracy * 0.3;
      newMasteryScore = Math.max(0.0, Math.min(1.0, newMasteryScore));

      const newTotalAttempts = previousAttempts + update.totalQuestions;
      const newTotalCorrect = previousCorrect + update.correctAnswers;
      const newConfidence = Math.min(1.0, newTotalAttempts / 10.0); // Confidence increases with attempt volume up to 10

      const updatedRecord = await this.prisma.mastery.upsert({
        where: {
          studentId_conceptId: {
            studentId,
            conceptId: update.conceptId,
          },
        },
        update: {
          masteryScore: newMasteryScore,
          attempts: newTotalAttempts,
          correctAttempts: newTotalCorrect,
          confidence: newConfidence,
          lastAssessedAt: new Date(),
        },
        create: {
          studentId,
          conceptId: update.conceptId,
          masteryScore: newMasteryScore,
          attempts: newTotalAttempts,
          correctAttempts: newTotalCorrect,
          confidence: newConfidence,
          lastAssessedAt: new Date(),
        },
      });

      this.logger.log(
        `Updated student ${studentId} concept ${update.conceptId}: previous=${previousMastery.toFixed(2)}, currentAcc=${currentAccuracy.toFixed(2)}, newMastery=${newMasteryScore.toFixed(2)}`,
      );

      results.push(updatedRecord);
    }

    return results;
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
