import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { QuestionType, QuestionObjective, QuestionSource } from '@prisma/client';

export class CreateQuestionDto {
  @IsUUID()
  conceptId: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsString()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @IsEnum(QuestionObjective)
  objective: QuestionObjective;

  @IsOptional()
  options?: any;

  @IsString()
  answer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  marks?: number;

  @IsOptional()
  @IsInt()
  estimatedTimeSeconds?: number;

  @IsOptional()
  @IsEnum(QuestionSource)
  source?: QuestionSource;

  @IsOptional()
  @IsObject()
  distractorMisconceptions?: Record<string, string>;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsEnum(QuestionObjective)
  objective?: QuestionObjective;

  @IsOptional()
  options?: any;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  marks?: number;

  @IsOptional()
  @IsObject()
  distractorMisconceptions?: Record<string, string>;
}

export class QuestionFilterDto {
  @IsOptional()
  @IsUUID()
  conceptId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsInt()
  difficulty?: number;

  @IsOptional()
  @IsEnum(QuestionObjective)
  objective?: QuestionObjective;

  @IsOptional()
  @IsEnum(QuestionSource)
  source?: QuestionSource;
}

export class GenerateQuestionsWithAiDto {
  @IsUUID()
  conceptId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  count: number;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsEnum(QuestionObjective)
  objective?: QuestionObjective;
}
