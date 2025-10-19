import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Scan, ScanStatus } from '../../entities/scan.entity';
import { Vulnerability } from '../../entities/vulnerability.entity';
import { Subscription } from '../../entities/subscription.entity';
import { NucleiScannerService } from '../../services/scanners/nuclei-scanner.service';
import { ZapScannerService } from '../../services/scanners/zap-scanner.service';
import { ScoreCalculatorService } from '../../services/score-calculator.service';
import { AIService } from '../../services/ai.service';
import { ScanGateway } from './scan.gateway';

@Processor('scan', {
  concurrency: 3, // 동시 처리 작업 수
  limiter: {
    max: 10, // 최대 10개 작업
    duration: 60000, // 1분당
  },
  lockDuration: 30 * 60 * 1000, // 30분 작업 락 (이 시간동안 작업이 완료되지 않으면 다른 워커가 재시도 가능)
})
export class ScanProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    @InjectRepository(Vulnerability)
    private readonly vulnerabilityRepository: EntityRepository<Vulnerability>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    private readonly nucleiScanner: NucleiScannerService,
    private readonly zapScanner: ZapScannerService,
    private readonly scoreCalculator: ScoreCalculatorService,
    private readonly aiService: AIService,
    private readonly scanGateway: ScanGateway,
    private readonly em: EntityManager,
  ) {
    super();
  }

  /**
   * 서버 시작 시 중단된 스캔 복구
   * - RUNNING 상태인 스캔을 FAILED로 변경
   * - 사용자의 usedScans를 1 감소 (스캔 횟수 롤백)
   */
  async onModuleInit() {
    this.logger.log('[RECOVERY_START] Checking for interrupted scans...');

    try {
      // Find all scans that were RUNNING when server stopped
      const interruptedScans = await this.scanRepository.find(
        { status: ScanStatus.RUNNING },
        { populate: ['user'] } // user relation 포함
      );

      if (interruptedScans.length === 0) {
        this.logger.log('[RECOVERY] No interrupted scans found');
        return;
      }

      this.logger.warn(`[RECOVERY] Found ${interruptedScans.length} interrupted scans`);

      let recoveredCount = 0;
      let rollbackCount = 0;

      for (const scan of interruptedScans) {
        try {
          this.logger.log(`[RECOVERY] Processing scan ${scan.id} (was at ${scan.progress}%)`);

          // Mark scan as FAILED
          scan.status = ScanStatus.FAILED;
          scan.progress = 0;
          scan.progressMessage = '서버 중단으로 인한 스캔 실패';
          scan.results = {
            error: 'Server interrupted',
            reason: '스캔 실행 중 서버가 중단되었습니다',
            recoveredAt: new Date().toISOString(),
          };

          await this.em.persistAndFlush(scan);
          recoveredCount++;
          this.logger.log(`[RECOVERY] Scan ${scan.id} marked as FAILED`);

          // Rollback user's scan count
          try {
            const subscription = await this.subscriptionRepository.findOne({
              user: scan.user.id,
            });

            if (subscription && subscription.usedScans > 0) {
              subscription.usedScans -= 1;
              await this.em.persistAndFlush(subscription);
              rollbackCount++;
              this.logger.log(
                `[RECOVERY] Rolled back scan count for user ${scan.user.id} (${subscription.usedScans + 1} → ${subscription.usedScans})`
              );
            } else if (subscription) {
              this.logger.warn(
                `[RECOVERY] User ${scan.user.id} has no scans to rollback (usedScans: ${subscription.usedScans})`
              );
            } else {
              this.logger.warn(
                `[RECOVERY] No subscription found for user ${scan.user.id}`
              );
            }
          } catch (subError) {
            this.logger.error(
              `[RECOVERY] Failed to rollback scan count for user ${scan.user.id}: ${subError.message}`
            );
          }

          // Send WebSocket notification to client
          this.scanGateway.sendFailed(
            scan.id,
            '서버가 재시작되어 스캔이 중단되었습니다. 스캔 횟수가 복구되었으니 다시 시도해주세요.'
          );

        } catch (error) {
          this.logger.error(
            `[RECOVERY] Failed to recover scan ${scan.id}: ${error.message}`
          );
        }
      }

      this.logger.log(
        `[RECOVERY_DONE] Recovered ${recoveredCount}/${interruptedScans.length} scans, rolled back ${rollbackCount} scan counts`
      );
    } catch (error) {
      this.logger.error(
        `[RECOVERY_ERROR] Failed to check for interrupted scans: ${error.message}`
      );
    }
  }

  async process(job: Job): Promise<any> {
    const { scanId, domain, repositoryUrl, language } = job.data;
    this.logger.log(`[PROCESS_START] Job ${job.id} - Processing scan ${scanId} for domain: ${domain}, language: ${language || 'ko'}`);

    let scan: Scan | null = null;

    try {
      scan = await this.scanRepository.findOneOrFail(
        { id: scanId },
        { populate: ['user'] }  // Load user relation for subscription check
      );
      this.logger.log(`[PROCESS] Scan ${scanId} found in database, current status: ${scan.status}`);

      // Validate state transition
      if (scan.status !== ScanStatus.PENDING && scan.status !== ScanStatus.RUNNING) {
        this.logger.warn(`[PROCESS] Scan ${scanId} has invalid status for processing: ${scan.status}`);
        throw new Error(`Cannot process scan with status: ${scan.status}`);
      }

      scan.status = ScanStatus.RUNNING;
      await this.em.flush();
      this.logger.log(`[PROCESS] Scan ${scanId} status updated to RUNNING`);

      // Update progress: 0% - Started
      await job.updateProgress(0);
      this.scanGateway.sendProgress(scanId, 0, '스캔 시작', { domain });

      // Run Nuclei and ZAP scanners in parallel (0% ~ 90%)
      this.logger.log(`[SCANNERS_START] Starting Nuclei and ZAP scans for scan ${scanId}`);
      this.scanGateway.sendProgress(scanId, 5, '취약점 스캔 시작 중 (5-15분 소요)...');
      const startTime = Date.now();

      let nucleiResult: { success: boolean; findings: any[]; error?: string } = {
        success: false,
        findings: [],
        error: 'Docker not available'
      };

      let zapResult: { success: boolean; findings: any[]; error?: string } = {
        success: false,
        findings: [],
        error: 'Docker not available'
      };

      // Track current progress to prevent going backwards
      let currentOverallProgress = 5;

      // Nuclei progress: 5% ~ 47.5% (42.5% range)
      const nucleiProgressCallback = (percent: number, message?: string) => {
        const mappedProgress = Math.round(5 + (percent * 0.425));
        if (mappedProgress > currentOverallProgress) {
          currentOverallProgress = mappedProgress;
          this.scanGateway.sendProgress(scanId, mappedProgress, `취약점 스캔 (Nuclei): ${message || `${percent}%`}`);
        }
      };

      // ZAP progress: 47.5% ~ 90% (42.5% range)
      const zapProgressCallback = (percent: number, message?: string) => {
        const mappedProgress = Math.round(47.5 + (percent * 0.425));
        if (mappedProgress > currentOverallProgress) {
          currentOverallProgress = mappedProgress;
          this.scanGateway.sendProgress(scanId, mappedProgress, `취약점 스캔 (ZAP): ${message || `${percent}%`}`);
        }
      };

      const [nucleiOutcome, zapOutcome] = await Promise.allSettled([
        this.nucleiScanner.scan(domain, {}, nucleiProgressCallback),
        this.zapScanner.scan(domain, {}, zapProgressCallback),
      ]);

      // Process Nuclei result
      if (nucleiOutcome.status === 'fulfilled') {
        nucleiResult = { ...nucleiOutcome.value, error: nucleiOutcome.value.error || undefined };
        this.logger.log(`[NUCLEI_DONE] Nuclei scan completed with ${nucleiResult.findings.length} findings`);
      } else {
        this.logger.warn(`[NUCLEI_SKIP] Nuclei scanner failed: ${nucleiOutcome.reason}`);
        nucleiResult.error = nucleiOutcome.reason?.message || 'Unknown error';
      }

      // Process ZAP result
      if (zapOutcome.status === 'fulfilled') {
        zapResult = { ...zapOutcome.value, error: zapOutcome.value.error || undefined };
        this.logger.log(`[ZAP_DONE] ZAP scan completed with ${zapResult.findings.length} findings`);
      } else {
        this.logger.warn(`[ZAP_SKIP] ZAP scanner failed: ${zapOutcome.reason}`);
        zapResult.error = zapOutcome.reason?.message || 'Unknown error';
      }

      this.logger.log(`[SCANNERS_DONE] Scanners completed in ${Date.now() - startTime}ms`);

      // Update progress: 90% - Scanners completed
      await job.updateProgress(90);
      this.scanGateway.sendProgress(scanId, 90, '취약점 스캔 완료', {
        nuclei: nucleiResult.findings.length,
        zap: zapResult.findings.length,
      }, true);

      // Check scanner success rate
      const scannerResults = [
        { name: 'Nuclei', success: nucleiResult.success },
        { name: 'ZAP', success: zapResult.success },
      ];

      const successCount = scannerResults.filter(r => r.success).length;
      const totalCount = scannerResults.length;
      const successRate = (successCount / totalCount) * 100;

      this.logger.log(`[SCANNER_SUCCESS_RATE] ${successCount}/${totalCount} scanners succeeded (${successRate.toFixed(1)}%)`);

      // If all scanners failed, mark scan as failed
      if (successCount === 0) {
        this.logger.error(`[SCANNER_FAILURE] All scanners failed`);
        throw new Error('All scanners failed. Please check scanner configuration and Docker availability.');
      }

      // Warn if success rate is low but continue
      if (successRate < 100) {
        this.logger.warn(`[SCANNER_WARNING] Some scanners failed: ${successRate.toFixed(1)}% success rate`);
      }

      // Collect all findings
      const rawFindings = [
        ...nucleiResult.findings,
        ...zapResult.findings,
      ];
      this.logger.log(`[FINDINGS] Total findings collected: ${rawFindings.length}`);

      // Apply deduplication
      const allFindings = this.deduplicateFindings(rawFindings);
      this.scanGateway.sendProgress(scanId, 90, '취약점 중복 제거 중...', {
        before: rawFindings.length,
        after: allFindings.length,
        removed: rawFindings.length - allFindings.length,
      }, true);

      // Update progress: 92% - Saving vulnerabilities
      await job.updateProgress(92);
      this.scanGateway.sendProgress(scanId, 92, '취약점 데이터 준비 중...', {}, true);

      // Save vulnerabilities to database FIRST (to normalize severity/category via Enum)
      this.logger.log(`[DB_SAVE_START] Saving ${allFindings.length} vulnerabilities to database`);
      this.scanGateway.sendProgress(scanId, 93, `${allFindings.length}개 취약점 저장 중...`, {}, true);
      const vulnerabilities = [];
      let aiExplanationsCount = 0;

      for (const finding of allFindings) {
        const vulnerability = this.vulnerabilityRepository.create({
          scan,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,  // ← Enum으로 정규화됨
          category: finding.category,  // ← Enum으로 정규화됨
          cveId: finding.cveId,
          metadata: finding.metadata || finding,
        });

        // AI explanations removed - only scan summary uses AI
        // Individual vulnerabilities use their original descriptions

        vulnerabilities.push(vulnerability);
        this.em.persist(vulnerability);
      }

      this.logger.log(`[DB_SAVE_DONE] Saved ${vulnerabilities.length} vulnerabilities (${aiExplanationsCount} with AI explanations)`);

      // Update progress: 94% - Vulnerabilities saved
      await job.updateProgress(94);
      this.scanGateway.sendProgress(scanId, 94, '취약점 저장 완료', {
        total: vulnerabilities.length,
        withAI: aiExplanationsCount,
      }, true);

      // Calculate score from SAVED vulnerabilities (with normalized severity/category)
      this.logger.log(`[SCORE_START] Calculating score for scan ${scanId} from ${vulnerabilities.length} saved vulnerabilities`);
      this.scanGateway.sendProgress(scanId, 95, '보안 점수 계산 중...', {}, true);

      // Debug: Log severity distribution from saved data
      const severityDist = vulnerabilities.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      this.logger.log(`[SCORE_DEBUG] Severity distribution from DB: ${JSON.stringify(severityDist)}`);

      const scoreResult = this.scoreCalculator.calculateScore(vulnerabilities);
      this.logger.log(`[SCORE_DONE] Score calculated: ${scoreResult.totalScore} (Grade: ${scoreResult.grade}), Penalty: ${scoreResult.penalties.severity}`);

      await job.updateProgress(95);

      // Fetch user's subscription to check for paid plan
      const subscription = await this.subscriptionRepository.findOne({
        user: scan.user,
      });

      // Generate AI summary (ONLY for paid plan users)
      let aiSummary = '';
      const hasPaidPlan = subscription && subscription.isPaidPlan();

      if (hasPaidPlan) {
        this.logger.log(`[AI_SUMMARY_START] Generating AI summary for paid user (plan: ${subscription.plan}), language: ${language || scan.language || 'ko'}`);
        this.scanGateway.sendProgress(scanId, 96, 'AI 요약 생성 중...', {}, true);
        try {
          aiSummary = await this.aiService.generateScanSummary(
            vulnerabilities,  // ← Use saved vulnerabilities
            scoreResult.totalScore,
            language || scan.language || 'ko',
          );
          this.logger.log(`[AI_SUMMARY_DONE] AI summary generated successfully`);
        } catch (e) {
          this.logger.error(`[AI_SUMMARY_ERROR] Failed to generate AI summary: ${e.message}`);
        }
        // Don't update DB here - will be saved together with final results
        this.scanGateway.sendProgress(scanId, 97, 'AI 요약 생성 완료', {}, true);
      } else {
        this.logger.log(`[AI_SUMMARY_SKIP] Skipping AI summary for free plan user (plan: ${subscription?.plan || 'none'})`);
      }

      // Update progress: 98%
      await job.updateProgress(98);
      this.scanGateway.sendProgress(scanId, 98, '최종 결과 저장 중...', {}, true);

      // Update scan with results
      this.logger.log(`[FINALIZE_START] Updating scan ${scanId} with final results`);
      scan.status = ScanStatus.COMPLETED;
      scan.score = scoreResult.totalScore;
      scan.grade = scoreResult.grade;
      scan.completedAt = new Date();
      scan.progress = 100;
      scan.progressMessage = '스캔 완료!';

      // Count findings by severity from SAVED vulnerabilities
      const findingsBySeverity = vulnerabilities.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      scan.results = {
        score: scoreResult.totalScore,
        grade: scoreResult.grade,
        breakdown: scoreResult.breakdown,
        penalties: scoreResult.penalties,
        vulnerabilitiesCount: vulnerabilities.length,  // ← Use saved vulnerabilities
        findingsBySeverity, // e.g., { critical: 2, high: 3, medium: 5, low: 8, info: 20 }
        aiSummary,
        recommendations: this.scoreCalculator.getScoreRecommendations(
          scoreResult.totalScore,
          vulnerabilities,  // ← Use saved vulnerabilities
        ),
        // Detailed findings stored in vulnerability table, not here
        scanners: {
          nuclei: nucleiResult.findings.length,
          zap: zapResult.findings.length,
        },
      };

      // DO NOT store full Nuclei JSON report - it's too large for DB
      // Detailed findings are already stored in vulnerability table
      this.logger.log(`[FINALIZE] Skipping jsonReport storage to reduce DB size`);

      // Flush ALL changes (status, score, grade, results, progress, progressMessage) at once
      this.logger.log(`[FINALIZE_FLUSH] Saving final scan results to database...`);
      await this.persistWithRetry(scan, 3);
      this.logger.log(`[FINALIZE_DONE] Scan ${scanId} completed successfully - Status: ${scan.status}, Score: ${scoreResult.totalScore}, Vulnerabilities: ${vulnerabilities.length}`);

      // Update progress: 100% - Completed
      await job.updateProgress(100);
      // Send WebSocket progress update without DB update (already saved above)
      this.scanGateway.sendProgress(scanId, 100, '스캔 완료!', {
        score: scoreResult.totalScore,
        grade: scoreResult.grade,
        vulnerabilities: vulnerabilities.length,
      }, true); // skipDbUpdate = true

      const result = {
        success: true,
        scanId,
        score: scoreResult.totalScore,
        vulnerabilities: vulnerabilities.length,
      };

      this.logger.log(`[PROCESS_END] Job ${job.id} completed - Result: ${JSON.stringify(result)}`);

      // Send final completion event via WebSocket
      this.scanGateway.sendCompleted(scanId, {
        score: scoreResult.totalScore,
        grade: scoreResult.grade,
        vulnerabilities: vulnerabilities.length,
        findingsBySeverity,
      });

      return result;

    } catch (error) {
      this.logger.error(`[PROCESS_ERROR] Job ${job.id} failed for scan ${scanId}: ${error.message}`);
      this.logger.error(`[PROCESS_ERROR] Stack trace: ${error.stack}`);

      // Always try to mark scan as failed
      try {
        if (!scan) {
          scan = await this.scanRepository.findOne({ id: scanId });
        }

        if (scan) {
          scan.status = ScanStatus.FAILED;
          scan.results = {
            error: error.message,
            failedAt: new Date().toISOString(),
            jobId: job.id.toString(),
          };
          scan.progress = 0;
          scan.progressMessage = `스캔 실패: ${error.message}`;

          // Retry DB update on failure
          await this.persistWithRetry(scan, 3);
          this.logger.log(`[PROCESS_ERROR] Scan ${scanId} marked as FAILED in database`);
        } else {
          this.logger.error(`[PROCESS_ERROR] Could not find scan ${scanId} to mark as failed`);
        }
      } catch (dbError) {
        this.logger.error(`[PROCESS_ERROR] Failed to update scan status to FAILED: ${dbError.message}`);
        // Continue to send WebSocket event even if DB update fails
      }

      // Send failure event via WebSocket
      this.scanGateway.sendFailed(scanId, error.message);

      throw error;
    } finally {
      // Cleanup: Ensure entity manager is clear for next job
      this.em.clear();
      this.logger.log(`[PROCESS_CLEANUP] Job ${job.id} cleanup completed`);
    }
  }

  /**
   * Persist entity with retry logic for transient DB failures
   */
  private async persistWithRetry(entity: any, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.em.persistAndFlush(entity);
        return; // Success
      } catch (error) {
        lastError = error;
        this.logger.warn(`[DB_RETRY] Persist failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = 100 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to persist entity after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Deduplicate findings based on title and category
   * When duplicates found, keep the one with higher severity
   */
  private deduplicateFindings(findings: any[]): any[] {
    const findingMap = new Map<string, any>();

    for (const finding of findings) {
      const key = this.createFindingKey(finding);

      if (!findingMap.has(key)) {
        findingMap.set(key, finding);
      } else {
        // Keep the one with higher severity
        const existing = findingMap.get(key);
        if (this.compareSeverity(finding.severity, existing.severity) > 0) {
          findingMap.set(key, finding);
        }
      }
    }

    const deduplicated = Array.from(findingMap.values());
    const duplicatesRemoved = findings.length - deduplicated.length;

    if (duplicatesRemoved > 0) {
      this.logger.log(`[DEDUPLICATION] Removed ${duplicatesRemoved} duplicate findings (${findings.length} -> ${deduplicated.length})`);
    }

    return deduplicated;
  }

  /**
   * Create unique key for finding based on title and category
   * Normalize title to handle slight variations
   */
  private createFindingKey(finding: any): string {
    // Normalize title: lowercase, remove extra spaces, remove domain-specific parts
    let normalizedTitle = finding.title
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Special handling for common duplicates
    // HSTS: "Missing Security Header: Strict-Transport-Security" vs "Missing or Invalid 'Strict-Transport-Security' Header"
    if (normalizedTitle.includes('strict-transport-security') || normalizedTitle.includes('hsts')) {
      normalizedTitle = 'hsts-header-issue';
    }

    // CSP: "Missing Security Header: Content-Security-Policy" vs similar variations
    if (normalizedTitle.includes('content-security-policy') || normalizedTitle.includes('csp')) {
      normalizedTitle = 'csp-header-issue';
    }

    // rdap-whois: Consolidate all rdap-whois findings
    if (normalizedTitle.includes('rdap') || normalizedTitle.includes('whois')) {
      normalizedTitle = 'rdap-whois-info';
    }

    return `${normalizedTitle}|${finding.category}`;
  }

  /**
   * Compare severity levels
   * Returns: 1 if severity1 > severity2, -1 if severity1 < severity2, 0 if equal
   */
  private compareSeverity(severity1: string, severity2: string): number {
    const severityOrder: Record<string, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    const level1 = severityOrder[severity1?.toLowerCase()] || 0;
    const level2 = severityOrder[severity2?.toLowerCase()] || 0;

    return level1 - level2;
  }
}
