import { createContext, useContext, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LocaleContext = createContext(null);
const DEFAULT_LOCALE = 'en';

const readInitialLocale = () => {
  const saved = localStorage.getItem('locale');
  return saved === 'mm' ? 'mm' : DEFAULT_LOCALE;
};

const getValueByPath = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

const interpolate = (template, params = {}) => {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''));
};

export const LocaleProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = (nextLocale) => {
    const normalized = nextLocale === 'mm' ? 'mm' : 'en';
    setLocaleState(normalized);
    localStorage.setItem('locale', normalized);
  };

  const t = (key, params) => {
    const fromLocale = getValueByPath(translations[locale], key);
    const fallback = getValueByPath(translations[DEFAULT_LOCALE], key);
    const value = fromLocale ?? fallback ?? key;
    return typeof value === 'string' ? interpolate(value, params) : value;
  };

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return ctx;
};

