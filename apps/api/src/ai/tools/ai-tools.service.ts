import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurriculumContentService } from '../services/curriculum-content.service';

@Injectable()
export class AiToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculumContentService: CurriculumContentService,
  ) {}

  /**
   * Security Enforcer: Ensures session studentId matches tool requested studentId
   */
  private enforceAuthorization(sessionStudentId: string, requestedStudentId: string) {
    if (sessionStudentId !== requestedStudentId) {
      throw new ForbiddenException(
        `AI Tool Access Denied: Unauthorized access to student ID "${requestedStudentId}".`,
      );
    }
  }

  async getStudentMastery(sessionStudentId: string, requestedStudentId: string) {
    this.enforceAuthorization(sessionStudentId, requestedStudentId);
    return this.prisma.mastery.findMany({
      where: { studentId: sessionStudentId },
      include: { concept: true },
    });
  }

  async getConcept(conceptId: string) {
    return this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: { topic: true, prerequisites: true },
    });
  }

  async getPrerequisites(conceptId: string) {
    return this.prisma.conceptPrerequisite.findMany({
      where: { conceptId },
      include: { prerequisite: true },
    });
  }

  async getLearningPlan(sessionStudentId: string, requestedStudentId: string) {
    this.enforceAuthorization(sessionStudentId, requestedStudentId);
    return this.prisma.learningPlan.findFirst({
      where: { studentId: sessionStudentId, status: 'ACTIVE' },
      include: { items: { include: { concept: true }, orderBy: { order: 'asc' } } },
    });
  }

  async getCurrentLearningItem(sessionStudentId: string, requestedStudentId: string) {
    this.enforceAuthorization(sessionStudentId, requestedStudentId);
    const plan = await this.getLearningPlan(sessionStudentId, requestedStudentId);
    if (!plan || plan.items.length === 0) return null;
    return plan.items.find((i) => i.status === 'IN_PROGRESS') ?? plan.items[0];
  }

  async getCurriculumContent(conceptId: string) {
    return this.curriculumContentService.getContentForConcept(conceptId);
  }

  async getPreviousAttempts(sessionStudentId: string, requestedStudentId: string, conceptId: string) {
    this.enforceAuthorization(sessionStudentId, requestedStudentId);
    return this.prisma.assessmentResponse.findMany({
      where: {
        attempt: { studentId: sessionStudentId },
        question: { conceptId },
      },
      include: { question: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }
}
