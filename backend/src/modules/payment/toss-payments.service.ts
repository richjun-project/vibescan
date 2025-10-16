import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { User } from '../../entities/user.entity';
import { Subscription } from '../../entities/subscription.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../entities/payment.entity';
import axios from 'axios';

interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  version: string;
  paymentKey: string;
  type: string;
  orderId: string;
  orderName: string;
  mId: string;
  currency: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  requestedAt: string;
  approvedAt: string;
  useEscrow: boolean;
  lastTransactionKey: string | null;
  suppliedAmount: number;
  vat: number;
  cultureExpense: boolean;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cancels: any[];
  isPartialCancelable: boolean;
  card?: any;
  virtualAccount?: any;
  transfer?: any;
  mobilePhone?: any;
  giftCertificate?: any;
  cashReceipt?: any;
  cashReceipts?: any;
  discount?: any;
  easyPay?: any;
  country: string;
  failure?: any;
  receipt?: {
    url: string;
  };
  checkout?: {
    url: string;
  };
}

@Injectable()
export class TossPaymentsService {
  private readonly apiUrl = 'https://api.tosspayments.com/v1/payments';
  private readonly billingApiUrl = 'https://api.tosspayments.com/v1/billing';
  private readonly secretKey: string;
  private readonly clientKey: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: EntityRepository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: EntityRepository<Payment>,
    private em: EntityManager,
  ) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY') || '';
    this.clientKey = this.configService.get<string>('TOSS_CLIENT_KEY') || '';

    if (!this.secretKey || !this.clientKey) {
      console.warn('TOSS_SECRET_KEY or TOSS_CLIENT_KEY not set. Payment features will be disabled.');
    }
  }

  /**
   * 결제 준비 - orderId 생성 및 반환
   */
  async createPaymentOrder(userId: number, scanCount: number = 1) {
    const user = await this.userRepository.findOneOrFail({ id: userId });

    // Generate unique orderId
    const orderId = `ORDER_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;
    const amount = 9900 * scanCount; // ₩9,900 per scan

    return {
      orderId,
      amount,
      orderName: `보안 스캔 상세 리포트 ${scanCount}회`,
      customerEmail: user.email,
      customerName: user.name || user.email,
      successUrl: `${this.configService.get('FRONTEND_URL')}/payment/success`,
      failUrl: `${this.configService.get('FRONTEND_URL')}/payment/fail`,
      clientKey: this.clientKey,
      scanCount,
    };
  }

  /**
   * 결제 승인
   */
  async confirmPayment(confirmRequest: TossPaymentConfirmRequest, userId: number) {
    try {
      // Extract scanCount from orderId
      const orderIdParts = confirmRequest.orderId.split('_');
      const userIdFromOrder = parseInt(orderIdParts[2]);

      // Verify userId matches
      if (userIdFromOrder !== userId) {
        throw new Error('User ID mismatch');
      }

      // Call Toss Payments API to confirm payment
      const response = await axios.post<TossPaymentResponse>(
        `${this.apiUrl}/confirm`,
        {
          paymentKey: confirmRequest.paymentKey,
          orderId: confirmRequest.orderId,
          amount: confirmRequest.amount,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const paymentData = response.data;

      // Calculate scan count from amount
      const scanCount = Math.floor(paymentData.totalAmount / 9900);

      // Get user (subscription model - no more credits)
      const user = await this.userRepository.findOneOrFail({ id: userId });

      // Note: This is old single-payment code. Now we use subscription model.
      // Keeping this for backward compatibility but this path should not be used.

      // Create Payment record
      const payment = this.em.create(Payment, {
        user,
        orderId: paymentData.orderId,
        paymentKey: paymentData.paymentKey,
        orderName: paymentData.orderName,
        amount: paymentData.totalAmount,
        status: PaymentStatus.COMPLETED,
        method: paymentData.method as PaymentMethod,
        approvedAt: new Date(paymentData.approvedAt),
        metadata: paymentData,
      });

      await this.em.flush();

      console.log(`✅ User ${user.email} completed payment. Amount: ${paymentData.totalAmount}`);

      return {
        success: true,
        message: `결제가 성공적으로 완료되었습니다.`,
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount,
        scanCount,
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);

      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        throw new Error(`결제 승인 실패: ${errorData.message || '알 수 없는 오류'}`);
      }

      throw new Error('결제 승인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(paymentKey: string, cancelReason: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${paymentKey}/cancel`,
        {
          cancelReason,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Payment cancellation failed:', error);
      throw new Error('결제 취소 중 오류가 발생했습니다.');
    }
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string) {
    try {
      const response = await axios.get<TossPaymentResponse>(
        `${this.apiUrl}/${paymentKey}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Payment retrieval failed:', error);
      throw new Error('결제 정보 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 가격 정보 조회 (구독 모델)
   */
  async getPrices() {
    return {
      free: {
        price: 0,
        currency: 'KRW',
        name: 'Free',
        description: '무료 플랜 - 월 1회 스캔',
        scansPerMonth: 1,
      },
      pro: {
        price: 29900,
        currency: 'KRW',
        name: 'Pro',
        description: '프로 플랜 - 월 10회 스캔',
        scansPerMonth: 10,
      },
      business: {
        price: 99900,
        currency: 'KRW',
        name: 'Business',
        description: '비즈니스 플랜 - 월 50회 스캔',
        scansPerMonth: 50,
      },
      enterprise: {
        price: null,
        currency: 'KRW',
        name: 'Enterprise',
        description: '엔터프라이즈 플랜 - 무제한 스캔',
        scansPerMonth: 'unlimited',
        contact: true,
      },
    };
  }

  /**
   * 빌링키 발급 (자동결제 등록)
   */
  async issueBillingKey(authKey: string, customerKey: string) {
    try {
      const response = await axios.post(
        `${this.billingApiUrl}/authorizations/issue`,
        {
          authKey,
          customerKey,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        billingKey: response.data.billingKey,
        customerKey: response.data.customerKey,
        card: response.data.card,
      };
    } catch (error) {
      console.error('Billing key issuance failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        throw new Error(`빌링키 발급 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
      throw new Error('빌링키 발급 중 오류가 발생했습니다.');
    }
  }

  /**
   * 자동결제 승인 (빌링키 사용)
   */
  async processBillingPayment(
    billingKey: string,
    customerKey: string,
    amount: number,
    orderName: string,
  ) {
    try {
      const orderId = `BILLING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await axios.post(
        `${this.billingApiUrl}/${billingKey}`,
        {
          customerKey,
          amount,
          orderId,
          orderName,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        orderId: response.data.orderId,
        paymentKey: response.data.paymentKey,
        amount: response.data.totalAmount,
        method: response.data.method,
        approvedAt: response.data.approvedAt,
      };
    } catch (error) {
      console.error('Billing payment failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        throw new Error(`자동결제 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
      throw new Error('자동결제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 빌링키 조회
   */
  async getBillingKey(billingKey: string) {
    try {
      const response = await axios.get(
        `${this.billingApiUrl}/${billingKey}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Billing key retrieval failed:', error);
      throw new Error('빌링키 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 빌링키 삭제 (자동결제 해지)
   */
  async deleteBillingKey(billingKey: string) {
    try {
      await axios.delete(
        `${this.billingApiUrl}/${billingKey}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          },
        },
      );

      return { success: true, message: '자동결제가 해지되었습니다.' };
    } catch (error) {
      console.error('Billing key deletion failed:', error);
      throw new Error('자동결제 해지 중 오류가 발생했습니다.');
    }
  }
}
