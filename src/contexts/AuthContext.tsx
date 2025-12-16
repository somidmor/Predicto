// ============================================
// PREDICTO - Auth Context
// Session-scoped user identity via LocalStorage
// NO AUTHENTICATION - Completely frictionless
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
  getUserId,
  isSessionAdmin,
  getAdminIdentity,
  getLastProfile,
} from '../services/storageService';
import type { LastProfile } from '../services/storageService';
import { subscribeToMyParticipantData, subscribeToParticipantFirestore } from '../services/firebaseService';
import type { Participant, ParticipantRTDB } from '../types';

interface AuthContextType {
  userId: string;
  // Session-scoped participant data
  participant: Participant | null;
  participantRTDB: ParticipantRTDB | null;
  // Admin status for current session
  isAdmin: boolean;
  hostId: string | null;
  // Last used profile (for auto-fill)
  lastProfile: LastProfile | null;
  // Session-specific helpers
  setCurrentSessionId: (sessionId: string | null) => void;
  currentSessionId: string | null;
  // Balance helpers
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  isVolunteer: boolean;
  isContestant: boolean;
  age: number;
  // Loading state
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId] = useState(() => getUserId());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantRTDB, setParticipantRTDB] = useState<ParticipantRTDB | null>(null);
  const [lastProfile] = useState<LastProfile | null>(() => getLastProfile());
  const [isLoading, setIsLoading] = useState(false);

  // Check admin status for current session
  const isAdmin = currentSessionId ? isSessionAdmin(currentSessionId) : false;
  const adminIdentity = currentSessionId ? getAdminIdentity(currentSessionId) : null;
  const hostId = adminIdentity?.hostId || null;

  // Subscribe to participant data when session changes
  useEffect(() => {
    if (!currentSessionId || isAdmin) {
      setParticipant(null);
      setParticipantRTDB(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to Firestore participant (source of truth)
    const unsubFirestore = subscribeToParticipantFirestore(
      currentSessionId,
      userId,
      (p) => {
        setParticipant(p);
        setIsLoading(false);
      }
    );

    // Subscribe to RTDB participant (real-time updates)
    const unsubRTDB = subscribeToMyParticipantData(
      currentSessionId,
      userId,
      (data) => {
        setParticipantRTDB(data);
      }
    );

    return () => {
      unsubFirestore();
      unsubRTDB();
    };
  }, [currentSessionId, userId, isAdmin]);

  // Derived balance values (prefer RTDB for real-time, fallback to Firestore)
  const balance = participantRTDB?.balance ?? participant?.balance ?? 0;
  const lockedBalance = participantRTDB?.lockedBalance ?? participant?.lockedBalance ?? 0;
  const availableBalance = balance;
  const isVolunteer = participantRTDB?.isVolunteer ?? participant?.isVolunteer ?? false;
  const isContestant = participantRTDB?.isContestant ?? participant?.isContestant ?? false;
  const age = participant?.age ?? 0;

  const handleSetCurrentSessionId = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    if (!sessionId) {
      setParticipant(null);
      setParticipantRTDB(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        participant,
        participantRTDB,
        isAdmin,
        hostId,
        lastProfile,
        setCurrentSessionId: handleSetCurrentSessionId,
        currentSessionId,
        balance,
        lockedBalance,
        availableBalance,
        isVolunteer,
        isContestant,
        age,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
