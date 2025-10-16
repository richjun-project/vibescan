import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Scan, ScanStatus } from '../entities/scan.entity';

/**
 * Service to clean up stuck scan jobs
 * Runs periodically to identify and fix scans that are stuck in RUNNING state
 */
@Injectable()
export class StuckJobCleanerService {
  private readonly logger = new Logger(StuckJobCleanerService.name);
  private readonly STUCK_THRESHOLD_MINUTES = 45; // Consider stuck after 45 minutes

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Run every 15 minutes to check for stuck jobs
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanStuckJobs(): Promise<void> {
    this.logger.log('[STUCK_JOB_CLEANER] Starting stuck job cleanup...');

    try {
      const thresholdTime = new Date();
      thresholdTime.setMinutes(
        thresholdTime.getMinutes() - this.STUCK_THRESHOLD_MINUTES,
      );

      // Find scans that have been RUNNING for too long
      const stuckScans = await this.scanRepository.find({
        status: ScanStatus.RUNNING,
        createdAt: { $lt: thresholdTime },
      });

      if (stuckScans.length === 0) {
        this.logger.log('[STUCK_JOB_CLEANER] No stuck jobs found');
        return;
      }

      this.logger.warn(
        `[STUCK_JOB_CLEANER] Found ${stuckScans.length} stuck scans`,
      );

      let cleanedCount = 0;
      for (const scan of stuckScans) {
        try {
          const runningSince = Math.floor(
            (Date.now() - scan.createdAt.getTime()) / 1000 / 60,
          );

          this.logger.warn(
            `[STUCK_JOB_CLEANER] Cleaning stuck scan ${scan.id} (running for ${runningSince} minutes)`,
          );

          scan.status = ScanStatus.FAILED;
          scan.results = {
            error: 'Scan timed out',
            reason: `Scan was stuck in RUNNING state for ${runningSince} minutes`,
            cleanedAt: new Date().toISOString(),
          };
          scan.progress = 0;
          scan.progressMessage = '스캔 시간 초과';

          await this.em.persistAndFlush(scan);
          cleanedCount++;

          this.logger.log(
            `[STUCK_JOB_CLEANER] Successfully cleaned stuck scan ${scan.id}`,
          );
        } catch (error) {
          this.logger.error(
            `[STUCK_JOB_CLEANER] Failed to clean scan ${scan.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `[STUCK_JOB_CLEANER] Cleaned ${cleanedCount}/${stuckScans.length} stuck scans`,
      );
    } catch (error) {
      this.logger.error(
        `[STUCK_JOB_CLEANER] Stuck job cleanup failed: ${error.message}`,
      );
    }
  }

  /**
   * Manual cleanup trigger for testing or admin purposes
   */
  async manualCleanup(): Promise<{ cleaned: number; total: number }> {
    this.logger.log('[STUCK_JOB_CLEANER] Manual cleanup triggered');
    await this.cleanStuckJobs();

    const stuckScans = await this.scanRepository.find({
      status: ScanStatus.RUNNING,
    });

    return {
      cleaned: 0,
      total: stuckScans.length,
    };
  }
}
