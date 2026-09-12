import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { LearningGapService } from './learning-gap.service';
import { DiagnosticReportService } from './diagnostic-report.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, LearningGapService, DiagnosticReportService],
  exports: [StudentsService, LearningGapService, DiagnosticReportService],
})
export class StudentsModule {}
