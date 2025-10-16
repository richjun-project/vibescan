import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { User } from '../../entities/user.entity';
import { Subscription, SubscriptionPlan } from '../../entities/subscription.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 사용자 프로필 조회 (구독 정보 포함)
   */
  async getProfile(userId: number) {
    return this.userRepository.findOneOrFail({ id: userId }, { populate: ['subscription'] });
  }

  /**
   * 사용자의 구독 제한 정보 조회
   */
  async getUserLimits(userId: number) {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['subscription'] }
    );

    // 구독이 없으면 Free 플랜으로 간주
    if (!user.subscription) {
      return {
        plan: SubscriptionPlan.FREE,
        monthlyScansLimit: 1,
        usedScans: 0,
        remainingScans: 1,
        canScan: true,
      };
    }

    return {
      plan: user.subscription.plan,
      monthlyScansLimit: user.subscription.monthlyScansLimit,
      usedScans: user.subscription.usedScans,
      remainingScans: user.subscription.getRemainingScans(),
      canScan: user.subscription.canScan(),
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      nextBillingDate: user.subscription.nextBillingDate,
      status: user.subscription.status,
    };
  }

  /**
   * 사용자가 스캔 가능한지 확인
   */
  async canScan(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOneOrFail(
      { id: userId },
      { populate: ['subscription'] }
    );

    // 구독이 없으면 Free 플랜으로 간주 (1회 가능)
    if (!user.subscription) {
      return true;
    }

    return user.subscription.canScan();
  }
}
