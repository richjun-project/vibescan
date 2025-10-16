import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { TossPaymentsService } from '../modules/payment/toss-payments.service';

/**
 * 자동결제 스케줄러 서비스
 * - 매일 자정에 결제 예정일이 도래한 구독을 찾아 자동결제 처리
 * - 결제 실패 시 재시도 로직 포함
 */
@Injectable()
export class BillingSchedulerService {
  private readonly logger = new Logger(BillingSchedulerService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: EntityRepository<Payment>,
    private readonly tossPaymentsService: TossPaymentsService,
    private readonly em: EntityManager,
  ) {}

  /**
   * 매일 자정에 자동결제 처리
   * Cron: 매일 00:00에 실행
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyBillings() {
    this.logger.log('[BILLING_SCHEDULER] Starting daily billing process');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 1. 취소 예정 구독 중 기간이 종료된 것 처리
      await this.processCanceledSubscriptions(today);

      // 2. 오늘이 결제일인 활성 구독 찾기 (FREE 제외, 취소 예정 제외)
      const subscriptionsToBill = await this.subscriptionRepository.find({
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: {
          $lte: today,
        },
        plan: {
          $ne: SubscriptionPlan.FREE,
        },
        cancelAtPeriodEnd: false, // 취소 예정이 아닌 구독만
      }, { populate: ['user'] });

      this.logger.log(`[BILLING_SCHEDULER] Found ${subscriptionsToBill.length} subscriptions to bill`);

      // 3. 각 구독에 대해 자동결제 처리
      for (const subscription of subscriptionsToBill) {
        await this.processSingleBilling(subscription);
      }

      this.logger.log('[BILLING_SCHEDULER] Daily billing process completed');
    } catch (error) {
      this.logger.error('[BILLING_SCHEDULER] Error during daily billing process:', error);
    }
  }

  /**
   * 취소 예정 구독 중 기간이 종료된 것들을 Free 플랜으로 전환
   */
  private async processCanceledSubscriptions(today: Date) {
    const canceledSubscriptions = await this.subscriptionRepository.find({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: {
        $lte: today,
      },
    }, { populate: ['user'] });

    this.logger.log(`[BILLING_SCHEDULER] Found ${canceledSubscriptions.length} canceled subscriptions to process`);

    for (const subscription of canceledSubscriptions) {
      try {
        // Free 플랜으로 전환
        subscription.plan = SubscriptionPlan.FREE;
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.cancelAtPeriodEnd = false;
        subscription.billingKey = null;
        subscription.customerKey = null;
        subscription.monthlyScansLimit = 1;
        subscription.usedScans = 0;
        subscription.nextBillingDate = null;

        await this.em.flush();

        this.logger.log(`[BILLING_SCHEDULER] Subscription ${subscription.id} downgraded to FREE plan for user ${subscription.user.id}`);
      } catch (error) {
        this.logger.error(`[BILLING_SCHEDULER] Error processing canceled subscription ${subscription.id}:`, error);
      }
    }
  }

  /**
   * 개별 구독에 대한 자동결제 처리
   */
  private async processSingleBilling(subscription: Subscription) {
    const userId = subscription.user.id;
    const amount = this.getPlanPrice(subscription.plan);

    this.logger.log(`[BILLING] Processing billing for user ${userId}, plan: ${subscription.plan}, amount: ${amount}`);

    try {
      // 안전 체크: 취소 예정인 구독은 결제하지 않음
      if (subscription.cancelAtPeriodEnd) {
        this.logger.warn(`[BILLING] Subscription ${subscription.id} is marked for cancellation, skipping billing`);
        return;
      }

      // 빌링키가 없으면 건너뛰기
      if (!subscription.billingKey) {
        this.logger.warn(`[BILLING] No billing key for user ${userId}, skipping`);
        return;
      }

      // customerKey가 없으면 건너뛰기
      if (!subscription.customerKey) {
        this.logger.warn(`[BILLING] No customer key for user ${userId}, skipping`);
        return;
      }

      // TossPayments 자동결제 승인 요청
      const billingResult = await this.tossPaymentsService.processBillingPayment(
        subscription.billingKey,
        subscription.customerKey,
        amount,
        `${subscription.plan.toUpperCase()} 플랜 월간 구독`,
      );

      // 결제 성공 시 처리
      await this.handleSuccessfulBilling(subscription, billingResult, amount);

      this.logger.log(`[BILLING] Billing successful for user ${userId}`);
    } catch (error) {
      // 결제 실패 시 처리
      await this.handleFailedBilling(subscription, error);

      this.logger.error(`[BILLING] Billing failed for user ${userId}:`, error);
    }
  }

