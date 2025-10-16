import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult, ProgressCallback } from './base-scanner.service';

interface ZapScanOptions {
  maxDuration?: number; // Maximum scan duration in milliseconds
}

interface ZapAlert {
  alert: string;
  risk: string; // High, Medium, Low, Informational
  confidence: string;
  description: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
  url: string;
  method?: string;
  param?: string;
  attack?: string;
  evidence?: string;
  other?: string;
}

@Injectable()
export class ZapScannerService extends BaseScannerService {
  private readonly CONTAINER_NAME = 'vibescan-zap';

  constructor() {
    super();
  }

  async scan(domain: string, options: ZapScanOptions = {}, progressCallback?: ProgressCallback): Promise<ScanResult> {
    const {
      maxDuration = 300000, // 5 minutes default
    } = options;

    this.logger.log(`[ZAP_SCAN] Starting ZAP Baseline scan (passive only) for: ${domain}`);

    try {
      // Check if container is running
      const isRunning = await this.isContainerRunning(this.CONTAINER_NAME);
      if (!isRunning) {
        throw new Error(`${this.CONTAINER_NAME} container is not running`);
      }

      // Ensure domain has protocol
      const targetUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      this.logger.log(`[ZAP_SCAN] Target URL: ${targetUrl}`);

      const startTime = Date.now();

      // Run ZAP baseline scan (passive only)
      // Official docs: https://www.zaproxy.org/docs/docker/baseline-scan/
      const scanArgs = [
        'zap-baseline.py',
        '-t', targetUrl,           // Target URL (required)
        '-I',                      // Don't return failure on warning
        '-m', '2',                 // Spider for 2 minutes
      ];

      this.logger.log(`[ZAP_SCAN] Running: ${scanArgs.join(' ')}`);

      const { stdout, stderr } = await this.executeInContainerWithLogging(
        this.CONTAINER_NAME,
        scanArgs,
        maxDuration,
        'ZAP'
      );

      const duration = Date.now() - startTime;
      this.logger.log(`[ZAP_SCAN] Scan completed in ${Math.round(duration / 1000)}s`);

      // Parse alerts from stdout
      const alerts = this.parseAlertsFromOutput(stdout);
      this.logger.log(`[ZAP_SCAN] Parsed ${alerts.length} alerts from output`);

      // Convert ZAP alerts to findings format
      const findings = alerts.map(alert => this.convertAlertToFinding(alert));

      // Count by severity
      const severityCounts = findings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      this.logger.log(`[ZAP_SCAN] Findings by severity: ${JSON.stringify(severityCounts)}`);

      return {
        success: true,
        findings,
        jsonReport: {
          target: targetUrl,
          scanDuration: duration,
          scanType: 'baseline', // Always baseline (passive only)
          totalAlerts: alerts.length,
          severityCounts,
          rawAlerts: alerts,
        },
      };
    } catch (error) {
      this.logger.error(`[ZAP_SCAN] Error: ${error.message}`);
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  /**
   * Parse alerts from ZAP stdout
   * Format: WARN-NEW: Alert Name [ID] x count
   */
  private parseAlertsFromOutput(output: string): ZapAlert[] {
    const alerts: ZapAlert[] = [];
    const lines = output.split('\n');

    let currentAlert: Partial<ZapAlert> | null = null;
    const urls: string[] = [];

    for (const line of lines) {
      // Match alert line: WARN-NEW: Alert Name [ID] x count
      // or FAIL-NEW: Alert Name [ID] x count
      const alertMatch = line.match(/(WARN|FAIL)-NEW:\s+(.+?)\s+\[(\d+)\](?:\s+x\s+(\d+))?/);

      if (alertMatch) {
        // Save previous alert if exists
        if (currentAlert && currentAlert.alert) {
          alerts.push({
            ...currentAlert,
            url: urls[0] || '',
          } as ZapAlert);
          urls.length = 0;
        }

        const [, level, alertName, id, count] = alertMatch;
        currentAlert = {
          alert: alertName,
          risk: level === 'FAIL' ? 'High' : 'Medium',
          confidence: 'Medium',
          description: alertName,
          solution: '',
          reference: `https://www.zaproxy.org/docs/alerts/${id}/`,
          cweid: id,
          wascid: '',
        };
      } else if (line.trim().startsWith('https://') || line.trim().startsWith('http://')) {
        // URL line (indented under alert)
        const urlMatch = line.trim().match(/^(https?:\/\/[^\s]+)/);
        if (urlMatch && currentAlert) {
          urls.push(urlMatch[1]);
        }
      }
    }

    // Save last alert
    if (currentAlert && currentAlert.alert) {
      alerts.push({
        ...currentAlert,
        url: urls[0] || '',
      } as ZapAlert);
    }

    return alerts;
  }

  /**
   * Convert ZAP alert to finding format
   */
  private convertAlertToFinding(alert: ZapAlert): any {
    return {
      title: alert.alert,
      description: alert.description,
      severity: this.mapZapRiskToSeverity(alert.risk),
      category: 'owasp_top10', // ZAP focuses on OWASP Top 10
      cweId: alert.cweid,
      metadata: {
        confidence: alert.confidence,
        solution: alert.solution,
        reference: alert.reference,
        url: alert.url,
        method: alert.method,
        param: alert.param,
        attack: alert.attack,
        evidence: alert.evidence,
        other: alert.other,
        wascid: alert.wascid,
        source: 'owasp-zap',
      },
    };
  }

  /**
   * Map ZAP risk level to our severity levels
   */
  private mapZapRiskToSeverity(risk: string): string {
    const riskLower = risk.toLowerCase();
    switch (riskLower) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      case 'informational':
        return 'info';
      default:
        return 'info';
    }
  }

}
