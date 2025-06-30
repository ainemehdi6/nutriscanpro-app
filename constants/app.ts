// App-wide constants and configuration

export const APP_CONFIG = {
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Performance Configuration
  DEBOUNCE_DELAY: 300, // 300ms
  THROTTLE_LIMIT: 100, // 100ms
  PERFORMANCE_WARNING_THRESHOLD: 100, // 100ms

  // UI Configuration
  ANIMATION_DURATION: 300,
  LOADING_TIMEOUT: 10000, // 10 seconds
  REFRESH_INTERVAL: 30000, // 30 seconds

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    LANGUAGE: 'language',
    THEME: 'theme',
  },

  // Supported Languages
  SUPPORTED_LANGUAGES: {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
  },

  // Locale Mapping
  LOCALE_MAP: {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
  },

  // Meal Types
  MEAL_TYPES: {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    DINNER: 'dinner',
    SNACK: 'snack',
  },

  // Colors
  COLORS: {
    PRIMARY: '#22C55E',
    PRIMARY_DARK: '#16A34A',
    SECONDARY: '#3B82F6',
    SECONDARY_DARK: '#2563EB',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
    GRAY: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // Meal Type Colors
  MEAL_COLORS: {
    breakfast: '#F59E0B',
    lunch: '#EF4444',
    dinner: '#8B5CF6',
    snack: '#06B6D4',
  },

  // Dimensions
  DIMENSIONS: {
    HEADER_HEIGHT: 120,
    CARD_BORDER_RADIUS: 12,
    BUTTON_BORDER_RADIUS: 8,
    ICON_SIZE: 24,
    SPACING: {
      XS: 4,
      SM: 8,
      MD: 16,
      LG: 24,
      XL: 32,
    },
  },

  // Validation Rules
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
  },

  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
  },
} as const;

// Type-safe access to constants
export type AppConfig = typeof APP_CONFIG;
export type MealType = keyof typeof APP_CONFIG.MEAL_TYPES;
export type SupportedLanguage = keyof typeof APP_CONFIG.SUPPORTED_LANGUAGES;

// Utility functions
export const getLocaleForLanguage = (language: SupportedLanguage): string => {
  return APP_CONFIG.LOCALE_MAP[language] || 'en-US';
};

export const getMealColor = (mealType: string): string => {
  return APP_CONFIG.MEAL_COLORS[mealType as keyof typeof APP_CONFIG.MEAL_COLORS] || APP_CONFIG.COLORS.GRAY[500];
};

export const isValidEmail = (email: string): boolean => {
  return APP_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH;
};

export const isValidName = (name: string): boolean => {
  return name.length >= APP_CONFIG.VALIDATION.NAME_MIN_LENGTH;
}; 