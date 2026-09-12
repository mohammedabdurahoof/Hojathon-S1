import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsUUID,
  IsInt,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StartAssessmentAttemptDto {
  @IsUUID()
  studentId: string;
}

export class AnswerSubmissionDto {
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

export class SubmitAttemptAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsInt()
  responseTimeMs?: number;

  @IsOptional()
  @IsInt()
  hintsUsed?: number;
}

export class SubmitAssessmentAttemptDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSubmissionDto)
  answers?: AnswerSubmissionDto[];
}

export class CreateAssessmentFromBlueprintDto {
  @IsUUID()
  blueprintId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isAdaptive?: boolean;
}

export class GenerateAssessmentWithAiDto {
  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsUUID()
  blueprintId?: string;

  @IsInt()
  @Min(1)
  totalQuestions: number;

  @IsString()
  title: string;
}
