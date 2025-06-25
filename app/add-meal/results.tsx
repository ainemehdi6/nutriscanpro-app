import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Edit3, Trash2 } from 'lucide-react-native';
import { Food, MealType } from '@/types/api';
import Button from '@/components/Button';
import { apiService } from '@/services/api';

export default function ResultsScreen() {
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
        console.log('Parsed mealItems:', parsedItems);
        setMealItems(parsedItems);
      } catch (error) {
        console.error('Failed to parse mealItems data:', error);
        Alert.alert('Error', 'Failed to load meal data');
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
      Alert.alert('Error', 'Failed to add meal items. Please try again.');
      return;
    }
    setLoading(false);

    Alert.alert(
      'Meal Added!',
      `Successfully added ${mealItems.length} item(s) to your ${type}.`
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
        'No mealItems',
        'All mealItems have been removed. Would you like to try again?',
        [
          {
            text: 'Try Again',
            onPress: () => router.back(),
          },
          {
            text: 'Cancel',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    }
  };

  const getTotalNutrition = () => {
    return mealItems.reduce(
      (total, item) => ({
        calories: total.calories + (item.calories ?? 0),
        protein: total.protein + (item.protein ?? 0),
        carbs: total.carbs + (item.carbs ?? 0),
        fat: total.fat + (item.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'barcode': return 'Scanned Product';
      case 'camera': return 'Photo Analysis';
      case 'description': return 'Text Analysis';
      default: return 'Analysis Results';
    }
  };

  const getMealLabel = () => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Meal';
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
          <Text style={styles.methodLabel}>Adding to {getMealLabel()}</Text>
          <Text style={styles.itemCount}>{mealItems.length} item(s) found</Text>
          
          <View style={styles.nutritionSummary}>
            <View style={styles.caloriesTotal}>
              <Text style={styles.caloriesTotalValue}>{totals.calories}</Text>
              <Text style={styles.caloriesTotalLabel}>Total Calories</Text>
            </View>
            
            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{totals.fat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Detected {getMealLabel()} Meals</Text>
          
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
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{item.calories}</Text>
                  <Text style={styles.nutritionLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{item.protein}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{item.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{item.fat}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.confirmText}>
            Review the detected {getMealLabel()} Meals above. Remove any incorrect mealItems, then confirm to add them to your meal.
          </Text>
          
          <Button
            title={loading ? 'Adding to Meal...' : 'Confirm & Add to Meal'}
            onPress={() => handleConfirm(mealId || '', mealItems)}
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
});