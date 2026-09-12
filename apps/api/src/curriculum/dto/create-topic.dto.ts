import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ description: 'Topic title (e.g. Arithmetic)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Topic order', default: 1 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Chapter ID' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;
}

export class UpdateTopicDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chapterId?: string;
}
