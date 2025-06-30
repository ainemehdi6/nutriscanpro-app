import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { apiService } from '@/services/api';
import { Meal } from '@/types/api';
import { useI18n } from './useI18n';

interface UseMealsOptions {
  date?: Date;
  enableCache?: boolean;
  autoRefresh?: boolean;
}

interface UseMealsReturn {
  meals: Meal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadMeals: (date?: Date) => Promise<void>;
  refreshMeals: () => Promise<void>;
  removeMealItem: (mealId: string, foodId: string, foodName: string) => Promise<void>;
  totalCalories: number;
  totalMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Simple in-memory cache
const mealsCache = new Map<string, { data: Meal[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useMeals(options: UseMealsOptions = {}): UseMealsReturn {
  const { date = new Date(), enableCache = true, autoRefresh = true } = options;
  const { t } = useI18n();
  
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  const calculateMealCalories = useCallback((meal: Meal): number => {
    return Math.round(
      meal.items.reduce((sum, item) => {
        if (
          item.food &&
          typeof item.food.calories === 'number' &&
          typeof item.food.servingSize === 'number' &&
          typeof item.quantity === 'number'
        ) {
          return sum + (item.quantity * item.food.calories) / item.food.servingSize;
        }
        return sum;
      }, 0)
    );
  }, []);

  const processMealsData = useCallback((mealsData: Meal[]): Meal[] => {
    return mealsData.map(meal => ({
      ...meal,
      totalCalories: calculateMealCalories(meal),
    }));
  }, [calculateMealCalories]);

  const loadMeals = useCallback(async (targetDate?: Date) => {
    const targetDateKey = (targetDate || date).toISOString().split('T')[0];
    
    try {
      setError(null);
      
      // Check cache first
      if (enableCache && mealsCache.has(targetDateKey)) {
        const cached = mealsCache.get(targetDateKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setMeals(processMealsData(cached.data));
          setLoading(false);
          return;
        }
      }

      const mealsData = await apiService.getMealsByDate(targetDate || date);
      const processedMeals = processMealsData(mealsData || []);
      
      setMeals(processedMeals);
      
      // Update cache
      if (enableCache) {
        mealsCache.set(targetDateKey, {
          data: mealsData || [],
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meals';
      setError(errorMessage);
      Alert.alert(t('common.error'), t('home.failed_load_meals'));
    } finally {
      setLoading(false);
    }
  }, [date, enableCache, processMealsData, t]);

  const refreshMeals = useCallback(async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  }, [loadMeals]);

  const removeMealItem = useCallback(async (mealId: string, foodId: string, foodName: string) => {
    try {
      setLoading(true);
      const result = await apiService.deleteFoodFromMeal(mealId, foodId);
      
      if (result.success) {
        // Update local state
        setMeals(prevMeals => 
          prevMeals.map(meal => 
            meal.id === mealId 
              ? { ...meal, items: meal.items.filter(item => item.foodId !== foodId) }
              : meal
          ).map(meal => ({
            ...meal,
            totalCalories: calculateMealCalories(meal),
          }))
        );
        
        // Clear cache for this date
        mealsCache.delete(cacheKey);
        
        Alert.alert(t('common.success'), t('home.delete_success'));
      } else {
        Alert.alert(t('common.error'), result.message || t('home.delete_failed'));
      }
    } catch (err) {
      console.error('Failed to delete food:', err);
      Alert.alert(t('common.error'), t('home.delete_failed_retry'));
    } finally {
      setLoading(false);
    }
  }, [calculateMealCalories, cacheKey, t]);

  // Calculate totals
  const totalCalories = useMemo(() => {
    return meals.reduce((total, meal) => total + (meal.totalCalories || 0), 0);
  }, [meals]);

  const totalMacros = useMemo(() => {
    return meals.reduce(
      (totals, meal) => {
        meal.items.forEach(item => {
          if (item.food && item.food.servingSize) {
            const ratio = item.quantity / item.food.servingSize;
            totals.protein += (item.food.protein || 0) * ratio;
            totals.carbs += (item.food.carbs || 0) * ratio;
            totals.fat += (item.food.fat || 0) * ratio;
          }
        });
        return totals;
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  // Auto-refresh when date changes
  useEffect(() => {
    if (autoRefresh) {
      loadMeals();
    }
  }, [date, autoRefresh, loadMeals]);

  return {
    meals,
    loading,
    refreshing,
    error,
    loadMeals,
    refreshMeals,
    removeMealItem,
    totalCalories,
    totalMacros,
  };
} 