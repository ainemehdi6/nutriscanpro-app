import { Platform } from 'react-native';
import { User, AuthResponse, Meal, AddItemRequest, AddItemResponse, MealType, AnalyseMealResponse, Food } from '@/types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nutriscanpro-api.onrender.com/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
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

    console.log('Making API Request:', { url, options, headers });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as any),
        },
      });
      console.log('API Request:', response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/auth/profile');
  }

  // Meals
  async getTodayMeals(): Promise<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.makeRequest<Meal[]>(`/meals/date?date=${today}`);
  }

  async getMealsByDate(date: Date ): Promise<Meal[]> {
    return this.makeRequest<Meal[]>(`/meals/date?date=${date.toISOString().split('T')[0]}`);
  }

  async getMealHistory(page: number = 1, limit: number = 20): Promise<Meal[]> {
    return this.makeRequest<Meal[]>(`/meals?page=${page}&limit=${limit}`);
  }

  async createMeal(mealType: MealType, date:string): Promise<Meal> {
    return this.makeRequest<Meal>(`/meals`, {
      method: 'POST',
      body: JSON.stringify({ type: mealType, date }),
    });
  }

  async getFoodByBarcode(barcode: string): Promise<Food> {
    return this.makeRequest<Food>(`/foods/barcode/${barcode}`);
  }

  async addItemByBarcode(mealId: string, barcode: string, quantity: number = 1): Promise<AddItemResponse> {
    return this.makeRequest<AddItemResponse>(`/meals/${mealId}/add-item-by-barcode`, {
      method: 'POST',
      body: JSON.stringify({ barcode, quantity }),
    });
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

    return this.makeRequest<AnalyseMealResponse>(`/ai-analysis/image`, {
      method: 'POST',
      body: formData,
    });
  }

  async addItemByDescription(mealId: String, description: string): Promise<AddItemResponse> {
    return this.makeRequest<AddItemResponse>(`/meals/${mealId}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async analyseMealDescription(description: string): Promise<AnalyseMealResponse> {
    return this.makeRequest<AddItemResponse>(`/ai-analysis/text`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async addFoodsToMealFromAiAnalyste(mealId: string, foods: Food[]): Promise<AnalyseMealResponse> {
    return this.makeRequest<AddItemResponse>(`/meals/${mealId}/add-new-foods`, {
      method: 'POST',
      body: JSON.stringify({ foods }),
    });
  }
  
  // User Profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    return this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

export const apiService = new ApiService();