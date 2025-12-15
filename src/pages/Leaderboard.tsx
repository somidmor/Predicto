// ============================================
// PREDICTO - Leaderboard Page
// Shows top 10 players with the most Anars
// ============================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { useSession } from '../contexts/SessionContext';
import { isSessionAdmin } from '../services/storageService';
import {
  Trophy,
  Medal,
  Crown,
  Loader2,
  ArrowLeft,
  Sparkles,
  Users,
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  balance: number;
  rank: number;
}

export function Leaderboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { setSessionId: setContextSessionId, participants, participantCount, isLoading } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const isAdmin = sessionId ? isSessionAdmin(sessionId) : false;

  useEffect(() => {
    if (!sessionId) return;
    setContextSessionId(sessionId);
  }, [sessionId, setContextSessionId]);

  // Generate leaderboard from participants
  useEffect(() => {
    const entries: LeaderboardEntry[] = Object.entries(participants)
      .map(([id, data]) => ({
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        balance: data.balance + (data.lockedBalance || 0), // Include locked balance
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    setLeaderboard(entries);
  }, [participants]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-surface-400">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-surface-800/50 border-surface-700';
    }
  };

  const backLink = isAdmin ? `/admin/${sessionId}` : `/play/${sessionId}`;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <Link
                to={backLink}
                className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-full">
                <Users className="w-4 h-4 text-surface-400" />
                <span className="text-sm">{participantCount} players</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-accent-400" />
                <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
                <Sparkles className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-surface-400">Top 10 Players with the Most Anars 🍎</p>
            </div>
          </motion.div>

          {/* Leaderboard List */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                className={`p-4 rounded-xl border ${getRankBg(entry.rank)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${entry.rank <= 3 ? 'text-lg' : ''}`}>
                        {entry.firstName} {entry.lastName}
                      </h3>
                      {entry.rank === 1 && (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Champion
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-display font-bold ${
                      entry.rank === 1 ? 'text-2xl text-yellow-400' :
                      entry.rank <= 3 ? 'text-xl text-accent-400' :
                      'text-lg text-surface-300'
                    }`}>
                      {entry.balance.toLocaleString()} 🍎
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {leaderboard.length === 0 && (
              <motion.div
                className="glass-card p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Users className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-surface-400 mb-2">
                  No Players Yet
                </h2>
                <p className="text-surface-500">
                  Players will appear here once they join the session
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Session Code */}
          <motion.div
            className="text-center text-surface-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Session: <span className="font-mono text-surface-400">{sessionId}</span>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

