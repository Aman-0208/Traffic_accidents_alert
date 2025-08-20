const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async register(email: string, password: string, name: string, role?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Stream methods
  async getStreams() {
    return this.request<any[]>('/streams');
  }

  async createStream(url: string, location: string, coordinates?: any) {
    return this.request<any>('/streams', {
      method: 'POST',
      body: JSON.stringify({ url, location, coordinates }),
    });
  }

  async updateStream(id: string, data: any) {
    return this.request<any>(`/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStream(id: string) {
    return this.request(`/streams/${id}`, {
      method: 'DELETE',
    });
  }

  async startStream(id: string) {
    return this.request(`/streams/${id}/start`, {
      method: 'POST',
    });
  }

  async stopStream(id: string) {
    return this.request(`/streams/${id}/stop`, {
      method: 'POST',
    });
  }

  // Alert methods
  async getAlerts(params?: { status?: string; severity?: string; limit?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/alerts${queryString}`);
  }

  async updateAlertStatus(id: string, status: string) {
    return this.request<any>(`/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async sendAlert(id: string) {
    return this.request<any>(`/alerts/${id}/send`, {
      method: 'POST',
    });
  }

  async getAlertStats() {
    return this.request<any>('/alerts/stats/summary');
  }

  // ML methods
  async getMLStatus() {
    return this.request<any>('/ml/status');
  }

  async analyzeImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.request<any>('/ml/analyze-image', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async analyzeImageUrl(imageUrl: string) {
    return this.request<any>('/ml/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  }

  async getMLMetrics() {
    return this.request<any>('/ml/metrics');
  }

  // New ML methods
  async getWeatherData() {
    return this.request<any>('/ml/weather');
  }

  async getSampleImages() {
    return this.request<any>('/ml/sample-images');
  }

  async getTrafficConditions() {
    return this.request<any>('/ml/traffic-conditions');
  }

  async getComprehensiveAnalysis() {
    return this.request<any>('/ml/analysis');
  }

  async testMLModel() {
    return this.request<any>('/ml/test', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;