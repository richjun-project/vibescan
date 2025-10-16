import { Controller, Get } from '@nestjs/common';
import { ScanStatsService } from './scan-stats.service';

@Controller('scan-stats')
export class ScanStatsController {
  constructor(private readonly scanStatsService: ScanStatsService) {}

  @Get('capabilities')
  async getCapabilities() {
    return this.scanStatsService.getCapabilities();
  }

  @Get('global-stats')
  async getGlobalStats() {
    return this.scanStatsService.getGlobalStats();
  }
}
