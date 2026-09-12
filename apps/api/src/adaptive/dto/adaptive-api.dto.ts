import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class StartAdaptiveSessionDto {
  @ApiProperty({ description: 'ID of the student' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Target concept ID' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiPropertyOptional({ description: 'Optional learning plan ID' })
  @IsString()
  @IsOptional()
  learningPlanId?: string;
}

export class SubmitAdaptiveAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Student submitted answer string' })
  @IsString()
  @IsNotEmpty()
  studentAnswer: string;

  @ApiPropertyOptional({ description: 'Response time in milliseconds' })
  @IsNumber()
  @IsOptional()
  responseTimeMs?: number;
}

export class RequestHintDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;
}
