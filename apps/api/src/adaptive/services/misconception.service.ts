import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MisconceptionCategory, LearningEventType } from '@prisma/client';

@Injectable()
export class MisconceptionService {
  private readonly logger = new Logger(MisconceptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log or update a student misconception
   */
  async recordMisconception(params: {
    studentId: string;
    conceptId: string;
    description: string;
    category?: MisconceptionCategory;
    confidence?: number;
  }) {
    const category = params.category ?? this.classifyMisconceptionCategory(params.description);

    const existing = await this.prisma.misconception.findFirst({
      where: {
        studentId: params.studentId,
        conceptId: params.conceptId,
        category,
        resolved: false,
      },
    });

    let record;
    if (existing) {
      record = await this.prisma.misconception.update({
        where: { id: existing.id },
        data: {
          occurrenceCount: existing.occurrenceCount + 1,
          description: params.description,
          confidence: params.confidence ?? existing.confidence,
          lastDetectedAt: new Date(),
        },
      });
    } else {
      record = await this.prisma.misconception.create({
        data: {
          studentId: params.studentId,
          conceptId: params.conceptId,
          category,
          description: params.description,
          confidence: params.confidence ?? 0.85,
          occurrenceCount: 1,
          resolved: false,
        },
      });
    }

    // Log LearningEvent
    await this.prisma.learningEvent.create({
      data: {
        studentId: params.studentId,
        conceptId: params.conceptId,
        eventType: LearningEventType.MISCONCEPTION_DETECTED,
        metadata: {
          misconceptionId: record.id,
          category,
          description: params.description,
        },
      },
    });

    this.logger.log(`Recorded misconception "${category}" for student ${params.studentId} on concept ${params.conceptId}`);
    return record;
  }

  /**
   * Check and update misconception resolution after 3 consecutive successful demonstrations
   */
  async updateMisconceptionResolution(studentId: string, conceptId: string) {
    // Fetch active misconceptions for concept
    const active = await this.prisma.misconception.findMany({
      where: { studentId, conceptId, resolved: false },
    });

    if (active.length === 0) return;

    // Check last 3 evidence items for this student + concept
    const recentEvidence = await this.prisma.masteryEvidence.findMany({
      where: { studentId, conceptId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const hasThreeConsecutiveCorrect =
      recentEvidence.length >= 3 && recentEvidence.every((e) => e.correctness === true);

    if (hasThreeConsecutiveCorrect) {
      for (const misc of active) {
        await this.prisma.misconception.update({
          where: { id: misc.id },
          data: { resolved: true },
        });
        this.logger.log(`Resolved misconception "${misc.category}" for student ${studentId} on concept ${conceptId}`);
      }
    }
  }

  async getActiveMisconceptions(studentId: string, conceptId?: string) {
    const where: any = { studentId, resolved: false };
    if (conceptId) where.conceptId = conceptId;

    return this.prisma.misconception.findMany({
      where,
      include: { concept: true },
      orderBy: { lastDetectedAt: 'desc' },
    });
  }

  private classifyMisconceptionCategory(description: string): MisconceptionCategory {
    const text = description.toLowerCase();
    if (text.includes('denominator') || text.includes('add top and bottom')) {
      return MisconceptionCategory.FRACTION_DENOMINATOR_ERROR;
    }
    if (text.includes('numerator')) {
      return MisconceptionCategory.FRACTION_NUMERATOR_ERROR;
    }
    if (text.includes('sign') || text.includes('negative') || text.includes('minus')) {
      return MisconceptionCategory.SIGN_ERROR;
    }
    if (text.includes('arithmetic') || text.includes('calculation') || text.includes('addition error')) {
      return MisconceptionCategory.ARITHMETIC_ERROR;
    }
    if (text.includes('place value') || text.includes('decimal point')) {
      return MisconceptionCategory.PLACE_VALUE_ERROR;
    }
    if (text.includes('formula') || text.includes('forget')) {
      return MisconceptionCategory.FORMULA_RECALL_ERROR;
    }
    if (text.includes('prerequisite') || text.includes('prior knowledge')) {
      return MisconceptionCategory.PREREQUISITE_GAP;
    }
    return MisconceptionCategory.UNKNOWN;
  }
}
