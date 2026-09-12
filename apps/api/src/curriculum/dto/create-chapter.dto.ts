import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ description: 'Chapter title (e.g. Foundations)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Chapter order', default: 1 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;
}

export class UpdateChapterDto {
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
  subjectId?: string;
}
