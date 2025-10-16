import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Ranking, RankingPeriod } from '../../entities/ranking.entity';
import { Scan, ScanStatus } from '../../entities/scan.entity';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Ranking)
    private readonly rankingRepository: EntityRepository<Ranking>,
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    private readonly em: EntityManager,
  ) {}

  async getTopRankings(period: RankingPeriod = RankingPeriod.MONTHLY, limit: number = 100) {
    return this.rankingRepository.find(
      { period, isPublic: true },
      { orderBy: { rank: 'ASC' }, limit },
    );
  }

  async updateRankings(period: RankingPeriod = RankingPeriod.MONTHLY) {
    // Get all public completed scans
    const scans = await this.scanRepository.find(
      { status: ScanStatus.COMPLETED, isPublic: true },
      { orderBy: { score: 'DESC' } },
    );

    // Group by domain and get best score
    const domainScores = new Map<string, number>();
    scans.forEach(scan => {
      const currentScore = domainScores.get(scan.domain) || 0;
      if (scan.score > currentScore) {
        domainScores.set(scan.domain, scan.score);
      }
    });

    // Sort and assign ranks
    const sortedDomains = Array.from(domainScores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Clear old rankings
    await this.rankingRepository.nativeDelete({ period });

    // Create new rankings
    sortedDomains.forEach(([domain, score], index) => {
      const ranking = this.rankingRepository.create({
        domain,
        score,
        rank: index + 1,
        period,
        isPublic: true,
        periodStart: new Date(),
        periodEnd: new Date(),
      });
      this.em.persist(ranking);
    });

    await this.em.flush();

    return { updated: sortedDomains.length };
  }
}
