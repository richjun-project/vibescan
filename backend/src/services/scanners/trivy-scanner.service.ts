import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';

@Injectable()
export class TrivyScannerService extends BaseScannerService {
  private readonly CONTAINER_NAME = 'vibescan-trivy';

  async scanImage(imageName: string): Promise<ScanResult> {
    try {
      // Check if container is running
      const isRunning = await this.isContainerRunning(this.CONTAINER_NAME);
      if (!isRunning) {
        throw new Error(`${this.CONTAINER_NAME} container is not running. Please start with: docker-compose up -d trivy`);
      }

      const { stdout } = await this.executeInContainer(
        this.CONTAINER_NAME,
        [
          'trivy',
          'image',
          '--format',
          'json',
          '--severity',
          'CRITICAL,HIGH,MEDIUM,LOW',
          imageName,
        ],
      );

      const findings = this.parseTrivyOutput(stdout);

      return {
        success: true,
        findings,
        rawOutput: stdout,
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  async scanRepository(repoPath: string): Promise<ScanResult> {
    // Repository scanning requires volume mounting which is not supported with docker exec
    // This feature is planned for future implementation with proper volume management
    return {
      success: false,
      findings: [],
      error: 'Repository scanning requires volume mounting. Use scanImage() or implement volume-based scanning.',
    };
  }

  async scan(target: string): Promise<ScanResult> {
    // Default to image scanning
    return this.scanImage(target);
  }

  private parseTrivyOutput(output: string): any[] {
    const findings = [];

    try {
      const data = JSON.parse(output);

      if (data.Results) {
        for (const result of data.Results) {
          if (result.Vulnerabilities) {
            for (const vuln of result.Vulnerabilities) {
              findings.push({
                title: `${vuln.VulnerabilityID}: ${vuln.Title || vuln.PkgName}`,
                description: vuln.Description || '',
                severity: vuln.Severity?.toLowerCase() || 'info',
                category: 'dependency',
                cveId: vuln.VulnerabilityID,
                packageName: vuln.PkgName,
                installedVersion: vuln.InstalledVersion,
                fixedVersion: vuln.FixedVersion,
                references: vuln.References,
                metadata: vuln,
              });
            }
          }
        }
      }
    } catch (e) {
      // Failed to parse JSON
    }

    return findings;
  }
}
