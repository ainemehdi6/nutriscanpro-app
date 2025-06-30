import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import { Language, TranslationKeys } from '@/types/i18n';
import { translations } from '../locales';

const LANGUAGE_KEY = 'user_language';

class I18nService {
  private currentLanguage: Language = 'fr';
  private listeners: ((language: Language) => void)[] = [];

  async initialize(): Promise<Language> {
    try {
      const savedLanguage = await this.getStoredLanguage();
      console.log(savedLanguage)
      if (savedLanguage) {
        this.currentLanguage = savedLanguage;
      } else {
        const systemLanguage = this.getSystemLanguage();
        this.currentLanguage = systemLanguage;
        await this.setLanguage(systemLanguage);
      }
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      this.currentLanguage = 'fr';
    }

    return this.currentLanguage;
  }

  private async getStoredLanguage(): Promise<Language | null> {
    try {
      const language = Platform.OS === 'web' 
        ? localStorage.getItem(LANGUAGE_KEY)
        : await SecureStore.getItemAsync(LANGUAGE_KEY);
      return language as Language;
    } catch {
      return null;
    }
  }

  private getSystemLanguage(): Language {
    let systemLang: string;
  
    if (Platform.OS === 'web') {
      systemLang = navigator.language.split('-')[0];
    } else {
      const locales = Localization.getLocales();
      const languageCode = locales.length > 0 ? locales[0].languageCode : 'fr';
      systemLang = languageCode ?? 'fr';
    }
  
    return this.isValidLanguage(systemLang) ? systemLang as Language : 'fr';
  }

  private isValidLanguage(lang: string): boolean {
    return ['en', 'fr', 'es', 'de', 'it', 'pt'].includes(lang);
  }

  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;

    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_KEY, language);
      } else {
        await SecureStore.setItemAsync(LANGUAGE_KEY, language);
      }
    } catch (error) {
      console.error('Failed to save language:', error);
    }

    this.notifyListeners(language);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  translate(key: keyof TranslationKeys, params?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage]?.[key] || translations.en[key] || key;

    if (params) {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }, translation);
    }

    return translation;
  }

  addListener(callback: (language: Language) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(language: Language): void {
    this.listeners.forEach(callback => callback(language));
  }
}

export const i18nService = new I18nService();
