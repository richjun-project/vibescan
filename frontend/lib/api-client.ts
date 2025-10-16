const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

class APIClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed, clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    return data.accessToken;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - Try to refresh token
    if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh') {
      try {
        // Ensure only one refresh is happening at a time
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.refreshPromise = this.refreshToken();
        }

        const newToken = await this.refreshPromise;
        this.isRefreshing = false;
        this.refreshPromise = null;

        // Retry the original request with new token
        return this.request<T>(endpoint, options, true);
      } catch (error) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        throw error;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async register(email: string, name: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/user/profile', {
      method: 'GET',
    });
  }

  // Scan APIs
  async createScan(domain: string, repositoryUrl?: string) {
    return this.request('/scans', {
      method: 'POST',
      body: JSON.stringify({ domain, repositoryUrl }),
    });
  }

  async getScans() {
    return this.request('/scans', {
      method: 'GET',
    });
  }

  async getScan(scanId: number) {
    return this.request(`/scans/${scanId}`, {
      method: 'GET',
    });
  }

  async togglePublic(scanId: number) {
    return this.request(`/scans/${scanId}/toggle-public`, {
      method: 'PATCH',
    });
  }

  async getJsonReport(scanId: number) {
    return this.request(`/scans/${scanId}/json-report`, {
      method: 'GET',
    });
  }

  // AI Analysis APIs
  async analyzeWithAI(scanId: number) {
    return this.request(`/scans/${scanId}/analyze-with-ai`, {
      method: 'POST',
    });
  }

  async generateFixGuide(scanId: number, vulnerabilityName: string) {
    return this.request(`/scans/${scanId}/generate-fix-guide`, {
      method: 'POST',
      body: JSON.stringify({ vulnerabilityName }),
    });
  }

  async downloadPdf(scanId: number) {
    const url = `${this.baseURL}/scans/${scanId}/download-pdf`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    // Get blob from response
    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `vibescan-report-${scanId}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async upgradeScanToPaid(scanId: number) {
    return this.request(`/scans/${scanId}/upgrade-to-paid`, {
      method: 'POST',
    });
  }

  // Payment APIs
  async getPrices() {
    return this.request('/payment/prices', {
      method: 'GET',
    });
  }

  async createPaymentOrder(scanCount: number) {
    return this.request('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ scanCount }),
    });
  }

  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    return this.request('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
  }

  // User APIs
  async getUserStats() {
    return this.request('/user/stats', {
      method: 'GET',
    });
  }

  async getRanking(limit: number = 10) {
    return this.request(`/ranking?limit=${limit}`, {
      method: 'GET',
    });
  }

  // Subscription APIs
  async getSubscription() {
    return this.request('/subscription/current', {
      method: 'GET',
    });
  }

  async getSubscriptionPlans() {
    return this.request('/subscription/plans', {
      method: 'GET',
    });
  }

  async initiateSubscription(plan: string) {
    return this.request('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async completeBillingAuth(authKey: string, customerKey: string) {
    return this.request('/subscription/complete-billing-auth', {
      method: 'POST',
      body: JSON.stringify({ authKey, customerKey }),
    });
  }

  async changePlan(newPlan: string) {
    return this.request('/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify({ newPlan }),
    });
  }

  async cancelSubscription() {
    return this.request('/subscription/cancel', {
      method: 'POST',
    });
  }

  async resumeSubscription() {
    return this.request('/subscription/resume', {
      method: 'POST',
    });
  }

  async cancelSubscriptionImmediately() {
    return this.request('/subscription/cancel-immediately', {
      method: 'POST',
    });
  }

  async getUserLimits() {
    return this.request('/user/limits', {
      method: 'GET',
    });
  }

  // Scan Stats APIs
  async getCapabilities() {
    return this.request('/scan-stats/capabilities', {
      method: 'GET',
    });
  }

  async getGlobalStats() {
    return this.request('/scan-stats/global-stats', {
      method: 'GET',
    });
  }
}

export const apiClient = new APIClient(API_URL);
export default apiClient;
