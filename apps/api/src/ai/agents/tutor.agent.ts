import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '../providers/openai.provider';
import { StructuredStudentContext } from '../services/student-context.service';
import { SYSTEM_SAFETY_RULES } from '../prompts/system-safety.prompt';
import { RAG_TUTOR_SAFETY_PROMPT } from '../prompts/rag-tutor.prompt';
import { TutorResponseDto, TutorResponseType, TutorNextAction, RAGSourceCitationDto } from '@ai-remedial/types';

@Injectable()
export class TutorAgent {
  private readonly logger = new Logger(TutorAgent.name);

  constructor(private readonly aiProvider: OpenAIProvider) {}

  async conductTutorStep(
    context: StructuredStudentContext,
    conversationHistory: { role: string; content: string }[],
    latestStudentMessage?: string,
    groundedSources?: { documentId: string; documentTitle: string; chunkId: string; content: string; pageNumber: number | null; sectionTitle: string | null }[],
  ): Promise<TutorResponseDto> {
    this.logger.log(`TutorAgent conducting step for student "${context.student.id}", concept "${context.currentConcept.name}"`);

    const sourcesBlock = groundedSources && groundedSources.length > 0
      ? `CURRICULUM SOURCES:\n` + groundedSources.map((s, idx) => `[Source ${idx + 1}] Title: "${s.documentTitle}" (Page: ${s.pageNumber ?? 'N/A'}, Section: "${s.sectionTitle ?? 'N/A'}")\nContent: "${s.content}"`).join('\n\n')
      : `CURRICULUM SOURCES: None retrieved. Use general pedagogical knowledge.`;

    const systemPrompt = `
${SYSTEM_SAFETY_RULES}
${RAG_TUTOR_SAFETY_PROMPT}

You are acting as the AI Tutor for concept "${context.currentConcept.name}" (${context.currentConcept.code}).
Student Mastery: ${(context.mastery.current * 100).toFixed(0)}% (Target: 80%).

${sourcesBlock}

Output MUST strictly match JSON schema:
{
  "type": "QUESTION" | "EXPLANATION" | "HINT" | "FEEDBACK" | "ENCOURAGEMENT",
  "message": "String content for student",
  "conceptId": "${context.currentConcept.id}",
  "difficulty": Number (1-5),
  "requiresStudentResponse": Boolean,
  "nextAction": "ANSWER" | "CONTINUE" | "PRACTICE" | "ASSESS"
}
`;

    const formattedHistory = conversationHistory
      .slice(-6)
      .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
      .join('\n');

    const prompt = `
Conversation History:
${formattedHistory}

Latest Student Input: "${latestStudentMessage ?? 'Hello, I want to learn this concept.'}"

Generate the tutor's next grounded step.
`;

    const response = await this.aiProvider.generateStructuredOutput<TutorResponseDto>({
      prompt,
      systemPrompt,
      schemaName: 'TutorSchema',
      validator: (raw) => this.validateTutorResponse(raw, context.currentConcept.id),
    });

    if (groundedSources && groundedSources.length > 0) {
      response.sources = groundedSources.map((s) => ({
        documentId: s.documentId,
        documentTitle: s.documentTitle,
        chunkId: s.chunkId,
        pageNumber: s.pageNumber,
        sectionTitle: s.sectionTitle,
      }));
    }

    return response;
  }

  private validateTutorResponse(raw: any, defaultConceptId: string): TutorResponseDto {
    const validTypes: TutorResponseType[] = ['QUESTION', 'EXPLANATION', 'HINT', 'FEEDBACK', 'ENCOURAGEMENT'];
    const validActions: TutorNextAction[] = ['ANSWER', 'CONTINUE', 'PRACTICE', 'ASSESS'];

    return {
      type: validTypes.includes(raw?.type) ? raw.type : 'QUESTION',
      message: typeof raw?.message === 'string' && raw.message.length > 0 ? raw.message : 'Let\'s try a quick problem to test your understanding.',
      conceptId: typeof raw?.conceptId === 'string' ? raw.conceptId : defaultConceptId,
      difficulty: typeof raw?.difficulty === 'number' && raw.difficulty >= 1 && raw.difficulty <= 5 ? raw.difficulty : 2,
      requiresStudentResponse: typeof raw?.requiresStudentResponse === 'boolean' ? raw.requiresStudentResponse : true,
      nextAction: validActions.includes(raw?.nextAction) ? raw.nextAction : 'ANSWER',
    };
  }
}
