import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiService } from './api';
import { User, AuthResponse } from '@/types/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
    apiService.setToken(token);
  }

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    apiService.clearToken();
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = Platform.OS === 'web' 
        ? localStorage.getItem(USER_KEY)
        : await SecureStore.getItemAsync(USER_KEY);
      
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  async setUser(user: User): Promise<void> {
    this.currentUser = user;
    const userData = JSON.stringify(user);

    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, userData);
    } else {
      await SecureStore.setItemAsync(USER_KEY, userData);
    }
    
    this.notifyListeners(user);
  }

  async removeUser(): Promise<void> {
    this.currentUser = null;
    
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    
    this.notifyListeners(null);
  }

  async login(email: string, password: string): Promise<void> {
    const response = await apiService.login(email, password);
    await this.setToken(response.access_token);
    await this.setUser(response.user);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await apiService.register(email, password, name);
    await this.setToken(response.access_token);
    await this.setUser(response.user);
  }

  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  async initialize(): Promise<User | null> {
    const token = await this.getToken();

    if (token) {
      apiService.setToken(token);
      try {
        const user = await apiService.getCurrentUser();
        await this.setUser(user);
        return user;
      } catch (error) {
        await this.logout();
        return null;
      }
    }
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  addListener(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => callback(user));
  }
}

export const authService = new AuthService();