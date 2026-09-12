import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlueprintStatus, AssessmentPurpose, Prisma } from '@prisma/client';
import { CreateBlueprintDto, UpdateBlueprintDto } from '../dto/blueprint.dto';

@Injectable()
export class AssessmentBlueprintService {
  private readonly logger = new Logger(AssessmentBlueprintService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlueprintDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new BadRequestException(`Subject "${dto.subjectId}" not found`);

    this.validateDistribution(dto.difficultyDistribution);

    const blueprint = await this.prisma.assessmentBlueprint.create({
      data: {
        title: dto.title,
        subjectId: dto.subjectId,
        targetGrade: dto.targetGrade ?? 8,
        purpose: dto.purpose,
        durationMinutes: dto.durationMinutes,
        totalQuestions: dto.totalQuestions,
        totalMarks: dto.totalMarks,
        passingScore: dto.passingScore,
        conceptDistribution: dto.conceptDistribution as any,
        difficultyDistribution: dto.difficultyDistribution as any,
        questionTypeDistribution: dto.questionTypeDistribution ?? Prisma.JsonNull,
        objectiveDistribution: dto.objectiveDistribution ?? Prisma.JsonNull,
        createdBy: dto.createdBy,
        status: BlueprintStatus.DRAFT,
      },
      include: { subject: true },
    });

    this.logger.log(`Blueprint created: ${blueprint.id}`);
    return blueprint;
  }

  async findAll(subjectId?: string) {
    return this.prisma.assessmentBlueprint.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const blueprint = await this.prisma.assessmentBlueprint.findUnique({
      where: { id },
      include: { subject: true, assessments: true },
    });
    if (!blueprint) throw new NotFoundException(`Blueprint "${id}" not found`);
    return blueprint;
  }

  async update(id: string, dto: UpdateBlueprintDto) {
    const blueprint = await this.findOne(id);
    if (blueprint.status === BlueprintStatus.PUBLISHED) {
      throw new BadRequestException('Cannot edit a published blueprint. Archive it first.');
    }

    if (dto.difficultyDistribution) {
      this.validateDistribution(dto.difficultyDistribution);
    }

    return this.prisma.assessmentBlueprint.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.durationMinutes && { durationMinutes: dto.durationMinutes }),
        ...(dto.totalQuestions && { totalQuestions: dto.totalQuestions }),
        ...(dto.totalMarks && { totalMarks: dto.totalMarks }),
        ...(dto.passingScore !== undefined && { passingScore: dto.passingScore }),
        ...(dto.conceptDistribution && { conceptDistribution: dto.conceptDistribution }),
        ...(dto.difficultyDistribution && { difficultyDistribution: dto.difficultyDistribution as any }),
        ...(dto.objectiveDistribution && { objectiveDistribution: dto.objectiveDistribution as any }),
      },
      include: { subject: true },
    });
  }

  async publish(id: string) {
    const blueprint = await this.findOne(id);
    if (blueprint.status === BlueprintStatus.PUBLISHED) {
      throw new BadRequestException('Blueprint is already published');
    }

    // Validate concept distribution sums to 100%
    const conceptDist = blueprint.conceptDistribution as Record<string, number>;
    const total = Object.values(conceptDist).reduce((sum, v) => sum + v, 0);
    if (Math.abs(total - 100) > 0.5) {
      throw new BadRequestException(
        `Concept distribution must sum to 100%, currently ${total.toFixed(1)}%`,
      );
    }

    // Verify concepts exist
    const conceptIds = Object.keys(conceptDist);
    if (conceptIds.length === 0) {
      throw new BadRequestException('Blueprint must target at least one concept');
    }

    const concepts = await this.prisma.concept.findMany({
      where: { id: { in: conceptIds } },
    });
    if (concepts.length !== conceptIds.length) {
      throw new BadRequestException('One or more concept IDs in the distribution are invalid');
    }

    return this.prisma.assessmentBlueprint.update({
      where: { id },
      data: { status: BlueprintStatus.PUBLISHED },
      include: { subject: true },
    });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.assessmentBlueprint.update({
      where: { id },
      data: { status: BlueprintStatus.ARCHIVED },
    });
  }

  private validateDistribution(dist: { easy: number; medium: number; hard: number }) {
    const total = dist.easy + dist.medium + dist.hard;
    if (Math.abs(total - 100) > 0.5) {
      throw new BadRequestException(
        `Difficulty distribution must sum to 100%, got ${total.toFixed(1)}%`,
      );
    }
  }
}
