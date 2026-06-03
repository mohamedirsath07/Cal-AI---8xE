import { API_ENDPOINTS, ERROR_MESSAGES } from './constants';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface FoodAnalysisRequest {
  imageUri: string;
  quantity?: number;
}

interface FoodAnalysisResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: number;
  ingredients: string[];
}

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    this.timeout = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      return {
        success: false,
        error: ERROR_MESSAGES.networkError,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async analyzeFood(request: FoodAnalysisRequest): Promise<ApiResponse<FoodAnalysisResponse>> {
    return this.makeRequest<FoodAnalysisResponse>(
      'POST',
      API_ENDPOINTS.analyzeFood,
      request,
      { 'X-API-Version': 'v1' }
    );
  }

  async searchFood(query: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      'GET',
      `${API_ENDPOINTS.searchFood}?q=${encodeURIComponent(query)}`
    );
  }

  async uploadLog(logData: any): Promise<ApiResponse<{ logId: string }>> {
    return this.makeRequest<{ logId: string }>(
      'POST',
      API_ENDPOINTS.uploadLog,
      logData
    );
  }

  async getStats(userId: string, timeRange: 'week' | 'month' | 'year' = 'week'): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      'GET',
      `${API_ENDPOINTS.getStats}?userId=${userId}&range=${timeRange}`
    );
  }

  async syncData(userId: string, data: any): Promise<ApiResponse<{ syncedAt: string }>> {
    return this.makeRequest<{ syncedAt: string }>(
      'POST',
      API_ENDPOINTS.syncData,
      { userId, ...data }
    );
  }

  async getFoodDatabase(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(
      'GET',
      API_ENDPOINTS.getFoodDatabase
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
