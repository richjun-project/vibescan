import { Entity, PrimaryKey, Property, OneToOne, Enum } from '@mikro-orm/core';
import { User } from './user.entity';

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',           // 정상 구독 중
  PAST_DUE = 'past_due',       // 결제 실패
  PAYMENT_FAILED = 'payment_failed',  // 결제 실패 (별칭)
  CANCELED = 'canceled',       // 취소됨
  INCOMPLETE = 'incomplete',   // 빌링키 발급 대기
}

@Entity()
export class Subscription {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, { owner: true, unique: true })
  user!: User;

  // 토스페이먼츠 빌링 정보
  @Property({ nullable: true })
  billingKey?: string;          // 자동결제 빌링키 (카드 정보 암호화 값)

  @Property({ nullable: true })
  customerKey?: string;         // 토스페이먼츠 고객 식별자

  // 구독 정보
  @Enum(() => SubscriptionPlan)
  plan: SubscriptionPlan = SubscriptionPlan.FREE;

  @Enum(() => SubscriptionStatus)
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE;

  // 스캔 쿼터
  @Property()
  monthlyScansLimit: number = 1;  // 월 제공 스캔 수

  @Property()
  usedScans: number = 0;          // 이번 달 사용한 스캔 수

  // 결제 주기
  @Property({ nullable: true })
  currentPeriodStart?: Date;      // 현재 결제 주기 시작

  @Property({ nullable: true })
  currentPeriodEnd?: Date;        // 현재 결제 주기 종료

  @Property({ nullable: true })
  nextBillingDate?: Date;         // 다음 자동결제일

  @Property({ nullable: true })
  lastBillingDate?: Date;         // 마지막 결제일

  // 취소 정보
  @Property()
  cancelAtPeriodEnd: boolean = false;  // 기간 종료 시 취소 여부

  @Property({ nullable: true })
  canceledAt?: Date;                   // 취소 요청 시점

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  /**
   * 스캔 가능 여부 확인
   */
  canScan(): boolean {
    return this.status === SubscriptionStatus.ACTIVE
           && this.usedScans < this.monthlyScansLimit;
  }

  /**
   * 남은 스캔 횟수
   */
  getRemainingScans(): number {
    return Math.max(0, this.monthlyScansLimit - this.usedScans);
  }

  /**
   * 유료 플랜 여부
   */
  isPaidPlan(): boolean {
    return this.plan !== SubscriptionPlan.FREE;
  }

  /**
   * 플랜별 스캔 제한 설정
   */
  setMonthlyScansLimit(): void {
    const limits: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 1,
      [SubscriptionPlan.PRO]: 10,
      [SubscriptionPlan.BUSINESS]: 50,
      [SubscriptionPlan.ENTERPRISE]: 999999, // 무제한 (실질적으로)
    };
    this.monthlyScansLimit = limits[this.plan];
  }
}
