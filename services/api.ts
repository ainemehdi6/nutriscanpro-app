import { Platform, Alert } from 'react-native';
import { User, AuthResponse, Meal, AddItemResponse, MealType, AnalyseMealResponse, Food, Goals, DeleteItemResponse } from '@/types/api';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const requestCache = new Map<string, { data: any; timestamp: number }>();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RequestOptions extends RequestInit {
  skipCache?: boolean;
  retryCount?: number;
}

class ApiService {
  private token: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
    requestCache.clear(); // Clear cache when token changes
  }

  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retryCount = 0, skipCache = false, ...requestOptions } = options;
    const cacheKey = this.getCacheKey(endpoint, requestOptions);

    // Check cache for GET requests
    if (!skipCache && requestOptions.method === 'GET' && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const result = await this.makeRequest<T>(endpoint, requestOptions);
      
      // Cache successful GET requests
      if (requestOptions.method === 'GET' && !skipCache) {
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
        await this.delay(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        return this.makeRequestWithRetry<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        });
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.message?.includes('Session Expired') && 
           (error.message?.includes('Network') || 
            (error.status >= 500 && error.status < 600));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: { [key: string]: string } = {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as any),
        },
      });

      if (response.status === 401) {
        this.clearToken();
        Alert.alert('Session Expired', 'Please log in again.');
        router.push({
          pathname: '/auth/login',
        });
        throw new Error('Session Expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Clear cache for specific endpoints
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of requestCache.keys()) {
        if (key.includes(pattern)) {
          requestCache.delete(key);
        }
      }
    } else {
      requestCache.clear();
    }
  }

  // Clear cache for meal-related requests
  clearMealsCache() {
    this.clearCache('/meals');
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.makeRequestWithRetry<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipCache: true,
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.makeRequestWithRetry<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      skipCache: true,
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequestWithRetry<User>('/auth/profile');
  }

  async getTodayMeals(): Promise<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.makeRequestWithRetry<Meal[]>(`/meals/date?date=${today}`);
  }

  async getMealsByDate(date: Date): Promise<Meal[]> {
    return this.makeRequestWithRetry<Meal[]>(`/meals/date?date=${date.toISOString().split('T')[0]}`);
  }

  async getMealHistory(page: number = 1, limit: number = 20): Promise<Meal[]> {
    return this.makeRequestWithRetry<Meal[]>(`/meals?page=${page}&limit=${limit}`);
  }

  async createMeal(mealType: MealType, date: string): Promise<Meal> {
    const result = await this.makeRequestWithRetry<Meal>(`/meals`, {
      method: 'POST',
      body: JSON.stringify({ type: mealType, date }),
      skipCache: true,
    });
    
    // Clear meals cache after creating a new meal
    this.clearMealsCache();
    return result;
  }

  async getFoodByBarcode(barcode: string): Promise<Food> {
    return this.makeRequestWithRetry<Food>(`/foods/barcode/${barcode}`);
  }

  async addItemByBarcode(mealId: string, barcode: string, quantity: number = 1): Promise<AddItemResponse> {
    const result = await this.makeRequestWithRetry<AddItemResponse>(`/meals/${mealId}/add-item-by-barcode`, {
      method: 'POST',
      body: JSON.stringify({ barcode, quantity }),
      skipCache: true,
    });
    
    this.clearMealsCache();
    return result;
  }

  async AnalyseItemByImage(imageUri: string, context: string = 'Lunch plate'): Promise<AnalyseMealResponse> {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, 'meal-image.jpg');
    } else {
      formData.append('file', {
        uri: imageUri,
        name: 'meal-image.jpg',
        type: 'image/jpeg',
      } as any);
    }

    return this.makeRequestWithRetry<AnalyseMealResponse>(`/ai-analysis/image`, {
      method: 'POST',
      body: formData,
      skipCache: true,
    });
  }

  async addItemByDescription(mealId: String, description: string): Promise<AddItemResponse> {
    const result = await this.makeRequestWithRetry<AddItemResponse>(`/meals/${mealId}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({ description }),
      skipCache: true,
    });
    
    this.clearMealsCache();
    return result;
  }

  async deleteFoodFromMeal(mealId: String, foodId: string): Promise<DeleteItemResponse> {
    const result = await this.makeRequestWithRetry<DeleteItemResponse>(`/meals/${mealId}/delete-food/${foodId}`, {
      method: 'DELETE',
      skipCache: true,
    });
    
    this.clearMealsCache();
    return result;
  }

  async analyseMealDescription(description: string): Promise<AnalyseMealResponse> {
    return this.makeRequestWithRetry<AddItemResponse>(`/ai-analysis/text`, {
      method: 'POST',
      body: JSON.stringify({ description }),
      skipCache: true,
    });
  }

  async addFoodsToMealFromAiAnalyste(mealId: string, foods: Food[]): Promise<AnalyseMealResponse> {
    const result = await this.makeRequestWithRetry<AddItemResponse>(`/meals/${mealId}/add-new-foods`, {
      method: 'POST',
      body: JSON.stringify({ foods }),
      skipCache: true,
    });
    
    this.clearMealsCache();
    return result;
  }
  
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const result = await this.makeRequestWithRetry<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      skipCache: true,
    });
    
    // Clear user cache
    this.clearCache('/auth/profile');
    return result;
  }

  async updateUserGoals(goals: Partial<Goals>): Promise<Goals> {
    return this.makeRequestWithRetry<Goals>('/goals', {
      method: 'POST',
      body: JSON.stringify(goals),
      skipCache: true,
    });
  }
}

export const apiService = new ApiService();