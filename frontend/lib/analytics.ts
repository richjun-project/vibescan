import { analytics } from './firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Log custom events to Firebase Analytics
 */
export const logEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    firebaseLogEvent(analytics, eventName, eventParams);
  }
};

/**
 * Track scan creation
 */
export const logScanCreated = (domain: string, isPaid: boolean) => {
  logEvent('scan_created', {
    domain,
    isPaid,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track scan completion
 */
export const logScanCompleted = (scanId: number, vulnerabilitiesCount: number, score: number) => {
  logEvent('scan_completed', {
    scanId,
    vulnerabilitiesCount,
    score,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user authentication
 */
export const logUserLogin = (method: 'google' | 'email') => {
  logEvent('login', {
    method,
  });
};

export const logUserSignup = (method: 'google' | 'email') => {
  logEvent('sign_up', {
    method,
  });
};

/**
 * Track subscription events
 */
export const logSubscriptionPurchase = (plan: string, price: number) => {
  logEvent('purchase', {
    plan,
    value: price,
    currency: 'KRW',
  });
};

/**
 * Track page interactions
 */
export const logButtonClick = (buttonName: string, location: string) => {
  logEvent('button_click', {
    buttonName,
    location,
  });
};
