import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '../providers/openai.provider';
import { SYSTEM_SAFETY_RULES } from '../prompts/system-safety.prompt';
import { StructuredStudentContext } from '../services/student-context.service';
import { LessonDto } from '@ai-remedial/types';

@Injectable()
export class LessonAgent {
  private readonly logger = new Logger(LessonAgent.name);

  constructor(private readonly aiProvider: OpenAIProvider) {}

  async generateLesson(context: StructuredStudentContext): Promise<LessonDto> {
    this.logger.log(`LessonAgent generating lesson for concept "${context.currentConcept.name}"`);

    const systemPrompt = `
${SYSTEM_SAFETY_RULES}

You are the AI Lesson Generator. Generate a structured remedial lesson for concept "${context.currentConcept.name}" (${context.currentConcept.code}).

OUTPUT FORMAT (JSON object matching LessonDto):
{
  "concept": "${context.currentConcept.name}",
  "objective": "Clear learning objective statement",
  "prerequisiteCheck": "Summary of required prerequisite skills",
  "sections": [
    {
      "type": "OBJECTIVE",
      "content": "Description of section objective"
    },
    {
      "type": "EXPLANATION",
      "content": "Step-by-step conceptual explanation"
    },
    {
      "type": "EXAMPLE",
      "content": "Worked example with full solution"
    },
    {
      "type": "GUIDED_PRACTICE",
      "content": "Guided question for student to try",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct option"
    },
    {
      "type": "INDEPENDENT_PRACTICE",
      "content": "Practice problem for student mastery test"
    }
  ]
}
`;

    const prompt = `Generate remedial lesson content for student in grade ${context.student.grade} studying concept: ${context.currentConcept.name}.`;

    return this.aiProvider.generateStructuredOutput<LessonDto>({
      prompt,
      systemPrompt,
      schemaName: 'LessonSchema',
      validator: (raw) => this.validateLessonResponse(raw, context.currentConcept.name),
    });
  }

  private validateLessonResponse(raw: any, conceptName: string): LessonDto {
    const defaultSections = [
      { type: 'OBJECTIVE' as const, content: `Master key principles of ${conceptName}.` },
      { type: 'EXPLANATION' as const, content: `Understanding fundamental rules for ${conceptName}.` },
      { type: 'EXAMPLE' as const, content: `Step-by-step example problem.` },
      { type: 'GUIDED_PRACTICE' as const, content: `Try this guided practice problem.`, question: `Sample question`, options: ['A', 'B'], answer: 'A' },
      { type: 'INDEPENDENT_PRACTICE' as const, content: `Independent practice problem.` },
    ];

    return {
      concept: typeof raw?.concept === 'string' ? raw.concept : conceptName,
      objective: typeof raw?.objective === 'string' ? raw.objective : `Student can apply ${conceptName} effectively.`,
      prerequisiteCheck: typeof raw?.prerequisiteCheck === 'string' ? raw.prerequisiteCheck : 'Requires baseline prerequisite arithmetic skills.',
      sections: Array.isArray(raw?.sections) && raw.sections.length > 0 ? raw.sections : defaultSections,
    };
  }
}
