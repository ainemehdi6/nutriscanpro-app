import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { MealType } from '@/types/api';
import Button from '@/components/Button';
import { useI18n } from '@/hooks/useI18n';

export default function DescriptionScreen() {
  const { t } = useI18n();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const { type } = useLocalSearchParams<{ type: MealType }>();
  const { selectedDate } = useLocalSearchParams<{ selectedDate: string }>();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('add_meal.missing_description'));
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.analyseMealDescription(description.trim());

      if (result.foods) {
        router.push({
          pathname: '/add-meal/results',
          params: {
            mealId: mealId,
            selectedDate: selectedDate,
            type: type,
            method: 'description',
            data: JSON.stringify(result.foods),
          },
        });
      } else {
        Alert.alert(
          t('common.error'),
          result.message || t('add_meal.analysis_failed_description'),
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('add_meal.description_analysis_failed'));
    } finally {
      setLoading(false);
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

  const exampleDescriptions = [
    t('add_meal.example_1'),
    t('add_meal.example_2'),
    t('add_meal.example_3'),
    t('add_meal.example_4'),
    t('add_meal.example_5'),
    t('add_meal.example_6'),
    t('add_meal.example_7'),
    t('add_meal.example_8'),
  ];

  const handleExampleTap = (example: string) => {
    setDescription(example);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add_meal.describe_title', { meal: getMealLabel() })}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <View style={styles.iconContainer}>
            <MessageSquare size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>{t('add_meal.what_did_you_eat')}</Text>
          <Text style={styles.subtitle}>
            {t('add_meal.describe_subtitle')}
          </Text>

          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Grilled chicken breast with steamed vegetables and quinoa..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Button
            title={loading ? t('add_meal.analyzing') : t('add_meal.analyze_meal')}
            onPress={handleSubmit}
            disabled={loading || !description.trim()}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>{t('add_meal.need_inspiration')}</Text>

          {exampleDescriptions.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleCard}
              onPress={() => handleExampleTap(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{t('add_meal.tips_title')}</Text>
          <Text style={styles.tipText}>{t('add_meal.tip_1')}</Text>
          <Text style={styles.tipText}>{t('add_meal.tip_2')}</Text>
          <Text style={styles.tipText}>{t('add_meal.tip_3')}</Text>
          <Text style={styles.tipText}>{t('add_meal.tip_4')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  textInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  submitButton: {
    width: '100%',
  },
  examplesSection: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  exampleCard: {
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
  exampleText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
    lineHeight: 16,
  },
});