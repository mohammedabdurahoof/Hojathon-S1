import { Module } from '@nestjs/common';
import { MasteryController } from './mastery.controller';
import { MasteryService } from './mastery.service';
import { WeightedAccuracyStrategy } from './mastery-strategies/weighted-accuracy.strategy';
import { BktStrategy } from './mastery-strategies/bkt.strategy';

@Module({
  controllers: [MasteryController],
  providers: [MasteryService, WeightedAccuracyStrategy, BktStrategy],
  exports: [MasteryService, WeightedAccuracyStrategy, BktStrategy],
})
export class MasteryModule {}

