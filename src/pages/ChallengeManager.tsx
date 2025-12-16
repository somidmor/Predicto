import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import { isSessionAdmin } from '../services/storageService';
import {
    adminMakeVolunteer,
    addContestant,
    startBettingPhase,
    cancelChallenge,
} from '../services/firebaseService';
import {
    Users,
    Trophy,
    Loader2,
    ArrowLeft,
    UserPlus,
    Shuffle,
    Play,
    Check,
    Shield,
    AlertTriangle,
} from 'lucide-react';

export function ChallengeManager() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { formatNumber } = useLanguage();
    const { setCurrentSessionId } = useAuth();
    const {
        setSessionId: setContextSessionId,
        volunteers,
        contestants,
        participants,
        isLoading,
    } = useSession();

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

    const handleMakeVolunteer = async (userId: string) => {
        if (!sessionId) return;
        setActionLoading(`volunteer-${userId}`);
        try {
            await adminMakeVolunteer(sessionId, userId);
        } catch (err) {
            console.error('Failed to make volunteer:', err);
        }
        setActionLoading(null);
    };

    const handleAddContestant = async (userId?: string) => {
        if (!sessionId) return;
        const loadingKey = userId ? `contestant-${userId}` : 'contestant-random';
        setActionLoading(loadingKey);
        try {
            await addContestant(sessionId, userId);
        } catch (err) {
            console.error('Failed to add contestant:', err);
        }
        setActionLoading(null);
    };

    const handleStartBetting = async () => {
        if (!sessionId) return;
        setActionLoading('startBetting');
        try {
            await startBettingPhase(sessionId);
            navigate(`/admin/${sessionId}`); // Go back to dashboard
        } catch (err) {
            console.error('Failed to start betting:', err);
        }
        setActionLoading(null);
    };

    const handleCancelChallenge = async () => {
        if (!sessionId || !window.confirm('Are you sure you want to terminate this challenge? All bets will be refunded.')) return;
        setActionLoading('cancelChallenge');
        try {
            await cancelChallenge(sessionId);
            navigate(`/admin/${sessionId}`);
        } catch (err) {
            console.error('Failed to cancel challenge:', err);
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

    const volunteerList = Object.entries(volunteers);
    const participantList = Object.entries(participants);
    const currentContestants = contestants || [];

    // Filter participants who are NOT volunteers and NOT contestants
    const eligibleParticipants = participantList.filter(([id, p]) =>
        !volunteers[id] && !currentContestants.includes(id) && p.balance > 0
    );

    // Filter volunteers who are NOT contestants
    const eligibleVolunteers = volunteerList.filter(([id]) =>
        !currentContestants.includes(id)
    );

    return (
        <Layout>
            <div className="min-h-screen py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <motion.button
                            onClick={() => navigate(`/admin/${sessionId}`)}
                            className="p-2 hover:bg-surface-800 rounded-full transition-colors flex items-center gap-2 px-4"
                            whileTap={{ scale: 0.9 }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Dashboard</span>
                        </motion.button>
                        <div>
                            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6 text-primary-400" />
                                Challenge Manager
                            </h1>
                            <p className="text-surface-400">Manage volunteers and contestants</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Participants Column */}
                        <motion.div
                            className="glass-card p-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-surface-400" />
                                Participants ({eligibleParticipants.length})
                            </h2>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                {eligibleParticipants.map(([id, p]) => (
                                    <div key={id} className="p-3 bg-surface-800/50 rounded-xl border border-surface-700 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{p.firstName} {p.lastName}</p>
                                            <p className="text-sm text-accent-400">{formatNumber(p.balance)} 🍎</p>
                                        </div>
                                        <motion.button
                                            onClick={() => handleMakeVolunteer(id)}
                                            disabled={actionLoading === `volunteer-${id}`}
                                            className="btn-secondary p-2 rounded-lg"
                                            whileTap={{ scale: 0.95 }}
                                            title="Make Volunteer"
                                        >
                                            {actionLoading === `volunteer-${id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="w-4 h-4" />
                                            )}
                                        </motion.button>
                                    </div>
                                ))}
                                {eligibleParticipants.length === 0 && (
                                    <p className="text-surface-500 text-center py-4">No eligible participants</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Volunteers & Contestants Column */}
                        <motion.div
                            className="glass-card p-6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary-400" />
                                Volunteers ({eligibleVolunteers.length})
                            </h2>

                            {/* Random Select Button */}
                            <motion.button
                                onClick={() => handleAddContestant()}
                                disabled={eligibleVolunteers.length === 0 || actionLoading === 'contestant-random'}
                                className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
                                whileTap={{ scale: 0.95 }}
                            >
                                {actionLoading === 'contestant-random' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Shuffle className="w-4 h-4" />
                                        <span>Randomly Select One</span>
                                    </>
                                )}
                            </motion.button>

                            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {eligibleVolunteers.map(([id, v]) => (
                                    <div key={id} className="p-3 bg-surface-800/50 rounded-xl border border-surface-700 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{v.firstName} {v.lastName}</p>
                                            <p className="text-sm text-accent-400">{formatNumber(v.balanceLocked)} 🍎 Locked</p>
                                        </div>
                                        <motion.button
                                            onClick={() => handleAddContestant(id)}
                                            disabled={actionLoading === `contestant-${id}`}
                                            className="btn-primary p-2 rounded-lg"
                                            whileTap={{ scale: 0.95 }}
                                            title="Make Contestant"
                                        >
                                            {actionLoading === `contestant-${id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </motion.button>
                                    </div>
                                ))}
                                {eligibleVolunteers.length === 0 && (
                                    <p className="text-surface-500 text-center py-4">No volunteers available</p>
                                )}
                            </div>

                            <div className="border-t border-surface-700 pt-4">
                                <h3 className="font-bold mb-3">Selected Contestants ({currentContestants.length})</h3>
                                <div className="space-y-2 mb-4">
                                    {currentContestants.map(id => {
                                        const v = volunteers[id]; // They might be in volunteers map still? Yes, logic keeps them there until refund.
                                        // Wait, selectContestants logic kept them in volunteers map?
                                        // My addContestant logic does NOT remove them from volunteers map in RTDB, just marks isContestant.
                                        // So we can look them up in volunteers.
                                        return (
                                            <div key={id} className="p-2 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-primary-400" />
                                                <span>{v?.firstName} {v?.lastName}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    onClick={handleStartBetting}
                                    disabled={currentContestants.length < 2 || actionLoading === 'startBetting'}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {actionLoading === 'startBetting' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" />
                                            <span>Start Betting Phase</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Danger Zone */}
                <motion.div
                    className="glass-card p-6 border-red-500/20 mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2 text-red-400">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h2>
                            <p className="text-sm text-surface-400 mt-1">
                                Terminate challenge and refund all bets.
                            </p>
                        </div>
                        <motion.button
                            onClick={handleCancelChallenge}
                            disabled={actionLoading === 'cancelChallenge'}
                            className="btn-secondary border-red-500/50 text-red-400 hover:bg-red-500/10 px-4 py-2 text-sm flex items-center gap-2"
                            whileTap={{ scale: 0.95 }}
                        >
                            {actionLoading === 'cancelChallenge' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Terminate</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </div>

        </Layout >
    );
}
