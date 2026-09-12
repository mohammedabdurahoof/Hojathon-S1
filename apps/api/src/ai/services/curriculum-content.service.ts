import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurriculumContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getContentForConcept(conceptId: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
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
        questions: {
          where: { isActive: true },
          take: 5,
        },
      },
    });

    if (!concept) {
      throw new NotFoundException(`Concept with ID "${conceptId}" not found.`);
    }

    return {
      conceptId: concept.id,
      code: concept.code,
      name: concept.name,
      description: concept.description,
      subject: concept.topic.chapter.subject.name,
      chapter: concept.topic.chapter.name,
      topic: concept.topic.name,
      prerequisites: concept.prerequisites.map((p) => ({
        id: p.prerequisite.id,
        name: p.prerequisite.name,
        code: p.prerequisite.code,
      })),
      sampleQuestions: concept.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      })),
    };
  }
}
