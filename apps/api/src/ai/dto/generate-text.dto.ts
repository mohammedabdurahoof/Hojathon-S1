import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class GenerateTextDto {
  @ApiProperty({ description: 'User prompt text' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'Optional system instructions', required: false })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiProperty({ description: 'Sampling temperature', required: false, default: 0.7 })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}
