import { Module } from '@nestjs/common';
import { AssessmentEngineController } from './assessment-engine.controller';
import { AssessmentBlueprintService } from './services/assessment-blueprint.service';
import { AssessmentBuilderService } from './services/assessment-builder.service';
import { AssessmentAttemptService } from './services/assessment-attempt.service';
import { AssessmentScoringService } from './services/assessment-scoring.service';
import { AssessmentAnalyticsService } from './services/assessment-analytics.service';
import { AssessmentSecurityService } from './services/assessment-security.service';
import { AssessmentRecommendationService } from './services/assessment-recommendation.service';
import { AdaptiveAssessmentService } from './services/adaptive-assessment.service';
import { QuestionSelectionService } from './services/question-selection.service';
import { QuestionQualityService } from './services/question-quality.service';
import { DifficultyCalibrationService } from './services/difficulty-calibration.service';
import { InterventionAssessmentService } from './services/intervention-assessment.service';
import { MasteryModule } from '../mastery/mastery.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MasteryModule],
  controllers: [AssessmentEngineController],
  providers: [
    AssessmentBlueprintService,
    AssessmentBuilderService,
    AssessmentAttemptService,
    AssessmentScoringService,
    AssessmentAnalyticsService,
    AssessmentSecurityService,
    AssessmentRecommendationService,
    AdaptiveAssessmentService,
    QuestionSelectionService,
    QuestionQualityService,
    DifficultyCalibrationService,
    InterventionAssessmentService,
  ],
  exports: [
    AssessmentBlueprintService,
    AssessmentScoringService,
    AssessmentRecommendationService,
    QuestionQualityService,
    DifficultyCalibrationService,
  ],
})
export class AssessmentEngineModule {}
