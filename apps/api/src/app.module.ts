import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { allConfigs } from './config/app.config';
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
import { AdaptiveModule } from './adaptive/adaptive.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeacherIntelligenceModule } from './teacher-intelligence/teacher-intelligence.module';
import { AssessmentEngineModule } from './assessment-engine/assessment-engine.module';
import { AdminModule } from './admin/admin.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    // Load all typed config factories — validates production env at startup
    ConfigModule.forRoot({
      isGlobal: true,
      load: allConfigs,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
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
    AdaptiveModule,
    AnalyticsModule,
    NotificationsModule,
    TeacherIntelligenceModule,
    AssessmentEngineModule,
    AdminModule,
  ],
  providers: [
    // Global exception filter — consistent error format, no internal leaks in production
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global logging interceptor — structured request/response logs with requestId
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global JWT authentication guard — secure by default, bypass with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global RBAC roles guard — checks @Roles()
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
