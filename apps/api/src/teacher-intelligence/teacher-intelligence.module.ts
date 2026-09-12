import { Module } from '@nestjs/common';
import { TeacherIntelligenceController } from './teacher-intelligence.controller';
import { TeacherIntelligenceService } from './teacher-intelligence.service';
import { StudentRiskService } from './services/student-risk.service';
import { ClassAnalyticsService } from './services/class-analytics.service';
import { ConceptAnalyticsService } from './services/concept-analytics.service';
import { BottleneckAnalyticsService } from './services/bottleneck-analytics.service';
import { MisconceptionAnalyticsService } from './services/misconception-analytics.service';
import { StudentGroupingService } from './services/student-grouping.service';
import { ProgressAnalyticsService } from './services/progress-analytics.service';
import { InterventionService } from './services/intervention.service';
import { TeacherRecommendationService } from './services/teacher-recommendation.service';
import { TeacherAlertService } from './services/teacher-alert.service';
import { TeacherAiService } from './services/teacher-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [TeacherIntelligenceController],
  providers: [
    PrismaService,
    TeacherIntelligenceService,
    StudentRiskService,
    ClassAnalyticsService,
    ConceptAnalyticsService,
    BottleneckAnalyticsService,
    MisconceptionAnalyticsService,
    StudentGroupingService,
    ProgressAnalyticsService,
    InterventionService,
    TeacherRecommendationService,
    TeacherAlertService,
    TeacherAiService,
  ],
  exports: [
    TeacherIntelligenceService,
    StudentRiskService,
    ClassAnalyticsService,
    ConceptAnalyticsService,
    BottleneckAnalyticsService,
    MisconceptionAnalyticsService,
    StudentGroupingService,
    ProgressAnalyticsService,
    InterventionService,
    TeacherRecommendationService,
    TeacherAlertService,
    TeacherAiService,
  ],
})
export class TeacherIntelligenceModule {}
