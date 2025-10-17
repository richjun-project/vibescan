import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from './user.entity';

export enum PaymentLogStatus {
  INITIATED = 'initiated',
  TOSS_SUCCESS = 'toss_success',
  TOSS_FAILED = 'toss_failed',
  DB_SAVE_SUCCESS = 'db_save_success',
  DB_SAVE_FAILED = 'db_save_failed',
  SUBSCRIPTION_UPDATE_SUCCESS = 'subscription_update_success',
  SUBSCRIPTION_UPDATE_FAILED = 'subscription_update_failed',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity()
export class PaymentLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User)
  user!: User;

  @Property({ nullable: true })
  orderId?: string;

  @Property({ nullable: true })
  paymentKey?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Property({ nullable: true })
  subscriptionPlan?: string;

  @Enum({ items: () => PaymentLogStatus })
  status!: PaymentLogStatus;

  @Property({ type: 'text', nullable: true })
  message?: string;

  @Property({ type: 'json', nullable: true })
  requestData?: any;

  @Property({ type: 'json', nullable: true })
  responseData?: any;

  @Property({ type: 'json', nullable: true })
  errorData?: any;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
