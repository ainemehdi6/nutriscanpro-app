import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Meal, MealType } from '@/types/api';
import { useI18n } from '@/hooks/useI18n';
import { TranslationKeys } from '@/types/i18n';

interface MealCardProps {
    mealType: {
        type: MealType;
        label: string;
        icon: any;
        color: string;
    };
    meal?: Meal;
    onAddMeal: (mealId: string, type: MealType, selectedDate: string) => void;
    onRemoveItem?: (foodId: string, name: string, type: string, mealId: string) => void;
    selectedDate: string;
}

const MealCard = memo<MealCardProps>(({
    mealType,
    meal,
    onAddMeal,
    onRemoveItem,
    selectedDate,
}) => {
    const { t } = useI18n();
    const Icon = mealType.icon;

    const mealStats = useMemo(() => {
        if (!meal) return t('home.no_items_added');

        return t('home.items_calories', {
            count: meal.items.length,
            calories: meal.totalCalories?.toFixed(0) ?? 0
        });
    }, [meal, t]);

    const handleAddMeal = () => {
        onAddMeal(meal?.id || '', mealType.type, selectedDate);
    };

    const calculateNutrient = (key: 'calories' | 'carbs' | 'protein' | 'fat', quantity: number, food?: any) => {
        if (!food || typeof food[key] !== 'number' || typeof food.servingSize !== 'number') return 0;
        return (quantity * food[key]) / food.servingSize;
    };

    return (
        <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                    <View style={[styles.mealIcon, { backgroundColor: `${mealType.color}20` }]}>
                        <Icon size={20} color={mealType.color} />
                    </View>
                    <View>
                        <Text style={styles.mealTitle}>
                            {t(mealType.label as keyof TranslationKeys)}
                        </Text>
                        <Text style={styles.mealStats}>{mealStats}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: mealType.color }]}
                    onPress={handleAddMeal}
                >
                    <Plus size={16} color="white" />
                </TouchableOpacity>
            </View>

            {meal?.items && meal.items.length > 0 && (
                <View style={styles.mealItems}>
                    {meal.items.map((item, index) => (
                        <View key={`${item.foodId}-${index}`} style={styles.foodItem}>
                            <View style={styles.foodItemHeader}>
                                <Text style={styles.foodName}>
                                    {item.quantity}{item.unit} {t('home.of')} {item.food?.name}
                                </Text>
                                {onRemoveItem && (
                                    <TouchableOpacity
                                        onPress={() => onRemoveItem(item.foodId, item.food?.name, mealType.label, meal.id)}
                                        style={styles.removeButton}
                                    >
                                        <Trash2 size={15} color="red" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.foodCalories}>
                                {item.food?.calories && item.food?.servingSize
                                    ? `${((item.quantity * item.food.calories) / item.food.servingSize).toFixed(0)} ${t('profile.calories')} | `
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
});

MealCard.displayName = 'MealCard';

const styles = StyleSheet.create({
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
    foodItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    foodName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    removeButton: {
        padding: 4,
    },
    foodCalories: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default MealCard; 