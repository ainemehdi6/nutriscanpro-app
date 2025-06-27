import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Sunrise, Sun, Sunset, Coffee, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { apiService } from '@/services/api';
import { Meal, MealType } from '@/types/api';
import { TranslationKeys } from '@/types/i18n';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'meals.breakfast', icon: Sunrise, color: '#F59E0B' },
  { type: 'LUNCH', label: 'meals.lunch', icon: Sun, color: '#EF4444' },
  { type: 'DINNER', label: 'meals.dinner', icon: Sunset, color: '#8B5CF6' },
  { type: 'SNACK', label: 'meals.snacks', icon: Coffee, color: '#06B6D4' },
] satisfies { type: MealType; label: string; icon: any; color: string }[];

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadMealsByDate = async (date: Date) => {
    try {
      const mealsByDate = await apiService.getMealsByDate(date);
      if (!mealsByDate || mealsByDate.length === 0) {
        setMeals([]);
        return;
      }

      const mealsWithCalories = Object.values(mealsByDate).map(meal => ({
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
      })) as Meal[];

      setMeals(mealsWithCalories);
    } catch (error) {
      console.error('Failed to load meals:', error);
      Alert.alert(t('common.error'), t('home.failed_load_meals'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMealsByDate(selectedDate);
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealsByDate(selectedDate);
    setRefreshing(false);
  };

  const handleRemoveItem = (foodId: string, name: string, type: string, mealId: string) => {
    Alert.alert(
      t('common.delete'),
      t('home.delete_confirm', { name, type }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deleteMealItem = await apiService.deleteFoodFromMeal(mealId, foodId);
              setMeals(prevMeals => prevMeals.filter(m => m.id !== foodId));
              if (deleteMealItem.success) {
                Alert.alert(t('common.success'), t('home.delete_success'));
                await loadMealsByDate(selectedDate);
              } else {
                Alert.alert(t('common.error'), deleteMealItem.message || t('home.delete_failed'));
              }
            } catch (error) {
              console.error('Failed to delete food:', error);
              Alert.alert(t('common.error'), t('home.delete_failed_retry'));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const getTotal = (key: 'carbs' | 'protein' | 'fat'): number => {
    return meals.reduce((total, meal) => {
      return total + meal.items.reduce((sum, item) => {
        return sum + calculateNutrient(key, item.quantity, item.food);
      }, 0);
    }, 0);
  };

  const getGoalValue = (key: 'calories' | 'carbs' | 'protein' | 'fat') => {
    const lastGoal = user?.goals?.slice(-1)[0];
    return lastGoal?.[key];
  };

  const handleAddMeal = (mealId: string, type: MealType, selectedDate: string) => {
    router.push(`/add-meal?mealId=${mealId}&type=${type}&selectedDate=${selectedDate}`);
  };

  const updateSelectedDate = (direction: 'next' | 'prev') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const calculateNutrient = (key: 'calories' | 'carbs' | 'protein' | 'fat', quantity: number, food?: any) => {
    if (!food || typeof food[key] !== 'number' || typeof food.servingSize !== 'number') return 0;
    return (quantity * food[key]) / food.servingSize;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('history.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('history.yesterday');
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{t('home.hello', { name: user?.name ?? '' })}</Text>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>
          <View style={[styles.headerStats, { justifyContent: 'center' }]}>
            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesLabel}>{t('profile.calories')}</Text>
              <Text style={styles.caloriesValue}>
                {meals.reduce((t, m) => t + (m.totalCalories || 0), 0).toFixed(0)} Kcal
              </Text>
              {getGoalValue('calories') && (
                <Text style={styles.caloriesGoal}>
                  {t('home.of_goal', { goal: getGoalValue('calories') ?? 0 })} Kcal
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.headerStats]}>
            <View style={styles.macrosCard}>
              <Text style={styles.caloriesLabel}>{t('results.carbs')}</Text>
              <Text style={styles.caloriesValue}>{getTotal('carbs').toFixed(0)}g</Text>
              {getGoalValue('carbs') && (
                <Text style={styles.caloriesGoal}>
                  {t('home.of_goal', { goal: getGoalValue('carbs') ?? 0 })}g
                </Text>
              )}
            </View>
            <View style={styles.macrosCard}>
              <Text style={styles.caloriesLabel}>{t('results.protein')}</Text>
              <Text style={styles.caloriesValue}>{getTotal('protein').toFixed(0)}g</Text>
              {getGoalValue('protein') && (
                <Text style={styles.caloriesGoal}>
                  {t('home.of_goal', { goal: getGoalValue('protein') ?? 0 })}g
                </Text>
              )}
            </View>
            <View style={styles.macrosCard}>
              <Text style={styles.caloriesLabel}>{t('results.fat')}</Text>
              <Text style={styles.caloriesValue}>{getTotal('fat').toFixed(0)}g</Text>
              {getGoalValue('fat') && (
                <Text style={styles.caloriesGoal}>
                  {t('home.of_goal', { goal: getGoalValue('fat') ?? 0 })}g
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={() => updateSelectedDate('prev')}>
            <Text style={{ color: 'white', marginRight: 16 }}>{'<'} {t('home.prev')}</Text>
          </TouchableOpacity>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity onPress={() => updateSelectedDate('next')}>
            <Text style={{ color: 'white', marginLeft: 16 }}>{t('home.next')} {'>'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('home.today_meals')}</Text>

        {MEAL_TYPES.map(({ type, label, icon: Icon, color }) => {
          const meal = meals.find((m) => m.type === type);

          return (
            <View key={type} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <View style={[styles.mealIcon, { backgroundColor: `${color}20` }]}>
                    <Icon size={20} color={color} />
                  </View>
                  <View>
                    <Text style={styles.mealTitle}>{t(label as keyof TranslationKeys)}</Text>
                    <Text style={styles.mealStats}>
                      {meal
                        ? t('home.items_calories', {
                          count: meal.items.length,
                          calories: meal.totalCalories?.toFixed(0) ?? 0
                        })
                        : t('home.no_items_added')
                      }
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: color }]}
                  onPress={() => handleAddMeal(meal?.id || '', type || 'BREAKFAST', selectedDate.toISOString())}
                >
                  <Plus size={16} color="white" />
                </TouchableOpacity>
              </View>

              {meal?.items && meal.items.length > 0 && (
                <View style={styles.mealItems}>
                  {meal.items.map((item, index) => (
                    <View key={index} style={styles.foodItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.foodName}>
                          {item.quantity}{item.unit} {t('home.of')} {item.food?.name}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveItem(item.foodId, item.food?.name, label, meal.id)}>
                          <Trash2 size={15} color="red" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.foodCalories}>
                        {item.food?.calories && item.food?.servingSize
                          ? `${((item.quantity * item.food.calories) / item.food.servingSize).toFixed(0)} Kcal | `
                          : ''}
                        {item.food?.carbs && item.food?.servingSize
                          ? `${((item.quantity * item.food.carbs) / item.food.servingSize).toFixed(0)}g ${t('home.of_carbs')} | `
                          : ''}
                        {item.food?.protein && item.food?.servingSize
                          ? `${((item.quantity * item.food.protein) / item.food.servingSize).toFixed(0)}g ${t('home.of_protein')} | `
                          : ''}
                        {item.food?.fat && item.food?.servingSize
                          ? `${((item.quantity * item.food.fat) / item.food.servingSize).toFixed(0)}g ${t('home.of_fats')}`
                          : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
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
  caloriesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    width: '45%',
    minWidth: 150,
    marginBottom: 8,
  },
  macrosCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    width: '30%',
    minWidth: 100,
    marginBottom: 8,
  },
  caloriesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  caloriesGoal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mealStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  mealItems: {
    marginTop: 12,
  },
  foodItem: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodCalories: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreItems: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
