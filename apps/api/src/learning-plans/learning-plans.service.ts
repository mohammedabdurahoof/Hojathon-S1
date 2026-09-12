import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningGapService } from '../students/learning-gap.service';
import { LearningPlanStatus, LearningPlanItemStatus } from '@prisma/client';

@Injectable()
export class LearningPlansService {
  private readonly logger = new Logger(LearningPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly learningGapService: LearningGapService,
  ) {}

  /**
   * Generate a remedial learning plan for a student based on root knowledge gaps and prerequisite ordering
   */
  async generateLearningPlan(studentId: string, targetConceptId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    // Fetch learning gaps and root gaps
    const learningGaps = await this.learningGapService.findLearningGaps(studentId);
    const rootGaps = await this.learningGapService.findRootGaps(studentId, targetConceptId);

    if (learningGaps.length === 0) {
      return {
        message: 'No learning gaps detected. Student has achieved mastery (>= 0.70) across all concepts.',
        studentId,
        items: [],
      };
    }

    // Collect all concepts to include in the remedial sequence
    const conceptIdSet = new Set<string>();
    for (const gap of learningGaps) {
      conceptIdSet.add(gap.conceptId);
    }
    if (targetConceptId) {
      conceptIdSet.add(targetConceptId);
    }

    const conceptIds = Array.from(conceptIdSet);

    // Topological Sort to ensure prerequisite concepts appear before dependent concepts
    const sortedConceptIds = await this.topologicalSortConcepts(conceptIds);

    // Fetch student masteries map
    const masteries = await this.prisma.mastery.findMany({ where: { studentId } });
    const masteryMap = new Map(masteries.map((m) => [m.conceptId, m.masteryScore]));

    // Root gaps set for reason annotation
    const rootGapSet = new Set(rootGaps.map((rg) => rg.rootPrerequisiteId));

    // Deactivate previous active plans for student
    await this.prisma.learningPlan.updateMany({
      where: { studentId, status: LearningPlanStatus.ACTIVE },
      data: { status: LearningPlanStatus.PAUSED },
    });

    // Create new LearningPlan
    const plan = await this.prisma.learningPlan.create({
      data: {
        studentId,
        targetConceptId: targetConceptId ?? sortedConceptIds[sortedConceptIds.length - 1],
        title: `Remedial Learning Plan - ${student.user?.name ?? 'Student'}`,
        purpose: 'Targeted remediation for prerequisite knowledge gaps',
        status: LearningPlanStatus.ACTIVE,
        estimatedDurationMinutes: sortedConceptIds.length * 45,
        priority: 'HIGH',
      },
    });

    // Create LearningPlanItems
    const planItems: any[] = [];
    for (let i = 0; i < sortedConceptIds.length; i++) {
      const cId = sortedConceptIds[i];
      const currentMastery = masteryMap.get(cId) ?? 0.0;
      const isRoot = rootGapSet.has(cId);

      const reason = isRoot
        ? 'PRIMARY ROOT GAP: Foundational prerequisite knowledge deficit requiring immediate remediation'
        : 'Prerequisite gap in target learning sequence';

      const item = await this.prisma.learningPlanItem.create({
        data: {
          learningPlanId: plan.id,
          conceptId: cId,
          order: i + 1,
          reason,
          targetMastery: 0.80,
          currentMastery,
          status: i === 0 ? LearningPlanItemStatus.IN_PROGRESS : LearningPlanItemStatus.PENDING,
        },
        include: {
          concept: true,
        },
      });

      planItems.push(item);
    }

    this.logger.log(`Generated remedial learning plan "${plan.id}" with ${planItems.length} ordered items for student ${studentId}`);

    return {
      planId: plan.id,
      studentId: plan.studentId,
      title: plan.title,
      status: plan.status,
      estimatedDurationMinutes: plan.estimatedDurationMinutes,
      items: planItems,
    };
  }

  async findByStudent(studentId: string) {
    const plans = await this.prisma.learningPlan.findMany({
      where: { studentId },
      include: {
        items: {
          include: {
            concept: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans;
  }

  /**
   * Helper: Topological sort using Kahn's Algorithm / Indegree counting
   */
  private async topologicalSortConcepts(conceptIds: string[]): Promise<string[]> {
    if (conceptIds.length === 0) return [];

    const conceptSet = new Set(conceptIds);

    // Fetch all prerequisite relationships between concepts in conceptIds
    const prereqRels = await this.prisma.conceptPrerequisite.findMany({
      where: {
        conceptId: { in: conceptIds },
        prerequisiteId: { in: conceptIds },
      },
    });

    // Adj list: prereqId -> Array of dependent conceptIds
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of conceptIds) {
      adj.set(id, []);
      inDegree.set(id, 0);
    }

    for (const rel of prereqRels) {
      const u = rel.prerequisiteId; // Must come before v
      const v = rel.conceptId;      // Depends on u

      if (conceptSet.has(u) && conceptSet.has(v)) {
        adj.get(u)!.push(v);
        inDegree.set(v, (inDegree.get(v) ?? 0) + 1);
      }
    }

    // Queue nodes with inDegree === 0 (no prerequisites among conceptIds)
    const queue: string[] = [];
    for (const id of conceptIds) {
      if ((inDegree.get(id) ?? 0) === 0) {
        queue.push(id);
      }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sorted.push(u);

      for (const v of adj.get(u) || []) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    // Append any unvisited node in case of unexpected cycles
    for (const id of conceptIds) {
      if (!sorted.includes(id)) {
        sorted.push(id);
      }
    }

    return sorted;
  }
}
