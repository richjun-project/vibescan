import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Ranking } from '../../entities/ranking.entity';
import { Scan } from '../../entities/scan.entity';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Ranking, Scan])],
  providers: [RankingService],
  controllers: [RankingController],
})
export class RankingModule {}
