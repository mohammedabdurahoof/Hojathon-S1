import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateAiSessionDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Concept ID to study' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiProperty({ description: 'Learning Plan ID (optional)', required: false })
  @IsString()
  @IsOptional()
  learningPlanId?: string;
}

export class SendSessionMessageDto {
  @ApiProperty({ description: 'Student ID (for verification)' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Student input message string' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class GenerateLessonDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Concept ID' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiProperty({ description: 'Learning Plan ID (optional)', required: false })
  @IsString()
  @IsOptional()
  learningPlanId?: string;
}

export class GeneratePracticeDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Concept ID' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiProperty({ description: 'Number of practice questions', default: 3 })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  count?: number;

  @ApiProperty({ description: 'Target difficulty (1-5)', default: 3 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;
}

export class EvaluateAnswerDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Concept ID' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'Expected correct answer' })
  @IsString()
  @IsNotEmpty()
  expectedAnswer: string;

  @ApiProperty({ description: 'Student submitted answer' })
  @IsString()
  @IsNotEmpty()
  studentAnswer: string;
}
