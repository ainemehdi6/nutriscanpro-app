import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useI18n } from '@/hooks/useI18n';
import { availableLanguages } from '@/locales';
import { Language } from '@/types/i18n';

interface LanguageSelectorProps {
    onLanguageChange?: (language: Language) => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
    const { t, currentLanguage, setLanguage } = useI18n();
    const [modalVisible, setModalVisible] = useState(false);

    const handleLanguageSelect = async (language: Language) => {
        try {
            await setLanguage(language);
            onLanguageChange?.(language);
            setModalVisible(false);
        } catch (error) {
            Alert.alert(t('common.error'), 'Failed to change language');
        }
    };

    const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

    return (
        <>
            <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.languageFlag}>{currentLanguageInfo?.flag}</Text>
                <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{currentLanguageInfo?.nativeName}</Text>
                    <Text style={styles.languageSubtitle}>{currentLanguageInfo?.name}</Text>
                </View>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('profile.language')}</Text>

                        {availableLanguages.map((language) => (
                            <TouchableOpacity
                                key={language.code}
                                style={[
                                    styles.languageOption,
                                    currentLanguage === language.code && styles.selectedLanguage
                                ]}
                                onPress={() => handleLanguageSelect(language.code)}
                            >
                                <Text style={styles.languageFlag}>{language.flag}</Text>
                                <View style={styles.languageOptionInfo}>
                                    <Text style={styles.languageOptionName}>{language.nativeName}</Text>
                                    <Text style={styles.languageOptionSubtitle}>{language.name}</Text>
                                </View>
                                {currentLanguage === language.code && (
                                    <Text style={styles.selectedIndicator}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    languageButton: {
        flexDirection: 'row',
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
    languageFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    languageSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
    },
    selectedLanguage: {
        backgroundColor: '#F3F4F6',
        borderColor: '#8B5CF6',
        borderWidth: 1,
    },
    languageOptionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    languageOptionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    languageOptionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    selectedIndicator: {
        fontSize: 18,
        color: '#8B5CF6',
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
});