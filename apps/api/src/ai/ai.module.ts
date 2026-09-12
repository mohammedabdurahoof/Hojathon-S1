import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { OpenAIProvider } from './providers/openai.provider';
import { MockAIProvider } from './providers/mock-ai.provider';
import { StudentContextService } from './services/student-context.service';
import { CurriculumContentService } from './services/curriculum-content.service';
import { AiObservabilityService } from './services/ai-observability.service';
import { AiToolsService } from './tools/ai-tools.service';
import { TutorAgent } from './agents/tutor.agent';
import { EvaluatorAgent } from './agents/evaluator.agent';
import { PracticeAgent } from './agents/practice.agent';
import { LessonAgent } from './agents/lesson.agent';
import { MasteryModule } from '../mastery/mastery.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [MasteryModule, forwardRef(() => RagModule)],
  controllers: [AiController],
  providers: [
    AiService,
    AiOrchestratorService,
    OpenAIProvider,
    MockAIProvider,
    StudentContextService,
    CurriculumContentService,
    AiObservabilityService,
    AiToolsService,
    TutorAgent,
    EvaluatorAgent,
    PracticeAgent,
    LessonAgent,
  ],
  exports: [
    AiService,
    AiOrchestratorService,
    StudentContextService,
    CurriculumContentService,
    AiObservabilityService,
  ],
})
export class AiModule {}
