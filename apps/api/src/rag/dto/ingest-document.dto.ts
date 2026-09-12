import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IngestDocumentDto {
  @ApiProperty({ description: 'Title of document' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Raw document content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Document type tag (e.g., pdf, text, curriculum)', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
