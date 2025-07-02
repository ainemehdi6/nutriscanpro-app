import { useState, useEffect } from 'react';
import { i18nService } from '@/services/i18n';
import { Language, TranslationKeys } from '@/types/i18n';

export function useI18n() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(i18nService.getCurrentLanguage());

  useEffect(() => {
    const unsubscribe = i18nService.addListener(setCurrentLanguage);
    return unsubscribe;
  }, []);

  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    return i18nService.translate(key, params);
  };

  const setLanguage = async (language: Language): Promise<void> => {
    await i18nService.setLanguage(language);
  };

  return {
    t,
    currentLanguage,
    setLanguage,
  };
}