import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Check, Globe } from 'lucide-react-native';
import { useI18n } from '@/hooks/useI18n';
import { availableLanguages } from '@/locales';
import { Language } from '@/types/i18n';

interface LanguageSelectorProps {
    showLabel?: boolean;
}

export default function LanguageSelector({ showLabel = true }: LanguageSelectorProps) {
    const { t, currentLanguage, setLanguage } = useI18n();
    const [modalVisible, setModalVisible] = useState(false);

    const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

    const handleLanguageSelect = async (language: Language) => {
        await setLanguage(language);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
                <View style={styles.iconContainer}>
                    <Globe size={18} color="#6B7280" />
                </View>
                <View style={styles.content}>
                    {showLabel && (
                        <Text style={styles.label}>{t('profile.language')}</Text>
                    )}
                    <Text style={styles.value}>
                        {currentLanguageInfo?.flag} {currentLanguageInfo?.nativeName}
                    </Text>
                </View>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('profile.language')}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.languageList}>
                        {availableLanguages.map((language) => (
                            <TouchableOpacity
                                key={language.code}
                                style={styles.languageItem}
                                onPress={() => handleLanguageSelect(language.code)}
                            >
                                <View style={styles.languageInfo}>
                                    <Text style={styles.flag}>{language.flag}</Text>
                                    <View>
                                        <Text style={styles.languageName}>{language.nativeName}</Text>
                                        <Text style={styles.languageNameEn}>{language.name}</Text>
                                    </View>
                                </View>
                                {currentLanguage === language.code && (
                                    <Check size={20} color="#22C55E" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        color: '#6B7280',
    },
    modal: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#22C55E',
        fontWeight: '600',
    },
    languageList: {
        flex: 1,
        padding: 20,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 24,
        marginRight: 12,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    languageNameEn: {
        fontSize: 12,
        color: '#6B7280',
    },
});