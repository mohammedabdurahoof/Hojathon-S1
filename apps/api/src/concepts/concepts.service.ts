import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConceptDto, UpdateConceptDto } from './dto/create-concept.dto';

@Injectable()
export class ConceptsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConcept(dto: CreateConceptDto) {
    const existing = await this.prisma.concept.findUnique({ where: { code: dto.code } }).catch(() => null);
    if (existing) {
      throw new BadRequestException(`Concept with code "${dto.code}" already exists.`);
    }
    return this.prisma.concept.create({ data: dto });
  }

  async findAll(query?: { subjectId?: string; chapterId?: string; topicId?: string }) {
    const where: any = {};

    if (query?.topicId) {
      where.topicId = query.topicId;
    } else if (query?.chapterId) {
      where.topic = { chapterId: query.chapterId };
    } else if (query?.subjectId) {
      where.topic = { chapter: { subjectId: query.subjectId } };
    }

    return this.prisma.concept.findMany({
      where,
      include: {
        topic: {
          include: {
            chapter: {
              include: {
                subject: true,
              },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { id },
      include: {
        topic: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        prerequisiteFor: {
          include: {
            concept: true,
          },
        },
      },
    });
    if (!concept) throw new NotFoundException(`Concept with ID "${id}" not found.`);
    return concept;
  }

  async update(id: string, dto: UpdateConceptDto) {
    await this.findOne(id);
    return this.prisma.concept.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.concept.delete({ where: { id } });
  }

  // --- PREREQUISITES MANAGEMENT & CYCLE DETECTION ---

  async addPrerequisite(conceptId: string, prerequisiteId: string) {
    // Rule 1: Prevent self-referencing prerequisite
    if (conceptId === prerequisiteId) {
      throw new BadRequestException('Concept cannot depend on itself as a prerequisite.');
    }

    // Verify both concepts exist
    await this.findOne(conceptId);
    await this.findOne(prerequisiteId);

    // Rule 2: Prevent duplicate relationship
    const existing = await this.prisma.conceptPrerequisite.findUnique({
      where: {
        conceptId_prerequisiteId: {
          conceptId,
          prerequisiteId,
        },
      },
    }).catch(() => null);

    if (existing) {
      throw new BadRequestException('Prerequisite relationship already exists.');
    }

    // Rule 3: Cycle Detection
    const cycle = await this.wouldCreateCycle(conceptId, prerequisiteId);
    if (cycle) {
      throw new BadRequestException('Circular prerequisite dependency detected. Operation rejected.');
    }

    return this.prisma.conceptPrerequisite.create({
      data: {
        conceptId,
        prerequisiteId,
      },
      include: {
        concept: true,
        prerequisite: true,
      },
    });
  }

  async getPrerequisites(conceptId: string) {
    await this.findOne(conceptId);
    return this.prisma.conceptPrerequisite.findMany({
      where: { conceptId },
      include: { prerequisite: true },
    });
  }

  async removePrerequisite(conceptId: string, prerequisiteId: string) {
    const record = await this.prisma.conceptPrerequisite.findUnique({
      where: {
        conceptId_prerequisiteId: {
          conceptId,
          prerequisiteId,
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Prerequisite relationship between "${conceptId}" and "${prerequisiteId}" not found.`);
    }

    return this.prisma.conceptPrerequisite.delete({
      where: {
        conceptId_prerequisiteId: {
          conceptId,
          prerequisiteId,
        },
      },
    });
  }

  /**
   * BFS Traversal to detect if candidatePrereqId transitively depends on conceptId
   */
  private async wouldCreateCycle(conceptId: string, candidatePrereqId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue: string[] = [candidatePrereqId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === conceptId) {
        return true; // Cycle!
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const prereqs = await this.prisma.conceptPrerequisite.findMany({
        where: { conceptId: current },
        select: { prerequisiteId: true },
      });

      for (const p of prereqs) {
        if (!visited.has(p.prerequisiteId)) {
          queue.push(p.prerequisiteId);
        }
      }
    }

    return false;
  }
}
