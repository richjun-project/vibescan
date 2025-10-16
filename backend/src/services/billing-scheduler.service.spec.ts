import { Test, TestingModule } from '@nestjs/testing';
import { BillingSchedulerService } from './billing-scheduler.service';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../entities/subscription.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { TossPaymentsService } from '../modules/payment/toss-payments.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';

describe('BillingSchedulerService - 구독 취소 스케줄링', () => {
  let service: BillingSchedulerService;
  let mockSubscriptionRepository: any;
  let mockPaymentRepository: any;
  let mockTossPaymentsService: any;
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
    subscription.usedScans = 3;
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
    };

    mockSubscriptionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((data) => Object.assign(new Subscription(), data)),
    };

    mockPaymentRepository = {
      create: jest.fn((data) => Object.assign(new Payment(), data)),
    };

    mockTossPaymentsService = {
      processBillingPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingSchedulerService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
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
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<BillingSchedulerService>(BillingSchedulerService);
  });

  describe('processDailyBillings - 취소 예정 구독 제외', () => {
    it('cancelAtPeriodEnd가 true인 구독은 결제에서 제외되어야 한다', async () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const canceledSubscription = createMockSubscription({
        id: 1,
        cancelAtPeriodEnd: true,
        canceledAt: new Date('2025-01-15'),
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후
      });

      const activeSubscription = createMockSubscription({
        id: 2,
        cancelAtPeriodEnd: false,
      });

      // 취소 예정 구독은 find에서 제외됨
      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions - 아직 기간 안 끝남
        .mockResolvedValueOnce([activeSubscription]); // processDailyBillings - 취소 구독 제외됨

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_123',
        paymentKey: 'payment_key_123',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      // When
      await service.processDailyBillings();

      // Then
      // cancelAtPeriodEnd가 false인 구독만 조회되었는지 확인
      expect(mockSubscriptionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelAtPeriodEnd: false,
        }),
        expect.any(Object)
      );

      // 결제가 한 번만 시도되었는지 확인 (취소 구독 제외)
      expect(mockTossPaymentsService.processBillingPayment).toHaveBeenCalledTimes(1);
    });

    it('빌링키가 없는 구독은 안전하게 건너뛰어야 한다', async () => {
      // Given
      const subscriptionWithoutBillingKey = createMockSubscription({
        billingKey: null,
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([subscriptionWithoutBillingKey]);

      // When
      await service.processDailyBillings();

      // Then
      expect(mockTossPaymentsService.processBillingPayment).not.toHaveBeenCalled();
    });

    it('customerKey가 없는 구독은 안전하게 건너뛰어야 한다', async () => {
      // Given
      const subscriptionWithoutCustomerKey = createMockSubscription({
        customerKey: null,
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([subscriptionWithoutCustomerKey]);

      // When
      await service.processDailyBillings();

      // Then
      expect(mockTossPaymentsService.processBillingPayment).not.toHaveBeenCalled();
    });

    it('FREE 플랜은 결제에서 제외되어야 한다', async () => {
      // Given
      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([]); // FREE 플랜은 쿼리에서 제외됨

      // When
      await service.processDailyBillings();

      // Then
      expect(mockSubscriptionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: { $ne: 'free' },
        }),
        expect.any(Object)
      );
      expect(mockTossPaymentsService.processBillingPayment).not.toHaveBeenCalled();
    });
  });

  describe('processCanceledSubscriptions - 기간 종료된 취소 구독 처리', () => {
    it('기간이 종료된 취소 예정 구독은 Free 플랜으로 전환되어야 한다', async () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredCanceledSubscription = createMockSubscription({
        id: 1,
        plan: 'pro',
        cancelAtPeriodEnd: true,
        canceledAt: new Date('2025-01-01'),
        currentPeriodEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([expiredCanceledSubscription]) // processCanceledSubscriptions
        .mockResolvedValueOnce([]); // processDailyBillings

      // When
      await service.processDailyBillings();

      // Then
      expect(expiredCanceledSubscription.plan).toBe('free');
      expect(expiredCanceledSubscription.status).toBe('canceled');
      expect(expiredCanceledSubscription.cancelAtPeriodEnd).toBe(false);
      expect(expiredCanceledSubscription.billingKey).toBeNull();
      expect(expiredCanceledSubscription.customerKey).toBeNull();
      expect(expiredCanceledSubscription.monthlyScansLimit).toBe(1);
      expect(expiredCanceledSubscription.usedScans).toBe(0);
      expect(expiredCanceledSubscription.nextBillingDate).toBeNull();
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('아직 기간이 남은 취소 예정 구독은 처리하지 않아야 한다', async () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const notExpiredYet = createMockSubscription({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions - 기간 안 끝남
        .mockResolvedValueOnce([]); // processDailyBillings

      // When
      await service.processDailyBillings();

      // Then
      expect(notExpiredYet.plan).toBe('pro'); // 변경 안 됨
      expect(notExpiredYet.status).toBe('active'); // 변경 안 됨
    });

    it('여러 개의 만료된 취소 구독을 한 번에 처리할 수 있어야 한다', async () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredSubs = [
        createMockSubscription({
          id: 1,
          plan: 'pro',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }),
        createMockSubscription({
          id: 2,
          plan: 'business',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        }),
        createMockSubscription({
          id: 3,
          plan: 'pro',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }),
      ];

      mockSubscriptionRepository.find
        .mockResolvedValueOnce(expiredSubs) // processCanceledSubscriptions
        .mockResolvedValueOnce([]); // processDailyBillings

      // When
      await service.processDailyBillings();

      // Then
      expiredSubs.forEach((sub) => {
        expect(sub.plan).toBe('free');
        expect(sub.status).toBe('canceled');
        expect(sub.cancelAtPeriodEnd).toBe(false);
      });
      expect(mockEntityManager.flush).toHaveBeenCalledTimes(3);
    });
  });

  describe('결제 성공 시 cancelAtPeriodEnd 초기화', () => {
    it('정상 결제 성공 시 cancelAtPeriodEnd와 canceledAt이 초기화되어야 한다', async () => {
      // Given
      const activeSubscription = createMockSubscription({
        cancelAtPeriodEnd: false,
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([activeSubscription]); // processDailyBillings

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_123',
        paymentKey: 'payment_key_123',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      // When
      await service.processDailyBillings();

      // Then
      expect(activeSubscription.cancelAtPeriodEnd).toBe(false);
      expect(activeSubscription.canceledAt).toBeNull();
      expect(activeSubscription.status).toBe('active');
    });
  });

  describe('복합 시나리오', () => {
    it('취소 구독과 활성 구독이 섞여 있을 때 올바르게 처리해야 한다', async () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredCanceledSub = createMockSubscription({
        id: 1,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });

      const activeSub1 = createMockSubscription({
        id: 2,
        cancelAtPeriodEnd: false,
      });

      const activeSub2 = createMockSubscription({
        id: 3,
        cancelAtPeriodEnd: false,
      });

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([expiredCanceledSub]) // processCanceledSubscriptions
        .mockResolvedValueOnce([activeSub1, activeSub2]); // processDailyBillings

      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_123',
        paymentKey: 'payment_key_123',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      // When
      await service.processDailyBillings();

      // Then
      // 취소 구독은 Free로 전환
      expect(expiredCanceledSub.plan).toBe('free');
      expect(expiredCanceledSub.status).toBe('canceled');

      // 활성 구독은 결제 처리됨
      expect(mockTossPaymentsService.processBillingPayment).toHaveBeenCalledTimes(2);
    });

    it('결제 실패 시 구독 상태가 PAYMENT_FAILED로 변경되어야 한다', async () => {
      // Given
      const activeSubscription = createMockSubscription();

      mockSubscriptionRepository.find
        .mockResolvedValueOnce([]) // processCanceledSubscriptions
        .mockResolvedValueOnce([activeSubscription]); // processDailyBillings

      mockTossPaymentsService.processBillingPayment.mockRejectedValue(
        new Error('Payment failed')
      );

      // When
      await service.processDailyBillings();

      // Then
      expect(activeSubscription.status).toBe('payment_failed');
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });
  });

  describe('retryBilling - 수동 재시도', () => {
    it('PAYMENT_FAILED 상태의 구독만 재시도할 수 있어야 한다', async () => {
      // Given
      const failedSubscription = createMockSubscription({
        status: 'payment_failed',
      });

      mockSubscriptionRepository.findOneOrFail.mockResolvedValue(failedSubscription);
      mockTossPaymentsService.processBillingPayment.mockResolvedValue({
        orderId: 'order_retry',
        paymentKey: 'payment_key_retry',
        amount: 29900,
        method: 'card',
        approvedAt: new Date().toISOString(),
      });

      // When
      await service.retryBilling(1);

      // Then
      expect(mockTossPaymentsService.processBillingPayment).toHaveBeenCalled();
      expect(failedSubscription.status).toBe('active');
    });

    it('ACTIVE 상태의 구독은 재시도할 수 없어야 한다', async () => {
      // Given
      const activeSubscription = createMockSubscription({
        status: 'active',
      });

      mockSubscriptionRepository.findOneOrFail.mockResolvedValue(activeSubscription);

      // When & Then
      await expect(service.retryBilling(1)).rejects.toThrow(
        'Can only retry billing for subscriptions with PAYMENT_FAILED status'
      );
    });
  });
});
