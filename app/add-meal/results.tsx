import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Edit3, Trash2 } from 'lucide-react-native';
import { Food, MealType } from '@/types/api';
import Button from '@/components/Button';
import { apiService } from '@/services/api';
import { useI18n } from '@/hooks/useI18n';

export default function ResultsScreen() {
  const { t } = useI18n();
  const { mealId, type, method, data, selectedDate } = useLocalSearchParams<{
    mealId?: string;
    type: MealType;
    method: string;
    data: string;
    selectedDate: string;
  }>();

  const [mealItems, setMealItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      try {
        const parsedItems = JSON.parse(data);
        setMealItems(parsedItems);
      } catch (error) {
        console.error('Failed to parse mealItems data:', error);
        Alert.alert(t('common.error'), t('results.failed_load_data'));
        router.back();
      }
    }
  }, [data]);

  const handleGoBack = () => {
    router.back();
  };

  const handleConfirm = async (mealId: string, foods: Food[]) => {
    setLoading(true);
    const succes = await apiService.addFoodsToMealFromAiAnalyste(mealId, foods);

    if (!succes) {
      setLoading(false);
      Alert.alert(t('common.error'), t('results.failed_add_items'));
      return;
    }
    setLoading(false);

    Alert.alert(
      t('results.meal_added'),
      t('results.successfully_added', { count: mealItems.length, meal: getMealLabel() })
    );

    router.push({
      pathname: '/(tabs)',
      params: {
        selectedDate: selectedDate,
      },
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = mealItems.filter((_, i) => i !== index);
    setMealItems(newItems);

    if (newItems.length === 0) {
      Alert.alert(
        t('results.no_items'),
        t('results.all_items_removed'),
        [
          {
            text: t('common.retry'),
            onPress: () => router.back(),
          },
          {
            text: t('common.cancel'),
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    }
  };

  const getMacros = (food: Food) => {
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let calories = 0;

    const ratio = (food.quantity ?? 1) / (food.servingSize ?? 1);
    protein = (food.protein ?? 0) * ratio;
    carbs = (food.carbs ?? 0) * ratio;
    fat = (food.fat ?? 0) * ratio;
    calories = (food.calories ?? 0) * ratio;
    return {
      protein: protein.toFixed(0),
      carbs: carbs.toFixed(0),
      fat: fat.toFixed(0),
      calories: calories.toFixed(0),
    };
  }

  const getTotalNutrition = () => {
    return mealItems.reduce(
      (total, item) => ({
        calories: (total.calories + (item.calories ?? 0)) * ((item.quantity ?? 1) / (item.servingSize ?? 1)),
        protein: total.protein + (item.protein ?? 0) * ((item.quantity ?? 1) / (item.servingSize ?? 1)),
        carbs: total.carbs + (item.carbs ?? 0) * ((item.quantity ?? 1) / (item.servingSize ?? 1)),
        fat: total.fat + (item.fat ?? 0) * ((item.quantity ?? 1) / (item.servingSize ?? 1)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'barcode': return t('results.scanned_product');
      case 'camera': return t('results.photo_analysis');
      case 'description': return t('results.text_analysis');
      default: return t('results.analysis_results');
    }
  };

  const getMealLabel = () => {
    const mealType = type?.toLowerCase() as keyof typeof mealTranslations;
    return mealTranslations[mealType] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'Meal';
  };

  const mealTranslations = {
    breakfast: t('meals.breakfast'),
    lunch: t('meals.lunch'),
    dinner: t('meals.dinner'),
    snacks: t('meals.snacks'),
  };

  const totals = getTotalNutrition();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getMethodTitle()}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.methodLabel}>{t('results.adding_to', { meal: getMealLabel() })}</Text>
          <Text style={styles.itemCount}>{t('results.items_found', { count: mealItems.length })}</Text>

          <View style={styles.nutritionSummary}>
            <View style={styles.caloriesTotal}>
              <Text style={styles.caloriesTotalValue}>{totals.calories.toFixed(0)}</Text>
              <Text style={styles.caloriesTotalLabel}>{t('results.total_calories')}</Text>
            </View>

            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.protein.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>{t('results.protein')}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.carbs.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>{t('results.carbs')}</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.fat.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>{t('results.fat')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>{t('results.detected_items')}</Text>

          {mealItems.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={String(item.quantity)}
                  onChangeText={(text) => {
                    const newItems = [...mealItems];
                    const newQuantity = parseFloat(text.replace(',', '.')) || 0;
                    newItems[index].quantity = newQuantity;
                    setMealItems(newItems);
                  }}
                />
                <Text style={styles.unitLabel}>{item.servingUnit}</Text>
              </View>

              <View style={styles.itemNutrition}>
                <Text style={styles.itemCalories}>{getMacros(item).calories} cal</Text>
                <Text style={styles.itemMacros}>
                  {getMacros(item).protein}g {t('results.protein')} • {getMacros(item).carbs}g {t('results.carbs')} • {getMacros(item).fat}g {t('results.fat')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationText}>
            {t('results.confirm_text')}
          </Text>

          <Button
            title={loading ? t('results.adding_to_meal') : t('results.confirm_add')}
            onPress={() => mealId && handleConfirm(mealId, mealItems)}
            disabled={loading || mealItems.length === 0}
            style={styles.confirmButton}
          />
        </View>
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  methodLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  nutritionSummary: {
    width: '100%',
    alignItems: 'center',
  },
  caloriesTotal: {
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesTotalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22C55E',
  },
  caloriesTotalLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  macroLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: 40,
  },
  confirmText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButton: {
    marginBottom: 12,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    marginRight: 6,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  unitLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmationSection: {
    marginBottom: 40,
  },
  confirmationText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemMacros: {
    fontSize: 12,
    color: '#6B7280',
  },
});