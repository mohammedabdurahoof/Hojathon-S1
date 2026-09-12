import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningPlanItemStatus } from '@prisma/client';

export type PlanProposalAction =
  | 'ADD_PREREQUISITE'
  | 'INSERT_REMEDIATION'
  | 'REORDER'
  | 'REASSESS'
  | 'SCHEDULE_REVIEW'
  | 'MARK_READY_TO_ADVANCE';

@Injectable()
export class AdaptivePlanService {
  private readonly logger = new Logger(AdaptivePlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Propose and update plan items cleanly through deterministic rules
   */
  async applyPlanProposal(params: {
    studentId: string;
    conceptId: string;
    action: PlanProposalAction;
    prerequisiteConceptId?: string | null;
  }) {
    const activePlan = await this.prisma.learningPlan.findFirst({
      where: { studentId: params.studentId, status: 'ACTIVE' },
      include: { items: true },
    });

    if (!activePlan) {
      this.logger.warn(`No active learning plan found for student ${params.studentId}`);
      return null;
    }

    const currentItem = activePlan.items.find((item) => item.conceptId === params.conceptId);

    if (params.action === 'INSERT_REMEDIATION' && currentItem) {
      await this.prisma.learningPlanItem.update({
        where: { id: currentItem.id },
        data: { status: LearningPlanItemStatus.REMEDIATION },
      });
      this.logger.log(`Set learning plan item ${currentItem.id} status to REMEDIATION`);
    } else if (params.action === 'ADD_PREREQUISITE' && params.prerequisiteConceptId) {
      const existingPrereqItem = activePlan.items.find((item) => item.conceptId === params.prerequisiteConceptId);
      if (!existingPrereqItem) {
        const minOrder = currentItem ? currentItem.order : 1;

        await this.prisma.learningPlanItem.updateMany({
          where: {
            learningPlanId: activePlan.id,
            order: { gte: minOrder },
          },
          data: { order: { increment: 1 } },
        });

        await this.prisma.learningPlanItem.create({
          data: {
            learningPlanId: activePlan.id,
            conceptId: params.prerequisiteConceptId,
            order: minOrder,
            status: LearningPlanItemStatus.IN_PROGRESS,
            reason: 'Root prerequisite gap identified for adaptive review',
          },
        });
        this.logger.log(`Inserted prerequisite concept ${params.prerequisiteConceptId} into plan ${activePlan.id}`);
      }
    } else if (params.action === 'MARK_READY_TO_ADVANCE' && currentItem) {
      await this.prisma.learningPlanItem.update({
        where: { id: currentItem.id },
        data: { status: LearningPlanItemStatus.MASTERED },
      });
      this.logger.log(`Marked plan item ${currentItem.id} as MASTERED`);
    }

    return this.prisma.learningPlan.findUnique({
      where: { id: activePlan.id },
      include: {
        items: {
          include: { concept: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
