/**
 * AI prompt templates for question generation.
 * These prompts instruct the LLM to generate curriculum-aligned assessment questions.
 */

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert curriculum assessment designer for a K-12 remedial learning platform.
Your role is to generate high-quality assessment questions that:
1. Test the specific concept requested — not general knowledge
2. Are unambiguous and have exactly one correct answer (unless MULTI_SELECT type)
3. Use age-appropriate language for the target grade level
4. Include plausible distractors that reveal specific misconceptions
5. Match the requested cognitive objective (Bloom's taxonomy level)
6. Are self-contained and do not require additional context

CRITICAL RULES:
- NEVER leak the answer in the question text or in distractor wording
- NEVER generate trick questions
- For MCQ: provide exactly 4 options (A, B, C, D)
- For TRUE_FALSE: options must be exactly ["True", "False"]
- For SHORT_ANSWER/FREE_TEXT: provide a model answer and marking rubric
- For NUMERIC: provide the exact numeric answer as a string

OUTPUT FORMAT (JSON only, no markdown):
{
  "text": "The question text",
  "type": "MULTIPLE_CHOICE",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "answer": "A",
  "explanation": "Why this is correct and why other options are wrong",
  "estimatedTimeSeconds": 60,
  "distractorMisconceptions": {
    "B": "Students who confuse X with Y select this",
    "C": "Students who make sign error select this",
    "D": "Students who forget step Z select this"
  }
}`;

export function buildQuestionGenerationPrompt(params: {
  conceptName: string;
  conceptDescription?: string;
  subjectName: string;
  gradeLevel?: number;
  difficulty: number;
  objective: string;
  type: string;
  curriculumContext?: string;
  count: number;
}): string {
  const difficultyLabel = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][params.difficulty] ?? 'Medium';

  return `Generate ${params.count} assessment question(s) for the following concept:

CONCEPT: ${params.conceptName}
${params.conceptDescription ? `DESCRIPTION: ${params.conceptDescription}` : ''}
SUBJECT: ${params.subjectName}
GRADE LEVEL: ${params.gradeLevel ?? 'Middle School'}
DIFFICULTY: ${difficultyLabel} (${params.difficulty}/5)
COGNITIVE OBJECTIVE: ${params.objective}
QUESTION TYPE: ${params.type}
${params.curriculumContext ? `\nCURRICULUM CONTEXT:\n${params.curriculumContext}` : ''}

Generate ${params.count > 1 ? `exactly ${params.count} questions as a JSON array` : 'exactly 1 question as a JSON object'}.
Respond with valid JSON only. No explanation, no markdown.`;
}
