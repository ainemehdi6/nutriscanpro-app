import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Modal, StyleSheet, Pressable, Dimensions } from 'react-native';
import { apiService } from '@/services/api';
import { Exercise } from '@/types/api';
import { i18nService } from '@/services/i18n';

const { width } = Dimensions.get('window');

const MUSCLES = [
    'All', 'chest', 'back', 'shoulders', 'legs', 'arms', 'abs', 'glutes', 'calves', 'waist'
];
const EQUIPMENT = [
    'All', 'body weight', 'dumbbell', 'barbell', 'machine', 'kettlebell', 'band', 'cable'
];

const PAGE_SIZE = 12;
const FETCH_LIMIT = 1000;

export default function ExercisesScreen() {
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Exercise | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [muscleFilter, setMuscleFilter] = useState('All');
    const [equipmentFilter, setEquipmentFilter] = useState('All');
    const [page, setPage] = useState(1);

    // Fetch all exercises once on component mount
    const fetchAllExercises = () => {
        setLoading(true);
        setError(null);
        apiService.getExerciseExamples({
            limit: FETCH_LIMIT,
            offset: 0,
        })
            .then((data) => {
                const exerciseData = Array.isArray(data) ? data : [];
                setAllExercises(exerciseData);
            })
            .catch(() => setError('Failed to load exercises'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAllExercises();
    }, []);

    const filteredExercises = allExercises.filter(ex => {
        const muscleMatch = muscleFilter === 'All' || ex.muscle.toLowerCase().includes(muscleFilter.toLowerCase());
        const equipmentMatch = equipmentFilter === 'All' || ex.equipment.toLowerCase().includes(equipmentFilter.toLowerCase());
        return muscleMatch && equipmentMatch;
    });

    const paginatedExercises = filteredExercises.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filteredExercises.length / PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [muscleFilter, equipmentFilter]);

    const openModal = (ex: Exercise) => {
        setSelected(ex);
        setModalVisible(true);
    };
    const closeModal = () => {
        setModalVisible(false);
        setSelected(null);
    };

    const clearFilters = () => {
        setMuscleFilter('All');
        setEquipmentFilter('All');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>{i18nService.translate('exercises.loading')}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{i18nService.translate('exercises.error')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchAllExercises()}>
                    <Text style={styles.retryButtonText}>{i18nService.translate('exercises.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{i18nService.translate('exercises.title')}</Text>
                <Text style={styles.headerSubtitle}>{i18nService.translate('exercises.subtitle')}</Text>

                <View style={styles.filterContainer}>
                    <View style={styles.filterRow}>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterLabel}>{i18nService.translate('exercises.muscle')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                                {MUSCLES.map((muscle) => (
                                    <TouchableOpacity
                                        key={muscle}
                                        style={[styles.filterChipSmall, muscleFilter === muscle && styles.filterChipActive]}
                                        onPress={() => setMuscleFilter(muscle)}
                                    >
                                        <Text style={[styles.filterChipTextSmall, muscleFilter === muscle && styles.filterChipTextActive]}>
                                            {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={styles.filterRow}>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterLabel}>{i18nService.translate('exercises.equipment')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                                {EQUIPMENT.map((equipment) => (
                                    <TouchableOpacity
                                        key={equipment}
                                        style={[styles.filterChipSmall, equipmentFilter === equipment && styles.filterChipActive]}
                                        onPress={() => setEquipmentFilter(equipment)}
                                    >
                                        <Text style={[styles.filterChipTextSmall, equipmentFilter === equipment && styles.filterChipTextActive]}>
                                            {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {(muscleFilter !== 'All' || equipmentFilter !== 'All') && (
                        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                            <Text style={styles.clearFiltersText}>{i18nService.translate('exercises.clear_filters')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {paginatedExercises.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>{i18nService.translate('exercises.no_exercises')}</Text>
                            <Text style={styles.emptyStateSubtext}>{i18nService.translate('exercises.no_exercises_subtitle')}</Text>
                        </View>
                    ) : (
                        paginatedExercises.map((ex, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.card}
                                activeOpacity={0.9}
                                onPress={() => openModal(ex)}
                            >
                                <View style={styles.cardImageContainer}>
                                    <Image source={{ uri: ex.image }} style={styles.cardImage} resizeMode="cover" />
                                    <View style={styles.cardOverlay}>
                                        <View style={styles.cardBadge}>
                                            <Text style={styles.cardBadgeText}>{ex.muscle}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{ex.name.toUpperCase()}</Text>
                                    <Text style={styles.cardDesc} numberOfLines={2}>
                                        {Array.isArray(ex.description) ? ex.description.join(' ') : ex.description}
                                    </Text>
                                    <View style={styles.cardFooter}>
                                        <View style={styles.cardTag}>
                                            <Text style={styles.cardTagText}>{ex.equipment}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.viewButton}>
                                            <Text style={styles.viewButtonText}>{i18nService.translate('exercises.view_details')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
                <View style={styles.paginationContainer}>
                    <TouchableOpacity style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]} onPress={() => setPage(page - 1)} disabled={page === 1}>
                        <Text style={styles.paginationButtonText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>{i18nService.translate('exercises.page')} {page} {i18nService.translate('exercises.of')} {totalPages || 1}</Text>
                    <TouchableOpacity style={[styles.paginationButton, page === totalPages || totalPages === 0 ? styles.paginationButtonDisabled : null]} onPress={() => setPage(page + 1)} disabled={page === totalPages || totalPages === 0}>
                        <Text style={styles.paginationButtonText}>{'>'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeModal}
                    />
                    <View style={styles.modalContainer}>
                        {selected && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{selected.name.toUpperCase()}</Text>
                                    <TouchableOpacity style={styles.closeIcon} onPress={closeModal}>
                                        <Text style={styles.closeIconText}>×</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                                    <View style={styles.modalImageContainer}>
                                        <Image source={{ uri: selected.image }} style={styles.modalImage} resizeMode="cover" />
                                    </View>

                                    <View style={styles.modalInfo}>
                                        <View style={styles.modalTags}>
                                            <View style={styles.modalTag}>
                                                <Text style={styles.modalTagLabel}>Muscle</Text>
                                                <Text style={styles.modalTagValue}>{selected.muscle}</Text>
                                            </View>
                                            <View style={styles.modalTag}>
                                                <Text style={styles.modalTagLabel}>Equipment</Text>
                                                <Text style={styles.modalTagValue}>{selected.equipment}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.modalSection}>
                                            <Text style={styles.modalSectionTitle}>{i18nService.translate('exercises.instructions')}</Text>
                                            <View style={styles.modalInstructions}>
                                                {Array.isArray(selected.description)
                                                    ? selected.description.map((line, i) => (
                                                        <View key={i} style={styles.instructionItem}>
                                                            <View style={styles.instructionNumber}>
                                                                <Text style={styles.instructionNumberText}>{i + 1}</Text>
                                                            </View>
                                                            <Text style={styles.instructionText}>{line}</Text>
                                                        </View>
                                                    ))
                                                    : (
                                                        <Text style={styles.instructionText}>{selected.description}</Text>
                                                    )}
                                            </View>
                                        </View>

                                        {selected.video && (
                                            <TouchableOpacity
                                                style={styles.modalVideoButton}
                                                onPress={() => Linking.openURL(selected.video)}
                                            >
                                                <Text style={styles.modalVideoButtonText}>{i18nService.translate('exercises.watch_video')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#22C55E',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E0F2FE',
        fontWeight: '500',
        marginBottom: 10,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    cardImageContainer: {
        position: 'relative',
        height: 200,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    cardBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    cardBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    cardContent: {
        padding: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    cardTagText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    viewButton: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '100%',
        height: '80%',
        maxWidth: width - 32,
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 0,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        flex: 1,
    },
    closeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIconText: {
        fontSize: 20,
        color: '#64748B',
        fontWeight: 'bold',
    },
    modalImageContainer: {
        position: 'relative',
        height: 200,
        width: '100%',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalInfo: {
        padding: 20,
    },
    modalTags: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    modalTag: {
        flex: 1,
        marginRight: 12,
        marginTop: 40,
    },
    modalTagLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 4,
    },
    modalTagValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    modalSection: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    modalInstructions: {
        gap: 12,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    instructionNumberText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    modalVideoButton: {
        backgroundColor: '#22C55E',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    modalVideoButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'column',
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    filterRow: {
        width: '100%',
        marginBottom: 12,
    },
    filterItem: {
        marginBottom: 0,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 6,
        opacity: 0.9,
    },
    filterScroll: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterChipSmall: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    filterChipActive: {
        backgroundColor: '#FFFFFF',
    },
    filterChipTextSmall: {
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: 12,
    },
    filterChipTextActive: {
        color: '#22C55E',
    },
    clearFiltersButton: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    clearFiltersText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    modalScrollView: {
        flex: 1,
        paddingBottom: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    paginationButton: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    paginationButtonDisabled: {
        backgroundColor: '#A7F3D0',
    },
    paginationButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    paginationText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
}); 