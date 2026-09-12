import { Module } from '@nestjs/common';
import { LearningPlansController } from './learning-plans.controller';
import { LearningPlansService } from './learning-plans.service';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [StudentsModule],
  controllers: [LearningPlansController],
  providers: [LearningPlansService],
  exports: [LearningPlansService],
})
export class LearningPlansModule {}
