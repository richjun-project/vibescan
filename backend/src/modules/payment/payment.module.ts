import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '../../entities/user.entity';
import { Subscription } from '../../entities/subscription.entity';
import { Payment } from '../../entities/payment.entity';
import { TossPaymentsService } from './toss-payments.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User, Subscription, Payment])],
  providers: [TossPaymentsService],
  controllers: [PaymentController],
  exports: [TossPaymentsService],
})
export class PaymentModule {}
