import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.userService.getProfile(req.user.id);
    const subscription = user.subscription;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
      // Flatten subscription info for easier access
      subscriptionPlan: subscription?.plan ?? 'free',
      monthlyScansLimit: subscription?.monthlyScansLimit ?? 1,
      usedScans: subscription?.usedScans ?? 0,
      remainingScans: subscription?.getRemainingScans() ?? 1,
      subscriptionStatus: subscription?.status ?? 'active',
      nextBillingDate: subscription?.nextBillingDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get('limits')
  async getLimits(@Request() req) {
    const user = await this.userService.getProfile(req.user.id);
    const subscription = user.subscription;

    return {
      subscriptionPlan: subscription?.plan ?? 'free',
      monthlyScansLimit: subscription?.monthlyScansLimit ?? 1,
      usedScans: subscription?.usedScans ?? 0,
      remainingScans: subscription?.getRemainingScans() ?? 1,
      hasAvailableScans: subscription?.canScan() ?? true,
    };
  }
}
