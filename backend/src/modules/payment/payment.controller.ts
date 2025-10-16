import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TossPaymentsService } from './toss-payments.service';

class CreatePaymentOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  scanCount?: number; // Number of detailed scan reports to purchase (default: 1)
}

class ConfirmPaymentDto {
  @IsString()
  paymentKey: string;

  @IsString()
  orderId: string;

  @IsNumber()
  amount: number;
}

@Controller('payment')
export class PaymentController {
  constructor(private readonly tossPaymentsService: TossPaymentsService) {}

  @Get('prices')
  async getPrices() {
    return this.tossPaymentsService.getPrices();
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createPaymentOrder(@Req() req, @Body() dto: CreatePaymentOrderDto) {
    const scanCount = dto.scanCount || 1;

    if (scanCount < 1 || scanCount > 100) {
      throw new Error('Scan count must be between 1 and 100');
    }

    return this.tossPaymentsService.createPaymentOrder(req.user.id, scanCount);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Req() req, @Body() dto: ConfirmPaymentDto) {
    return this.tossPaymentsService.confirmPayment(
      {
        paymentKey: dto.paymentKey,
        orderId: dto.orderId,
        amount: dto.amount,
      },
      req.user.id,
    );
  }
}
