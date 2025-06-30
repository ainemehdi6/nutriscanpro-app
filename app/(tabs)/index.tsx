import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Sunrise, Sun, Sunset, Coffee, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useMeals } from '@/hooks/useMeals';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { apiService } from '@/services/api';
import { Meal, MealType } from '@/types/api';
import { TranslationKeys } from '@/types/i18n';
import LoadingScreen from '@/components/LoadingScreen';
import MealCard from '@/components/MealCard';
import StatsCard from '@/components/StatsCard';
import ErrorBoundary from '@/components/ErrorBoundary';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'meals.breakfast', icon: Sunrise, color: '#F59E0B' },
  { type: 'LUNCH', label: 'meals.lunch', icon: Sun, color: '#EF4444' },
  { type: 'DINNER', label: 'meals.dinner', icon: Sunset, color: '#8B5CF6' },
  { type: 'SNACK', label: 'meals.snacks', icon: Coffee, color: '#06B6D4' },
] satisfies { type: MealType; label: string; icon: any; color: string }[];

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, currentLanguage } = useI18n();
  const { formatDateLong } = useDateFormatter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    meals,
    loading,
    refreshing,
    error,
    refreshMeals,
    removeMealItem,
    totalCalories,
    totalMacros,
  } = useMeals({ date: selectedDate });

  const handleAddMeal = useCallback((mealId: string, type: MealType, selectedDate: string) => {
    router.push(`/add-meal?mealId=${mealId}&type=${type}&selectedDate=${selectedDate}`);
  }, []);

  const handleRemoveItem = useCallback((foodId: string, name: string, type: string, mealId: string) => {
    removeMealItem(mealId, foodId, name);
  }, [removeMealItem]);

  const updateSelectedDate = useCallback((direction: 'next' | 'prev') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  const getGoalValue = useCallback((key: 'calories' | 'carbs' | 'protein' | 'fat') => {
    const lastGoal = user?.goals?.slice(-1)[0];
    return lastGoal?.[key];
  }, [user?.goals]);

  const onRefresh = useCallback(async () => {
    await refreshMeals();
  }, [refreshMeals]);

  // Memoize meal lookup for better performance
  const mealsByType = useMemo(() => {
    const mealMap = new Map();
    meals.forEach(meal => {
      mealMap.set(meal.type, meal);
    });
    return mealMap;
  }, [meals]);

  // Memoize stats data
  const statsData = useMemo(() => [
    {
      label: t('profile.calories'),
      value: totalCalories.toFixed(0),
      goal: getGoalValue('calories'),
      unit: ' Kcal',
      isMain: true,
    },
    {
      label: t('results.carbs'),
      value: totalMacros.carbs.toFixed(0),
      goal: getGoalValue('carbs'),
      unit: 'g',
    },
    {
      label: t('results.protein'),
      value: totalMacros.protein.toFixed(0),
      goal: getGoalValue('protein'),
      unit: 'g',
    },
    {
      label: t('results.fat'),
      value: totalMacros.fat.toFixed(0),
      goal: getGoalValue('fat'),
      unit: 'g',
    },
  ], [totalCalories, totalMacros, getGoalValue, t]);

  if (loading && !refreshing) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <View style={styles.errorContainer}>
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
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{t('home.hello', { name: user?.name ?? '' })}</Text>
            <Text style={styles.date}>{formatDateLong(selectedDate)}</Text>

            {/* Main Calories Card */}
            <View style={[styles.headerStats, { justifyContent: 'center' }]}>
              <StatsCard {...statsData[0]} />
            </View>

            {/* Macro Cards */}
            <View style={styles.headerStats}>
              {statsData.slice(1).map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </View>
          </View>

          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => updateSelectedDate('prev')}>
              <Text style={styles.navButton}>{'<'} {t('home.prev')}</Text>
            </TouchableOpacity>
            <Text style={styles.date}>{formatDateLong(selectedDate)}</Text>
            <TouchableOpacity onPress={() => updateSelectedDate('next')}>
              <Text style={styles.navButton}>{t('home.next')} {'>'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('home.today_meals')}</Text>

          {MEAL_TYPES.map((mealType) => (
            <MealCard
              key={mealType.type}
              mealType={mealType}
              meal={mealsByType.get(mealType.type)}
              onAddMeal={handleAddMeal}
              onRemoveItem={handleRemoveItem}
              selectedDate={selectedDate.toISOString()}
            />
          ))}
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  navButton: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
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
});
