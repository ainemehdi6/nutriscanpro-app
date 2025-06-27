import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { Meal } from '@/types/api';
import { ActivityIndicator } from 'react-native';

export default function HistoryScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMealHistory = async () => {
    try {
      const history = await apiService.getMealHistory();
      setMeals(history);
    } catch (error) {
      console.error('Failed to load meal history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealHistory();
    setRefreshing(false);
  };

  useEffect(() => {
      loadMealHistory();
  }, []);

  const getMacros = (meal: Meal) => {
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let calories = 0;

    meal.items.forEach(item => {
      const { food, quantity } = item;
      const ratio = quantity / (food.servingSize ?? 1);

      protein += (food.protein ?? 0) * ratio;
      carbs += (food.carbs ?? 0) * ratio;
      fat += (food.fat ?? 0) * ratio;
      calories += (food.calories ?? 0) * ratio;
    });

    return {
      protein: protein.toFixed(0),
      carbs: carbs.toFixed(0),
      fat: fat.toFixed(0),
      calories: calories.toFixed(0),
    };
  };

  const groupMealsByDate = () => {
    const grouped: { [key: string]: Meal[] } = {};
    
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getTotalCaloriesForDate = (mealsForDate: Meal[]) => {
    return mealsForDate.reduce((total, meal) => {
      const mealCalories = meal.items.reduce((mealTotal, item) => {
        const calories = item.food?.calories ?? 0;
        const servingSize = item.food?.servingSize ?? 1;
        return mealTotal + calories * (item.quantity / servingSize);
      }, 0);
      return total + mealCalories;
    }, 0).toFixed(0);
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#EF4444';
      case 'dinner': return '#8B5CF6';
      case 'snack': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  const groupedMeals = groupMealsByDate();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Calendar size={24} color="white" />
          <Text style={styles.headerTitle}>Meal History</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {groupedMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Meal History</Text>
              <Text style={styles.emptyText}>Start tracking your meals to see your history here</Text>
            </View>
          ) : (
            groupedMeals.map(([date, mealsForDate]) => (
              <View key={date} style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{formatDate(date)}</Text>
                  <Text style={styles.dateSummary}>
                    {getTotalCaloriesForDate(mealsForDate)} Kcal • {mealsForDate.length} meals
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
                              {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                            </Text>
                            <Text style={styles.mealItemCount}>
                              {meal.items.length} items
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
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.carbs}g</Text>
                          <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.fat}g</Text>
                          <Text style={styles.macroLabel}>Fat</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
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