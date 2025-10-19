import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Scan, ScanStatus } from '../../entities/scan.entity';
import { Vulnerability } from '../../entities/vulnerability.entity';
import { User } from '../../entities/user.entity';
import { Subscription, SubscriptionPlan } from '../../entities/subscription.entity';
import { UserService } from '../user/user.service';
import { GeminiAIService } from '../../services/gemini-ai.service';
import { AIService } from '../../services/ai.service';
import * as crypto from 'crypto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: EntityRepository<Scan>,
    @InjectRepository(Vulnerability)
    private readonly vulnerabilityRepository: EntityRepository<Vulnerability>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    @InjectQueue('scan')
    private readonly scanQueue: Queue,
    private readonly userService: UserService,
    private readonly geminiAIService: GeminiAIService,
    private readonly aiService: AIService,
    private readonly em: EntityManager,
  ) {}

  async createScan(user: User, domain: string, repositoryUrl?: string, language: 'ko' | 'en' = 'ko') {
    this.logger.log(`[CREATE_SCAN] Starting scan creation for user ${user.id}, domain: ${domain}, language: ${language}`);

    // Check if user already has a running scan
    const existingScan = await this.scanRepository.findOne({
      user: user.id,
      status: ScanStatus.RUNNING,
    });

    if (existingScan) {
      this.logger.warn(`[CREATE_SCAN] User ${user.id} already has a running scan (ID: ${existingScan.id})`);
      throw new ForbiddenException('이미 진행 중인 스캔이 있습니다. 현재 스캔이 완료된 후 다시 시도해주세요.');
    }

    // Block scanning of own domain
    const normalizedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const blockedDomains = [
      'ourvibescan.netlify.app',
      'vibescan.kr',
      'www.vibescan.kr',
      'localhost',
    ];

    if (blockedDomains.some(blocked => normalizedDomain.includes(blocked))) {
      this.logger.warn(`[CREATE_SCAN] Blocked scan attempt for restricted domain: ${domain}`);
      throw new ForbiddenException('이 도메인은 스캔할 수 없습니다.');
    }

    // Get or create subscription
    let subscription = await this.subscriptionRepository.findOne(
      { user: user.id },
      { populate: ['user'] }
    );

    if (!subscription) {
      // Create Free subscription for new users
      subscription = this.em.create(Subscription, {
        user,
        plan: SubscriptionPlan.FREE,
        monthlyScansLimit: 1,
        usedScans: 0,
      });
      await this.em.persistAndFlush(subscription);
      this.logger.log(`[CREATE_SCAN] Created Free subscription for user ${user.id}`);
    }

    // Check if user can scan
    if (!subscription.canScan()) {
      if (subscription.plan === SubscriptionPlan.FREE) {
        this.logger.warn(`[CREATE_SCAN] User ${user.id} has no free scans remaining`);
        throw new ForbiddenException('무료 스캔을 모두 사용했습니다. Pro 플랜으로 업그레이드하세요.');
      } else {
        this.logger.warn(`[CREATE_SCAN] User ${user.id} has no scans remaining (${subscription.usedScans}/${subscription.monthlyScansLimit})`);
        throw new ForbiddenException(`이번 달 스캔을 모두 사용했습니다. (${subscription.usedScans}/${subscription.monthlyScansLimit}회)`);
      }
    }

    // Determine if this is a paid scan (based on plan)
    const isPaid = subscription.plan !== SubscriptionPlan.FREE;

    // Create scan
    const scan = this.scanRepository.create({
      domain,
      repositoryUrl,
      user,
      status: ScanStatus.PENDING,
      shareToken: crypto.randomBytes(16).toString('hex'),
      isPaid,
      language,
    });

    await this.em.persistAndFlush(scan);
    this.logger.log(`[CREATE_SCAN] Scan ${scan.id} created in database with status PENDING, isPaid: ${isPaid}`);

    // Add to queue
    const job = await this.scanQueue.add('run-scan', {
      scanId: scan.id,
      domain,
      repositoryUrl,
      language,
    });

    this.logger.log(`[QUEUE_ADD] Job ${job.id} added to queue for scan ${scan.id}`);
    this.logger.debug(`[QUEUE_ADD] Job data: ${JSON.stringify(job.data)}`);

    // Check queue status
    const queueCounts = await this.scanQueue.getJobCounts();
    this.logger.log(`[QUEUE_STATUS] Current queue counts: ${JSON.stringify(queueCounts)}`);

    // Increment scan usage
    subscription.usedScans++;
    await this.em.flush();
    this.logger.log(`[CREATE_SCAN] User ${user.id} scan count updated (${subscription.usedScans}/${subscription.monthlyScansLimit})`);

    return scan;
  }

  async getScans(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [scans, total] = await this.scanRepository.findAndCount(
      { user: userId },
      {
        orderBy: { createdAt: 'DESC' },
        limit,
        offset,
      },
    );

    return {
      scans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getScanById(scanId: number, userId: number): Promise<any> {
    const scan = await this.scanRepository.findOneOrFail(
      { id: scanId, user: userId },
      { populate: ['vulnerabilities'] },
    );

    // 모든 스캔 (무료 포함)에 대해 전체 리포트 제공
    return scan;
  }

  async getPublicScan(shareToken: string) {
    return this.scanRepository.findOneOrFail(
      { shareToken, isPublic: true },
      { populate: ['vulnerabilities'] },
    );
  }

  async togglePublic(scanId: number, userId: number) {
    const scan = await this.scanRepository.findOneOrFail({ id: scanId, user: userId });
    scan.isPublic = !scan.isPublic;
    await this.em.flush();
    return scan;
  }

  async getJsonReport(scanId: number, userId: number) {
    const scan = await this.scanRepository.findOneOrFail({ id: scanId, user: userId });
    return scan.jsonReport;
  }

  /**
   * AI 기반 취약점 분석
   */
  async analyzeWithAI(scanId: number, userId: number) {
    this.logger.log(`[AI_ANALYSIS] Starting AI analysis for scan ${scanId}`);

    const scan = await this.scanRepository.findOneOrFail(
      { id: scanId, user: userId },
      { populate: ['vulnerabilities'] },
    );

    if (scan.status !== ScanStatus.COMPLETED) {
      throw new ForbiddenException('Scan is not completed yet');
    }

    // Get vulnerabilities
    const vulnerabilities = scan.vulnerabilities.getItems().map((v) => ({
      name: v.title,
      severity: v.severity,
      description: v.description,
      affected: v.metadata?.affected || v.metadata?.url || v.metadata?.component || 'N/A',
    }));

    this.logger.log(`[AI_ANALYSIS] Analyzing ${vulnerabilities.length} vulnerabilities`);

    // Analyze with Gemini AI
    const analysis = await this.geminiAIService.analyzeVulnerabilities({
      vulnerabilities,
      scanType: 'Full Security Scan',
      targetUrl: scan.domain,
    });

    // Generate security score
    const securityScore = await this.geminiAIService.generateSecurityScore(vulnerabilities);

    this.logger.log(`[AI_ANALYSIS] AI analysis completed for scan ${scanId}`);

    return {
      scan: {
        id: scan.id,
        domain: scan.domain,
        status: scan.status,
        createdAt: scan.createdAt,
      },
      securityScore,
      analysis,
    };
  }

  /**
   * 특정 취약점에 대한 수정 가이드 생성
   */
  async generateFixGuide(scanId: number, userId: number, vulnerabilityName: string) {
    this.logger.log(`[FIX_GUIDE] Generating fix guide for vulnerability: ${vulnerabilityName}`);

    const scan = await this.scanRepository.findOneOrFail(
      { id: scanId, user: userId },
      { populate: ['vulnerabilities'] },
    );

    // Find the vulnerability
    const vulnerability = scan.vulnerabilities
      .getItems()
      .find((v) => v.title.toLowerCase().includes(vulnerabilityName.toLowerCase()));

    if (!vulnerability) {
      throw new ForbiddenException('Vulnerability not found');
    }

    // Generate fix guide
    const fixGuide = await this.geminiAIService.generateFixGuide({
      name: vulnerability.title,
      description: vulnerability.description,
      severity: vulnerability.severity,
      affected: vulnerability.metadata?.affected || vulnerability.metadata?.url || vulnerability.metadata?.component || 'N/A',
    });

    this.logger.log(`[FIX_GUIDE] Fix guide generated for ${vulnerabilityName}`);

    return {
      vulnerability: {
        title: vulnerability.title,
        severity: vulnerability.severity,
        description: vulnerability.description,
      },
      fixGuide,
    };
  }

  /**
   * Upgrade free scan to paid and enrich with AI analysis
   */
  async upgradeToPaid(scanId: number, userId: number) {
    this.logger.log(`[UPGRADE_SCAN] Upgrading scan ${scanId} to paid for user ${userId}`);

    const scan = await this.scanRepository.findOneOrFail(
      { id: scanId, user: userId },
      { populate: ['vulnerabilities'] },
    );

    // Check if scan is already paid
    if (scan.isPaid) {
      this.logger.warn(`[UPGRADE_SCAN] Scan ${scanId} is already paid`);
      throw new ForbiddenException('This scan is already a paid scan');
    }

    // Check if scan is completed
    if (scan.status !== ScanStatus.COMPLETED) {
      this.logger.warn(`[UPGRADE_SCAN] Scan ${scanId} is not completed yet`);
      throw new ForbiddenException('Can only upgrade completed scans');
    }

    // Update scan to paid
    scan.isPaid = true;
    await this.em.flush();
    this.logger.log(`[UPGRADE_SCAN] Scan ${scanId} marked as paid`);

    // Start AI enrichment in background
    this.enrichScanWithAI(scanId).catch((error) => {
      this.logger.error(`[UPGRADE_SCAN] AI enrichment failed for scan ${scanId}:`, error);
    });

    return {
      success: true,
      message: 'Scan upgraded to paid. AI analysis is being generated in the background.',
      scanId,
    };
  }

  /**
   * Enrich existing scan with AI analysis (background task)
   */
  private async enrichScanWithAI(scanId: number) {
    this.logger.log(`[AI_ENRICH] Starting AI enrichment for scan ${scanId}`);

    const scan = await this.scanRepository.findOneOrFail(
      { id: scanId },
      { populate: ['vulnerabilities'] },
    );

    const vulnerabilities = scan.vulnerabilities.getItems();
    let enrichedCount = 0;

    // Generate AI explanations for high/critical vulnerabilities
    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'high' || vuln.severity === 'critical') {
        try {
          this.logger.log(`[AI_ENRICH] Generating AI explanation for ${vuln.title}`);

          const aiExplanation = await this.aiService.explainVulnerability({
            title: vuln.title,
            description: vuln.description,
            severity: vuln.severity,
            category: vuln.category,
            cveId: vuln.cveId,
          });

          vuln.aiExplanation = aiExplanation.explanation;
          vuln.fixGuide = aiExplanation.fixGuide;
          enrichedCount++;

          this.logger.log(`[AI_ENRICH] AI explanation generated for ${vuln.title}`);
        } catch (error) {
          this.logger.error(`[AI_ENRICH] Failed to generate AI explanation for ${vuln.title}:`, error);
        }
      }
    }

    // Generate AI summary
    try {
      this.logger.log(`[AI_ENRICH] Generating AI summary for scan ${scanId}`);

      const aiSummary = await this.aiService.generateScanSummary(
        vulnerabilities.map(v => ({
          title: v.title,
          description: v.description,
          severity: v.severity,
          category: v.category,
        })),
        scan.score || 0,
      );

      // Update scan results with AI summary
      scan.results = {
        ...scan.results,
        aiSummary,
      };

      this.logger.log(`[AI_ENRICH] AI summary generated for scan ${scanId}`);
    } catch (error) {
      this.logger.error(`[AI_ENRICH] Failed to generate AI summary for scan ${scanId}:`, error);
    }

    await this.em.flush();
    this.logger.log(`[AI_ENRICH] Completed AI enrichment for scan ${scanId} (${enrichedCount} vulnerabilities enriched)`);
  }
}
