import { en } from './en';
import { fr } from './fr';

import { Language, TranslationKeys } from '@/types/i18n';

export const translations: Record<Language, TranslationKeys> = {
  en,
  fr,
};

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];
