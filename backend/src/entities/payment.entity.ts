import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CARD = 'card',
  VIRTUAL_ACCOUNT = 'virtual_account',
  TRANSFER = 'transfer',
}

@Entity()
export class Payment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  orderId!: string; // Toss Payments 주문 ID

  @Property({ nullable: true })
  paymentKey?: string; // Toss Payments 결제 키

  @Property()
  orderName!: string; // 상품명

  @Property()
  amount!: number; // 결제 금액 (원)

  // 구독 결제 정보
  @Enum({ type: 'SubscriptionPlan', nullable: true })
  subscriptionPlan?: SubscriptionPlan; // 구독 플랜

  @Property()
  isRecurring: boolean = true; // 정기 결제 여부 (자동결제)

  @Property({ nullable: true })
  billingKey?: string; // 빌링키 (자동결제 시)

  @Enum(() => PaymentStatus)
  status: PaymentStatus = PaymentStatus.PENDING;

  @Enum({ type: 'PaymentMethod', nullable: true })
  method?: PaymentMethod;

  @Property({ nullable: true })
  approvedAt?: Date; // 승인 시간

  @Property({ nullable: true })
  failureCode?: string; // 실패 코드

  @Property({ nullable: true })
  failureMessage?: string; // 실패 메시지

  @Property({ type: 'json', nullable: true })
  metadata?: any; // 추가 메타데이터 (Toss 응답 등)

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
