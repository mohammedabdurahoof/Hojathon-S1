import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { StudentRiskService } from './student-risk.service';
import { ClassAnalyticsService } from './class-analytics.service';
import { BottleneckAnalyticsService } from './bottleneck-analytics.service';
import { MisconceptionAnalyticsService } from './misconception-analytics.service';

@Injectable()
export class TeacherAiService {
  constructor(
    private readonly aiService: AiService,
    private readonly riskService: StudentRiskService,
    private readonly classAnalyticsService: ClassAnalyticsService,
    private readonly bottleneckService: BottleneckAnalyticsService,
    private readonly misconceptionService: MisconceptionAnalyticsService,
  ) {}

  async answerTeacherQuery(teacherId: string, query: string, classId?: string, studentId?: string) {
    let contextData: any = {};

    if (studentId) {
      contextData.studentRisk = await this.riskService.calculateStudentRisk(studentId);
    }

    if (classId) {
      contextData.classOverview = await this.classAnalyticsService.getClassOverview(classId, teacherId);
      contextData.bottlenecks = await this.bottleneckService.detectClassBottlenecks(classId);
      contextData.misconceptions = await this.misconceptionService.getClassMisconceptions(classId);
    }

    const systemPrompt = `You are an expert pedagogical assistant to a teacher on an AI Remedial Learning Platform.
You answer teacher queries accurately based ONLY on the provided deterministic telemetry data.
Do NOT fabricate scores, names, or student data not present in the context.
Be professional, concise, encouraging, and clear.`;

    const userPrompt = `Context Data:
${JSON.stringify(contextData, null, 2)}

Teacher Query: "${query}"

Provide a detailed, pedagogical, and actionable response:`;

    const response = await this.aiService.generateText({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.3,
    });

    return {
      query,
      answer: response || `Based on class telemetry: The student/class risk parameters indicate target remediation is recommended for identified prerequisite gaps.`,
      contextSummary: {
        hasStudentContext: !!studentId,
        hasClassContext: !!classId,
      },
    };
  }
}
