// ============================================
// PREDICTO - Home Page
// Landing page with Create/Join session options
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { createSession, getSession } from '../services/firebaseService';
import { Sparkles, Users, Zap, ArrowRight, Loader2 } from 'lucide-react';

export function HomePage() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [joinCode, setJoinCode] = useState('');
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSession = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const result = await createSession(hostName || undefined);
      // Navigate to admin dashboard (token is stored by createSession)
      navigate(`/admin/${result.sessionId}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      setError(t('join.invalidCode'));
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const session = await getSession(joinCode.toUpperCase().trim());
      if (!session) {
        setError(t('join.sessionNotFound'));
        return;
      }
      // Navigate to join page with session code
      navigate(`/join/${joinCode.toUpperCase().trim()}`);
    } catch (err) {
      console.error('Failed to find session:', err);
      setError(t('join.sessionNotFound'));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('app.tagline')}</span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-display font-bold mb-6">
            <span className="gradient-text">{t('app.name')}</span>
          </h1>

          <p className="text-xl text-surface-400 max-w-lg mx-auto">
            {t('home.subtitle')}
          </p>
        </motion.div>

        {/* Action Cards */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          {/* Create Session Card */}
          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                {t('home.createSession')}
              </h2>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('home.hostName')}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="input-field"
                dir={isRTL ? 'rtl' : 'ltr'}
              />

              <motion.button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="btn-primary w-full flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('home.createSession')}</span>
                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Join Session Card */}
          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-surface-900" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                {t('home.joinSession')}
              </h2>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('home.enterCode')}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="input-field text-center font-mono text-xl tracking-widest uppercase"
                maxLength={6}
                dir="ltr"
              />

              <motion.button
                onClick={handleJoinSession}
                disabled={isJoining || !joinCode.trim()}
                className="btn-accent w-full flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isJoining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('home.joinSession')}</span>
                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mt-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        </div>
      </div>
    </Layout>
  );
}

