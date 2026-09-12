import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentContextService } from './services/student-context.service';
import { CurriculumContentService } from './services/curriculum-content.service';
import { AiObservabilityService } from './services/ai-observability.service';
import { CurriculumGroundingService } from '../rag/curriculum/curriculum-grounding.service';
import { TutorAgent } from './agents/tutor.agent';
import { EvaluatorAgent } from './agents/evaluator.agent';
import { PracticeAgent } from './agents/practice.agent';
import { LessonAgent } from './agents/lesson.agent';
import { MasteryService } from '../mastery/mastery.service';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly studentContextService: StudentContextService,
    private readonly curriculumContentService: CurriculumContentService,
    private readonly observabilityService: AiObservabilityService,
    private readonly groundingService: CurriculumGroundingService,
    private readonly tutorAgent: TutorAgent,
    private readonly evaluatorAgent: EvaluatorAgent,
    private readonly practiceAgent: PracticeAgent,
    private readonly lessonAgent: LessonAgent,
    private readonly masteryService: MasteryService,
  ) {}

  /**
   * Start or retrieve an AI tutoring session for a student, learning plan, and concept
   */
  async startSession(studentId: string, conceptId: string, learningPlanId?: string) {
    const startTime = Date.now();

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Student "${studentId}" not found.`);

    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept) throw new NotFoundException(`Concept "${conceptId}" not found.`);

    let plan: any = null;
    if (learningPlanId) {
      plan = await this.prisma.learningPlan.findFirst({ where: { id: learningPlanId, studentId } });
      if (!plan) throw new BadRequestException(`Learning plan "${learningPlanId}" does not belong to student "${studentId}".`);
    } else {
      plan = await this.prisma.learningPlan.findFirst({ where: { studentId, status: 'ACTIVE' } });
    }

    let conversation = await this.prisma.aiConversation.findFirst({
      where: { studentId, conceptId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: {
          studentId,
          learningPlanId: plan?.id ?? null,
          conceptId,
          title: `AI Tutor Session: ${concept.name}`,
        },
        include: { messages: true },
      });
    }

    const context = await this.studentContextService.buildContext(studentId, conceptId);

    if (conversation.messages.length === 0) {
      // Retrieve grounded curriculum context
      const grounded = await this.groundingService.getGroundedContext({
        studentId,
        conceptId,
        query: `Learning ${concept.name} overview and examples`,
      });

      const initialStep = await this.tutorAgent.conductTutorStep(
        context,
        [],
        'Start session',
        grounded.retrievedChunks,
      );

      await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          messageType: initialStep.type,
          content: initialStep.message,
          metadata: JSON.parse(JSON.stringify(initialStep)),
        },
      });

      await this.observabilityService.logInteraction({
        studentId,
        provider: 'OpenAIProvider',
        model: 'gpt-4o-mini',
        operation: 'START_SESSION',
        latencyMs: Date.now() - startTime,
        success: true,
      });

      return {
        sessionId: conversation.id,
        studentId,
        conceptId,
        learningPlanId: plan?.id,
        context,
        tutorResponse: initialStep,
      };
    }

    return {
      sessionId: conversation.id,
      studentId,
      conceptId,
      learningPlanId: plan?.id,
      context,
      messages: conversation.messages,
    };
  }

  /**
   * Process student message in an active session
   */
  async sendMessage(sessionId: string, studentId: string, studentMessage: string) {
    const startTime = Date.now();

    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) throw new NotFoundException(`Session "${sessionId}" not found.`);
    if (conversation.studentId !== studentId) {
      throw new BadRequestException(`Session "${sessionId}" does not belong to student "${studentId}".`);
    }
    if (!conversation.conceptId) {
      throw new BadRequestException(`Session "${sessionId}" has no conceptId.`);
    }

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'STUDENT',
        messageType: 'TEXT',
        content: studentMessage,
      },
    });

    const context = await this.studentContextService.buildContext(studentId, conversation.conceptId);

    // RAG Grounding retrieval for student message
    const grounded = await this.groundingService.getGroundedContext({
      studentId,
      conceptId: conversation.conceptId,
      query: studentMessage,
    });

    const history = conversation.messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    }));

    const tutorResponse = await this.tutorAgent.conductTutorStep(
      context,
      history,
      studentMessage,
      grounded.retrievedChunks,
    );

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        messageType: tutorResponse.type,
        content: tutorResponse.message,
        metadata: JSON.parse(JSON.stringify(tutorResponse)),
      },
    });

    await this.observabilityService.logInteraction({
      studentId,
      provider: 'OpenAIProvider',
      model: 'gpt-4o-mini',
      operation: 'TUTOR_MESSAGE',
      latencyMs: Date.now() - startTime,
      success: true,
    });

    return {
      sessionId: conversation.id,
      tutorResponse,
    };
  }

  async evaluateAnswer(params: {
    studentId: string;
    conceptId: string;
    questionText: string;
    expectedAnswer: string;
    studentAnswer: string;
  }) {
    const startTime = Date.now();
    const concept = await this.prisma.concept.findUnique({ where: { id: params.conceptId } });
    if (!concept) throw new NotFoundException(`Concept "${params.conceptId}" not found.`);

    const evaluation = await this.evaluatorAgent.evaluateAnswer({
      questionText: params.questionText,
      expectedAnswer: params.expectedAnswer,
      studentAnswer: params.studentAnswer,
      conceptName: concept.name,
    });

    if (evaluation.misconception) {
      await this.prisma.misconceptionLog.create({
        data: {
          studentId: params.studentId,
          conceptId: params.conceptId,
          misconception: evaluation.misconception,
          confidence: evaluation.confidence,
          questionText: params.questionText,
          studentAnswer: params.studentAnswer,
        },
      });
    }

    await this.masteryService.updateStudentMasteryForConcepts(params.studentId, [
      { conceptId: params.conceptId, totalQuestions: 1, correctAnswers: evaluation.correct ? 1 : 0 },
    ]);

    await this.observabilityService.logInteraction({
      studentId: params.studentId,
      provider: 'OpenAIProvider',
      model: 'gpt-4o-mini',
      operation: 'EVALUATE_ANSWER',
      latencyMs: Date.now() - startTime,
      success: true,
    });

    return evaluation;
  }

  async generateLesson(studentId: string, conceptId: string) {
    const context = await this.studentContextService.buildContext(studentId, conceptId);
    return this.lessonAgent.generateLesson(context);
  }

  async generatePractice(studentId: string, conceptId: string, count = 3, difficulty = 3) {
    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept) throw new NotFoundException(`Concept "${conceptId}" not found.`);
    return this.practiceAgent.generatePracticeQuestions({
      conceptId,
      conceptName: concept.name,
      count,
      difficulty,
    });
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.aiConversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        concept: true,
        student: { include: { user: true } },
      },
    });
    if (!session) throw new NotFoundException(`Session "${sessionId}" not found.`);
    return session;
  }
}
