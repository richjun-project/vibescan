import { Controller, Get, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingPeriod } from '../../entities/ranking.entity';

@Controller('rankings')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  async getRankings(
    @Query('period') period: RankingPeriod = RankingPeriod.MONTHLY,
    @Query('limit') limit: number = 100,
  ) {
    return this.rankingService.getTopRankings(period, limit);
  }

  @Get('update')
  async updateRankings(@Query('period') period: RankingPeriod = RankingPeriod.MONTHLY) {
    return this.rankingService.updateRankings(period);
  }
}
