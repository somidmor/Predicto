// ============================================
// PREDICTO - Layout Component
// ============================================

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen mesh-bg">
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-surface-950/50 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.a
                href="/"
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <span className="text-xl">🎯</span>
                </div>
                <span className="font-display font-bold text-xl gradient-text">
                  {t('app.name')}
                </span>
              </motion.a>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <LanguageToggle />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={showHeader ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
}

