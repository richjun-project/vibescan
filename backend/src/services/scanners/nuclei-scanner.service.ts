import { Injectable, Logger } from '@nestjs/common';
import { BaseScannerService, ScanResult, ProgressCallback } from './base-scanner.service';

@Injectable()
export class NucleiScannerService extends BaseScannerService {
  private readonly CONTAINER_NAME = 'vibescan-nuclei';

  async scan(domain: string, options?: any, progressCallback?: ProgressCallback): Promise<ScanResult> {
    this.logger.log(`[NUCLEI_SCAN] Starting scan for: ${domain}`);

    try {
      // Check if container is running
      this.logger.debug(`[NUCLEI_SCAN] Checking if container is running...`);
      const isRunning = await this.isContainerRunning(this.CONTAINER_NAME);
      if (!isRunning) {
        this.logger.warn(`[NUCLEI_SCAN] Container ${this.CONTAINER_NAME} is NOT running`);
        throw new Error(`${this.CONTAINER_NAME} container is not running. Please start with: docker-compose up -d nuclei`);
      }
      this.logger.log(`[NUCLEI_SCAN] Container is running ✓`);

      // Ensure domain has protocol
      const targetUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      this.logger.log(`[NUCLEI_SCAN] Target URL: ${targetUrl}`);

      const startTime = Date.now();
      this.logger.log(`[NUCLEI_SCAN] Starting scan with 15min timeout...`);

      const jsonReportFile = `/tmp/nuclei-scan-${Date.now()}.json`;

      const { stdout, stderr } = await this.executeInContainerWithLogging(
        this.CONTAINER_NAME,
        [
          'nuclei',
          '-u',
          targetUrl,
          '-jsonl',             // JSON lines output to stdout (real-time findings)
          '-severity',
          'critical,high,medium,low,info',  // Include all severity levels including info
          '-timeout',
          '30',                 // Per-template timeout
          '-retries',
          '1',
          '-stats',             // Show statistics (to stderr)
          '-verbose',           // Verbose output for real-time progress (to stderr)
          '-jsonl-export',      // Export findings in JSONL format to file (better for parsing)
          jsonReportFile,       // JSONL report file path
          // Note: NOT using -omit-raw to include full request/response pairs in output
          // Note: Removed -tags filter to allow all templates (not just owasp,cve,exposure)
        ],
        900000, // 15 minutes timeout for nuclei scan (4000+ templates need time)
        'NUCLEI',  // Log prefix
        progressCallback  // Pass progress callback
      );

      const duration = Date.now() - startTime;
      this.logger.log(`[NUCLEI_SCAN] ===== SCAN COMPLETED =====`);
      this.logger.log(`[NUCLEI_SCAN] Duration: ${Math.round(duration / 1000)}s (${duration}ms)`);

      // Analyze stderr for final statistics and errors
      this.logger.log(`[NUCLEI_SCAN] ----- STDERR Analysis (${stderr.length} bytes) -----`);
      const stderrLines = stderr.split('\n').filter(l => l.trim());
      this.logger.log(`[NUCLEI_SCAN] Total stderr lines: ${stderrLines.length}`);


      // Find final statistics (reverse without mutating)
      const reversedLines = [...stderrLines].reverse();
      const lastStats = reversedLines.find(l => l.includes('"percent"'));
      if (lastStats) {
        try {
          const stats = JSON.parse(lastStats);
          this.logger.log(`[NUCLEI_SCAN] Final Statistics:`);
          this.logger.log(`[NUCLEI_SCAN]   - Progress: ${stats.percent}%`);
          this.logger.log(`[NUCLEI_SCAN]   - Templates: ${stats.templates}`);
          this.logger.log(`[NUCLEI_SCAN]   - Requests: ${stats.requests}/${stats.total}`);
          this.logger.log(`[NUCLEI_SCAN]   - Matched: ${stats.matched}`);
          this.logger.log(`[NUCLEI_SCAN]   - Errors: ${stats.errors}`);
          this.logger.log(`[NUCLEI_SCAN]   - RPS: ${stats.rps}`);
          this.logger.log(`[NUCLEI_SCAN]   - Duration: ${stats.duration}`);
        } catch (e) {
          this.logger.warn(`[NUCLEI_SCAN] Could not parse final statistics`);
        }
      }

      // Show ALL stderr lines without truncation
      this.logger.log(`[NUCLEI_SCAN] ----- STDERR Full Output (ALL ${stderrLines.length} lines) -----`);
      stderrLines.forEach((line, i) => {
        this.logger.debug(`[NUCLEI_SCAN]   ${i + 1}: ${line}`);
      });

      // Check for various error patterns
      const errorPatterns = [
        { name: 'ERR', pattern: /\[ERR\]/ },
        { name: 'FTL', pattern: /\[FTL\]/ },
        { name: 'WRN', pattern: /\[WRN\]/ },
        { name: 'ERROR', pattern: /error/i },
        { name: 'FAILED', pattern: /failed/i },
        { name: 'TIMEOUT', pattern: /timeout/i },
        { name: 'Could not', pattern: /could not/i },
      ];

      this.logger.log(`[NUCLEI_SCAN] ----- Error Pattern Analysis (FULL OUTPUT) -----`);
      errorPatterns.forEach(({ name, pattern }) => {
        const matches = stderrLines.filter(l => pattern.test(l));
        if (matches.length > 0) {
          this.logger.warn(`[NUCLEI_SCAN] ${name} pattern: ${matches.length} matches`);
          // Show ALL matches without truncation
          matches.forEach((line, index) => {
            this.logger.warn(`[NUCLEI_SCAN]   [${index + 1}/${matches.length}] ${line}`);
          });
        }
      });

      // Analyze stdout (actual findings)
      this.logger.log(`[NUCLEI_SCAN] ----- STDOUT Analysis (${stdout.length} bytes) -----`);
      if (stdout.trim().length === 0) {
        this.logger.warn(`[NUCLEI_SCAN] ⚠ Empty STDOUT - No vulnerabilities matched`);
      } else {
        this.logger.log(`[NUCLEI_SCAN] STDOUT Content (actual findings):`);
        // Show ALL lines without any truncation
        const lines = stdout.split('\n').filter(l => l.trim());
        this.logger.log(`[NUCLEI_SCAN] Total stdout lines: ${lines.length}`);
        lines.forEach((line, i) => {
          this.logger.log(`[NUCLEI_SCAN]   Line ${i + 1}: ${line}`);
        });
      }

      this.logger.log(`[NUCLEI_SCAN] ===== END OF SCAN RESULTS =====`);

      // Try to read Nuclei's JSONL report (one JSON object per line)
      this.logger.log(`[NUCLEI_SCAN] ----- NUCLEI JSONL REPORT (OFFICIAL FORMAT) -----`);
      let jsonReportData: any[] = [];
      try {
        const { stdout: jsonContent } = await this.executeInContainer(
          this.CONTAINER_NAME,
          ['cat', jsonReportFile],
          10000
        );

        if (jsonContent && jsonContent.trim().length > 0) {
          this.logger.log(`[NUCLEI_SCAN] JSONL Report size: ${jsonContent.length} bytes`);
          this.logger.log(`[NUCLEI_SCAN] Full JSONL Report:\n${jsonContent}`);

          // Parse JSONL format (each line is a separate JSON object)
          const jsonLines = jsonContent.split('\n').filter(line => line.trim());
          this.logger.log(`[NUCLEI_SCAN] Total JSONL lines: ${jsonLines.length}`);

          jsonLines.forEach((line, index) => {
            try {
              const entry = JSON.parse(line);
              jsonReportData.push(entry);

              this.logger.log(`[NUCLEI_SCAN] Entry ${index + 1}:`);
              this.logger.log(`[NUCLEI_SCAN]   Template: ${entry['template-id'] || entry.templateID || 'unknown'}`);
              this.logger.log(`[NUCLEI_SCAN]   Severity: ${entry.info?.severity || 'unknown'}`);
              this.logger.log(`[NUCLEI_SCAN]   Host: ${entry.host || 'unknown'}`);
              this.logger.log(`[NUCLEI_SCAN]   Full entry: ${JSON.stringify(entry, null, 2)}`);
            } catch (e) {
              this.logger.warn(`[NUCLEI_SCAN] Could not parse JSONL line ${index + 1}: ${line.substring(0, 100)}`);
            }
          });

          this.logger.log(`[NUCLEI_SCAN] Total findings in JSONL report: ${jsonReportData.length}`);
        } else {
          this.logger.log(`[NUCLEI_SCAN] Empty JSONL report (no vulnerabilities matched)`);
        }
      } catch (error) {
        this.logger.debug(`[NUCLEI_SCAN] Could not read JSONL report: ${error.message}`);
      }

      // Clean up report file
      try {
        await this.executeInContainer(this.CONTAINER_NAME, ['rm', '-f', jsonReportFile], 5000);
      } catch (e) {
        // ignore cleanup errors
      }

      const findings = this.parseNucleiOutput(stdout);
      this.logger.log(`[NUCLEI_SCAN] Parsed ${findings.length} findings`);

      if (findings.length > 0) {
        const severities = findings.reduce((acc, f) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {});
        this.logger.log(`[NUCLEI_SCAN] Findings by severity: ${JSON.stringify(severities)}`);
      }

      // Extract metadata from stderr
      const metadata = this.parseNucleiMetadata(stderr);
      if (metadata) {
        this.logger.log(`[NUCLEI_SCAN] Metadata extracted: ${JSON.stringify(metadata)}`);
      }

      // Extract important parts of stdout/stderr (avoid storing huge logs)
      const trimmedOutput = this.trimOutputForStorage(stdout, stderr);

      // Build comprehensive JSON report with trimmed data
      const fullJsonReport = metadata || jsonReportData.length > 0 || stdout || stderr ? {
        metadata,
        findings: jsonReportData,
        scanCompleted: metadata?.percent === 100 || metadata?.percent === '100',
        rawOutput: trimmedOutput,
      } : undefined;

      this.logger.log(`[NUCLEI_SCAN] JSON Report includes:`);
      this.logger.log(`[NUCLEI_SCAN]   - Metadata: ${metadata ? 'Yes' : 'No'}`);
      this.logger.log(`[NUCLEI_SCAN]   - Findings: ${jsonReportData.length}`);
      this.logger.log(`[NUCLEI_SCAN]   - Raw stdout: ${stdout.length} bytes → ${trimmedOutput.stdout.length} bytes (trimmed)`);
      this.logger.log(`[NUCLEI_SCAN]   - Raw stderr: ${stderr.length} bytes → ${trimmedOutput.stderr.length} bytes (trimmed)`);

      return {
        success: true,
        findings,
        rawOutput: stdout,
        jsonReport: fullJsonReport,
      };
    } catch (error) {
      this.logger.error(`[NUCLEI_SCAN] ✗ Error: ${error.message}`);
      this.logger.debug(`[NUCLEI_SCAN] Stack: ${error.stack}`);
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }


  private parseNucleiOutput(output: string): any[] {
    const rawFindings = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        rawFindings.push({
          title: json['template-id'] || json.info?.name || 'Unknown',
          description: json.info?.description || '',
          severity: json.info?.severity || 'info',
          category: 'owasp_top10',
          matcher_name: json['matcher-name'],
          host: json.host,
          matched_at: json['matched-at'],
          extracted_results: json['extracted-results'],
          metadata: json,
        });
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    // Consolidate rdap-whois findings (same template-id, different extractors)
    return this.consolidateRdapWhoisFindings(rawFindings);
  }

  /**
   * Consolidate multiple rdap-whois findings into one comprehensive finding
   * rdap-whois template has multiple extractors (name, email, phone, etc.)
   * which generates 6+ duplicate findings - consolidate into one
   */
  private consolidateRdapWhoisFindings(findings: any[]): any[] {
    const rdapFindings: any[] = [];
    const otherFindings: any[] = [];
    const rdapTemplate = 'rdap-whois';

    // Separate rdap-whois findings from others
    for (const finding of findings) {
      if (finding.title.includes(rdapTemplate)) {
        rdapFindings.push(finding);
      } else {
        otherFindings.push(finding);
      }
    }

    // If no rdap-whois findings, return as is
    if (rdapFindings.length === 0) {
      return findings;
    }

    // If only one rdap-whois finding, no need to consolidate
    if (rdapFindings.length === 1) {
      return findings;
    }

    // Consolidate multiple rdap-whois findings into one
    const consolidatedRdap = rdapFindings[0]; // Use first as base
    const allExtractedResults: string[] = [];
    const allMatcherNames: string[] = [];

    for (const rdap of rdapFindings) {
      // Collect all extracted results
      if (rdap.extracted_results && Array.isArray(rdap.extracted_results)) {
        allExtractedResults.push(...rdap.extracted_results);
      }

      // Collect all matcher names
      if (rdap.matcher_name) {
        allMatcherNames.push(rdap.matcher_name);
      }
    }

    // Update consolidated finding with merged data
    consolidatedRdap.extracted_results = [...new Set(allExtractedResults)]; // Deduplicate
    consolidatedRdap.matcher_name = allMatcherNames.join(', ');
    consolidatedRdap.description = `RDAP/WHOIS information discovery (${rdapFindings.length} extractors: ${allMatcherNames.join(', ')})`;
    consolidatedRdap.metadata.consolidatedCount = rdapFindings.length;
    consolidatedRdap.metadata.extractors = allMatcherNames;

    this.logger.log(`[NUCLEI_PARSE] Consolidated ${rdapFindings.length} rdap-whois findings into 1 comprehensive finding`);

    return [...otherFindings, consolidatedRdap];
  }

  /**
   * Parse metadata from Nuclei stderr output
   * Extracts final statistics like duration, templates, requests, etc.
   */
  private parseNucleiMetadata(stderr: string): any {
    try {
      const stderrLines = stderr.split('\n').filter(l => l.trim());

      // Find the last line containing statistics (reverse search)
      const reversedLines = [...stderrLines].reverse();
      const lastStatsLine = reversedLines.find(l => l.includes('"percent"') && l.includes('"duration"'));

      if (lastStatsLine) {
        const stats = JSON.parse(lastStatsLine);
        return {
          duration: stats.duration || '0:00:00',
          templates: stats.templates || 0,
          requests: stats.requests || 0,
          total: stats.total || 0,
          percent: stats.percent || 0,
          matched: stats.matched || 0,
          errors: stats.errors || 0,
          rps: stats.rps || 0,
          startedAt: stats.startedAt || null,
        };
      }
    } catch (e) {
      this.logger.warn(`[NUCLEI_SCAN] Could not parse metadata from stderr: ${e.message}`);
    }

    return null;
  }

  /**
   * Trim stdout/stderr for storage to avoid huge JSON reports
   * Keeps important information while reducing size
   */
  private trimOutputForStorage(stdout: string, stderr: string): any {
    const MAX_LINES = 100;  // Maximum lines to store for each section

    // stdout: Keep all (usually small, contains actual findings)
    const stdoutLines = stdout.split('\n');

    // stderr: Keep first N + last N + error lines
    const stderrLines = stderr.split('\n').filter(l => l.trim());

    let trimmedStderr: string[] = [];

    if (stderrLines.length <= MAX_LINES * 2) {
      // If total lines <= limit, keep all
      trimmedStderr = stderrLines;
    } else {
      // Keep first N lines
      const firstLines = stderrLines.slice(0, MAX_LINES);

      // Keep last N lines
      const lastLines = stderrLines.slice(-MAX_LINES);

      // Extract error/warning lines from middle section
      const middleSection = stderrLines.slice(MAX_LINES, -MAX_LINES);
      const errorLines = middleSection.filter(line =>
        /\[(ERR|FTL|WRN)\]|error|failed|timeout/i.test(line)
      );

      // Combine: first N + errors + last N
      trimmedStderr = [
        ...firstLines,
        `... [Trimmed ${middleSection.length - errorLines.length} progress lines] ...`,
        ...errorLines,
        ...lastLines,
      ];
    }

    return {
      stdout: stdoutLines.join('\n'),
      stderr: trimmedStderr.join('\n'),
      stdoutLines: stdoutLines.length,
      stderrLines: stderrLines.length,
      stderrTrimmed: stderrLines.length > MAX_LINES * 2,
      stderrOriginalLines: stderrLines.length,
    };
  }
}
