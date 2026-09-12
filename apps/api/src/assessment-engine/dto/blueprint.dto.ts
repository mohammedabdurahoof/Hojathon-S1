import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsUUID,
  IsInt,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentPurpose, BlueprintStatus } from '@prisma/client';

export class ConceptTargetDto {
  @IsUUID()
  conceptId: string;

  @IsInt()
  @Min(1)
  questionTarget: number;

  @IsOptional()
  @IsNumber()
  marksTarget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuestions?: number;

  @IsOptional()
  @IsInt()
  maximumQuestions?: number;
}

export class DifficultyDistributionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  easy: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  medium: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  hard: number;
}

export class CreateBlueprintDto {
  @IsString()
  title: string;

  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsInt()
  targetGrade?: number;

  @IsEnum(AssessmentPurpose)
  purpose: AssessmentPurpose;

  @IsInt()
  @Min(5)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  totalQuestions: number;

  @IsNumber()
  totalMarks: number;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsObject()
  conceptDistribution: Record<string, number>;

  @ValidateNested()
  @Type(() => DifficultyDistributionDto)
  difficultyDistribution: DifficultyDistributionDto;

  @IsOptional()
  @IsObject()
  questionTypeDistribution?: Record<string, number>;

  @IsOptional()
  @IsObject()
  objectiveDistribution?: Record<string, number>;

  @IsString()
  createdBy: string;
}

export class UpdateBlueprintDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  totalQuestions?: number;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsObject()
  conceptDistribution?: Record<string, number>;

  @IsOptional()
  @ValidateNested()
  @Type(() => DifficultyDistributionDto)
  difficultyDistribution?: DifficultyDistributionDto;

  @IsOptional()
  @IsObject()
  objectiveDistribution?: Record<string, number>;
}

export class PublishBlueprintDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
