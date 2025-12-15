// ============================================
// PREDICTO - Admin Dashboard
// Host control panel for managing sessions
// ============================================

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import {
  createChallenge,
  startVolunteerPhase,
  selectContestants,
  startBettingPhase,
  closeBetting,
  resolveChallenge,
} from '../services/firebaseService';
import {
  Copy,
  Check,
  Users,
  Play,
  Pause,
  Trophy,
  Plus,
  Shuffle,
  CheckSquare,
  Loader2,
  QrCode,
  Timer,
  Coins,
} from 'lucide-react';

export function AdminDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, formatNumber, formatTimer, isRTL } = useLanguage();
  const {
    setSessionId,
    session,
    gameState,
    challenges,
    volunteers,
    contestants,
    odds,
    poolTotal,
    isLoading,
  } = useSession();

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState('');
  const [requiredParticipants, setRequiredParticipants] = useState(2);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Set session context
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
    }
  }, [sessionId, setSessionId]);

  // Timer countdown
  useEffect(() => {
    if (!gameState?.timer?.endAt) {
      setTimerSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((gameState.timer!.endAt - Date.now()) / 1000));
      setTimerSeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.timer]);

  const copySessionCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateChallenge = async () => {
    if (!sessionId || !newChallengeName.trim()) return;
    
    setActionLoading('createChallenge');
    try {
      await createChallenge(sessionId, newChallengeName.trim(), requiredParticipants);
      setNewChallengeName('');
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
    setActionLoading(null);
  };

  const handleStartVolunteering = async (challengeId: string) => {
    if (!sessionId) return;
    
    setActionLoading('startVolunteering');
    try {
      await startVolunteerPhase(sessionId, challengeId);
    } catch (err) {
      console.error('Failed to start volunteering:', err);
    }
    setActionLoading(null);
  };

  const handleSelectContestants = async (mode: 'MANUAL' | 'RANDOM') => {
    if (!sessionId) return;
    
    setActionLoading('selectContestants');
    try {
      await selectContestants(
        sessionId,
        mode,
        mode === 'MANUAL' ? selectedVolunteers : undefined,
        mode === 'RANDOM' ? requiredParticipants : undefined
      );
      setSelectedVolunteers([]);
    } catch (err) {
      console.error('Failed to select contestants:', err);
    }
    setActionLoading(null);
  };

  const handleStartBetting = async () => {
    if (!sessionId) return;
    
    setActionLoading('startBetting');
    try {
      await startBettingPhase(sessionId, 60);
    } catch (err) {
      console.error('Failed to start betting:', err);
    }
    setActionLoading(null);
  };

  const handleCloseBetting = async () => {
    if (!sessionId) return;
    
    setActionLoading('closeBetting');
    try {
      await closeBetting(sessionId);
    } catch (err) {
      console.error('Failed to close betting:', err);
    }
    setActionLoading(null);
  };

  const handleDeclareWinner = async (winnerId: string) => {
    if (!sessionId) return;
    
    setActionLoading('declareWinner');
    try {
      await resolveChallenge(sessionId, winnerId);
    } catch (err) {
      console.error('Failed to declare winner:', err);
    }
    setActionLoading(null);
  };

  const toggleVolunteerSelection = (volunteerId: string) => {
    setSelectedVolunteers((prev) =>
      prev.includes(volunteerId)
        ? prev.filter((id) => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  const volunteerList = Object.entries(volunteers);
  const status = gameState?.status || 'OPEN';

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold mb-1">
                  {t('admin.title')}
                </h1>
                <p className="text-surface-400">{t('admin.shareCode')}</p>
              </div>

              {/* Session Code */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl border border-surface-600">
                  <span className="font-mono text-2xl font-bold tracking-widest">
                    {sessionId}
                  </span>
                  <motion.button
                    onClick={copySessionCode}
                    className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                    whileTap={{ scale: 0.9 }}
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-surface-400" />
                    )}
                  </motion.button>
                </div>

                <motion.button
                  onClick={() => setShowQR(!showQR)}
                  className="p-3 bg-surface-800 rounded-xl border border-surface-600 hover:bg-surface-700 transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <QrCode className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* QR Code */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  className="mt-4 flex justify-center"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="p-4 bg-white rounded-xl">
                    <QRCode
                      value={`${window.location.origin}/join/${sessionId}`}
                      size={200}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'RESOLVED' ? 'bg-green-500' : 'bg-primary-500 animate-pulse'
                }`} />
                <span className="text-sm font-medium text-primary-400">
                  {status}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full">
                <Users className="w-4 h-4 text-surface-400" />
                <span className="text-sm font-medium">
                  {session?.participantCount || 0} {t('admin.participants')}
                </span>
              </div>

              {timerSeconds > 0 && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  timerSeconds < 10
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-accent-500/10 border border-accent-500/30 text-accent-400'
                }`}>
                  <Timer className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTimer(timerSeconds)}</span>
                </div>
              )}

              {poolTotal > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/30 rounded-full text-accent-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{formatNumber(poolTotal)}</span>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Challenge Management */}
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary-400" />
                {t('admin.challenges')}
              </h2>

              {/* Create Challenge Form */}
              {status === 'OPEN' && (
                <div className="space-y-3 mb-6 p-4 bg-surface-800/50 rounded-xl">
                  <input
                    type="text"
                    placeholder={t('challenge.name')}
                    value={newChallengeName}
                    onChange={(e) => setNewChallengeName(e.target.value)}
                    className="input-field"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={requiredParticipants}
                      onChange={(e) => setRequiredParticipants(parseInt(e.target.value))}
                      className="input-field flex-1"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {t('challenge.participants')}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      onClick={handleCreateChallenge}
                      disabled={!newChallengeName.trim() || actionLoading === 'createChallenge'}
                      className="btn-primary flex items-center gap-2"
                      whileTap={{ scale: 0.95 }}
                    >
                      {actionLoading === 'createChallenge' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Challenge List */}
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-surface-800/50 rounded-xl border border-surface-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{challenge.name}</h3>
                        <p className="text-sm text-surface-400">
                          {challenge.requiredParticipants} participants
                        </p>
                      </div>
                      {status === 'OPEN' && challenge.status === 'PENDING' && (
                        <motion.button
                          onClick={() => handleStartVolunteering(challenge.id)}
                          disabled={actionLoading === 'startVolunteering'}
                          className="btn-primary flex items-center gap-2 text-sm py-2"
                          whileTap={{ scale: 0.95 }}
                        >
                          {actionLoading === 'startVolunteering' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>{t('admin.startVolunteering')}</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))}
                
                {challenges.length === 0 && (
                  <p className="text-center text-surface-400 py-8">
                    {t('admin.createChallenge')} to get started
                  </p>
                )}
              </div>
            </motion.div>

            {/* Volunteer/Contestant Management */}
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-400" />
                {status === 'VOLUNTEERING' ? 'Volunteers' : 'Contestants'}
              </h2>

              {/* Volunteer Phase Controls */}
              {status === 'VOLUNTEERING' && (
                <>
                  <div className="space-y-2 mb-4">
                    {volunteerList.map(([id, data]) => (
                      <motion.div
                        key={id}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedVolunteers.includes(id)
                            ? 'bg-primary-500/20 border-primary-500'
                            : 'bg-surface-800/50 border-surface-700 hover:border-surface-500'
                        }`}
                        onClick={() => toggleVolunteerSelection(id)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedVolunteers.includes(id)
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-surface-500'
                            }`}>
                              {selectedVolunteers.includes(id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="font-medium">
                              {data.firstName} {data.lastName}
                            </span>
                          </div>
                          <span className="text-accent-400 font-bold">
                            {formatNumber(data.balanceLocked)} 🍎
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {volunteerList.length > 0 && (
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => handleSelectContestants('MANUAL')}
                        disabled={selectedVolunteers.length < 2 || actionLoading === 'selectContestants'}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckSquare className="w-5 h-5" />
                        <span>{t('volunteer.selectManual')}</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleSelectContestants('RANDOM')}
                        disabled={volunteerList.length < 2 || actionLoading === 'selectContestants'}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Shuffle className="w-5 h-5" />
                        <span>{t('volunteer.selectRandom')}</span>
                      </motion.button>
                    </div>
                  )}

                  {volunteerList.length === 0 && (
                    <p className="text-center text-surface-400 py-8">
                      Waiting for volunteers...
                    </p>
                  )}
                </>
              )}

              {/* Betting Phase Controls */}
              {(status === 'BETTING' || status === 'IN_PROGRESS') && (
                <>
                  <div className="space-y-3 mb-4">
                    {contestants.map((id) => {
                      const volunteer = volunteers[id];
                      const contestantOdds = odds[id] || 0;
                      
                      return (
                        <div
                          key={id}
                          className="p-4 bg-surface-800/50 rounded-xl border border-surface-700"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {volunteer?.firstName} {volunteer?.lastName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="odds-badge">
                                  {contestantOdds.toFixed(2)}x
                                </span>
                              </div>
                            </div>
                            {status === 'IN_PROGRESS' && (
                              <motion.button
                                onClick={() => handleDeclareWinner(id)}
                                disabled={actionLoading === 'declareWinner'}
                                className="btn-accent flex items-center gap-2"
                                whileTap={{ scale: 0.95 }}
                              >
                                <Trophy className="w-4 h-4" />
                                <span>{t('admin.declareWinner')}</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {status === 'BETTING' && !gameState?.bettingLocked && (
                    <motion.button
                      onClick={handleCloseBetting}
                      disabled={actionLoading === 'closeBetting'}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Pause className="w-5 h-5" />
                      <span>{t('admin.closeBetting')}</span>
                    </motion.button>
                  )}
                </>
              )}

              {/* Start Betting Button */}
              {contestants.length >= 2 && status !== 'BETTING' && status !== 'IN_PROGRESS' && status !== 'RESOLVED' && (
                <motion.button
                  onClick={handleStartBetting}
                  disabled={actionLoading === 'startBetting'}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  <span>{t('admin.startBetting')}</span>
                </motion.button>
              )}

              {/* Resolved State */}
              {status === 'RESOLVED' && gameState?.winnerId && (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-display font-bold mb-2">
                    {t('result.winner')}
                  </h3>
                  <p className="text-xl">
                    {volunteers[gameState.winnerId]?.firstName}{' '}
                    {volunteers[gameState.winnerId]?.lastName}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

