// ============================================
// PREDICTO - Firebase Service Layer
// Session-scoped, Real-time Operations
// ============================================

import { httpsCallable } from 'firebase/functions';
import type { HttpsCallableResult } from 'firebase/functions';
import { ref, onValue, off } from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { doc, getDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { functions, db, rtdb } from './firebase';
import { getUserId, setSessionUserIdentity, setCurrentSession, createAdminIdentity } from './storageService';
import type {
  Session,
  Participant,
  GameState,
  Challenge,
  JoinSessionRequest,
  JoinSessionResponse,
  VolunteerRequest,
  VolunteerResponse,
  PlaceBetRequest,
  PlaceBetResponse,
  SelectionMode,
  ParticipantRTDB,
} from '../types';

// ============================================
// Cloud Function Wrappers
// ============================================

async function callFunction<TRequest, TResponse>(
  name: string,
  data: TRequest
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functions, name);
  const result: HttpsCallableResult<TResponse> = await callable(data);
  return result.data;
}

// ============================================
// Session Management
// ============================================

export async function createSession(hostName?: string): Promise<{ sessionId: string; hostId: string }> {
  const response = await callFunction<{ hostName?: string }, { sessionId: string; hostId: string }>(
    'createSession',
    { hostName }
  );

  // Store admin identity
  createAdminIdentity(response.sessionId, response.hostId);

  return response;
}

export async function joinSession(
  sessionId: string,
  firstName: string,
  lastName: string,
  age: number
): Promise<JoinSessionResponse> {
  const userId = getUserId();

  const response = await callFunction<JoinSessionRequest, JoinSessionResponse>('joinSession', {
    sessionId,
    userId,
    firstName,
    lastName,
    age,
  });

  // Store session user identity locally
  setSessionUserIdentity(sessionId, firstName, lastName, age);
  setCurrentSession(sessionId);

  return response;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const docRef = doc(db, 'sessions', sessionId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() } as Session;
}

export async function getParticipant(
  sessionId: string,
  userId: string
): Promise<Participant | null> {
  const response = await callFunction<{ sessionId: string; userId: string }, { participant: Participant | null }>(
    'getParticipant',
    { sessionId, userId }
  );
  return response.participant;
}

// ============================================
// Challenge Management
// ============================================

export async function createChallenge(
  sessionId: string,
  name: string,
  requiredParticipants: number,
  description?: string
): Promise<{ challengeId: string }> {
  return callFunction<{
    sessionId: string;
    name: string;
    requiredParticipants: number;
    description?: string;
  }, { challengeId: string }>('createChallenge', {
    sessionId,
    name,
    requiredParticipants,
    description,
  });
}

export async function startVolunteerPhase(
  sessionId: string,
  challengeId: string
): Promise<{ success: boolean }> {
  return callFunction<{
    sessionId: string;
    challengeId: string;
  }, { success: boolean }>('startVolunteerPhase', {
    sessionId,
    challengeId,
  });
}

// ============================================
// Volunteer Actions
// ============================================

export async function volunteer(sessionId: string): Promise<VolunteerResponse> {
  const userId = getUserId();

  return callFunction<VolunteerRequest, VolunteerResponse>('volunteerForChallenge', {
    sessionId,
    userId,
  });
}

export async function adminMakeVolunteer(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; lockedAmount: number }> {
  return callFunction<{
    sessionId: string;
    userId: string;
  }, { success: boolean; lockedAmount: number }>('adminMakeVolunteer', {
    sessionId,
    userId,
  });
}

export async function addContestant(
  sessionId: string,
  userId?: string
): Promise<{ success: boolean; userId: string }> {
  return callFunction<{
    sessionId: string;
    userId?: string;
  }, { success: boolean; userId: string }>('addContestant', {
    sessionId,
    userId,
  });
}

export async function selectContestants(
  sessionId: string,
  mode: SelectionMode,
  selectedIds?: string[],
  count?: number
): Promise<{ success: boolean; contestants: string[]; refundedCount: number }> {
  return callFunction<{
    sessionId: string;
    mode: SelectionMode;
    selectedIds?: string[];
    count?: number;
  }, { success: boolean; contestants: string[]; refundedCount: number }>('selectContestants', {
    sessionId,
    mode,
    selectedIds,
    count,
  });
}

export async function closeVolunteering(
  sessionId: string
): Promise<{ success: boolean }> {
  return callFunction<{
    sessionId: string;
  }, { success: boolean }>('closeVolunteering', {
    sessionId,
  });
}

// ============================================
// Betting Actions
// ============================================

export async function startBettingPhase(
  sessionId: string
): Promise<{ success: boolean }> {
  return callFunction<{
    sessionId: string;
  }, { success: boolean }>('startBettingPhase', {
    sessionId,
  });
}

export async function placeBet(
  sessionId: string,
  contestantId: string,
  amount: number
): Promise<PlaceBetResponse> {
  const userId = getUserId();

  return callFunction<PlaceBetRequest, PlaceBetResponse>('placeBet', {
    sessionId,
    userId,
    contestantId,
    amount,
  });
}

export async function closeBetting(sessionId: string): Promise<{ success: boolean }> {
  return callFunction<{
    sessionId: string;
  }, { success: boolean }>('closeBetting', {
    sessionId,
  });
}

