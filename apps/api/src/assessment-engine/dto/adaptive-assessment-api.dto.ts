import { IsUUID, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class StartAdaptiveAssessmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsString()
  focusConceptId?: string;
}

export class SubmitAdaptiveAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  responseTimeMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hintsUsed?: number;
}

export class MasteryCheckDto {
  @IsUUID()
  conceptId: string;

  @IsOptional()
  @IsInt()
  questionCount?: number;
}
