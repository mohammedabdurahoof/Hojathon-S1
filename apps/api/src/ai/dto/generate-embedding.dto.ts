import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateEmbeddingDto {
  @ApiProperty({ description: 'Text string to compute vector embedding for' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
