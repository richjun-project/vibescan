// Jest setup file for mocking enums

// Mock the entire entities module enums
jest.mock('./src/entities/subscription.entity', () => {
  const actual = jest.requireActual('./src/entities/subscription.entity');
  return {
    ...actual,
    SubscriptionPlan: {
      FREE: 'free',
      PRO: 'pro',
      BUSINESS: 'business',
      ENTERPRISE: 'enterprise',
    },
    SubscriptionStatus: {
      ACTIVE: 'active',
      PAST_DUE: 'past_due',
      PAYMENT_FAILED: 'payment_failed',
      CANCELED: 'canceled',
      INCOMPLETE: 'incomplete',
    },
  };
});

jest.mock('./src/entities/payment.entity', () => {
  const actual = jest.requireActual('./src/entities/payment.entity');
  return {
    ...actual,
    PaymentStatus: {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
    },
    PaymentMethod: {
      CARD: 'card',
      VIRTUAL_ACCOUNT: 'virtual_account',
      TRANSFER: 'transfer',
    },
  };
});
