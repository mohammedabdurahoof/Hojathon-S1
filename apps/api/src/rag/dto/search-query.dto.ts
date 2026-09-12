import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ description: 'Top K results to retrieve', required: false, default: 5 })
  @IsNumber()
  @IsOptional()
  topK?: number;
}
