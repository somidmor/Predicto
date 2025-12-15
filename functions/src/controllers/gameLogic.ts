// ============================================
// PREDICTO - Game Logic Controller
// ALL DATA IS SESSION-SCOPED
// ============================================

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db, rtdb } from '../services/adminService';
import { validateSession, getParticipantData } from './session';
import { calculatePariMutuelOdds, calculateVolunteerReward } from '../math/pariMutuel';
import {
  Participant,
  GameState,
  Challenge,
  VOLUNTEER_MULTIPLIER,
} from '../types/schema';

// ============================================
// Helper: Update participant in both Firestore and RTDB
// ============================================

async function updateParticipant(
  sessionId: string,
  userId: string,
  updates: Partial<Participant>
): Promise<void> {
  // Update Firestore (source of truth)
  await db
    .collection('sessions')
    .doc(sessionId)
    .collection('participants')
    .doc(userId)
    .update(updates);

  // Update RTDB (real-time)
  const rtdbUpdates: Record<string, unknown> = {};
  if (updates.balance !== undefined) rtdbUpdates['balance'] = updates.balance;
  if (updates.lockedBalance !== undefined) rtdbUpdates['lockedBalance'] = updates.lockedBalance;
  if (updates.isVolunteer !== undefined) rtdbUpdates['isVolunteer'] = updates.isVolunteer;
  if (updates.isContestant !== undefined) rtdbUpdates['isContestant'] = updates.isContestant;

  if (Object.keys(rtdbUpdates).length > 0) {
    await rtdb.ref(`sessions/${sessionId}/participants/${userId}`).update(rtdbUpdates);
  }
}

// ============================================
// CREATE CHALLENGE
// ============================================

interface CreateChallengeData {
  sessionId: string;
  name: string;
  requiredParticipants: number;
  description?: string;
}

export const createChallenge = onCall<CreateChallengeData>(
  async (request): Promise<{ challengeId: string }> => {
    const { sessionId, name, requiredParticipants, description } = request.data;

    await validateSession(sessionId);

    if (!name || requiredParticipants < 2 || requiredParticipants > 10) {
      throw new HttpsError('invalid-argument', 'Invalid challenge parameters');
    }

    const challengeId = db.collection('sessions').doc(sessionId).collection('challenges').doc().id;
    const now = Date.now();

    const challenge: Challenge = {
      id: challengeId,
      sessionId,
      name,
      description,
      requiredParticipants,
      status: 'PENDING',
      contestants: [],
      createdAt: now,
    };

    await db
      .collection('sessions')
      .doc(sessionId)
      .collection('challenges')
      .doc(challengeId)
      .set(challenge);

    logger.info(`Challenge ${challengeId} created for session ${sessionId}`);

    return { challengeId };
  }
);

// ============================================
// START VOLUNTEER PHASE
// ============================================

interface StartVolunteerPhaseData {
  sessionId: string;
  challengeId: string;
}

export const startVolunteerPhase = onCall<StartVolunteerPhaseData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId, challengeId } = request.data;

    await validateSession(sessionId);

    // Get challenge
    const challengeDoc = await db
      .collection('sessions')
      .doc(sessionId)
      .collection('challenges')
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      throw new HttpsError('not-found', 'Challenge not found');
    }

    const challenge = challengeDoc.data() as Challenge;

    // Update Firestore
    const batch = db.batch();
    batch.update(db.collection('sessions').doc(sessionId), {
      status: 'VOLUNTEERING',
      currentChallengeId: challengeId,
    });
    batch.update(challengeDoc.ref, { status: 'VOLUNTEERING' });
    await batch.commit();

    // Update RTDB game state
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'VOLUNTEERING',
      challengeId,
      challengeName: challenge.name,
      requiredParticipants: challenge.requiredParticipants,
      volunteers: {},
      contestants: [],
      bets: {},
      odds: {},
      poolTotal: 0,
      winnerId: null,
      bettingLocked: true,
    });

    logger.info(`Volunteer phase started for session ${sessionId}`);

    return { success: true };
  }
);

// ============================================
// CLOSE VOLUNTEERING (Move to Selection Phase)
// ============================================

interface CloseVolunteeringData {
  sessionId: string;
}

