// ============================================
// PREDICTO - Admin Dashboard
// Host control panel for managing sessions
// Real-time updates, session-scoped data
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import { isSessionAdmin } from '../services/storageService';
import {
  createChallenge,



  closeBetting,
  resolveChallenge,
  resetSession,
} from '../services/firebaseService';
import {
  Copy,
  Check,
  Users,
  Play,
  Pause,
  Trophy,


  Loader2,
  QrCode,
  Coins,
  RotateCcw,
  Shield,
  Sparkles,
  BarChart3,
  UserPlus,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { formatNumber, isRTL } = useLanguage();
  const { setCurrentSessionId } = useAuth();
  const {
    setSessionId: setContextSessionId,
    gameState,
    challenges,
    volunteers,
    contestants,
    odds,
    poolTotal,
    participants,
    participantCount,
    isLoading,
  } = useSession();

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState('');
  const [requiredParticipants, setRequiredParticipants] = useState(2);
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');


  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check admin access and set session context
  useEffect(() => {
    if (!sessionId) return;

    if (!isSessionAdmin(sessionId)) {
      navigate(`/join/${sessionId}`);
      return;
    }

    setContextSessionId(sessionId);
    setCurrentSessionId(sessionId);
  }, [sessionId, navigate, setContextSessionId, setCurrentSessionId]);

  const copySessionCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyJoinLink = () => {
    if (sessionId) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && sessionId) {
      try {
        await navigator.share({
          title: 'Join PredictO Session',
          text: `Join my PredictO session with code: ${sessionId}`,
          url: `${window.location.origin}/join/${sessionId}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyJoinLink(); // Copy link to clipboard
      alert('Link copied to clipboard! You can share it manually.');
    }
  };

  const handleCreateChallenge = async () => {
    if (!sessionId || !newChallengeName.trim()) return;

    setActionLoading('createChallenge');
    try {
      const { challengeId } = await createChallenge(
        sessionId,
        newChallengeName.trim(),
        requiredParticipants,
        undefined, // description
        minAge || undefined,
        maxAge || undefined
      );
      setNewChallengeName('');
      setMinAge('');
      setMaxAge('');
      // Navigate to challenge manager
      navigate(`/admin/${sessionId}/challenge/${challengeId}`);
    } catch (err) {
      console.error('Failed to create challenge:', err);
      setActionLoading(null);
    }
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

  const handleResetSession = async () => {
    if (!sessionId) return;

    setActionLoading('resetSession');
    try {
      await resetSession(sessionId);
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
    setActionLoading(null);
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


  const participantList = Object.entries(participants);
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
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  <h1 className="text-2xl font-display font-bold">
                    Admin Dashboard
                  </h1>
                </div>
                <p className="text-surface-400">Share this code with players</p>
              </div>

              {/* Session Code */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-xl border border-surface-600">
                  <span className="font-mono text-2xl font-bold tracking-widest">
                    {sessionId}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => window.open(`/join/${sessionId}?forcePlayer=true`, '_blank')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 rounded-full transition-colors text-sm text-surface-300 hover:text-primary-400 border border-surface-700"
                      whileTap={{ scale: 0.95 }}
                      title="Open new player tab for testing"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Test Player</span>
                    </motion.button>
                    <motion.button
                      onClick={handleShare}
                      className="p-2 hover:bg-surface-800 rounded-full transition-colors"
                      whileTap={{ scale: 0.9 }}
                      title="Share Session Link"
                    >
                      <Share2 className="w-5 h-5 text-surface-400" />
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={copySessionCode}
                    className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                    whileTap={{ scale: 0.9 }}
                    title="Copy code"
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
                  className="mt-4 flex flex-col items-center"
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
                  <motion.button
                    onClick={copyJoinLink}
                    className="mt-3 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Copy className="w-4 h-4" />
                    Copy join link
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full">
                <div
                  className={`w-2 h-2 rounded-full ${status === 'RESOLVED'
                    ? 'bg-green-500'
                    : 'bg-primary-500 animate-pulse'
                    }`}
                />
                <span className="text-sm font-medium text-primary-400">
                  {status}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full">
                <Users className="w-4 h-4 text-surface-400" />
                <span className="text-sm font-medium">
                  {participantCount} players
                </span>
              </div>

              {poolTotal > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/30 rounded-full text-accent-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{formatNumber(poolTotal)}</span>
                </div>
              )}

              {/* Leaderboard Link */}
              <Link
                to={`/leaderboard/${sessionId}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 hover:bg-primary-500/20 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Leaderboard</span>
              </Link>
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
                Challenges
              </h2>

              {/* Create Challenge Form */}
              {(status === 'OPEN' || status === 'RESOLVED') && (
                <div className="space-y-3 mb-6 p-4 bg-surface-800/50 rounded-xl">
                  <input
                    type="text"
                    placeholder="Challenge Name"
                    value={newChallengeName}
                    onChange={(e) => setNewChallengeName(e.target.value)}
                    className="input-field"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={requiredParticipants}
                      onChange={(e) =>
                        setRequiredParticipants(parseInt(e.target.value))
                      }
                      className="input-field flex-1"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} Contestants
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Min Age"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : '')}
                      className="input-field w-24"
                      min="1"
                      max="100"
                    />
                    <input
                      type="number"
                      placeholder="Max Age"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : '')}
                      className="input-field w-24"
                      min="1"
                      max="100"
                    />
                  </div>
                  <motion.button
                    onClick={handleCreateChallenge}
                    disabled={
                      !newChallengeName.trim() ||
                      actionLoading === 'createChallenge'
                    }
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    {actionLoading === 'createChallenge' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Create & Start</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Challenge List */}
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    onClick={() => navigate(`/admin/${sessionId}/challenge/${challenge.id}`)}
                    className="p-4 bg-surface-800/50 rounded-xl border border-surface-700 cursor-pointer hover:border-primary-500/50 transition-colors group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold group-hover:text-primary-400 transition-colors">{challenge.name}</h3>
                        <p className="text-sm text-surface-400">
                          {challenge.requiredParticipants} participants • {challenge.status}
                        </p>
                      </div>
                      <div className="p-2 bg-surface-800 rounded-full group-hover:bg-primary-500/20 transition-colors">
                        <Play className="w-4 h-4 text-surface-400 group-hover:text-primary-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {challenges.length === 0 && (
                  <p className="text-center text-surface-400 py-8">
                    Create a challenge to get started
                  </p>
                )}
              </div>
            </motion.div>

            {/* Volunteer/Contestant Management moved to ChallengeManager */}
            {(status === 'VOLUNTEERING' || status === 'SELECTION') && (
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                <Shield className="w-12 h-12 text-primary-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Challenge in Progress</h3>
                <p className="text-surface-400 mb-6">
                  Manage volunteers and contestants in the Challenge Manager.
                </p>
                <motion.button
                  onClick={() => {
                    const activeChallenge = challenges.find(c => c.status === 'VOLUNTEERING' || c.status === 'SELECTION');
                    if (activeChallenge) {
                      navigate(`/admin/${sessionId}/challenge/${activeChallenge.id}`);
                    }
                  }}
                  className="btn-primary"
                  whileTap={{ scale: 0.95 }}
                >
                  Go to Challenge Manager
                </motion.button>
              </div>
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
                              <span>Winner</span>
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
                    <span>Close Betting</span>
                  </motion.button>
                )}
              </>
            )}

            {/* Resolved State */}
            {status === 'RESOLVED' && gameState?.winnerId && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Trophy className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-display font-bold mb-2">
                  Winner! 🎉
                </h3>
                <p className="text-xl mb-6">
                  {volunteers[gameState.winnerId]?.firstName}{' '}
                  {volunteers[gameState.winnerId]?.lastName}
                </p>

                <motion.button
                  onClick={handleResetSession}
                  disabled={actionLoading === 'resetSession'}
                  className="btn-ghost flex items-center justify-center gap-2 mx-auto text-sm text-surface-400 hover:text-surface-300"
                  whileTap={{ scale: 0.95 }}
                >
                  {actionLoading === 'resetSession' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset Session</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Open State - Show Participants */}
            {status === 'OPEN' && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Participants ({participantCount})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participantList.map(([id, data]) => (
                    <motion.div
                      key={id}
                      className="flex items-center justify-between p-2 bg-surface-800/30 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-sm">
                        {data.firstName} {data.lastName}
                      </span>
                      <span className="text-sm text-accent-400">
                        {formatNumber(data.balance)} 🍎
                      </span>
                    </motion.div>
                  ))}
                  {participantList.length === 0 && (
                    <p className="text-sm text-surface-500 text-center py-4">
                      No players yet. Share the code!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
