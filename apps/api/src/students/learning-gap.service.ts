import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PrerequisiteTreeNode {
  conceptId: string;
  code: string;
  name: string;
  prerequisites: PrerequisiteTreeNode[];
}

export interface LearningGapResult {
  conceptId: string;
  conceptCode: string;
  conceptName: string;
  masteryScore: number;
  status: 'Critical' | 'Weak' | 'Developing' | 'Mastered';
  prerequisiteIds: string[];
}

export interface RootGapResult {
  targetConceptId: string;
  targetConceptName: string;
  targetConceptMastery: number;
  rootPrerequisiteId: string;
  rootPrerequisiteName: string;
  rootPrerequisiteMastery: number;
  dependencyPath: { conceptId: string; name: string; mastery: number }[];
}

@Injectable()
export class LearningGapService {
  private readonly logger = new Logger(LearningGapService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get recursive prerequisite tree for a given concept ID
   */
  async getPrerequisiteTree(conceptId: string, visited = new Set<string>()): Promise<PrerequisiteTreeNode> {
    if (visited.has(conceptId)) {
      throw new Error(`Circular prerequisite detected at concept "${conceptId}"`);
    }
    visited.add(conceptId);

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

    const children: PrerequisiteTreeNode[] = [];
    for (const prereqRel of concept.prerequisites) {
      const childTree = await this.getPrerequisiteTree(prereqRel.prerequisiteId, new Set(visited));
      children.push(childTree);
    }

    return {
      conceptId: concept.id,
      code: concept.code,
      name: concept.name,
      prerequisites: children,
    };
  }

  /**
   * Identify all concepts where student mastery score < 0.70
   */
  async findLearningGaps(studentId: string): Promise<LearningGapResult[]> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    const masteries = await this.prisma.mastery.findMany({
      where: { studentId },
      include: {
        concept: {
          include: {
            prerequisites: true,
          },
        },
      },
    });

    const masteryMap = new Map(masteries.map((m) => [m.conceptId, m.masteryScore]));

    // All concepts in the database
    const allConcepts = await this.prisma.concept.findMany({
      include: {
        prerequisites: true,
      },
    });

    const gapResults: LearningGapResult[] = [];

    for (const concept of allConcepts) {
      const score = masteryMap.get(concept.id) ?? 0.0; // Default 0.0 if not assessed

      if (score < 0.70) {
        let status: 'Critical' | 'Weak' | 'Developing' | 'Mastered' = 'Critical';
        if (score >= 0.60) status = 'Developing';
        else if (score >= 0.40) status = 'Weak';

        gapResults.push({
          conceptId: concept.id,
          conceptCode: concept.code,
          conceptName: concept.name,
          masteryScore: score,
          status,
          prerequisiteIds: concept.prerequisites.map((p) => p.prerequisiteId),
        });
      }
    }

    return gapResults.sort((a, b) => a.masteryScore - b.masteryScore);
  }

  /**
   * Recursive prerequisite traversal to locate the lowest-level / root weak prerequisite gap
   */
  async findRootGaps(studentId: string, targetConceptId?: string): Promise<RootGapResult[]> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found.`);
    }

    const masteries = await this.prisma.mastery.findMany({ where: { studentId } });
    const masteryMap = new Map(masteries.map((m) => [m.conceptId, m.masteryScore]));

    // Determine target concepts to analyze
    let conceptsToAnalyze: string[] = [];
    if (targetConceptId) {
      conceptsToAnalyze = [targetConceptId];
    } else {
      // Analyze concepts with mastery < 0.70
      const gaps = await this.findLearningGaps(studentId);
      conceptsToAnalyze = gaps.map((g) => g.conceptId);
    }

    const rootGaps: RootGapResult[] = [];
    const seenRoots = new Set<string>();

    for (const conceptId of conceptsToAnalyze) {
      const targetConcept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
      if (!targetConcept) continue;

      const targetMastery = masteryMap.get(conceptId) ?? 0.0;
      if (targetMastery >= 0.70 && targetConceptId === undefined) continue;

      // Perform recursive root gap traversal
      const path = await this.traceRootPrerequisitePath(conceptId, masteryMap);

      // Deepest weak prerequisite in the path (last item before mastered node)
      const rootItem = path[path.length - 1];

      if (rootItem && !seenRoots.has(rootItem.conceptId)) {
        seenRoots.add(rootItem.conceptId);
        rootGaps.push({
          targetConceptId: targetConcept.id,
          targetConceptName: targetConcept.name,
          targetConceptMastery: targetMastery,
          rootPrerequisiteId: rootItem.conceptId,
          rootPrerequisiteName: rootItem.name,
          rootPrerequisiteMastery: rootItem.mastery,
          dependencyPath: path,
        });
      }
    }

    return rootGaps;
  }

  /**
   * Helper: Traverses prerequisites backwards to find the deepest unmastered root node
   */
  private async traceRootPrerequisitePath(
    conceptId: string,
    masteryMap: Map<string, number>,
    visited = new Set<string>(),
  ): Promise<{ conceptId: string; name: string; mastery: number }[]> {
    if (visited.has(conceptId)) return [];
    visited.add(conceptId);

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

    if (!concept) return [];

    const currentMastery = masteryMap.get(concept.id) ?? 0.0;
    const currentNode = { conceptId: concept.id, name: concept.name, mastery: currentMastery };

    if (concept.prerequisites.length === 0) {
      // Leaf prerequisite node reached
      return [currentNode];
    }

    // Traverse all prerequisites and find the path to the weakest/root prerequisite
    let deepestPath: { conceptId: string; name: string; mastery: number }[] = [];

    for (const prereqRel of concept.prerequisites) {
      const prereqMastery = masteryMap.get(prereqRel.prerequisiteId) ?? 0.0;
      if (prereqMastery < 0.70) {
        const subPath = await this.traceRootPrerequisitePath(prereqRel.prerequisiteId, masteryMap, new Set(visited));
        if (subPath.length > deepestPath.length) {
          deepestPath = subPath;
        }
      }
    }

    if (deepestPath.length > 0) {
      return [currentNode, ...deepestPath];
    }

    return [currentNode];
  }
}
