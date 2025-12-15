// ============================================
// PREDICTO - Language Context
// Manages i18n and RTL support
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import {
  initializeI18n,
  getCurrentLanguage,
  switchLanguage,
  isRTL,
  t as translate,
  formatNumber as formatNum,
  formatCurrency as formatCurr,
  formatTimer as formatTime,
} from '../utils/i18n';
import type { Language } from '../services/storageService';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translate;
  formatNumber: typeof formatNum;
  formatCurrency: typeof formatCurr;
  formatTimer: typeof formatTime;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => getCurrentLanguage());
  const [rtl, setRtl] = useState(() => isRTL());

  // Initialize on mount
  useEffect(() => {
    initializeI18n();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    switchLanguage(lang);
    setLang(lang);
    setRtl(lang === 'fa');
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'fa' : 'en';
    setLanguage(newLang);
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL: rtl,
        setLanguage,
        toggleLanguage,
        t: translate,
        formatNumber: formatNum,
        formatCurrency: formatCurr,
        formatTimer: formatTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

