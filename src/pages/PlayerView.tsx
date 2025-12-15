// ============================================
// PREDICTO - Player View
// Guest experience for betting and volunteering
// Session-scoped, Real-time experience
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { volunteer, placeBet } from '../services/firebaseService';
import { hasJoinedSession } from '../services/storageService';
import {
  Wallet,
  Lock,
  Trophy,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Hand,
  Target,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export function PlayerView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { formatNumber, formatCurrency, isRTL } = useLanguage();
  const {
    userId,
    balance,
    lockedBalance,
    isVolunteer,
    isContestant,
    setCurrentSessionId,
    isLoading: authLoading,
  } = useAuth();
  const {
    setSessionId: setContextSessionId,
    gameState,
    volunteers,
    contestants,
    odds,
    poolTotal,
    participantCount,
    challengeName,
    status,
    winnerId,
    isLoading: sessionLoading,
  } = useSession();

  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Check if user has joined this session
  useEffect(() => {
    if (!sessionId) return;

    // If user hasn't joined this session, redirect to join page
    if (!hasJoinedSession(sessionId)) {
      navigate(`/join/${sessionId}`);
      return;
    }

    setContextSessionId(sessionId);
    setCurrentSessionId(sessionId);
  }, [sessionId, navigate, setContextSessionId, setCurrentSessionId]);

  // Show result and confetti when resolved
  useEffect(() => {
    if (status === 'RESOLVED' && winnerId) {
      setShowResult(true);

      // Check if user won (as contestant)
      if (winnerId === userId) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#d946ef', '#8b5cf6', '#10b981'],
        });
      }
    } else {
      setShowResult(false);
    }
  }, [status, winnerId, userId]);

  const handleVolunteer = async () => {
    if (!sessionId) return;

    setActionLoading('volunteer');
    try {
      await volunteer(sessionId);
      setShowVolunteerModal(false);
    } catch (err) {
      console.error('Failed to volunteer:', err);
    }
    setActionLoading(null);
  };

  const handlePlaceBet = async (contestantId: string) => {
    if (!sessionId) return;

    const amount = betAmounts[contestantId];
    if (!amount || amount <= 0) return;

    setActionLoading(`bet-${contestantId}`);
    try {
      await placeBet(sessionId, contestantId, amount);
      setBetAmounts((prev) => ({ ...prev, [contestantId]: 0 }));
    } catch (err) {
      console.error('Failed to place bet:', err);
    }
    setActionLoading(null);
  };

  const updateBetAmount = (contestantId: string, value: string) => {
    const amount = parseInt(value) || 0;
    setBetAmounts((prev) => ({ ...prev, [contestantId]: amount }));
  };

  const setMaxBet = (contestantId: string) => {
    setBetAmounts((prev) => ({ ...prev, [contestantId]: balance }));
  };

  if (sessionLoading || authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  const volunteerData = userId ? volunteers[userId] : null;

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Wallet Card */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-400 text-sm mb-1">Your Balance</p>
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-accent-400" />
                  <span className="text-3xl font-display font-bold text-accent-400">
                    {formatNumber(balance)} 🍎
                  </span>
                </div>
              </div>

              {lockedBalance > 0 && (
                <div className="text-right">
                  <p className="text-surface-400 text-sm mb-1">Locked</p>
                  <div className="flex items-center gap-2 text-primary-400">
                    <Lock className="w-5 h-5" />
                    <span className="text-xl font-bold">
                      {formatNumber(lockedBalance)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  status === 'RESOLVED'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-primary-500/10 border border-primary-500/20 text-primary-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === 'RESOLVED'
                      ? 'bg-green-500'
                      : 'bg-primary-500 animate-pulse'
                  }`}
                />
                <span className="text-sm font-medium">{status}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full">
                <Users className="w-4 h-4 text-surface-400" />
                <span className="text-sm">{participantCount} online</span>
              </div>

              {/* Leaderboard Link */}
              <Link
                to={`/leaderboard/${sessionId}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 hover:bg-primary-500/20 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Leaderboard</span>
              </Link>

              {/* Role Badge */}
              {isContestant && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 border border-primary-500/30 rounded-full text-primary-400">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Contestant</span>
                </div>
              )}
              {isVolunteer && !isContestant && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400">
                  <Hand className="w-4 h-4" />
                  <span className="text-sm font-medium">Volunteer</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Challenge Info */}
          {challengeName && (
            <motion.div
              className="glass-card p-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-surface-400 text-sm">Current Challenge</p>
              <h2 className="text-xl font-display font-bold text-primary-400">
                {challengeName}
              </h2>
            </motion.div>
          )}

          {/* Volunteering Phase */}
          {status === 'VOLUNTEERING' && !isVolunteer && balance > 0 && (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-display font-bold mb-2">
                🙋 Volunteer
              </h2>
              <p className="text-surface-400 mb-4">Risk it all for 3x reward!</p>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">ALL-IN Required</p>
                    <p className="text-surface-400 text-sm mt-1">
                      Your Balance: {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => setShowVolunteerModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                <span>Volunteer Now</span>
              </motion.button>
            </motion.div>
          )}

          {/* Volunteer Status - Waiting for selection */}
          {isVolunteer && !isContestant && status === 'VOLUNTEERING' && (
            <motion.div
              className="glass-card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold mb-2">
                Waiting for Selection
              </h2>
              <p className="text-surface-400">
                {formatCurrency(volunteerData?.balanceLocked || lockedBalance)} locked
              </p>
            </motion.div>
          )}

          {/* Contestant View */}
          {isContestant && (status === 'BETTING' || status === 'IN_PROGRESS') && (
            <motion.div
              className="glass-card p-6 text-center border-2 border-primary-500"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Trophy className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold mb-2">
                You're a Contestant!
              </h2>
              <p className="text-surface-400">
                Your stake: {formatCurrency(lockedBalance)}
              </p>
              <p className="text-primary-400 mt-2">
                Win to earn {formatCurrency(lockedBalance * 3)}!
              </p>
            </motion.div>
          )}

          {/* Betting Phase */}
          {status === 'BETTING' &&
            !isContestant &&
            !gameState?.bettingLocked &&
            balance > 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">
                    Place Your Bets
                  </h2>
                  <div className="flex items-center gap-2 text-accent-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold">
                      {formatNumber(poolTotal)} Pool
                    </span>
                  </div>
                </div>

                {contestants.map((contestantId) => {
                  const contestantData = volunteers[contestantId];
                  const contestantOdds = odds[contestantId] || 1;
                  const betAmount = betAmounts[contestantId] || 0;
                  const potentialWin = Math.floor(betAmount * contestantOdds);

                  return (
                    <motion.div
                      key={contestantId}
                      className="contestant-card"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {contestantData?.firstName} {contestantData?.lastName}
                          </h3>
                          <div className="odds-badge mt-1">
                            {contestantOdds.toFixed(2)}x coefficient
                          </div>
                        </div>
                        {betAmount > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-surface-400">
                              Potential Win
                            </p>
                            <p className="text-xl font-bold text-accent-400">
                              {formatNumber(potentialWin)} 🍎
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={betAmount || ''}
                            onChange={(e) =>
                              updateBetAmount(contestantId, e.target.value)
                            }
                            placeholder="Bet Amount"
                            className="input-field pr-20"
                            min="1"
                            max={balance}
                            dir="ltr"
                          />
                          <button
                            onClick={() => setMaxBet(contestantId)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-400 hover:text-primary-300 font-medium"
                          >
                            MAX
                          </button>
                        </div>
                        <motion.button
                          onClick={() => handlePlaceBet(contestantId)}
                          disabled={
                            !betAmount ||
                            betAmount > balance ||
                            actionLoading === `bet-${contestantId}`
                          }
                          className="btn-primary flex items-center gap-2"
                          whileTap={{ scale: 0.95 }}
                        >
                          {actionLoading === `bet-${contestantId}` ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span>Bet</span>
                              <ArrowRight
                                className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`}
                              />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

          {/* No balance for betting */}
          {status === 'BETTING' && !isContestant && balance === 0 && (
            <motion.div
              className="glass-card p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Wallet className="w-12 h-12 text-surface-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-surface-400">
                No Anars to bet
              </h2>
              <p className="text-surface-500 mt-2">
                Wait for the next round!
              </p>
            </motion.div>
          )}

          {/* Betting Closed */}
          {(status === 'IN_PROGRESS' || gameState?.bettingLocked) &&
            !isContestant &&
            status !== 'RESOLVED' && (
              <motion.div
                className="glass-card p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Lock className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-surface-400">
                  Betting Closed
                </h2>
                <p className="text-surface-500 mt-2">
                  Waiting for the result...
                </p>
              </motion.div>
            )}

          {/* Results */}
          <AnimatePresence>
            {status === 'RESOLVED' && winnerId && showResult && (
              <motion.div
                className="glass-card p-8 text-center border-2 border-accent-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Trophy className="w-20 h-20 text-accent-400 mx-auto mb-4" />
                <h2 className="text-3xl font-display font-bold mb-2">
                  Winner!
                </h2>
                <p className="text-2xl text-accent-400 font-semibold">
                  {volunteers[winnerId]?.firstName}{' '}
                  {volunteers[winnerId]?.lastName}
                </p>

                {winnerId === userId && (
                  <motion.div
                    className="mt-6 p-4 bg-accent-500/20 rounded-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-2xl font-bold text-accent-400">
                      🎉 You Won! 🎉
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting State */}
          {status === 'OPEN' && (
            <motion.div
              className="glass-card p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-surface-400">
                Waiting for host...
              </h2>
              <p className="text-surface-500 mt-2">
                The host will start a challenge soon
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Volunteer Confirmation Modal */}
      <AnimatePresence>
        {showVolunteerModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVolunteerModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold mb-4">
                Confirm Volunteer
              </h3>
              <p className="text-surface-400 mb-6">
                You are about to lock{' '}
                <span className="text-accent-400 font-bold">
                  {formatCurrency(balance)}
                </span>{' '}
                as your stake. If you win, you'll receive 3x your stake!
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowVolunteerModal(false)}
                  className="btn-secondary flex-1"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleVolunteer}
                  disabled={actionLoading === 'volunteer'}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  {actionLoading === 'volunteer' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Confirm</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
