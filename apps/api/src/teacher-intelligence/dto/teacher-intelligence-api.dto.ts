import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';
import { InterventionType, InterventionStatus, AlertSeverity, AlertType, AlertStatus } from '@prisma/client';

export class CreateInterventionDto {
  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  conceptId?: string;

  @IsEnum(InterventionType)
  type: InterventionType;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  recommendation?: string;

  @IsEnum(AlertSeverity)
  @IsOptional()
  priority?: AlertSeverity;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  targetMastery?: number;

  @IsNumber()
  @IsOptional()
  practiceCount?: number;

  @IsString()
  @IsOptional()
  teacherNotes?: string;
}

export class UpdateInterventionDto {
  @IsEnum(InterventionStatus)
  @IsOptional()
  status?: InterventionStatus;

  @IsString()
  @IsOptional()
  teacherNotes?: string;

  @IsNumber()
  @IsOptional()
  afterMastery?: number;
}

export class UpdateAlertStatusDto {
  @IsEnum(AlertStatus)
  status: AlertStatus;
}

export class AiTeacherQueryDto {
  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;
}
