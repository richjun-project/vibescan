import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Scan } from '../../entities/scan.entity';
import { Vulnerability } from '../../entities/vulnerability.entity';
import { Subscription } from '../../entities/subscription.entity';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { ScanProcessor } from './scan.processor';
import { ScanGateway } from './scan.gateway';
import { ScanStatsController } from './scan-stats.controller';
import { ScanStatsService } from './scan-stats.service';
import { UserModule } from '../user/user.module';

// Scanner services
import { NucleiScannerService } from '../../services/scanners/nuclei-scanner.service';
import { ZapScannerService } from '../../services/scanners/zap-scanner.service';
import { TrivyScannerService } from '../../services/scanners/trivy-scanner.service';
import { GitleaksScannerService } from '../../services/scanners/gitleaks-scanner.service';
import { SecurityHeadersScannerService } from '../../services/scanners/security-headers-scanner.service';
import { SSLScannerService } from '../../services/scanners/ssl-scanner.service';
import { WebReconScannerService } from '../../services/scanners/web-recon-scanner.service';
import { PortScannerService } from '../../services/scanners/port-scanner.service';

// Core services
import { ScoreCalculatorService } from '../../services/score-calculator.service';
import { AIService } from '../../services/ai.service';
import { GeminiAIService } from '../../services/gemini-ai.service';
import { PDFService } from '../../services/pdf.service';
import { StuckJobCleanerService } from '../../services/stuck-job-cleaner.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Scan, Vulnerability, Subscription]),
    BullModule.registerQueue({
      name: 'scan',
      defaultJobOptions: {
        attempts: 2, // 최대 2회 재시도
        backoff: {
          type: 'exponential',
          delay: 5000, // 5초 후 첫 재시도, 이후 지수적으로 증가
        },
        removeOnComplete: {
          age: 24 * 3600, // 완료된 작업 24시간 후 삭제
          count: 1000, // 최대 1000개 보관
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // 실패한 작업 7일간 보관 (디버깅용)
        },
      },
    }),
    UserModule,
  ],
  providers: [
    ScanService,
    ScanProcessor,
    ScanGateway,
    ScanStatsService,
    // Scanner services
    NucleiScannerService,
    ZapScannerService,
    TrivyScannerService,
    GitleaksScannerService,
    SecurityHeadersScannerService,
    SSLScannerService,
    WebReconScannerService,
    PortScannerService,
    // Core services
    ScoreCalculatorService,
    AIService,
    GeminiAIService,
    PDFService,
    StuckJobCleanerService,
  ],
  controllers: [ScanController, ScanStatsController],
})
export class ScanModule {}