export const closeVolunteering = onCall<CloseVolunteeringData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;

    await validateSession(sessionId);

    // Check current status
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'VOLUNTEERING') {
      throw new HttpsError('failed-precondition', 'Not in volunteering phase');
    }

    // Update Firestore
    await db.collection('sessions').doc(sessionId).update({
      status: 'SELECTION',
    });

    // Update RTDB
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'SELECTION',
    });

    logger.info(`Volunteering closed for session ${sessionId}, moving to selection`);

    return { success: true };
  }
);

// ============================================
// VOLUNTEER FOR CHALLENGE (ALL-IN)
// ============================================

interface VolunteerData {
  sessionId: string;
  userId: string;
}

interface VolunteerResult {
  success: boolean;
  lockedAmount: number;
}

export const volunteerForChallenge = onCall<VolunteerData>(
  async (request): Promise<VolunteerResult> => {
    const { sessionId, userId } = request.data;

    if (!sessionId || !userId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    // Check game state - only allow volunteering during VOLUNTEERING phase
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'VOLUNTEERING') {
      throw new HttpsError('failed-precondition', 'Volunteering is not open');
    }

    // Get participant data
    const participant = await getParticipantData(sessionId, userId);

    if (participant.balance <= 0) {
      throw new HttpsError('failed-precondition', 'Insufficient balance to volunteer');
    }

    if (participant.isVolunteer) {
      throw new HttpsError('failed-precondition', 'Already volunteered');
    }

    // Lock 100% of balance (ALL-IN)
    const lockedAmount = participant.balance;

    // Update participant
    await updateParticipant(sessionId, userId, {
      balance: 0,
      lockedBalance: lockedAmount,
      isVolunteer: true,
    });

    // Add to RTDB volunteers list
    await rtdb.ref(`sessions/${sessionId}/volunteers/${userId}`).set({
      userId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      balanceLocked: lockedAmount,
      volunteeredAt: Date.now(),
    });

    logger.info(`User ${userId} volunteered, locked ${lockedAmount}`);

    return { success: true, lockedAmount };
  }
);

// ============================================
// SELECT CONTESTANTS
// ============================================

interface SelectContestantsData {
  sessionId: string;
  mode: 'MANUAL' | 'RANDOM';
  selectedIds?: string[];
  count?: number;
}

interface SelectContestantsResult {
  success: boolean;
  contestants: string[];
  refundedCount: number;
}

export const selectContestants = onCall<SelectContestantsData>(
  async (request): Promise<SelectContestantsResult> => {
    const { sessionId, mode, selectedIds, count } = request.data;

    await validateSession(sessionId);

    // Check game state - only allow selection during SELECTION phase
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'SELECTION') {
      throw new HttpsError('failed-precondition', 'Not in selection phase');
    }

    // Get volunteers from RTDB
    const volunteersSnapshot = await rtdb.ref(`sessions/${sessionId}/volunteers`).once('value');
    const volunteers = volunteersSnapshot.val() || {};
    const volunteerIds = Object.keys(volunteers);

    if (volunteerIds.length === 0) {
      throw new HttpsError('failed-precondition', 'No volunteers available');
    }

    let selected: string[];

    if (mode === 'MANUAL') {
      if (!selectedIds || selectedIds.length === 0) {
        throw new HttpsError('invalid-argument', 'Must select at least one contestant');
      }
      selected = selectedIds.filter((id) => volunteerIds.includes(id));
      if (selected.length < 2) {
        throw new HttpsError('invalid-argument', 'Must select at least 2 contestants');
      }
    } else {
      const selectCount = count || 2;
      if (volunteerIds.length < selectCount) {
        throw new HttpsError('failed-precondition', `Not enough volunteers`);
      }
      
      // Fisher-Yates shuffle
      const shuffled = [...volunteerIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      selected = shuffled.slice(0, selectCount);
    }

    // Refund unselected volunteers
    const unselected = volunteerIds.filter((id) => !selected.includes(id));

    for (const uid of unselected) {
      const volunteerData = volunteers[uid];
      await updateParticipant(sessionId, uid, {
        balance: volunteerData.balanceLocked,
        lockedBalance: 0,
        isVolunteer: false,
      });
    }

    // Mark selected as contestants
    for (const uid of selected) {
      await updateParticipant(sessionId, uid, {
        isContestant: true,
      });
    }

    // Update RTDB
    const selectedVolunteers: Record<string, unknown> = {};
    selected.forEach((id) => {
      selectedVolunteers[id] = volunteers[id];
    });

    await rtdb.ref(`sessions/${sessionId}`).update({
      contestants: selected,
      volunteers: selectedVolunteers,
    });

    // Initialize betting pools
    const initialBets: Record<string, number> = {};
    selected.forEach((id) => {
      initialBets[id] = 0;
    });
    await rtdb.ref(`sessions/${sessionId}/bets`).set(initialBets);

    logger.info(`Selected ${selected.length} contestants, refunded ${unselected.length}`);

    return {
      success: true,
      contestants: selected,
      refundedCount: unselected.length,
    };
  }
);

