import { Module } from '@nestjs/common';
import { LearningPlansController } from './learning-plans.controller';
import { LearningPlansService } from './learning-plans.service';

@Module({
  controllers: [LearningPlansController],
  providers: [LearningPlansService],
  exports: [LearningPlansService],
})
export class LearningPlansModule {}
