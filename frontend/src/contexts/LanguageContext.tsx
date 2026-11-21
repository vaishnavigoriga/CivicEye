import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, LANGUAGES, type Dictionary, type Language } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const STORAGE_KEY = 'civiceye_lang';
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const readStored = (): Language => {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'te' || v === 'hi') return v;
  } catch {
    /* storage unavailable */
  }
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(readStored);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGUAGES.find((l) => l.code === language)?.htmlLang ?? 'en';
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: dictionaries[language] }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