// ============================================
// START BETTING PHASE
// ============================================

interface StartBettingPhaseData {
  sessionId: string;
}

export const startBettingPhase = onCall<StartBettingPhaseData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;

    await validateSession(sessionId);

    // Check game state - must be in SELECTION phase with contestants selected
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'SELECTION') {
      throw new HttpsError('failed-precondition', 'Must be in selection phase');
    }

    if (!gameState?.contestants || gameState.contestants.length < 2) {
      throw new HttpsError('failed-precondition', 'Contestants must be selected first');
    }

    // Update Firestore
    await db.collection('sessions').doc(sessionId).update({
      status: 'BETTING',
    });

    // Update RTDB - no timer, host controls everything
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'BETTING',
      bettingLocked: false,
    });

    logger.info(`Betting started for session ${sessionId}`);

    return { success: true };
  }
);

// ============================================
// PLACE BET
// ============================================

interface PlaceBetData {
  sessionId: string;
  userId: string;
  contestantId: string;
  amount: number;
}

interface PlaceBetResult {
  success: boolean;
  betId: string;
  oddsAtPlacement: number;
  newBalance: number;
}

export const placeBet = onCall<PlaceBetData>(
  async (request): Promise<PlaceBetResult> => {
    const { sessionId, userId, contestantId, amount } = request.data;

    if (!sessionId || !userId || !contestantId || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Invalid bet parameters');
    }

    // Check game state
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val() as GameState;

    if (gameState.status !== 'BETTING' || gameState.bettingLocked) {
      throw new HttpsError('failed-precondition', 'Betting is not open');
    }

    if (!gameState.contestants.includes(contestantId)) {
      throw new HttpsError('invalid-argument', 'Invalid contestant');
    }

    if (gameState.contestants.includes(userId)) {
      throw new HttpsError('failed-precondition', 'Contestants cannot bet');
    }

    // Get participant
    const participant = await getParticipantData(sessionId, userId);

    if (participant.balance < amount) {
      throw new HttpsError('failed-precondition', 'Insufficient balance');
    }

    const betId = db.collection('sessions').doc(sessionId).collection('bets').doc().id;
    const newBalance = participant.balance - amount;
    const currentOdds = gameState.odds[contestantId] || 1;

    // Update participant balance
    await updateParticipant(sessionId, userId, {
      balance: newBalance,
    });

    // Record bet
    await db.collection('sessions').doc(sessionId).collection('bets').doc(betId).set({
      id: betId,
      userId,
      sessionId,
      contestantId,
      amount,
      oddsAtPlacement: currentOdds,
      status: 'PENDING',
      placedAt: Date.now(),
    });

    // Update RTDB pool
    await rtdb.ref(`sessions/${sessionId}/bets/${contestantId}`).transaction(
      (current) => (current || 0) + amount
    );

    logger.info(`Bet placed: ${userId} bet ${amount} on ${contestantId}`);

    return {
      success: true,
      betId,
      oddsAtPlacement: currentOdds,
      newBalance,
    };
  }
);

// ============================================
// CLOSE BETTING
// ============================================

interface CloseBettingData {
  sessionId: string;
}

export const closeBetting = onCall<CloseBettingData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;

    await validateSession(sessionId);

    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'IN_PROGRESS',
      bettingLocked: true,
    });

    await db.collection('sessions').doc(sessionId).update({
      status: 'IN_PROGRESS',
    });

    logger.info(`Betting closed for session ${sessionId}`);

    return { success: true };
  }
);

// ============================================
// RESOLVE CHALLENGE
// ============================================

interface ResolveChallengeData {
  sessionId: string;
  winnerId: string;
}

interface ResolveChallengeResult {
  success: boolean;
  winningCoefficient: number;
  totalPayouts: number;
  winnersCount: number;
}

