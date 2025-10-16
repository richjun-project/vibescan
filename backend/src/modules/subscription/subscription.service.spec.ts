import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/subscription.entity';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { TossPaymentsService } from '../payment/toss-payments.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';

describe('SubscriptionService - 구독 취소 기능', () => {
  let service: SubscriptionService;
  let mockSubscriptionRepository: any;
  let mockUserRepository: any;
  let mockPaymentRepository: any;
  let mockTossPaymentsService: any;
  let mockConfigService: any;
  let mockEntityManager: any;

  // Mock 구독 데이터
  const createMockSubscription = (overrides = {}): Subscription => {
    const subscription = new Subscription();
    subscription.id = 1;
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

    const mockUser = new User();
    mockUser.id = 1;
    mockUser.email = 'test@example.com';
    subscription.user = mockUser;

    return Object.assign(subscription, overrides);
  };

  beforeEach(async () => {
    // Mock EntityManager
    mockEntityManager = {
      create: jest.fn((entity, data) => Object.assign(new entity(), data)),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    // Mock Repositories
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

    // Mock TossPaymentsService
    mockTossPaymentsService = {
      issueBillingKey: jest.fn(),
      processBillingPayment: jest.fn(),
    };

    // Mock ConfigService
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

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('cancelSubscription', () => {
    it('정상적으로 구독을 취소해야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When
      const result = await service.cancelSubscription(userId);

      // Then
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.canceledAt).toBeInstanceOf(Date);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('Free 플랜은 취소할 수 없어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({ plan: 'free' });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then
      await expect(service.cancelSubscription(userId)).rejects.toThrow(
        new BadRequestException('Free 플랜은 취소할 수 없습니다.')
      );
    });

    it('이미 취소된 구독은 다시 취소할 수 없어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        status: 'canceled'
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then
      await expect(service.cancelSubscription(userId)).rejects.toThrow(
        new BadRequestException('이미 취소된 구독입니다.')
      );
    });

    it('취소 시 cancelAtPeriodEnd 플래그와 canceledAt이 설정되어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      const beforeCancelTime = new Date();

      // When
      const result = await service.cancelSubscription(userId);

      // Then
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.canceledAt).toBeDefined();
      expect(result.canceledAt!.getTime()).toBeGreaterThanOrEqual(beforeCancelTime.getTime());
      expect(result.plan).toBe('pro'); // 플랜은 유지
      expect(result.status).toBe('active'); // 상태도 유지
    });
  });

  describe('resumeSubscription', () => {
    it('취소 예정인 구독을 재개할 수 있어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        cancelAtPeriodEnd: true,
        canceledAt: new Date('2025-01-15'),
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When
      const result = await service.resumeSubscription(userId);

      // Then
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.canceledAt).toBeNull();
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('Free 플랜은 재개할 수 없어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        plan: 'free',
        cancelAtPeriodEnd: true,
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then
      await expect(service.resumeSubscription(userId)).rejects.toThrow(
        new BadRequestException('Free 플랜은 재개할 수 없습니다.')
      );
    });

    it('취소 예정이 아닌 구독은 재개할 수 없어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        cancelAtPeriodEnd: false,
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then
      await expect(service.resumeSubscription(userId)).rejects.toThrow(
        new BadRequestException('취소 예정인 구독이 아닙니다.')
      );
    });

    it('재개 후 플랜과 상태는 그대로 유지되어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        plan: 'business',
        status: 'active',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When
      const result = await service.resumeSubscription(userId);

      // Then
      expect(result.plan).toBe('business');
      expect(result.status).toBe('active');
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.canceledAt).toBeNull();
    });
  });

  describe('취소/재개 시나리오 통합 테스트', () => {
    it('구독 취소 후 재개하면 원래 상태로 돌아와야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        plan: 'pro',
        status: 'active',
        monthlyScansLimit: 10,
        usedScans: 5,
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When - 취소
      const canceledResult = await service.cancelSubscription(userId);

      // Then - 취소 상태 확인
      expect(canceledResult.cancelAtPeriodEnd).toBe(true);
      expect(canceledResult.canceledAt).toBeDefined();
      expect(canceledResult.plan).toBe('pro');
      expect(canceledResult.status).toBe('active');

      // When - 재개
      const resumedResult = await service.resumeSubscription(userId);

      // Then - 재개 후 상태 확인
      expect(resumedResult.cancelAtPeriodEnd).toBe(false);
      expect(resumedResult.canceledAt).toBeNull();
      expect(resumedResult.plan).toBe('pro');
      expect(resumedResult.status).toBe('active');
      expect(resumedResult.monthlyScansLimit).toBe(10);
      expect(resumedResult.usedScans).toBe(5);
    });

    it('여러 번 취소/재개를 반복해도 안전해야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription();
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When & Then - 3번 반복
      for (let i = 0; i < 3; i++) {
        // 취소
        const canceledResult = await service.cancelSubscription(userId);
        expect(canceledResult.cancelAtPeriodEnd).toBe(true);

        // 재개
        const resumedResult = await service.resumeSubscription(userId);
        expect(resumedResult.cancelAtPeriodEnd).toBe(false);
      }

      // 최종 상태가 정상이어야 함
      expect(mockSubscription.cancelAtPeriodEnd).toBe(false);
      expect(mockSubscription.canceledAt).toBeNull();
      expect(mockEntityManager.flush).toHaveBeenCalledTimes(6); // 3 * 2
    });
  });

  describe('cancelSubscriptionImmediately', () => {
    it('즉시 취소 시 Free 플랜으로 전환되어야 한다', async () => {
      // Given
      const userId = 1;
      const mockSubscription = createMockSubscription({
        plan: 'pro',
      });
      const mockUser = new User();
      mockUser.id = userId;
      mockUser.subscription = mockSubscription;

      mockUserRepository.findOneOrFail.mockResolvedValue(mockUser);

      // When
      const result = await service.cancelSubscriptionImmediately(userId);

      // Then
      expect(result.plan).toBe('free');
      expect(result.status).toBe('canceled');
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.billingKey).toBeNull();
      expect(result.customerKey).toBeNull();
      expect(result.monthlyScansLimit).toBe(1);
      expect(result.usedScans).toBe(0);
    });
  });
});
