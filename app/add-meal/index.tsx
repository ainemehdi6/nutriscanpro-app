import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, QrCode, Camera, MessageSquare } from 'lucide-react-native';
import { MealType } from '@/types/api';
import { apiService } from '@/services/api';
import { useI18n } from '@/hooks/useI18n';

export default function AddMealScreen() {
  const { t } = useI18n();
  const { mealId: initialMealId, type, selectedDate } = useLocalSearchParams<{
    mealId?: string;
    type: MealType;
    selectedDate: string;
  }>();

  const [mealId, setMealId] = useState(initialMealId);
  const [loading, setLoading] = useState(!initialMealId);

  useEffect(() => {
    const createMealIfNeeded = async () => {
      if (!initialMealId && type && selectedDate) {
        try {
          const response = await apiService.createMeal(type, selectedDate);
          setMealId(response.id);
        } catch (error) {
          console.error('Error creating meal:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    createMealIfNeeded();
  }, [initialMealId, type, selectedDate]);

  const handleGoBack = () => router.back();

  const navigateTo = (path: string) => {
    if (!mealId) return;
    router.push({
      pathname: path as any,
      params: {
        mealId: mealId,
        type: type,
        selectedDate: selectedDate,
      },
    });
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F97316', '#EA580C']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add_meal.add_to', { meal: getMealLabel() })}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('add_meal.choose_method')}</Text>

        <View style={styles.methodsContainer}>
          <TouchableOpacity style={styles.methodCard} onPress={() => navigateTo('/add-meal/barcode')}>
            <View style={[styles.methodIcon, styles.barcodeIcon]}>
              <QrCode size={32} color="white" />
            </View>
            <Text style={styles.methodTitle}>{t('add_meal.scan_barcode')}</Text>
            <Text style={styles.methodDescription}>
              {t('add_meal.scan_barcode_desc')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodCard} onPress={() => navigateTo('/add-meal/camera')}>
            <View style={[styles.methodIcon, styles.cameraIcon]}>
              <Camera size={32} color="white" />
            </View>
            <Text style={styles.methodTitle}>{t('add_meal.take_photo')}</Text>
            <Text style={styles.methodDescription}>
              {t('add_meal.take_photo_desc')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodCard} onPress={() => navigateTo('/add-meal/description')}>
            <View style={[styles.methodIcon, styles.textIcon]}>
              <MessageSquare size={32} color="white" />
            </View>
            <Text style={styles.methodTitle}>{t('add_meal.describe_meal')}</Text>
            <Text style={styles.methodDescription}>
              {t('add_meal.describe_meal_desc')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  methodsContainer: {
    gap: 16,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  barcodeIcon: {
    backgroundColor: '#3B82F6',
  },
  cameraIcon: {
    backgroundColor: '#22C55E',
  },
  textIcon: {
    backgroundColor: '#8B5CF6',
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});