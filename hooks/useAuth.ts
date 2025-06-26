import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.initialize();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const unsubscribe = authService.addListener(setUser);
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await authService.login(email, password);
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    await authService.register(email, password, name);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
  };

  return {
    user,
    loading,
    isLoggedIn: authService.isLoggedIn(),
    login,
    register,
    logout,
  };
}