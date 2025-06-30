import { useMemo, useCallback } from 'react';
import { useI18n } from './useI18n';

interface DateFormatterOptions {
  weekday?: 'long' | 'short' | 'narrow';
  year?: 'numeric' | '2-digit';
  month?: 'long' | 'short' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
}

export function useDateFormatter() {
  const { t, currentLanguage } = useI18n();

  const localeMap = useMemo(() => ({
    'en': 'en-US',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
  }), []);

  const getLocale = useCallback((language?: string) => {
    const lang = language || currentLanguage;
    return localeMap[lang as keyof typeof localeMap] || 'en-US';
  }, [currentLanguage, localeMap]);

  const formatDate = useCallback((
    date: Date | string,
    options: DateFormatterOptions = {}
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check for relative dates
    if (dateObj.toDateString() === today.toDateString()) {
      return t('history.today');
    }
    
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return t('history.yesterday');
    }

    // Format with locale
    const locale = getLocale();
    return dateObj.toLocaleDateString(locale, options);
  }, [t, getLocale]);

  const formatDateShort = useCallback((date: Date | string) => {
    return formatDate(date, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [formatDate]);

  const formatDateLong = useCallback((date: Date | string) => {
    return formatDate(date, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [formatDate]);

  const formatTime = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = getLocale();
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [getLocale]);

  const isToday = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  }, []);

  const isYesterday = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateObj.toDateString() === yesterday.toDateString();
  }, []);

  const getDateKey = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  }, []);

  return {
    formatDate,
    formatDateShort,
    formatDateLong,
    formatTime,
    isToday,
    isYesterday,
    getDateKey,
    getLocale,
  };
} 