import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @ApiProperty({ description: 'Concept ID question belongs to' })
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @ApiProperty({ description: 'Question stem text' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ enum: QuestionType, default: QuestionType.MULTIPLE_CHOICE })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiProperty({ description: 'Difficulty level (1=very easy to 5=very hard)', default: 3 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;

  @ApiProperty({ description: 'Options JSON array or object', required: false })
  @IsOptional()
  options?: any;

  @ApiProperty({ description: 'Correct answer string (e.g. "A" or "42")' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: 'Explanation text', required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ description: 'Metadata JSON', required: false })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'Is question active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateQuestionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  conceptId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ enum: QuestionType, required: false })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  options?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
