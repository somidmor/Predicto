// ============================================
// PREDICTO - Session Controller
// ALL DATA IS SESSION-SCOPED
// ============================================

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db, rtdb, generateSessionId } from '../services/adminService';
import { GameState, Participant, INITIAL_BALANCE } from '../types/schema';

// ============================================
// CREATE SESSION
// ============================================

interface CreateSessionData {
  hostName?: string;
}

interface CreateSessionResult {
  sessionId: string;
  hostId: string;
}

export const createSession = onCall<CreateSessionData>(
  async (request): Promise<CreateSessionResult> => {
    const { hostName } = request.data || {};

    const sessionId = generateSessionId();
    const hostId = `host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    // Session document
    const sessionData = {
      id: sessionId,
      hostId,
      hostName: hostName || 'Anonymous Host',
      status: 'OPEN',
      createdAt: now,
    };

    // Initial game state for RTDB (real-time)
    const initialGameState: GameState = {
      status: 'OPEN',
      timer: null,
      volunteers: {},
      contestants: [],
      bets: {},
      odds: {},
      poolTotal: 0,
      bettingLocked: true,
      participantCount: 0,
    };

    try {
      await db.collection('sessions').doc(sessionId).set(sessionData);
      await rtdb.ref(`sessions/${sessionId}`).set(initialGameState);

      logger.info(`Session ${sessionId} created`);
      return { sessionId, hostId };
    } catch (error) {
      logger.error('Error creating session', error);
      throw new HttpsError('internal', 'Unable to create session');
    }
  }
);

// ============================================
// JOIN SESSION
// Creates a session-scoped participant profile
// ============================================

interface JoinSessionData {
  sessionId: string;
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
}

interface JoinSessionResult {
  success: boolean;
  participant: Participant;
  isReturning: boolean;
}

export const joinSession = onCall<JoinSessionData>(
  async (request): Promise<JoinSessionResult> => {
    const { sessionId, userId, firstName, lastName, age } = request.data;

    if (!sessionId || !userId || !firstName || !lastName || !age) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // Check if session exists
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new HttpsError('not-found', 'Session not found');
      }

      const now = Date.now();

      // Check if user already exists in THIS session
      const participantRef = db
        .collection('sessions')
        .doc(sessionId)
        .collection('participants')
        .doc(userId);

      const participantDoc = await participantRef.get();

      let participant: Participant;
      let isReturning = false;

      if (participantDoc.exists) {
        // User is returning to the same session - restore their state
        participant = participantDoc.data() as Participant;
        isReturning = true;
        logger.info(`User ${userId} returned to session ${sessionId}`);
      } else {
        // New user in this session - create fresh profile with 100 Anars
        participant = {
          userId,
          firstName,
          lastName,
          age,
          balance: INITIAL_BALANCE,
          lockedBalance: 0,
          joinedAt: now,
          isVolunteer: false,
          isContestant: false,
        };

        await participantRef.set(participant);

        // Increment participant count in RTDB (real-time)
        await rtdb.ref(`sessions/${sessionId}/participantCount`).transaction(
          (current) => (current || 0) + 1
        );

        logger.info(`User ${userId} joined session ${sessionId} with ${INITIAL_BALANCE} Anars`);
      }

      // Add to RTDB participants for real-time display
      await rtdb.ref(`sessions/${sessionId}/participants/${userId}`).set({
        firstName: participant.firstName,
        lastName: participant.lastName,
        balance: participant.balance,
        lockedBalance: participant.lockedBalance,
        isVolunteer: participant.isVolunteer,
        isContestant: participant.isContestant,
        joinedAt: participant.joinedAt,
        age: participant.age,
      });

      return { success: true, participant, isReturning };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error joining session', error);
      throw new HttpsError('internal', 'Failed to join session');
    }
  }
);

// ============================================
// GET SESSION
// ============================================

interface GetSessionData {
  sessionId: string;
}

export const getSession = onCall<GetSessionData>(
  async (request): Promise<{ session: unknown | null }> => {
    const { sessionId } = request.data;

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Session ID required');
    }

    try {
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        return { session: null };
      }

      return { session: { id: sessionDoc.id, ...sessionDoc.data() } };
    } catch (error) {
      logger.error('Error getting session', error);
      throw new HttpsError('internal', 'Failed to get session');
    }
  }
);

// ============================================
// GET PARTICIPANT (Check user's state in a session)
// ============================================

interface GetParticipantData {
  sessionId: string;
  userId: string;
}

export const getParticipant = onCall<GetParticipantData>(
  async (request): Promise<{ participant: Participant | null }> => {
    const { sessionId, userId } = request.data;

    if (!sessionId || !userId) {
      throw new HttpsError('invalid-argument', 'Session ID and User ID required');
    }

    try {
      const participantDoc = await db
        .collection('sessions')
        .doc(sessionId)
        .collection('participants')
        .doc(userId)
        .get();

      if (!participantDoc.exists) {
        return { participant: null };
      }

      return { participant: participantDoc.data() as Participant };
    } catch (error) {
      logger.error('Error getting participant', error);
      throw new HttpsError('internal', 'Failed to get participant');
    }
  }
);

// ============================================
// VALIDATE SESSION EXISTS
// ============================================

export async function validateSession(sessionId: string): Promise<void> {
  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'Session ID required');
  }

  const sessionDoc = await db.collection('sessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    throw new HttpsError('not-found', 'Session not found');
  }
}

// ============================================
// GET PARTICIPANT DATA (internal helper)
// ============================================

export async function getParticipantData(
  sessionId: string,
  userId: string
): Promise<Participant> {
  const participantDoc = await db
    .collection('sessions')
    .doc(sessionId)
    .collection('participants')
    .doc(userId)
    .get();

  if (!participantDoc.exists) {
    throw new HttpsError('not-found', 'Participant not found in this session');
  }

  return participantDoc.data() as Participant;
}
