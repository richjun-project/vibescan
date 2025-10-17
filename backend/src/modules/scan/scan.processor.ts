import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Scan, ScanStatus } from '../../entities/scan.entity';
import { Vulnerability } from '../../entities/vulnerability.entity';
import { NucleiScannerService } from '../../services/scanners/nuclei-scanner.service';
import { ZapScannerService } from '../../services/scanners/zap-scanner.service';
import { SecurityHeadersScannerService } from '../../services/scanners/security-headers-scanner.service';
import { SSLScannerService } from '../../services/scanners/ssl-scanner.service';
import { WebReconScannerService } from '../../services/scanners/web-recon-scanner.service';
import { PortScannerService } from '../../services/scanners/port-scanner.service';
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
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    @InjectRepository(Vulnerability)
    private readonly vulnerabilityRepository: EntityRepository<Vulnerability>,
    private readonly nucleiScanner: NucleiScannerService,
    private readonly zapScanner: ZapScannerService,
    private readonly headersScanner: SecurityHeadersScannerService,
    private readonly sslScanner: SSLScannerService,
    private readonly webReconScanner: WebReconScannerService,
    private readonly portScanner: PortScannerService,
    private readonly scoreCalculator: ScoreCalculatorService,
    private readonly aiService: AIService,
    private readonly scanGateway: ScanGateway,
    private readonly em: EntityManager,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { scanId, domain, repositoryUrl } = job.data;
    this.logger.log(`[PROCESS_START] Job ${job.id} - Processing scan ${scanId} for domain: ${domain}`);

    let scan: Scan | null = null;

    try {
      scan = await this.scanRepository.findOneOrFail({ id: scanId });
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

      // Run all scanners in parallel
      // Note: Nuclei requires Docker and may fail in some environments
      this.logger.log(`[SCANNERS_START] Starting parallel scanners for scan ${scanId}`);
      this.scanGateway.sendProgress(scanId, 5, '기본 보안 스캐너 시작 중...');
      this.scanGateway.sendProgress(scanId, 10, 'HTTP 헤더 보안 검사 중...');
      this.scanGateway.sendProgress(scanId, 15, 'SSL/TLS 인증서 검증 중...');
      this.scanGateway.sendProgress(scanId, 20, '웹 기술 스택 분석 중...');
      this.scanGateway.sendProgress(scanId, 25, '포트 스캔 진행 중...');
      const startTime = Date.now();

      const [
        headersResult,
        sslResult,
        webReconResult,
        portScanResult,
      ] = await Promise.all([
        this.headersScanner.scan(domain).catch(e => {
          this.logger.error(`[SCANNER_ERROR] Headers scanner failed for scan ${scanId}: ${e.message}`);
          return { success: false, findings: [], error: e.message };
        }),
        this.sslScanner.scan(domain).catch(e => {
          this.logger.error(`[SCANNER_ERROR] SSL scanner failed for scan ${scanId}: ${e.message}`);
          return { success: false, findings: [], error: e.message };
        }),
        this.webReconScanner.scan(domain).catch(e => {
          this.logger.error(`[SCANNER_ERROR] WebRecon scanner failed for scan ${scanId}: ${e.message}`);
          return { success: false, findings: [], error: e.message };
        }),
        this.portScanner.scan(domain).catch(e => {
          this.logger.error(`[SCANNER_ERROR] Port scanner failed for scan ${scanId}: ${e.message}`);
          return { success: false, findings: [], error: e.message };
        }),
      ]);

      this.logger.log(`[SCANNERS_DONE] Basic scanners completed in ${Date.now() - startTime}ms`);
      this.logger.log(`[SCANNERS_RESULT] Headers: ${headersResult.findings.length} findings, SSL: ${sslResult.findings.length} findings, WebRecon: ${webReconResult.findings.length} findings, Ports: ${portScanResult.findings.length} findings`);

      // Update progress: 40% - Basic scanners completed
      await job.updateProgress(40);
      this.scanGateway.sendProgress(scanId, 35, '기본 스캔 분석 중...');
      this.scanGateway.sendProgress(scanId, 40, '기본 스캔 완료', {
        headers: headersResult.findings.length,
        ssl: sslResult.findings.length,
        webRecon: webReconResult.findings.length,
        ports: portScanResult.findings.length,
      });

      // Run advanced scanners (Nuclei + ZAP) in parallel
      this.logger.log(`[ADVANCED_SCANNERS_START] Starting Nuclei and ZAP scans for scan ${scanId}`);
      this.scanGateway.sendProgress(
        scanId,
        45,
        '고급 스캔 시작 중 (5-15분 소요)...',
      );
      const advancedStartTime = Date.now();

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

      // Run Nuclei and ZAP (baseline) in parallel
      // ZAP uses baseline scan (passive only) - safe for production
      this.logger.log(`[ADVANCED_SCANNERS] Running Nuclei + ZAP Baseline (passive scan)`);

      // Track current progress to prevent going backwards
      let currentOverallProgress = 45;

      // Nuclei progress: 45% ~ 67.5% (22.5% range)
      const nucleiProgressCallback = (percent: number, message?: string) => {
        const mappedProgress = Math.round(45 + (percent * 0.225));
        if (mappedProgress > currentOverallProgress) {
          currentOverallProgress = mappedProgress;
          this.scanGateway.sendProgress(scanId, mappedProgress, `고급 스캔 (Nuclei): ${message || `${percent}%`}`);
        }
      };

      // ZAP progress: 67.5% ~ 90% (22.5% range)
      const zapProgressCallback = (percent: number, message?: string) => {
        const mappedProgress = Math.round(67.5 + (percent * 0.225));
        if (mappedProgress > currentOverallProgress) {
          currentOverallProgress = mappedProgress;
          this.scanGateway.sendProgress(scanId, mappedProgress, `고급 스캔 (ZAP): ${message || `${percent}%`}`);
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

      this.logger.log(`[ADVANCED_SCANNERS_DONE] Advanced scanners completed in ${Date.now() - advancedStartTime}ms`);

      // Update progress: 90% - Advanced scanners completed
      await job.updateProgress(90);
      this.scanGateway.sendProgress(scanId, 90, '고급 스캔 완료', {
        nuclei: nucleiResult.findings.length,
        zap: zapResult.findings.length,
      }, true);

      // Check scanner success rate
      const scannerResults = [
        { name: 'Headers', success: headersResult.success },
        { name: 'SSL', success: sslResult.success },
        { name: 'WebRecon', success: webReconResult.success },
        { name: 'Ports', success: portScanResult.success },
        { name: 'Nuclei', success: nucleiResult.success },
        { name: 'ZAP', success: zapResult.success },
      ];

      const successCount = scannerResults.filter(r => r.success).length;
      const totalCount = scannerResults.length;
      const successRate = (successCount / totalCount) * 100;

      this.logger.log(`[SCANNER_SUCCESS_RATE] ${successCount}/${totalCount} scanners succeeded (${successRate.toFixed(1)}%)`);

      // If all critical scanners failed, mark scan as failed
      const criticalScannersSuccessful = headersResult.success || sslResult.success || webReconResult.success;

      if (!criticalScannersSuccessful) {
        this.logger.error(`[SCANNER_FAILURE] All critical scanners failed`);
        throw new Error('All critical scanners failed. Please check scanner configuration and Docker availability.');
      }

      // Warn if success rate is low but continue
      if (successRate < 50) {
        this.logger.warn(`[SCANNER_WARNING] Low scanner success rate: ${successRate.toFixed(1)}%`);
      }

      // Collect all findings
      const rawFindings = [
        ...nucleiResult.findings,
        ...zapResult.findings,
        ...headersResult.findings,
        ...sslResult.findings,
        ...webReconResult.findings,
        ...portScanResult.findings,
      ];
      this.logger.log(`[FINDINGS] Total findings collected: ${rawFindings.length}`);

      // Apply deduplication
      const allFindings = this.deduplicateFindings(rawFindings);
      this.scanGateway.sendProgress(scanId, 90, '취약점 중복 제거 중...', {
        before: rawFindings.length,
        after: allFindings.length,
        removed: rawFindings.length - allFindings.length,
      }, true);

      // Update progress: 92% - Analyzing findings
      await job.updateProgress(92);
      this.scanGateway.sendProgress(scanId, 92, '보안 점수 계산 중...', {}, true);

      // Calculate score
      this.logger.log(`[SCORE_START] Calculating score for scan ${scanId}`);
      const scoreResult = this.scoreCalculator.calculateScore(allFindings);
      this.logger.log(`[SCORE_DONE] Score calculated: ${scoreResult.totalScore} (Grade: ${scoreResult.grade})`);

      // Save vulnerabilities to database
      this.logger.log(`[DB_SAVE_START] Saving ${allFindings.length} vulnerabilities to database`);
      this.scanGateway.sendProgress(scanId, 93, '취약점 데이터 준비 중...', {}, true);
      this.scanGateway.sendProgress(scanId, 94, `${allFindings.length}개 취약점 저장 중...`, {}, true);
      const vulnerabilities = [];
      let aiExplanationsCount = 0;

      for (const finding of allFindings) {
        const vulnerability = this.vulnerabilityRepository.create({
          scan,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          category: finding.category,
          cveId: finding.cveId,
          metadata: finding.metadata || finding,
        });

        // AI explanations removed - only scan summary uses AI
        // Individual vulnerabilities use their original descriptions

        vulnerabilities.push(vulnerability);
        this.em.persist(vulnerability);
      }

      this.logger.log(`[DB_SAVE_DONE] Saved ${vulnerabilities.length} vulnerabilities (${aiExplanationsCount} with AI explanations)`);

      // Update progress: 95% - Vulnerabilities saved
      await job.updateProgress(95);
      this.scanGateway.sendProgress(scanId, 95, '취약점 저장 완료', {
        total: vulnerabilities.length,
        withAI: aiExplanationsCount,
      }, true);

      // Generate AI summary (ONLY for paid scans)
      let aiSummary = '';
      if (scan.isPaid) {
        this.logger.log(`[AI_SUMMARY_START] Generating AI summary for paid scan ${scanId}`);
        this.scanGateway.sendProgress(scanId, 96, 'AI 요약 생성 중...', {}, true);
        try {
          aiSummary = await this.aiService.generateScanSummary(
            allFindings,
            scoreResult.totalScore,
          );
          this.logger.log(`[AI_SUMMARY_DONE] AI summary generated successfully`);
        } catch (e) {
          this.logger.error(`[AI_SUMMARY_ERROR] Failed to generate AI summary: ${e.message}`);
        }
        // Don't update DB here - will be saved together with final results
        this.scanGateway.sendProgress(scanId, 97, 'AI 요약 생성 완료', {}, true);
      } else {
        this.logger.log(`[AI_SUMMARY_SKIP] Skipping AI summary for free scan ${scanId}`);
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

      // Count findings by severity
      const findingsBySeverity = allFindings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      scan.results = {
        score: scoreResult.totalScore,
        grade: scoreResult.grade,
        breakdown: scoreResult.breakdown,
        penalties: scoreResult.penalties,
        vulnerabilitiesCount: allFindings.length,
        findingsBySeverity, // e.g., { critical: 2, high: 3, medium: 5, low: 8, info: 20 }
        aiSummary,
        recommendations: this.scoreCalculator.getScoreRecommendations(
          scoreResult.totalScore,
          allFindings,
        ),
        // Detailed findings from all scanners
        allFindings: allFindings.map(f => ({
          title: f.title,
          description: f.description,
          severity: f.severity,
          category: f.category,
          cveId: f.cveId,
          matcher_name: f.matcher_name,
          host: f.host,
          matched_at: f.matched_at,
        })),
        scanners: {
          nuclei: {
            success: nucleiResult.success,
            count: nucleiResult.findings.length,
            findings: nucleiResult.findings,  // Nuclei 상세 결과 포함
            error: nucleiResult.error,
          },
          zap: {
            success: zapResult.success,
            count: zapResult.findings.length,
            findings: zapResult.findings,  // ZAP 상세 결과 포함
            error: zapResult.error,
          },
          headers: {
            success: headersResult.success,
            count: headersResult.findings.length,
            findings: headersResult.findings, // Headers 상세 결과 포함
          },
          ssl: {
            success: sslResult.success,
            count: sslResult.findings.length,
            findings: sslResult.findings, // SSL 상세 결과 포함
          },
          webRecon: {
            success: webReconResult.success,
            count: webReconResult.findings.length,
            findings: webReconResult.findings, // WebRecon 상세 결과 포함
          },
          ports: {
            success: portScanResult.success,
            count: portScanResult.findings.length,
            findings: portScanResult.findings, // Port 상세 결과 포함
          },
        },
      };

      // Store full Nuclei JSON report if available
      if (nucleiResult.success && (nucleiResult as any).jsonReport) {
        scan.jsonReport = (nucleiResult as any).jsonReport;
        this.logger.log(`[FINALIZE] Nuclei JSON report saved (${(nucleiResult as any).jsonReport.length} entries)`);
      }

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
