import { Module } from '@nestjs/common';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';
import { DifficultyService } from './services/difficulty.service';
import { MisconceptionService } from './services/misconception.service';
import { PrerequisiteReviewService } from './services/prerequisite-review.service';
import { SpacedReviewService } from './services/spaced-review.service';
import { LearningRecommendationService } from './services/learning-recommendation.service';
import { AdaptiveQuestionService } from './services/adaptive-question.service';
import { StudentLearningStateService } from './services/student-learning-state.service';
import { AdaptivePlanService } from './services/adaptive-plan.service';
import { MasteryModule } from '../mastery/mastery.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [MasteryModule, AiModule],
  controllers: [AdaptiveController],
  providers: [
    AdaptiveService,
    DifficultyService,
    MisconceptionService,
    PrerequisiteReviewService,
    SpacedReviewService,
    LearningRecommendationService,
    AdaptiveQuestionService,
    StudentLearningStateService,
    AdaptivePlanService,
  ],
  exports: [
    AdaptiveService,
    DifficultyService,
    MisconceptionService,
    PrerequisiteReviewService,
    SpacedReviewService,
    LearningRecommendationService,
    StudentLearningStateService,
    AdaptivePlanService,
  ],
})
export class AdaptiveModule {}
