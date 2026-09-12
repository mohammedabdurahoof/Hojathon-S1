import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty() 
  @IsEmail() 
  email: string;

  @ApiProperty() 
  @IsString() 
  @MinLength(8) 
  @MaxLength(128) 
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty() 
  @IsString() 
  refreshToken: string;
}
