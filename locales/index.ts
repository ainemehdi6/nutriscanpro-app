import { en } from './en';
import { fr } from './fr';
import { Language, TranslationKeys } from '@/types/i18n';

export const translations: Record<Language, TranslationKeys> = {
  en,
  fr,
  es: en, // fallback
  de: en,
  it: en,
  pt: en,
};

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
];
