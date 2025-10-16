import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';

@Injectable()
export class GitleaksScannerService extends BaseScannerService {
  private readonly CONTAINER_NAME = 'vibescan-gitleaks';

  async scanRepository(repoPath: string): Promise<ScanResult> {
    // Repository scanning requires volume mounting which is not supported with docker exec
    // This feature is planned for future implementation with proper volume management
    return {
      success: false,
      findings: [],
      error: 'Repository scanning requires volume mounting. Planned for future implementation.',
    };
  }

  async scanGitUrl(gitUrl: string): Promise<ScanResult> {
    try {
      // Check if container is running
      const isRunning = await this.isContainerRunning(this.CONTAINER_NAME);
      if (!isRunning) {
        throw new Error(`${this.CONTAINER_NAME} container is not running. Please start with: docker-compose up -d gitleaks`);
      }

      // Gitleaks can scan remote Git repositories directly
      const { stdout } = await this.executeInContainer(
        this.CONTAINER_NAME,
        [
          'gitleaks',
          'detect',
          '--source',
          gitUrl,
          '--report-format',
          'json',
          '--report-path',
          '/dev/stdout',
          '--no-banner',
        ],
      );

      const findings = this.parseGitleaksOutput(stdout);

      return {
        success: true,
        findings,
        rawOutput: stdout,
      };
    } catch (error) {
      // Gitleaks returns non-zero exit code when secrets are found
      if (error.stdout) {
        const findings = this.parseGitleaksOutput(error.stdout);
        return {
          success: true,
          findings,
          rawOutput: error.stdout,
        };
      }

      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  async scan(target: string): Promise<ScanResult> {
    // If target looks like a Git URL, scan it
    if (target.includes('git') || target.includes('.git') || target.startsWith('http')) {
      return this.scanGitUrl(target);
    }

    // Otherwise, try repository scan (will return error)
    return this.scanRepository(target);
  }

  private parseGitleaksOutput(output: string): any[] {
    const findings = [];

    try {
      const data = JSON.parse(output);

      if (Array.isArray(data)) {
        for (const leak of data) {
          findings.push({
            title: `Secret Detected: ${leak.RuleID || 'Unknown'}`,
            description: leak.Description || `Potential secret found in ${leak.File}`,
            severity: 'high',
            category: 'secret',
            file: leak.File,
            line: leak.StartLine,
            commit: leak.Commit,
            author: leak.Author,
            email: leak.Email,
            date: leak.Date,
            match: leak.Match,
            secret: leak.Secret ? '***REDACTED***' : undefined,
            metadata: leak,
          });
        }
      }
    } catch (e) {
      // Failed to parse JSON
    }

    return findings;
  }
}
