import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '@/hooks/useI18n';

interface StatsCardProps {
    label: string;
    value: string | number;
    goal?: number;
    unit?: string;
    isMain?: boolean;
}

const StatsCard = memo<StatsCardProps>(({
    label,
    value,
    goal,
    unit = '',
    isMain = false,
}) => {
    const { t } = useI18n();

    return (
        <View style={[styles.card, isMain ? styles.mainCard : styles.macroCard]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>
                {value}{unit}
            </Text>
            {goal && (
                <Text style={styles.goal}>
                    {t('home.of_goal', { goal })} {unit}
                </Text>
            )}
        </View>
    );
});

StatsCard.displayName = 'StatsCard';

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    mainCard: {
        width: '45%',
        minWidth: 150,
    },
    macroCard: {
        width: '30%',
        minWidth: 100,
    },
    label: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },
    goal: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});

export default StatsCard; 