import { Injectable, Logger } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScanResult {
  success: boolean;
  findings: any[];
  rawOutput?: string;
  error?: string;
  markdownReport?: string;  // Detailed markdown report (for Nuclei)
  jsonReport?: any;  // Full JSON report in original format (for Nuclei)
}

export interface ProgressCallback {
  (percent: number, message?: string): void;
}

@Injectable()
export abstract class BaseScannerService {
  protected readonly logger = new Logger(BaseScannerService.name);

  /**
   * Execute command in docker container with real-time logging
   * @param containerName - Name of the container
   * @param command - Command to execute inside the container
   * @param timeout - Timeout in milliseconds
   * @param logPrefix - Prefix for log messages
   * @param progressCallback - Optional callback for progress updates (called every 5%)
   */
  protected async executeInContainerWithLogging(
    containerName: string,
    command: string[],
    timeout: number = 300000,
    logPrefix: string = 'DOCKER',
    progressCallback?: ProgressCallback
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const args = ['exec', containerName, ...command];
      this.logger.log(`[${logPrefix}] Executing: docker ${args.join(' ')}`);

      const process = spawn('docker', args);

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout;

      // Track duplicate lines to avoid log spam
      let lastStderrLine = '';
      let duplicateCount = 0;
      const DUPLICATE_THRESHOLD = 3; // Show first 3 duplicates, then summarize

      // Track progress for throttling (report every 2% for more frequent updates)
      let lastReportedPercent = -2;

      // Real-time stdout logging
      process.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        // Log each line
        text.split('\n').filter(line => line.trim()).forEach(line => {
          this.logger.debug(`[${logPrefix}][STDOUT] ${line}`);
        });
      });

      // Real-time stderr logging (Nuclei uses stderr for progress)
      process.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;

        // Process each line with duplicate detection
        text.split('\n').filter(line => line.trim()).forEach(line => {
          // Normalize line for comparison (remove ANSI codes, timestamps, etc.)
          const normalizedLine = line.replace(/\u001b\[[0-9;]*m/g, '').trim();

          // Try to parse progress from JSON (Nuclei/ZAP format)
          if (progressCallback && normalizedLine.includes('"percent"')) {
            try {
              const progressData = JSON.parse(normalizedLine);
              if (progressData.percent !== undefined) {
                const currentPercent = parseInt(progressData.percent);
                // Report every 2% for more granular updates, or at completion
                if (currentPercent >= lastReportedPercent + 2 || currentPercent >= 99) {
                  lastReportedPercent = currentPercent;
                  // Build detailed message with requests
                  const requests = progressData.requests || 0;
                  const total = progressData.total || 0;

                  const message = total > 0
                    ? `템플릿 ${requests}/${total} 실행 중`
                    : '스캔 진행 중';

                  progressCallback(currentPercent, message);
                  this.logger.log(`[${logPrefix}][PROGRESS_CALLBACK] ${currentPercent}% - ${message}`);
                }
              }
            } catch (e) {
              // Not valid JSON, ignore
            }
          }

          if (normalizedLine === lastStderrLine) {
            // Duplicate detected
            duplicateCount++;

            if (duplicateCount === DUPLICATE_THRESHOLD) {
              this.logger.log(`[${logPrefix}][PROGRESS] ... (repeated message, suppressing further duplicates)`);
            }
            // Don't log after threshold
          } else {
            // Different line - print previous duplicate count if any
            if (duplicateCount >= DUPLICATE_THRESHOLD) {
              this.logger.log(`[${logPrefix}][PROGRESS] ↑ Previous message repeated ${duplicateCount} times total`);
            }

            // Log the new line
            this.logger.log(`[${logPrefix}][PROGRESS] ${line}`);

            // Reset tracking
            lastStderrLine = normalizedLine;
            duplicateCount = 0;
          }
        });
      });

      process.on('error', (error) => {
        clearTimeout(timeoutId);
        this.logger.error(`[${logPrefix}] Process error: ${error.message}`);
        reject(new Error(`Docker exec failed: ${error.message}`));
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);

        // Print final duplicate count if any
        if (duplicateCount >= DUPLICATE_THRESHOLD) {
          this.logger.log(`[${logPrefix}][PROGRESS] ↑ Previous message repeated ${duplicateCount} times total`);
        }

        if (code === 0) {
          this.logger.log(`[${logPrefix}] Process completed successfully`);
          resolve({ stdout, stderr });
        } else {
          // For Nuclei, non-zero exit with stdout is still success
          if (stdout.length > 0) {
            this.logger.warn(`[${logPrefix}] Process exited with code ${code} but has output`);
            resolve({ stdout, stderr });
          } else {
            this.logger.error(`[${logPrefix}] Process failed with code ${code}`);
            reject(new Error(`Docker exec failed with code ${code}: ${stderr}`));
          }
        }
      });

      // Set timeout
      timeoutId = setTimeout(() => {
        this.logger.warn(`[${logPrefix}] Timeout after ${timeout}ms, killing process`);
        process.kill('SIGTERM');
        setTimeout(() => process.kill('SIGKILL'), 5000); // Force kill after 5s
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Execute command in docker-compose managed container using docker exec (legacy)
   * @deprecated Use executeInContainerWithLogging for better real-time monitoring
   */
  protected async executeInContainer(
    containerName: string,
    command: string[],
    timeout: number = 900000, // 5 minutes default
  ): Promise<{ stdout: string; stderr: string }> {
    const fullCommand = `docker exec ${containerName} ${command.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      return { stdout, stderr };
    } catch (error: any) {
      // Nuclei and other security tools output INFO/WARN to stderr, causing exec to throw
      // If the error has stdout property (even if empty), it means the command executed
      if ('stdout' in error) {
        console.log('Nuclei executed successfully (stderr has logs, stdout has results)');
        return { stdout: error.stdout || '', stderr: error.stderr || '' };
      }
      throw new Error(`Docker exec failed: ${error.message}`);
    }
  }

  /**
   * Check if container is running
   * @param containerName - Name of the container
   */
  protected async isContainerRunning(containerName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`docker ps --filter name=${containerName} --format "{{.Names}}"`);
      return stdout.trim() === containerName;
    } catch (error) {
      return false;
    }
  }

  abstract scan(target: string, options?: any, progressCallback?: ProgressCallback): Promise<ScanResult>;
}
