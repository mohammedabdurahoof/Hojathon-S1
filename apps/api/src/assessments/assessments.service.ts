import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryService } from '../mastery/mastery.service';
import { CreateAssessmentDto, StartAssessmentDto, SubmitAssessmentDto } from './dto/create-assessment.dto';
import { AssessmentStatus } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryService,
  ) {}

  async create(dto: CreateAssessmentDto) {
    // Check subject exists
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new BadRequestException(`Subject with ID "${dto.subjectId}" does not exist.`);
    }

    // Check questions if provided
    if (dto.questionIds && dto.questionIds.length > 0) {
      const questions = await this.prisma.question.findMany({
        where: { id: { in: dto.questionIds } },
      });

      const inactive = questions.filter((q) => !q.isActive);
      if (inactive.length > 0) {
        throw new BadRequestException('Assessment cannot contain inactive questions.');
      }
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        targetGrade: dto.targetGrade ?? 8,
        purpose: dto.purpose,
        duration: dto.duration ?? 30,
      },
    });

    if (dto.questionIds && dto.questionIds.length > 0) {
      await this.prisma.assessmentQuestion.createMany({
        data: dto.questionIds.map((qId, idx) => ({
          assessmentId: assessment.id,
          questionId: qId,
          order: idx + 1,
        })),
      });
    }

    return this.findOne(assessment.id);
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        subject: true,
        questions: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: true,
        questions: {
          include: {
            question: {
              include: {
                concept: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID "${id}" not found.`);
    }

    return assessment;
  }

  async startAssessment(assessmentId: string, dto: StartAssessmentDto) {
    const assessment = await this.findOne(assessmentId);

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) {
      throw new BadRequestException(`Student with ID "${dto.studentId}" does not exist.`);
    }

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        studentId: dto.studentId,
        status: AssessmentStatus.IN_PROGRESS,
        totalQuestions: assessment.questions.length,
      },
    });

    // Strip answers and explanations before returning to student!
    const sanitizedQuestions = assessment.questions.map((aq) => {
      const { answer, explanation, ...sanitized } = aq.question;
      return {
        ...aq,
        question: sanitized,
      };
    });

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      title: assessment.title,
      duration: assessment.duration,
      status: attempt.status,
      startedAt: attempt.startedAt,
      questions: sanitizedQuestions,
    };
  }

  async submitAssessment(assessmentId: string, dto: SubmitAssessmentDto) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: dto.attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt with ID "${dto.attemptId}" not found.`);
    }

    // Business Rule: Student cannot submit an assessment twice!
    if (attempt.status === AssessmentStatus.COMPLETED) {
      throw new BadRequestException('Student cannot submit an assessment twice.');
    }

    const questionMap = new Map(
      attempt.assessment.questions.map((aq) => [aq.question.id, aq.question]),
    );

    let correctCount = 0;
    let incorrectCount = 0;
    const responseRecords: any[] = [];
    const conceptAccuracyMap = new Map<string, { total: number; correct: number }>();

    for (const resp of dto.responses) {
      const question = questionMap.get(resp.questionId);
      if (!question) continue;

      const isCorrect = resp.selectedAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

      if (isCorrect) correctCount++;
      else incorrectCount++;

      responseRecords.push({
        attemptId: attempt.id,
        questionId: question.id,
        selectedAnswer: resp.selectedAnswer,
        isCorrect,
        timeSpentSeconds: resp.timeSpentSeconds ?? 0,
      });

      // Track concept performance breakdown
      const conceptId = question.conceptId;
      const currentStats = conceptAccuracyMap.get(conceptId) || { total: 0, correct: 0 };
      conceptAccuracyMap.set(conceptId, {
        total: currentStats.total + 1,
        correct: currentStats.correct + (isCorrect ? 1 : 0),
      });
    }

    // Create response records
    if (responseRecords.length > 0) {
      await this.prisma.assessmentResponse.createMany({
        data: responseRecords,
      });
    }

    const totalQuestions = dto.responses.length;
    const score = correctCount;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Update attempt record
    const updatedAttempt = await this.prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        percentage,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        responses: {
          include: {
            question: {
              include: {
                concept: true,
              },
            },
          },
        },
      },
    });

    // Update student mastery levels for evaluated concepts
    const conceptUpdates = Array.from(conceptAccuracyMap.entries()).map(([conceptId, stats]) => ({
      conceptId,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
    }));

    await this.masteryService.updateStudentMasteryForConcepts(attempt.studentId, conceptUpdates);

    return {
      attemptId: updatedAttempt.id,
      studentId: updatedAttempt.studentId,
      status: updatedAttempt.status,
      score: updatedAttempt.score,
      percentage: updatedAttempt.percentage,
      totalQuestions: updatedAttempt.totalQuestions,
      correctAnswers: updatedAttempt.correctAnswers,
      incorrectAnswers: updatedAttempt.incorrectAnswers,
      completedAt: updatedAttempt.completedAt,
      conceptPerformance: Array.from(conceptAccuracyMap.entries()).map(([conceptId, stats]) => ({
        conceptId,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        correct: stats.correct,
        total: stats.total,
      })),
    };
  }
}