  /**
   * 결제 성공 시 처리
   */
  private async handleSuccessfulBilling(
    subscription: Subscription,
    billingResult: any,
    amount: number,
  ) {
    // 결제 기록 생성
    const payment = this.paymentRepository.create({
      user: subscription.user,
      orderId: billingResult.orderId,
      paymentKey: billingResult.paymentKey,
      amount,
      status: PaymentStatus.COMPLETED,
      method: billingResult.method,
      subscriptionPlan: subscription.plan,
      isRecurring: true,
      billingKey: subscription.billingKey,
    });

    await this.em.persistAndFlush(payment);

    // 구독 정보 업데이트
    const now = new Date();
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    subscription.nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    subscription.usedScans = 0; // 월간 스캔 횟수 리셋
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false; // 결제 성공하면 취소 플래그 제거
    subscription.canceledAt = null; // 취소 날짜도 초기화

    await this.em.flush();

    this.logger.log(`[BILLING] Payment record created: ${payment.id}`);
  }

  /**
   * 결제 실패 시 처리
   */
  private async handleFailedBilling(subscription: Subscription, error: any) {
    const userId = subscription.user.id;

    // 결제 실패 기록 생성
    const payment = this.paymentRepository.create({
      user: subscription.user,
      orderId: `failed-${Date.now()}`,
      amount: this.getPlanPrice(subscription.plan),
      status: PaymentStatus.FAILED,
      subscriptionPlan: subscription.plan,
      isRecurring: true,
      billingKey: subscription.billingKey,
    });

    await this.em.persistAndFlush(payment);

    // 구독 상태를 PAYMENT_FAILED로 변경
    subscription.status = SubscriptionStatus.PAYMENT_FAILED;
    await this.em.flush();

    this.logger.warn(`[BILLING] Subscription ${subscription.id} marked as PAYMENT_FAILED for user ${userId}`);

    // TODO: 사용자에게 결제 실패 이메일 발송
    // await this.emailService.sendPaymentFailedEmail(subscription.user.email);
  }

  /**
   * 플랜별 가격 반환
   */
  private getPlanPrice(plan: SubscriptionPlan): number {
    const prices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.PRO]: 29900,
      [SubscriptionPlan.BUSINESS]: 99900,
      [SubscriptionPlan.ENTERPRISE]: 0, // Enterprise는 별도 계약
    };

    return prices[plan];
  }

  /**
   * 수동으로 특정 구독에 대한 결제 재시도 (관리자용)
   */
  async retryBilling(subscriptionId: number) {
    this.logger.log(`[BILLING] Manual retry for subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findOneOrFail(
      { id: subscriptionId },
      { populate: ['user'] },
    );

    if (subscription.status !== SubscriptionStatus.PAYMENT_FAILED) {
      throw new Error('Can only retry billing for subscriptions with PAYMENT_FAILED status');
    }

    await this.processSingleBilling(subscription);
  }

  /**
   * 결제 실패한 구독들에 대해 재시도 (수동 실행용)
   */
  async retryFailedBillings() {
    this.logger.log('[BILLING] Retrying failed billings');

    const failedSubscriptions = await this.subscriptionRepository.find(
      { status: SubscriptionStatus.PAYMENT_FAILED },
      { populate: ['user'] },
    );

    this.logger.log(`[BILLING] Found ${failedSubscriptions.length} failed subscriptions to retry`);

    for (const subscription of failedSubscriptions) {
      await this.processSingleBilling(subscription);
    }
  }
}
