// ============================================
// PREDICTO - Session Context
// Manages real-time game state
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
  subscribeToGameState,
  subscribeToSession,
  subscribeToChallenges,
  subscribeToParticipants,
} from '../services/firebaseService';
import type { Session, GameState, Challenge, VolunteerData, ParticipantRTDB } from '../types';

interface SessionContextType {
  sessionId: string | null;
  session: Session | null;
  gameState: GameState | null;
  challenges: Challenge[];
  // Real-time data
  volunteers: Record<string, VolunteerData>;
  contestants: string[];
  odds: Record<string, number>;
  bets: Record<string, number>;
  betCounts: Record<string, number>;
  poolTotal: number;
  // Participants
  participants: Record<string, ParticipantRTDB>;
  participantCount: number;
  // Timer
  timer: { endAt: number; duration: number; startedAt: number } | null;
  timeRemaining: number;
  // Status helpers
  status: string;
  challengeName: string | null;
  challengeId: string | null;
  requiredParticipants: number;
  winnerId: string | null;
  bettingLocked: boolean;
  // Loading
  isLoading: boolean;
  error: string | null;
  // Actions
  setSessionId: (id: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<Record<string, ParticipantRTDB>>({});
  const [participantCount, setParticipantCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to session data when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setGameState(null);
      setChallenges([]);
      setParticipants({});
      setParticipantCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to Firestore session document
    const unsubSession = subscribeToSession(sessionId, (sess) => {
      if (sess) {
        setSession(sess);
        setError(null);
      } else {
        setError('Session not found');
      }
      setIsLoading(false);
    });

    // Subscribe to RTDB game state
    const unsubGameState = subscribeToGameState(sessionId, (state) => {
      setGameState(state);
    });

    // Subscribe to challenges
    const unsubChallenges = subscribeToChallenges(sessionId, (challs) => {
      setChallenges(challs);
    });

    // Subscribe to participants
    const unsubParticipants = subscribeToParticipants(sessionId, (p, count) => {
      setParticipants(p);
      setParticipantCount(count);
    });

    return () => {
      unsubSession();
      unsubGameState();
      unsubChallenges();
      unsubParticipants();
    };
  }, [sessionId]);

  // Timer countdown effect
  useEffect(() => {
    const timer = gameState?.timer;
    if (!timer) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameState?.timer]);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setSession(null);
    setGameState(null);
    setChallenges([]);
    setParticipants({});
    setParticipantCount(0);
    setError(null);
  }, []);

  // Derived state from gameState
  const volunteers = gameState?.volunteers || {};
  const contestants = gameState?.contestants || [];
  const odds = gameState?.odds || {};
  const bets = gameState?.bets || {};
  const betCounts = gameState?.betCounts || {};
  const poolTotal = gameState?.poolTotal || 0;
  const timer = gameState?.timer || null;
  const status = gameState?.status || session?.status || 'OPEN';
  const challengeName = gameState?.challengeName || null;
  const challengeId = gameState?.challengeId || null;
  const requiredParticipants = gameState?.requiredParticipants || 2;
  const winnerId = gameState?.winnerId || null;
  const bettingLocked = gameState?.bettingLocked ?? true;

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        session,
        gameState,
        challenges,
        volunteers,
        contestants,
        odds,
        bets,
        betCounts,
        poolTotal,
        participants,
        participantCount,
        timer,
        timeRemaining,
        status,
        challengeName,
        challengeId,
        requiredParticipants,
        winnerId,
        bettingLocked,
        isLoading,
        error,
        setSessionId,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
