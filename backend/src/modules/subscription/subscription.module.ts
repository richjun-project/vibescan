import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription } from '../../entities/subscription.entity';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { PaymentLog } from '../../entities/payment-log.entity';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Subscription, User, Payment, PaymentLog]),
    PaymentModule, // Import PaymentModule to use TossPaymentsService
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
