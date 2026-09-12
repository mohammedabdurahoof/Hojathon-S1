import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAIProvider } from './providers/mock-ai.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, MockAIProvider],
  exports: [AiService],
})
export class AiModule {}