export async function resolveChallenge(
  sessionId: string,
  winnerId: string
): Promise<{ success: boolean; winningCoefficient: number; totalPayouts: number; winnersCount: number }> {
  return callFunction<{
    sessionId: string;
    winnerId: string;
  }, { success: boolean; winningCoefficient: number; totalPayouts: number; winnersCount: number }>('resolveChallenge', {
    sessionId,
    winnerId,
  });
}

export async function cancelChallenge(sessionId: string): Promise<{ success: boolean }> {
  return callFunction<{ sessionId: string }, { success: boolean }>('cancelChallenge', {
    sessionId,
  });
}

export async function resetSession(sessionId: string): Promise<{ success: boolean }> {
  return callFunction<{ sessionId: string }, { success: boolean }>('resetSession', {
    sessionId,
  });
}

// ============================================
// Real-time Subscriptions (RTDB)
// ============================================

export function subscribeToGameState(
  sessionId: string,
  callback: (state: GameState | null) => void
): () => void {
  const gameStateRef = ref(rtdb, `sessions/${sessionId}`);

  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as GameState);
    } else {
      callback(null);
    }
  };

  onValue(gameStateRef, listener);

  return () => off(gameStateRef, 'value', listener);
}

export function subscribeToOdds(
  sessionId: string,
  callback: (odds: Record<string, number>) => void
): () => void {
  const oddsRef = ref(rtdb, `sessions/${sessionId}/odds`);

  const listener = (snapshot: DataSnapshot) => {
    callback(snapshot.val() || {});
  };

  onValue(oddsRef, listener);

  return () => off(oddsRef, 'value', listener);
}

export function subscribeToVolunteers(
  sessionId: string,
  callback: (volunteers: Record<string, { userId: string; firstName: string; lastName: string; balanceLocked: number; volunteeredAt: number }>) => void
): () => void {
  const volunteersRef = ref(rtdb, `sessions/${sessionId}/volunteers`);

  const listener = (snapshot: DataSnapshot) => {
    callback(snapshot.val() || {});
  };

  onValue(volunteersRef, listener);

  return () => off(volunteersRef, 'value', listener);
}

export function subscribeToBets(
  sessionId: string,
  callback: (bets: Record<string, number>, poolTotal: number) => void
): () => void {
  const betsRef = ref(rtdb, `sessions/${sessionId}/bets`);
  const poolRef = ref(rtdb, `sessions/${sessionId}/poolTotal`);

  let currentBets: Record<string, number> = {};
  let currentPool = 0;

  const betsListener = (snapshot: DataSnapshot) => {
    currentBets = snapshot.val() || {};
    callback(currentBets, currentPool);
  };

  const poolListener = (snapshot: DataSnapshot) => {
    currentPool = snapshot.val() || 0;
    callback(currentBets, currentPool);
  };

  onValue(betsRef, betsListener);
  onValue(poolRef, poolListener);

  return () => {
    off(betsRef, 'value', betsListener);
    off(poolRef, 'value', poolListener);
  };
}

export function subscribeToParticipants(
  sessionId: string,
  callback: (participants: Record<string, ParticipantRTDB>, count: number) => void
): () => void {
  const participantsRef = ref(rtdb, `sessions/${sessionId}/participants`);
  const countRef = ref(rtdb, `sessions/${sessionId}/participantCount`);

  let currentParticipants: Record<string, ParticipantRTDB> = {};
  let currentCount = 0;

  const participantsListener = (snapshot: DataSnapshot) => {
    currentParticipants = snapshot.val() || {};
    callback(currentParticipants, currentCount);
  };

  const countListener = (snapshot: DataSnapshot) => {
    currentCount = snapshot.val() || 0;
    callback(currentParticipants, currentCount);
  };

  onValue(participantsRef, participantsListener);
  onValue(countRef, countListener);

  return () => {
    off(participantsRef, 'value', participantsListener);
    off(countRef, 'value', countListener);
  };
}

export function subscribeToMyParticipantData(
  sessionId: string,
  userId: string,
  callback: (data: ParticipantRTDB | null) => void
): () => void {
  const myDataRef = ref(rtdb, `sessions/${sessionId}/participants/${userId}`);

  const listener = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ParticipantRTDB);
    } else {
      callback(null);
    }
  };

  onValue(myDataRef, listener);

  return () => off(myDataRef, 'value', listener);
}

// ============================================
// Real-time Subscriptions (Firestore)
// ============================================

export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  const docRef = doc(db, 'sessions', sessionId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Session);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to session:', error);
      callback(null);
    }
  );
}

export function subscribeToChallenges(
  sessionId: string,
  callback: (challenges: Challenge[]) => void
): Unsubscribe {
  const challengesRef = collection(db, 'sessions', sessionId, 'challenges');
  const q = query(challengesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const challenges = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Challenge[];
      callback(challenges);
    },
    (error) => {
      console.error('Error subscribing to challenges:', error);
      callback([]);
    }
  );
}

export function subscribeToParticipantFirestore(
  sessionId: string,
  participantUserId: string,
  callback: (participant: Participant | null) => void
): Unsubscribe {
  const docRef = doc(db, 'sessions', sessionId, 'participants', participantUserId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Participant);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to participant:', error);
      callback(null);
    }
  );
}
