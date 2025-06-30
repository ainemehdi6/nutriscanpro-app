import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { it } from './it';
import { pt } from './pt';

import { Language, TranslationKeys } from '@/types/i18n';

export const translations: Record<Language, TranslationKeys> = {
  en,
  fr,
  es,
  de,
  it,
  pt,
};

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
];
