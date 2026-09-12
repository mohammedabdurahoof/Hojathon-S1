import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface StructuredStudentContext {
  student: {
    id: string;
    grade: number;
    targetGrade: number;
    name: string;
  };
  currentConcept: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
  mastery: {
    current: number;
    target: number;
    attempts: number;
    confidence: number;
  };
  prerequisites: {
    id: string;
    name: string;
    mastery: number;
  }[];
  learningGoal: {
    targetConcept?: string;
  };
  learningStyle: {
    language: string;
  };
}

@Injectable()
export class StudentContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(studentId: string, conceptId: string): Promise<StructuredStudentContext> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    if (!concept) {
      throw new NotFoundException(`Concept with ID "${conceptId}" not found.`);
    }

    // Fetch student's current mastery for this concept
    const currentMasteryRecord = await this.prisma.mastery.findUnique({
      where: {
        studentId_conceptId: {
          studentId,
          conceptId,
        },
      },
    });

    // Fetch student's masteries for prerequisites
    const prereqIds = concept.prerequisites.map((p) => p.prerequisiteId);
    const prereqMasteries = await this.prisma.mastery.findMany({
      where: {
        studentId,
        conceptId: { in: prereqIds },
      },
    });

    const prereqMasteryMap = new Map(prereqMasteries.map((m) => [m.conceptId, m.masteryScore]));

    const mappedPrereqs = concept.prerequisites.map((p) => ({
      id: p.prerequisite.id,
      name: p.prerequisite.name,
      mastery: prereqMasteryMap.get(p.prerequisite.id) ?? 0.0,
    }));

    // Active learning plan target concept
    const activePlan = await this.prisma.learningPlan.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    return {
      student: {
        id: student.id,
        grade: student.gradeLevel,
        targetGrade: student.targetGradeLevel,
        name: student.user.name,
      },
      currentConcept: {
        id: concept.id,
        code: concept.code,
        name: concept.name,
        description: concept.description ?? '',
      },
      mastery: {
        current: currentMasteryRecord?.masteryScore ?? 0.0,
        target: 0.80,
        attempts: currentMasteryRecord?.attempts ?? 0,
        confidence: currentMasteryRecord?.confidence ?? 0.5,
      },
      prerequisites: mappedPrereqs,
      learningGoal: {
        targetConcept: activePlan?.targetConceptId ?? 'Algebra',
      },
      learningStyle: {
        language: 'English',
      },
    };
  }
}
