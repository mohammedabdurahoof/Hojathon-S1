import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { ConceptsModule } from './concepts/concepts.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { QuestionsModule } from './questions/questions.module';
import { MasteryModule } from './mastery/mastery.module';
import { LearningPlansModule } from './learning-plans/learning-plans.module';
import { AiModule } from './ai/ai.module';
import { RagModule } from './rag/rag.module';
import { StorageModule } from './storage/storage.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    CurriculumModule,
    ConceptsModule,
    AssessmentsModule,
    QuestionsModule,
    MasteryModule,
    LearningPlansModule,
    AiModule,
    RagModule,
    StorageModule,
    AnalyticsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
