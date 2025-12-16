// ============================================
// PREDICTO - Join Page
// Guest registration form (Session-Scoped)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { joinSession, getSession, getParticipant } from '../services/firebaseService';
import {
  getSessionUserIdentity,
  isSessionAdmin,
  getUserId,
} from '../services/storageService';
import { User, Calendar, ArrowRight, Loader2, Gift, RefreshCw } from 'lucide-react';
import { INITIAL_BALANCE } from '../types';

export function JoinPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcePlayer = searchParams.get('forcePlayer') === 'true';

  const { isRTL, formatNumber, t } = useLanguage();
  const { lastProfile, setCurrentSessionId } = useAuth();
  const { setSessionId: setContextSessionId } = useSession();

  const [firstName, setFirstName] = useState(lastProfile?.firstName || '');
  const [lastName, setLastName] = useState(lastProfile?.lastName || '');
  const [age, setAge] = useState(lastProfile?.age?.toString() || '');
  const [isJoining, setIsJoining] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const [returningPlayer, setReturningPlayer] = useState<{
    firstName: string;
    lastName: string;
    balance: number;
  } | null>(null);

  // Check if session exists and if user has already joined
  useEffect(() => {
    async function checkSession() {
      if (!sessionId) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user is admin of this session
        if (isSessionAdmin(sessionId) && !forcePlayer) {
          navigate(`/admin/${sessionId}`);
          return;
        }

        // Check if session exists
        const session = await getSession(sessionId);
        if (!session) {
          setSessionExists(false);
          setError(t('join.sessionNotFound'));
          setIsChecking(false);
          return;
        }

        setSessionExists(true);

        // Check if user has already joined this session
        const existingIdentity = getSessionUserIdentity(sessionId);
        if (existingIdentity) {
          // User has joined before - check their current state
          const userId = getUserId();
          const participant = await getParticipant(sessionId, userId);

          if (participant) {
            setReturningPlayer({
              firstName: participant.firstName,
              lastName: participant.lastName,
              balance: participant.balance,
            });
          } else {
            // Local identity exists but no server data - let them rejoin
            setFirstName(existingIdentity.firstName);
            setLastName(existingIdentity.lastName);
            setAge(existingIdentity.age.toString());
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setSessionExists(false);
        setError(t('join.sessionNotFound'));
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [sessionId, navigate, t]);

  // Handle returning player rejoining
  const handleReturningPlayerJoin = () => {
    if (!sessionId || !returningPlayer) return;

    setCurrentSessionId(sessionId);
    setContextSessionId(sessionId);
    navigate(`/play/${sessionId}`);
  };

  // Handle new player join
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId || !firstName.trim() || !lastName.trim() || !age) {
      setError(t('join.invalidCode')); // Generic error, could be better key
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Please enter a valid age'); // Should translate
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      await joinSession(sessionId, firstName.trim(), lastName.trim(), ageNum);

      // Set active session in context
      setCurrentSessionId(sessionId);
      setContextSessionId(sessionId);

      // Navigate to player view
      navigate(`/play/${sessionId}`);
    } catch (err) {
      console.error('Failed to join session:', err);
      setError(t('common.error'));
    } finally {
      setIsJoining(false);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  // Session not found
  if (sessionExists === false) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            className="glass-card p-8 max-w-md w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-display font-bold mb-2">
              {t('join.sessionNotFound')}
            </h1>
            <p className="text-surface-400 mb-6">
              {t('join.invalidCode')}
            </p>
            <motion.button
              onClick={() => navigate('/')}
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('common.back')}
            </motion.button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Returning player view
  if (returningPlayer) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <motion.div
            className="glass-card p-8 max-w-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/20 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <RefreshCw className="w-8 h-8 text-accent-400" />
              </motion.div>

              <h1 className="text-3xl font-display font-bold mb-2">
                {t('common.success')}
              </h1>

              <p className="text-surface-400">
                {returningPlayer.firstName} {returningPlayer.lastName}
              </p>
            </div>

            {/* Balance Display */}
            <motion.div
              className="bg-surface-800/50 rounded-2xl p-6 mb-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-surface-400 text-sm mb-1">{t('player.balance')}</p>
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6 text-accent-400" />
                <span className="text-4xl font-display font-bold text-accent-400">
                  {formatNumber(returningPlayer.balance)}
                </span>
                <span className="text-surface-500">🍎</span>
              </div>
            </motion.div>

            {/* Session Code */}
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-mono mb-6 mx-auto w-fit">
              {sessionId}
            </div>

            {/* Continue Button */}
            <motion.button
              onClick={handleReturningPlayerJoin}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{t('join.submit')}</span>
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // New player registration form
  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          className="glass-card p-8 max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-mono mb-4">
              {sessionId}
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {t('join.title')}
            </h1>

            {/* Starter Balance Banner */}
            <motion.div
              className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-500/10 border border-accent-500/20 rounded-xl text-accent-400 mt-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Gift className="w-5 h-5" />
              <span className="font-medium">
                {t('join.starterBalance', { amount: INITIAL_BALANCE })}
              </span>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                {t('join.firstName')}
              </label>
              <div className="relative">
                <User
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 ${isRTL ? 'right-4' : 'left-4'
                    }`}
                />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`input-field ${isRTL ? 'pr-12' : 'pl-12'}`}
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                {t('join.lastName')}
              </label>
              <div className="relative">
                <User
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 ${isRTL ? 'right-4' : 'left-4'
                    }`}
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`input-field ${isRTL ? 'pr-12' : 'pl-12'}`}
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                {t('join.age')}
              </label>
              <div className="relative">
                <Calendar
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 ${isRTL ? 'right-4' : 'left-4'
                    }`}
                />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`input-field ${isRTL ? 'pr-12' : 'pl-12'}`}
                  min="1"
                  max="120"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isJoining}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isJoining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{t('join.submit')}</span>
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
