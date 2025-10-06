
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import en from '@/lib/locales/en.json';
import hi from '@/lib/locales/hi.json';

type Language = 'en' | 'hi';
type Translations = Record<string, any>;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationsData: Record<Language, Translations> = { en, hi };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('app-language') as Language | null;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'hi')) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app-language', lang);
    setLanguageState(lang);
  };
  
  const translations = useMemo(() => translationsData[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
