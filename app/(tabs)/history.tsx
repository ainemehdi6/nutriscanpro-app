import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { Meal } from '@/types/api';
import { useI18n } from '@/hooks/useI18n';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

interface HistoryMeal extends Meal {
  totalCalories?: number;
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const { formatDateShort } = useDateFormatter();
  const [meals, setMeals] = useState<HistoryMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMealHistory = useCallback(async () => {
    try {
      setError(null);
      const history = await apiService.getMealHistory();

      // Calculate calories for each meal
      const mealsWithCalories = history.map(meal => ({
        ...meal,
        totalCalories: Math.round(
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
        ),
      }));

      setMeals(mealsWithCalories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meal history';
      setError(errorMessage);
      console.error('Failed to load meal history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMealHistory();
    setRefreshing(false);
  }, [loadMealHistory]);

  useEffect(() => {
    loadMealHistory();
  }, [loadMealHistory]);

  const getMacros = useCallback((meal: HistoryMeal) => {
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    meal.items.forEach(item => {
      const { food, quantity } = item;
      const ratio = quantity / (food.servingSize ?? 1);

      protein += (food.protein ?? 0) * ratio;
      carbs += (food.carbs ?? 0) * ratio;
      fat += (food.fat ?? 0) * ratio;
    });

    return {
      protein: protein.toFixed(0),
      carbs: carbs.toFixed(0),
      fat: fat.toFixed(0),
      calories: meal.totalCalories?.toFixed(0) || '0',
    };
  }, []);

  const groupMealsByDate = useMemo(() => {
    const grouped: { [key: string]: HistoryMeal[] } = {};

    meals.forEach(meal => {
      const date = new Date(meal.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(meal);
    });

    return Object.entries(grouped).sort(([a], [b]) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [meals]);

  const getTotalCaloriesForDate = useCallback((mealsForDate: HistoryMeal[]) => {
    return mealsForDate.reduce((total, meal) => {
      return total + (meal.totalCalories || 0);
    }, 0).toFixed(0);
  }, []);

  const getMealTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#EF4444';
      case 'dinner': return '#8B5CF6';
      case 'snack': return '#06B6D4';
      default: return '#6B7280';
    }
  }, []);

  const getMealTypeLabel = useCallback((type: string) => {
    const mealType = type?.toLowerCase() as keyof typeof mealTranslations;
    return mealTranslations[mealType] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'Meal';
  }, []);

  const mealTranslations = useMemo(() => ({
    breakfast: t('meals.breakfast'),
    lunch: t('meals.lunch'),
    dinner: t('meals.dinner'),
    snack: t('meals.snacks'),
  }), [t]);

  if (loading && !refreshing) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <View style={styles.errorContainer}>
          <Calendar size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Calendar size={24} color="white" />
            <Text style={styles.headerTitle}>{t('history.meal_history')}</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {groupMealsByDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>{t('history.no_meal_history')}</Text>
              <Text style={styles.emptyText}>{t('history.start_tracking')}</Text>
            </View>
          ) : (
            groupMealsByDate.map(([date, mealsForDate]) => (
              <View key={date} style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{formatDateShort(date)}</Text>
                  <Text style={styles.dateSummary}>
                    {getTotalCaloriesForDate(mealsForDate)} Kcal • {mealsForDate.length} {t('history.meals')}
                  </Text>
                </View>

                {mealsForDate.map((meal) => {
                  const macros = getMacros(meal);

                  return (
                    <TouchableOpacity key={meal.id} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <View style={styles.mealInfo}>
                          <View
                            style={[
                              styles.mealTypeIndicator,
                              { backgroundColor: getMealTypeColor(meal.type) },
                            ]}
                          />
                          <View>
                            <Text style={styles.mealType}>
                              {getMealTypeLabel(meal.type)}
                            </Text>
                            <Text style={styles.mealItemCount}>
                              {meal.items.length} {t('history.items')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.mealStats}>
                          <Text style={styles.caloriesText}>{macros.calories} Kcal</Text>
                          <ChevronRight size={16} color="#9CA3AF" />
                        </View>
                      </View>

                      <View style={styles.macroInfo}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.protein}g</Text>
                          <Text style={styles.macroLabel}>{t('results.protein')}</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.carbs}g</Text>
                          <Text style={styles.macroLabel}>{t('results.carbs')}</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.fat}g</Text>
                          <Text style={styles.macroLabel}>{t('results.fat')}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  dateSummary: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  mealItemCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
});