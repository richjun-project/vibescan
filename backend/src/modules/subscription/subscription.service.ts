import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/subscription.entity';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { TossPaymentsService } from '../payment/toss-payments.service';
import * as crypto from 'crypto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: EntityRepository<Payment>,
    private readonly tossPaymentsService: TossPaymentsService,
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {}

  /**
   * 구독 정보 조회 (없으면 Free 플랜 자동 생성)
   */
  async getSubscription(userId: number): Promise<Subscription> {
    const user = await this.userRepository.findOneOrFail({ id: userId }, { populate: ['subscription'] });

    // 구독이 없으면 Free 플랜 생성
    if (!user.subscription) {
      this.logger.log(`[GET_SUBSCRIPTION] User ${userId} has no subscription, creating Free plan`);
      const subscription = this.em.create(Subscription, {
        user,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyScansLimit: 1,
        usedScans: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.getNextBillingDate(),
      });
      await this.em.persistAndFlush(subscription);
      return subscription;
    }

    return user.subscription;
  }

  /**
   * customerKey 생성 (구독 정보는 변경하지 않음)
   */
  async generateCustomerKey(userId: number, plan: SubscriptionPlan): Promise<{ customerKey: string; plan: SubscriptionPlan }> {
    if (plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Free 플랜은 구독할 수 없습니다.');
    }

    const user = await this.userRepository.findOneOrFail({ id: userId }, { populate: ['subscription'] });

    // customerKey 생성 (토스페이먼츠 고객 식별자)
    const customerKey = `USER_${userId}_${crypto.randomBytes(8).toString('hex')}`;

    this.logger.log(`[GENERATE_CUSTOMER_KEY] Generated customerKey for user ${userId} for plan ${plan}: ${customerKey}`);

    return { customerKey, plan };
  }

  /**
   * 빌링키 발급 완료 처리 및 첫 결제 진행
   */
  async completeBillingAuth(userId: number, authKey: string, customerKey: string, plan: SubscriptionPlan): Promise<Subscription> {
    const user = await this.userRepository.findOneOrFail({ id: userId }, { populate: ['subscription'] });

    // 토스페이먼츠에서 빌링키 발급
    const { billingKey } = await this.tossPaymentsService.issueBillingKey(authKey, customerKey);

    this.logger.log(`[COMPLETE_BILLING_AUTH] Billing key issued for user ${userId}`);

    // 첫 결제 진행
    const amount = this.getPlanPrice(plan);
    const planName = this.getPlanDisplayName(plan);

    try {
      const paymentResult = await this.tossPaymentsService.processBillingPayment(
        billingKey,
        customerKey,
        amount,
        `${planName} 플랜 첫 결제`,
      );

      this.logger.log(`[COMPLETE_BILLING_AUTH] First payment completed for user ${userId}`);

      // 결제 기록 생성
      const payment = this.em.create(Payment, {
        user,
        orderId: paymentResult.orderId,
        paymentKey: paymentResult.paymentKey,
        orderName: `${planName} 플랜 첫 결제`,
        amount: paymentResult.amount,
        status: PaymentStatus.COMPLETED,
        method: paymentResult.method as any,
        subscriptionPlan: plan,
        isRecurring: true,
        billingKey,
        approvedAt: new Date(paymentResult.approvedAt),
      });

      await this.em.persistAndFlush(payment);

      // 구독 생성 또는 업데이트 (결제 성공 후에만!)
      let subscription: Subscription;

      if (!user.subscription) {
        // 새 구독 생성
        subscription = this.em.create(Subscription, {
          user,
          plan,
          status: SubscriptionStatus.ACTIVE,
          customerKey,
          billingKey,
          monthlyScansLimit: 0,
          usedScans: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.getNextBillingDate(),
          nextBillingDate: this.getNextBillingDate(),
          lastBillingDate: new Date(),
        });
        subscription.setMonthlyScansLimit();
        await this.em.persistAndFlush(subscription);
        this.logger.log(`[COMPLETE_BILLING_AUTH] Created new subscription for user ${userId}`);
      } else {
        // 기존 구독 업데이트
        subscription = user.subscription;
        subscription.plan = plan;
        subscription.customerKey = customerKey;
        subscription.billingKey = billingKey;
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = this.getNextBillingDate();
        subscription.nextBillingDate = this.getNextBillingDate();
        subscription.lastBillingDate = new Date();
        subscription.setMonthlyScansLimit();
        await this.em.flush();
        this.logger.log(`[COMPLETE_BILLING_AUTH] Updated subscription for user ${userId}`);
      }

      this.logger.log(`[COMPLETE_BILLING_AUTH] Subscription activated for user ${userId}, plan: ${plan}`);

      return subscription;
    } catch (error) {
      this.logger.error(`[COMPLETE_BILLING_AUTH] First payment failed for user ${userId}:`, error);
      throw new BadRequestException('첫 결제가 실패했습니다. 카드 정보를 확인해주세요.');
    }
  }

  /**
   * 플랜 변경 (다음 결제 주기부터 적용)
   */
  async changePlan(userId: number, newPlan: SubscriptionPlan): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (newPlan === SubscriptionPlan.FREE && subscription.plan !== SubscriptionPlan.FREE) {
      // 유료 → Free 전환은 구독 취소로 처리
      return this.cancelSubscription(userId);
    }

    if (subscription.plan === newPlan) {
      throw new BadRequestException('이미 해당 플랜을 사용 중입니다.');
    }

    if (subscription.plan === SubscriptionPlan.FREE && newPlan !== SubscriptionPlan.FREE) {
      // Free → 유료 전환은 새로운 구독 시작
      throw new BadRequestException('새로운 구독을 시작해주세요.');
    }

    // 플랜 변경 (즉시 적용)
    subscription.plan = newPlan;
    subscription.setMonthlyScansLimit();
    // usedScans는 유지 (현재 주기 내에서)

    await this.em.flush();

    this.logger.log(`[CHANGE_PLAN] User ${userId} changed plan from ${subscription.plan} to ${newPlan}`);

    return subscription;
  }

  /**
   * 구독 취소 (기간 종료 시 취소)
   */
  async cancelSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (subscription.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Free 플랜은 취소할 수 없습니다.');
    }

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('이미 취소된 구독입니다.');
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();

    await this.em.flush();

    this.logger.log(`[CANCEL_SUBSCRIPTION] User ${userId} canceled subscription (end at period end)`);

    return subscription;
  }

  /**
   * 구독 취소 철회
   */
  async resumeSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (subscription.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Free 플랜은 재개할 수 없습니다.');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('취소 예정인 구독이 아닙니다.');
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;

    await this.em.flush();

    this.logger.log(`[RESUME_SUBSCRIPTION] User ${userId} resumed subscription`);

    return subscription;
  }

  /**
   * 구독 즉시 취소
   */
  async cancelSubscriptionImmediately(userId: number): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (subscription.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Free 플랜은 취소할 수 없습니다.');
    }

    // Free 플랜으로 다운그레이드
    subscription.plan = SubscriptionPlan.FREE;
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = new Date();
    subscription.billingKey = null;
    subscription.customerKey = null;
    subscription.monthlyScansLimit = 1;
    subscription.usedScans = 0;

    await this.em.flush();

    this.logger.log(`[CANCEL_IMMEDIATELY] User ${userId} canceled subscription immediately`);

    return subscription;
  }

  /**
   * 스캔 사용 (usedScans++)
   */
  async useScan(userId: number): Promise<void> {
    const subscription = await this.getSubscription(userId);

    if (!subscription.canScan()) {
      throw new ForbiddenException('스캔 횟수를 모두 사용했습니다.');
    }

    subscription.usedScans++;
    await this.em.flush();

    this.logger.log(`[USE_SCAN] User ${userId} used scan (${subscription.usedScans}/${subscription.monthlyScansLimit})`);
  }

  /**
   * 월간 스캔 쿼터 리셋
   */
  async resetMonthlyScans(subscriptionId: number): Promise<void> {
    const subscription = await this.subscriptionRepository.findOneOrFail({ id: subscriptionId });

    subscription.usedScans = 0;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = this.getNextBillingDate();

    await this.em.flush();

    this.logger.log(`[RESET_SCANS] Subscription ${subscriptionId} scans reset`);
  }

  /**
   * 플랜별 가격 조회
   */
  getPlanPrice(plan: SubscriptionPlan): number {
    const prices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.STARTER]: 9900,
      [SubscriptionPlan.PRO]: 29900,
      [SubscriptionPlan.BUSINESS]: 99900,
      [SubscriptionPlan.ENTERPRISE]: 0, // 문의
    };
    return prices[plan];
  }

  /**
   * 플랜 정보 조회
   */
  getPlans() {
    return {
      free: {
        name: 'Free',
        price: 0,
        monthlyScans: 1,
        features: ['월 1회 무료 스캔', '기본 보안 점검만'],
      },
      starter: {
        name: 'Starter',
        price: 9900,
        monthlyScans: 5,
        features: ['월 5회 상세 스캔', 'AI 분석 + 수정 가이드', 'PDF 다운로드'],
      },
      pro: {
        name: 'Pro',
        price: 29900,
        monthlyScans: 10,
        features: ['월 10회 상세 스캔', 'AI 분석 + 수정 가이드', 'PDF 다운로드', '우선 지원'],
      },
      business: {
        name: 'Business',
        price: 99900,
        monthlyScans: 50,
        features: ['월 50회 상세 스캔', 'Pro의 모든 기능', '우선 지원', 'API 액세스'],
      },
      enterprise: {
        name: 'Enterprise',
        price: 0,
        monthlyScans: 999999,
        features: ['무제한 스캔', 'Business의 모든 기능', '전담 지원', '커스텀 통합', 'SLA 보장'],
        contact: true,
      },
    };
  }

  /**
   * 다음 결제일 계산 (30일 후)
   */
  private getNextBillingDate(): Date {
    const next = new Date();
    next.setDate(next.getDate() + 30);
    return next;
  }

  /**
   * 플랜 표시 이름 반환
   */
  private getPlanDisplayName(plan: SubscriptionPlan): string {
    const names: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.FREE]: 'Free',
      [SubscriptionPlan.STARTER]: 'Starter',
      [SubscriptionPlan.PRO]: 'Pro',
      [SubscriptionPlan.BUSINESS]: 'Business',
      [SubscriptionPlan.ENTERPRISE]: 'Enterprise',
    };
    return names[plan];
  }
}
