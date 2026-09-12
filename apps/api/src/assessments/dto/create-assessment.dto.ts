import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentPurpose } from '@prisma/client';

export class CreateAssessmentDto {
  @ApiProperty({ description: 'Assessment title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Optional assessment description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'Target grade level', default: 8 })
  @IsNumber()
  @IsOptional()
  targetGrade?: number;

  @ApiProperty({ enum: AssessmentPurpose, default: AssessmentPurpose.DIAGNOSTIC })
  @IsEnum(AssessmentPurpose)
  @IsOptional()
  purpose?: AssessmentPurpose;

  @ApiProperty({ description: 'Duration in minutes', default: 30 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Array of question IDs to attach', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questionIds?: string[];
}

export class StartAssessmentDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class QuestionResponseItemDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Selected answer string (e.g. "A")' })
  @IsString()
  @IsNotEmpty()
  selectedAnswer: string;

  @ApiProperty({ description: 'Time spent in seconds', default: 15 })
  @IsNumber()
  @IsOptional()
  timeSpentSeconds?: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'Attempt ID' })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({ type: [QuestionResponseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionResponseItemDto)
  responses: QuestionResponseItemDto[];
}
