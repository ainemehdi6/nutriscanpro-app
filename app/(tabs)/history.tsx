import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { Meal } from '@/types/api';
import { useI18n } from '@/hooks/useI18n';

export default function HistoryScreen() {
  const { t, currentLanguage } = useI18n();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const ITEMS_PER_PAGE = 20;

  const loadMealHistory = async (pageNumber: number = 1, append: boolean = false) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const history = await apiService.getMealHistory();

      // Simulate pagination by slicing the data
      const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedHistory = history.slice(startIndex, endIndex);

      if (append) {
        setMeals(prev => [...prev, ...paginatedHistory]);
      } else {
        setMeals(paginatedHistory);
      }

      // Check if there are more items
      setHasMore(endIndex < history.length);
      setPage(pageNumber);

    } catch (error) {
      console.error('Failed to load meal history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealHistory(1, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadMealHistory(page + 1, true);
    }
  };

  useEffect(() => {
    loadMealHistory(1, false);
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

  const getLocaleForLanguage = (language: string) => {
    const localeMap: { [key: string]: string } = {
      'en': 'en-US',
      'fr': 'fr-FR',
    };
    return localeMap[language] || 'en-US';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('history.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('history.yesterday');
    } else {
      const locale = getLocaleForLanguage(currentLanguage);
      return date.toLocaleDateString(locale, {
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

  const getMealTypeLabel = (type: string) => {
    const mealType = type?.toLowerCase() as keyof typeof mealTranslations;
    return mealTranslations[mealType] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'Meal';
  };

  const mealTranslations = {
    breakfast: t('meals.breakfast'),
    lunch: t('meals.lunch'),
    dinner: t('meals.dinner'),
    snack: t('meals.snacks'),
  };

  const groupedMeals = groupMealsByDate();
  const totalMeals = meals.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Calendar size={24} color="white" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('history.meal_history')}</Text>
            {totalMeals > 0 && (
              <Text style={styles.headerSubtitle}>
                {totalMeals} {t('history.meals')} • Page {page}
              </Text>
            )}
          </View>
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
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {groupedMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>{t('history.no_meal_history')}</Text>
              <Text style={styles.emptyText}>{t('history.start_tracking')}</Text>
            </View>
          ) : (
            groupedMeals.map(([date, mealsForDate]) => (
              <View key={date} style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{formatDate(date)}</Text>
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

          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <Loader2 size={20} color="#6B7280" />
              <Text style={styles.loadingMoreText}>{t('common.loading')}</Text>
            </View>
          )}

          {/* End of List Indicator */}
          {!hasMore && meals.length > 0 && (
            <View style={styles.endOfListContainer}>
              <Text style={styles.endOfListText}>End of meal history</Text>
            </View>
          )}

          {/* Manual Pagination Controls */}
          {meals.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => loadMealHistory(page - 1, false)}
                disabled={page === 1}
              >
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                Page {page}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, !hasMore && styles.paginationButtonDisabled]}
                onPress={() => loadMealHistory(page + 1, false)}
                disabled={!hasMore}
              >
                <Text style={[styles.paginationButtonText, !hasMore && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
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
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  endOfListText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  paginationButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});