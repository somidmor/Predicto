// ============================================
// PREDICTO - Language Toggle Component
// ============================================

import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      onClick={toggleLanguage}
      className="relative flex items-center gap-2 px-4 py-2 bg-surface-800/50 border border-surface-600 rounded-full text-sm font-medium transition-colors hover:bg-surface-700/50"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        key={language}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2"
      >
        {language === 'en' ? (
          <>
            <span className="text-lg">🇺🇸</span>
            <span>EN</span>
          </>
        ) : (
          <>
            <span className="text-lg">🇮🇷</span>
            <span>فا</span>
          </>
        )}
      </motion.span>
    </motion.button>
  );
}

