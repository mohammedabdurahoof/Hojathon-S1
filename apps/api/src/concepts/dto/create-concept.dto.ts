import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConceptDto {
  @ApiProperty({ description: 'Concept name (e.g. Division)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique concept code (e.g. MATH-DIV-01)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Concept description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Topic ID' })
  @IsString()
  @IsNotEmpty()
  topicId: string;
}

export class UpdateConceptDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  topicId?: string;
}

export class AddPrerequisiteDto {
  @ApiProperty({ description: 'Prerequisite Concept ID' })
  @IsString()
  @IsNotEmpty()
  prerequisiteId: string;
}
