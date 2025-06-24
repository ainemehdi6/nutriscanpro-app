import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Sunrise, Sun, Sunset, Coffee } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { Meal, MealType } from '@/types/api';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Sunrise, color: '#F59E0B' },
  { type: 'LUNCH', label: 'Lunch', icon: Sun, color: '#EF4444' },
  { type: 'DINNER', label: 'Dinner', icon: Sunset, color: '#8B5CF6' },
  { type: 'SNACK', label: 'Snacks', icon: Coffee, color: '#06B6D4' },
] satisfies { type: MealType; label: string; icon: any; color: string }[];

export default function HomeScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadMealsByDate = async (date: Date) => {
  try {
    const mealsByDate = await apiService.getMealsByDate(date);
    if (!mealsByDate || mealsByDate.length === 0) {
      Alert.alert('No meals found', 'You have not added any meals for this date.');
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
      Alert.alert('Error', "Failed to load meals for selected date");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMealsByDate(selectedDate);
  }, [selectedDate, meals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealsByDate(selectedDate);
    setRefreshing(false);
  };

  const getTotal = (key: 'carbs' | 'protein'): number => {
    return meals.reduce((total, meal) => {
      return total + meal.items.reduce((sum, item) => {
        const value = item.food?.[key];
        const size = item.food?.servingSize;
        return value && size ? sum + (item.quantity * value) / size : sum;
      }, 0);
    }, 0);
  };

  const getGoalValue = (key: 'calories' | 'carbs' | 'protein') => {
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
    loadMealsByDate(selectedDate);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>

          <View style={styles.headerStats}>
            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{meals.reduce((t, m) => t + (m.totalCalories || 0), 0).toFixed(0)}Kcal</Text>
              {getGoalValue('calories') && (
                <Text style={styles.caloriesGoal}>of {getGoalValue('calories')} Kcal</Text>
              )}
            </View>

            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesLabel}>Carbs</Text>
              <Text style={styles.caloriesValue}>{getTotal('carbs').toFixed(0)}g</Text>
              {getGoalValue('carbs') && (
                <Text style={styles.caloriesGoal}>of {getGoalValue('carbs')}g</Text>
              )}
            </View>

            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesLabel}>Protein</Text>
              <Text style={styles.caloriesValue}>{getTotal('protein').toFixed(0)}g</Text>
              {getGoalValue('protein') && (
                <Text style={styles.caloriesGoal}>of {getGoalValue('protein')}g</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => updateSelectedDate('prev')}>
            <Text style={{ color: 'white', marginRight: 16 }}>{'<'} Prev</Text>
          </TouchableOpacity>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity onPress={() => updateSelectedDate('next')}>
            <Text style={{ color: 'white', marginLeft: 16 }}>Next {'>'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>

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
                    <Text style={styles.mealTitle}>{label}</Text>
                    <Text style={styles.mealStats}>
                      {meal ? `${meal.items.length} items • ${meal.totalCalories?.toFixed(0)}Kcal` : 'No items added'}
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
                      <Text style={styles.foodName}>{item.food?.name}</Text>
                      <Text style={styles.foodCalories}>
                        {item.food?.carbs && item.food?.servingSize
                          ? `${((item.quantity * item.food.carbs) / item.food.servingSize).toFixed(0)}g of Carbs | `
                          : ''}
                        {item.food?.protein && item.food?.servingSize 
                          ? `${((item.quantity * item.food.protein) / item.food.servingSize).toFixed(0)}g of Protein | ` 
                          : ''}
                        {item.food?.calories && item.food?.servingSize 
                          ? `${((item.quantity * item.food.calories) / item.food.servingSize).toFixed(0)}Kcal` 
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  dateNavigation:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
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
    marginBottom: 20,
  },
  caloriesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%',
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
