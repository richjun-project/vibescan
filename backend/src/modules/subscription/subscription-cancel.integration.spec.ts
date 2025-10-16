import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { BillingSchedulerService } from '../../services/billing-scheduler.service';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/subscription.entity';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { TossPaymentsService } from '../payment/toss-payments.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';

/**
 * 통합 테스트: 구독 취소 전체 플로우
 *
 * 시나리오:
 * 1. 사용자가 Pro 플랜 구독 중
 * 2. 구독 취소 요청
 * 3. 스케줄러가 취소 예정 구독을 자동결제에서 제외
 * 4. 기간 종료 시 Free 플랜으로 자동 전환
 */
describe('구독 취소 통합 테스트', () => {
  let subscriptionService: SubscriptionService;
  let billingSchedulerService: BillingSchedulerService;
  let mockSubscriptionRepository: any;
  let mockUserRepository: any;
  let mockPaymentRepository: any;
  let mockTossPaymentsService: any;
  let mockConfigService: any;
  let mockEntityManager: any;

  const createMockUser = (id: number): User => {
    const user = new User();
    user.id = id;
    user.email = `user${id}@example.com`;
    return user;
  };

  const createMockSubscription = (overrides = {}): Subscription => {
    const subscription = new Subscription();
    subscription.id = 1;
    subscription.user = createMockUser(1);
    subscription.plan = 'pro';
    subscription.status = 'active';
    subscription.monthlyScansLimit = 10;
    subscription.usedScans = 5;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    subscription.billingKey = 'test_billing_key';
    subscription.customerKey = 'test_customer_key';
    subscription.currentPeriodStart = new Date('2025-01-01');
    subscription.currentPeriodEnd = new Date('2025-01-31');
    subscription.nextBillingDate = new Date('2025-01-31');

    return Object.assign(subscription, overrides);
  };

  beforeEach(async () => {
    mockEntityManager = {
      create: jest.fn((entity, data) => Object.assign(new entity(), data)),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    mockSubscriptionRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => Object.assign(new Subscription(), data)),
    };

    mockUserRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    mockPaymentRepository = {
      create: jest.fn((data) => Object.assign(new Payment(), data)),
    };

    mockTossPaymentsService = {
      issueBillingKey: jest.fn(),
      processBillingPayment: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          TOSS_SECRET_KEY: 'test_secret_key',
          TOSS_CLIENT_KEY: 'test_client_key',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        BillingSchedulerService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: TossPaymentsService,
          useValue: mockTossPaymentsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    billingSchedulerService = module.get<BillingSchedulerService>(BillingSchedulerService);
  });

  describe('시나리오 1: 정상 구독 취소 플로우', () => {
    it('구독 취소 → 스케줄러 제외 → Free 전환 전체 플로우', async () => {
      // Step 1: 사용자가 Pro 플랜 구독 중
      const userId = 1;
      const mockSubscription = createMockSubscription({
        plan: 'pro',
        status: 'active',
      });
      const mockUser = createMockUser(userId);
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // Step 2: 구독 취소 요청
      const canceledSubscription = await subscriptionService.cancelSubscription(userId);

      expect(canceledSubscription.cancelAtPeriodEnd).toBe(true);
      expect(canceledSubscription.canceledAt).toBeDefined();
      expect(canceledSubscription.plan).toBe('pro');
      expect(canceledSubscription.status).toBe('active');

      // Step 3: 스케줄러 실행 (결제일 도래)
      // 취소 예정 구독은 아직 기간이 안 끝남 → 결제에서 제외
      const notExpiredCanceled = createMockSubscription({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions - 아직 안 끝남
        .mockResolvedValueOnce([]); // processDailyBillings - 취소 구독 제외

      await billingSchedulerService.processDailyBillings();

      // 결제가 시도되지 않았는지 확인
      expect(mockTossPaymentsService.processBillingPayment).not.toHaveBeenCalled();

      // Step 4: 기간 종료 후 스케줄러 실행
      const expiredCanceled = createMockSubscription({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([expiredCanceled]) // processCanceledSubscriptions
        .mockResolvedValueOnce([]); // processDailyBillings

      await billingSchedulerService.processDailyBillings();

      // Free 플랜으로 전환되었는지 확인
      expect(expiredCanceled.plan).toBe('free');
      expect(expiredCanceled.status).toBe('canceled');
      expect(expiredCanceled.cancelAtPeriodEnd).toBe(false);
      expect(expiredCanceled.billingKey).toBeNull();
      expect(expiredCanceled.monthlyScansLimit).toBe(1);
    });
  });

  describe('시나리오 2: 취소 후 재개 플로우', () => {
    it('구독 취소 → 재개 → 정상 결제', async () => {
      // Step 1: 구독 취소
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = createMockUser(userId);
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      const canceledSubscription = await subscriptionService.cancelSubscription(userId);
      expect(canceledSubscription.cancelAtPeriodEnd).toBe(true);

      // Step 2: 취소 철회
      const resumedSubscription = await subscriptionService.resumeSubscription(userId);
      expect(resumedSubscription.cancelAtPeriodEnd).toBe(false);
      expect(resumedSubscription.canceledAt).toBeNull();

      // Step 3: 결제일 도래 → 정상 결제
      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([resumedSubscription]); // processDailyBillings

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_resumed',
        paymentKey: 'payment_key_resumed',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      await billingSchedulerService.processDailyBillings();

      // 정상 결제되었는지 확인
      expect(mockTossPaymentsService.processBillingPayment).toHaveBeenCalledWith(
        resumedSubscription.billingKey,
        resumedSubscription.customerKey,
        29900,
        'PRO 플랜 월간 구독',
      );
      expect(resumedSubscription.status).toBe('active');
      expect(resumedSubscription.usedScans).toBe(0); // 리셋됨
    });
  });

  describe('시나리오 3: 여러 번 취소/재개 반복', () => {
    it('취소와 재개를 5번 반복해도 안전해야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = createMockUser(userId);
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then
      for (let i = 0; i < 5; i++) {
        // 취소
        const canceled = await subscriptionService.cancelSubscription(userId);
        expect(canceled.cancelAtPeriodEnd).toBe(true);
        expect(canceled.plan).toBe('pro');

        // 재개
        const resumed = await subscriptionService.resumeSubscription(userId);
        expect(resumed.cancelAtPeriodEnd).toBe(false);
        expect(resumed.canceledAt).toBeNull();
        expect(resumed.plan).toBe('pro');
      }

      // 최종 상태 확인
      expect(mockSubscription.cancelAtPeriodEnd).toBe(false);
      expect(mockSubscription.plan).toBe('pro');
      expect(mockSubscription.status).toBe('active');
    });
  });

  describe('시나리오 4: 복잡한 다중 구독 처리', () => {
    it('다양한 상태의 구독들을 동시에 처리해야 한다', async () => {
      // Given
      const user1 = createMockUser(1);
      const user2 = createMockUser(2);
      const user3 = createMockUser(3);
      const user4 = createMockUser(4);

      const sub1ExpiredCanceled = createMockSubscription({
        id: 1,
        user: user1,
        plan: 'pro',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 만료됨
      });

      const sub2PendingCanceled = createMockSubscription({
        id: 2,
        user: user2,
        plan: 'business',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 아직 안 만료
      });

      const sub3Active = createMockSubscription({
        id: 3,
        user: user3,
        plan: 'pro',
        cancelAtPeriodEnd: false, // 정상 구독
      });

      const sub4Active = createMockSubscription({
        id: 4,
        user: user4,
        plan: 'business',
        cancelAtPeriodEnd: false,
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([sub1ExpiredCanceled]) // processCanceledSubscriptions
        .mockResolvedValueOnce([sub3Active, sub4Active]); // processDailyBillings

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_123',
        paymentKey: 'payment_key_123',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      // When
      await billingSchedulerService.processDailyBillings();

      // Then
      // 1. 만료된 취소 구독은 Free로 전환
      expect(sub1ExpiredCanceled.plan).toBe('free');
      expect(sub1ExpiredCanceled.status).toBe('canceled');

      // 2. 아직 안 만료된 취소 구독은 그대로 유지
      expect(sub2PendingCanceled.plan).toBe('business');
      expect(sub2PendingCanceled.status).toBe('active');

      // 3. 정상 구독은 결제 처리
      expect(mockTossPaymentsService.processBillingPayment).toHaveBeenCalledTimes(2);
      expect(sub3Active.status).toBe('active');
      expect(sub4Active.status).toBe('active');
    });
  });

  describe('시나리오 5: 엣지 케이스', () => {
    it('빌링키 없는 취소 구독도 안전하게 Free로 전환되어야 한다', async () => {
      // Given
      const noBillingKeySub = createMockSubscription({
        billingKey: null,
        customerKey: null,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([noBillingKeySub]) // processCanceledSubscriptions
        .mockResolvedValueOnce([]); // processDailyBillings

      // When
      await billingSchedulerService.processDailyBillings();

      // Then
      expect(noBillingKeySub.plan).toBe('free');
      expect(noBillingKeySub.status).toBe('canceled');
      expect(noBillingKeySub.billingKey).toBeNull();
    });

    it('PAYMENT_FAILED 상태에서 취소해도 정상 처리되어야 한다', async () => {
      // Given
      const userId = 1;
      const failedSub = createMockSubscription({
        status: 'payment_failed',
      });
      const mockUser = createMockUser(userId);
      mockUser.subscription = failedSub;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When
      const canceled = await subscriptionService.cancelSubscription(userId);

      // Then
      expect(canceled.cancelAtPeriodEnd).toBe(true);
      expect(canceled.status).toBe('payment_failed'); // 상태 유지

      // 기간 종료 시 Free로 전환
      failedSub.currentPeriodEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([failedSub])
        .mockResolvedValueOnce([]);

      await billingSchedulerService.processDailyBillings();

      expect(failedSub.plan).toBe('free');
      expect(failedSub.status).toBe('canceled');
    });
  });

  describe('시나리오 6: 결제 성공 시 자동 초기화', () => {
    it('철회 후 결제 성공 시 cancelAtPeriodEnd가 자동으로 false가 되어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = createMockUser(userId);
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // 취소
      await subscriptionService.cancelSubscription(userId);
      expect(mockSubscription.cancelAtPeriodEnd).toBe(true);

      // 재개
      await subscriptionService.resumeSubscription(userId);
      expect(mockSubscription.cancelAtPeriodEnd).toBe(false);

      // When - 결제 성공
      mockSubscriptionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSubscription]);

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_auto_reset',
        paymentKey: 'payment_key_auto_reset',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      await billingSchedulerService.processDailyBillings();

      // Then
      expect(mockSubscription.cancelAtPeriodEnd).toBe(false);
      expect(mockSubscription.canceledAt).toBeNull();
    });
  });
});
