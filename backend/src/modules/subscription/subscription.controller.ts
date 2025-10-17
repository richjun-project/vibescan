import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPlan } from '../../entities/subscription.entity';

class InitiateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

class CompleteBillingAuthDto {
  @IsString()
  authKey: string;

  @IsString()
  customerKey: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

class ChangePlanDto {
  @IsEnum(SubscriptionPlan)
  newPlan: SubscriptionPlan;
}

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * 플랜 목록 및 가격 조회
   */
  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  /**
   * 현재 구독 정보 조회
   */
  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Request() req) {
    const subscription = await this.subscriptionService.getSubscription(req.user.id);
    const amount = this.subscriptionService.getPlanPrice(subscription.plan);
    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      amount,
      monthlyScansLimit: subscription.monthlyScansLimit,
      usedScans: subscription.usedScans,
      remainingScans: subscription.getRemainingScans(),
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
    };
  }

  /**
   * 구독 시작 (customerKey 반환)
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Request() req, @Body() dto: InitiateSubscriptionDto) {
    const { customerKey, plan } = await this.subscriptionService.generateCustomerKey(req.user.id, dto.plan);
    return {
      customerKey,
      plan,
    };
  }

  /**
   * 빌링 인증 완료 (빌링키 저장)
   */
  @Post('complete-billing-auth')
  @UseGuards(JwtAuthGuard)
  async completeBillingAuth(@Request() req, @Body() dto: CompleteBillingAuthDto) {
    const subscription = await this.subscriptionService.completeBillingAuth(
      req.user.id,
      dto.authKey,
      dto.customerKey,
      dto.plan,
    );

    return {
      success: true,
      message: '구독이 시작되었습니다.',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        monthlyScansLimit: subscription.monthlyScansLimit,
        nextBillingDate: subscription.nextBillingDate,
      },
    };
  }

  /**
   * 플랜 변경
   */
  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  async changePlan(@Request() req, @Body() dto: ChangePlanDto) {
    const subscription = await this.subscriptionService.changePlan(req.user.id, dto.newPlan);

    return {
      success: true,
      message: '플랜이 변경되었습니다.',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        monthlyScansLimit: subscription.monthlyScansLimit,
      },
    };
  }

  /**
   * 구독 취소 (기간 종료 시)
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Request() req) {
    const subscription = await this.subscriptionService.cancelSubscription(req.user.id);

    return {
      success: true,
      message: '구독이 취소되었습니다. 현재 결제 주기가 종료되면 Free 플랜으로 전환됩니다.',
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  }

  /**
   * 구독 즉시 취소
   */
  @Post('cancel-immediately')
  @UseGuards(JwtAuthGuard)
  async cancelImmediately(@Request() req) {
    const subscription = await this.subscriptionService.cancelSubscriptionImmediately(req.user.id);

    return {
      success: true,
      message: '구독이 즉시 취소되었습니다. Free 플랜으로 전환되었습니다.',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      },
    };
  }

  /**
   * 구독 취소 철회
   */
  @Post('resume')
  @UseGuards(JwtAuthGuard)
  async resumeSubscription(@Request() req) {
    const subscription = await this.subscriptionService.resumeSubscription(req.user.id);

    return {
      success: true,
      message: '구독 취소가 철회되었습니다. 계속해서 서비스를 이용하실 수 있습니다.',
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  }
}
