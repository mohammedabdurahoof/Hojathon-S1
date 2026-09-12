import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class UploadDocumentBodyDto {
  @ApiProperty({ description: 'Document Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Document Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Original File Name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME type (e.g. text/plain, text/markdown, application/pdf)', default: 'text/markdown' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'File content text or base64 string' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Subject ID', required: false })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ description: 'Chapter ID', required: false })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiProperty({ description: 'Topic ID', required: false })
  @IsString()
  @IsOptional()
  topicId?: string;
}

export class RagHybridSearchDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ description: 'Concept ID to filter scope', required: false })
  @IsString()
  @IsOptional()
  conceptId?: string;

  @ApiProperty({ description: 'Student ID for authorization scoping', required: false })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ description: 'Limit number of results', default: 5 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class AssociateConceptChunkDto {
  @ApiProperty({ description: 'Document Chunk ID' })
  @IsString()
  @IsNotEmpty()
  documentChunkId: string;

  @ApiProperty({ description: 'Is primary source for concept', default: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