export const resolveChallenge = onCall<ResolveChallengeData>(
  async (request): Promise<ResolveChallengeResult> => {
    const { sessionId, winnerId } = request.data;

    await validateSession(sessionId);

    // Get game state
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val() as GameState;

    if (!gameState.contestants.includes(winnerId)) {
      throw new HttpsError('invalid-argument', 'Winner must be a contestant');
    }

    // Calculate final odds
    const { odds } = calculatePariMutuelOdds(gameState.bets);
    const winningCoefficient = odds[winnerId] || 0;

    // Get winning bets
    const winningBetsSnapshot = await db
      .collection('sessions')
      .doc(sessionId)
      .collection('bets')
      .where('contestantId', '==', winnerId)
      .where('status', '==', 'PENDING')
      .get();

    let totalPayouts = 0;

    // Process winning bets
    for (const doc of winningBetsSnapshot.docs) {
      const betData = doc.data();
      const payout = Math.floor(betData.amount * winningCoefficient);
      totalPayouts += payout;

      // Get current balance and add payout
      const participant = await getParticipantData(sessionId, betData.userId);
      await updateParticipant(sessionId, betData.userId, {
        balance: participant.balance + payout,
      });

      await doc.ref.update({
        status: 'WON',
        payout,
        resolvedAt: Date.now(),
      });
    }

    // Mark losing bets
    const allBetsSnapshot = await db
      .collection('sessions')
      .doc(sessionId)
      .collection('bets')
      .where('status', '==', 'PENDING')
      .get();

    for (const doc of allBetsSnapshot.docs) {
      await doc.ref.update({
        status: 'LOST',
        payout: 0,
        resolvedAt: Date.now(),
      });
    }

    // Reward volunteer winner
    const volunteerData = gameState.volunteers[winnerId];
    if (volunteerData) {
      const volunteerReward = calculateVolunteerReward(
        volunteerData.balanceLocked,
        VOLUNTEER_MULTIPLIER
      );
      
      const winner = await getParticipantData(sessionId, winnerId);
      await updateParticipant(sessionId, winnerId, {
        balance: winner.balance + volunteerReward,
        lockedBalance: 0,
        isContestant: false,
        isVolunteer: false,
      });
    }

    // Zero out losing contestants
    for (const contestantId of gameState.contestants) {
      if (contestantId !== winnerId) {
        await updateParticipant(sessionId, contestantId, {
          lockedBalance: 0,
          isContestant: false,
          isVolunteer: false,
        });
      }
    }

    // Get session for currentChallengeId
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const session = sessionDoc.data();

    // Update session status
    await db.collection('sessions').doc(sessionId).update({
      status: 'RESOLVED',
    });

    if (session?.currentChallengeId) {
      await db
        .collection('sessions')
        .doc(sessionId)
        .collection('challenges')
        .doc(session.currentChallengeId)
        .update({
          status: 'RESOLVED',
          winnerId,
          resolvedAt: Date.now(),
        });
    }

    // Update RTDB
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'RESOLVED',
      winnerId,
    });

    logger.info(`Challenge resolved. Winner: ${winnerId}`);

    return {
      success: true,
      winningCoefficient,
      totalPayouts,
      winnersCount: winningBetsSnapshot.size,
    };
  }
);

// ============================================
// RESET SESSION (Start new round)
// ============================================

interface ResetSessionData {
  sessionId: string;
}

export const resetSession = onCall<ResetSessionData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;

    await validateSession(sessionId);

    // Update Firestore
    await db.collection('sessions').doc(sessionId).update({
      status: 'OPEN',
      currentChallengeId: null,
    });

    // Reset RTDB game state but keep participants
    const participantsSnapshot = await rtdb.ref(`sessions/${sessionId}/participants`).once('value');
    const participants = participantsSnapshot.val() || {};
    const participantCount = Object.keys(participants).length;

    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'OPEN',
      challengeId: null,
      challengeName: null,
      volunteers: {},
      contestants: [],
      bets: {},
      odds: {},
      poolTotal: 0,
      winnerId: null,
      bettingLocked: true,
      participantCount,
    });

    // Reset volunteer/contestant flags for all participants
    for (const participantId of Object.keys(participants)) {
      await updateParticipant(sessionId, participantId, {
        isVolunteer: false,
        isContestant: false,
        lockedBalance: 0,
      });
    }

    logger.info(`Session ${sessionId} reset for new round`);

    return { success: true };
  }
);
