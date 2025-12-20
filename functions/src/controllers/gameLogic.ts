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
  ParticipantRTDB,
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
  minAge?: number;
  maxAge?: number;
}

export const createChallenge = onCall<CreateChallengeData>(
  async (request): Promise<{ challengeId: string }> => {
    const { sessionId, name, requiredParticipants, description, minAge, maxAge } = request.data;

    // Validate session and check status
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.status !== 'OPEN' && sessionData?.status !== 'RESOLVED') {
      throw new HttpsError('failed-precondition', 'Cannot create challenge: Session is not OPEN or RESOLVED');
    }

    // If RESOLVED, we need to reset participant flags first (Auto-Reset)
    if (sessionData?.status === 'RESOLVED') {
      const participantsSnapshot = await rtdb.ref(`sessions/${sessionId}/participants`).once('value');
      const participants = participantsSnapshot.val() || {};
      for (const participantId of Object.keys(participants)) {
        await updateParticipant(sessionId, participantId, {
          isVolunteer: false,
          isContestant: false,
          lockedBalance: 0,
        });
      }
    }

    if (!name || requiredParticipants < 2 || requiredParticipants > 10) {
      throw new HttpsError('invalid-argument', 'Invalid challenge parameters');
    }

    const challengeId = sessionRef.collection('challenges').doc().id;
    const now = Date.now();

    const challenge: Challenge = {
      id: challengeId,
      sessionId,
      name,
      description,
      requiredParticipants,
      minAge,
      maxAge,
      status: 'VOLUNTEERING', // Auto-start to VOLUNTEERING
      contestants: [],
      createdAt: now,
    };

    // Create challenge and update session status in a batch
    const batch = db.batch();
    batch.set(sessionRef.collection('challenges').doc(challengeId), challenge);
    batch.update(sessionRef, {
      status: 'VOLUNTEERING',
      currentChallengeId: challengeId,
    });
    await batch.commit();

    // Update RTDB game state
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'VOLUNTEERING',
      challengeId,
      challengeName: name,
      requiredParticipants,
      minAge,
      maxAge,
      volunteers: {},
      contestants: [],
      bets: {},
      odds: {},
      poolTotal: 0,
      winnerId: null,
      bettingLocked: true,
    });

    logger.info(`Challenge ${challengeId} created and started for session ${sessionId}`);

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

// DEPRECATED: Logic moved to createChallenge, but kept for backward compatibility if needed
export const startVolunteerPhase = onCall<StartVolunteerPhaseData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;
    await validateSession(sessionId);
    // ... logic is now in createChallenge
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

    // Check Age Restrictions
    if (gameState?.minAge && participant.age < gameState.minAge) {
      throw new HttpsError('failed-precondition', `Minimum age is ${gameState.minAge}`);
    }
    if (gameState?.maxAge && participant.age > gameState.maxAge) {
      throw new HttpsError('failed-precondition', `Maximum age is ${gameState.maxAge}`);
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
// ADMIN: MAKE VOLUNTEER
// ============================================

interface AdminMakeVolunteerData {
  sessionId: string;
  userId: string;
}

export const adminMakeVolunteer = onCall<AdminMakeVolunteerData>(
  async (request): Promise<VolunteerResult> => {
    const { sessionId, userId } = request.data;

    await validateSession(sessionId);

    // Check game state
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'VOLUNTEERING') {
      throw new HttpsError('failed-precondition', 'Not in volunteering phase');
    }

    // Get participant data
    const participant = await getParticipantData(sessionId, userId);

    if (participant.isVolunteer) {
      throw new HttpsError('failed-precondition', 'Already volunteered');
    }

    if (participant.isContestant) {
      throw new HttpsError('failed-precondition', 'Already a contestant');
    }

    // Check Age Restrictions
    if (gameState?.minAge && participant.age < gameState.minAge) {
      throw new HttpsError('failed-precondition', `Minimum age is ${gameState.minAge}`);
    }
    if (gameState?.maxAge && participant.age > gameState.maxAge) {
      throw new HttpsError('failed-precondition', `Maximum age is ${gameState.maxAge}`);
    }

    // Lock 100% of balance (ALL-IN)
    // If balance is 0, we can still make them volunteer? Maybe they have 0 balance but we want them in?
    // The previous logic required balance > 0. Let's stick to that for now, or allow 0 if admin forces?
    // Let's require balance > 0 to be safe for now, consistent with volunteerForChallenge.
    if (participant.balance <= 0) {
      throw new HttpsError('failed-precondition', 'Insufficient balance to volunteer');
    }

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

    logger.info(`Admin made user ${userId} a volunteer, locked ${lockedAmount}`);

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

    // Update RTDB - Set contestants and volunteers
    const selectedVolunteers: Record<string, unknown> = {};
    selected.forEach((id) => {
      selectedVolunteers[id] = volunteers[id];
    });

    // Initialize betting pools
    const initialBets: Record<string, number> = {};
    selected.forEach((id) => {
      initialBets[id] = 0;
    });
    await rtdb.ref(`sessions/${sessionId}/bets`).set(initialBets);

    // AUTO-START BETTING PHASE
    // Update Firestore
    await db.collection('sessions').doc(sessionId).update({
      status: 'BETTING',
    });

    // Update RTDB
    await rtdb.ref(`sessions/${sessionId}`).update({
      contestants: selected,
      volunteers: selectedVolunteers,
      status: 'BETTING',
      bettingLocked: false,
    });

    logger.info(`Selected ${selected.length} contestants, refunded ${unselected.length}. Betting started.`);

    return {
      success: true,
      contestants: selected,
      refundedCount: unselected.length,
    };
  }
);

// ============================================
// ADD CONTESTANT (Incremental)
// ============================================

interface AddContestantData {
  sessionId: string;
  userId?: string; // If missing, select random
}

export const addContestant = onCall<AddContestantData>(
  async (request): Promise<{ success: boolean; userId: string }> => {
    const { sessionId, userId } = request.data;

    await validateSession(sessionId);

    // Check game state
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    // Allow adding contestants in VOLUNTEERING or SELECTION phase
    if (gameState?.status !== 'VOLUNTEERING' && gameState?.status !== 'SELECTION') {
      throw new HttpsError('failed-precondition', 'Not in volunteering or selection phase');
    }

    // If in VOLUNTEERING, switch to SELECTION automatically?
    // Or just allow it. Let's allow it.

    const volunteers = gameState.volunteers || {};
    const currentContestants = gameState.contestants || [];

    let targetUserId = userId;

    if (!targetUserId) {
      // Random selection from volunteers who are NOT already contestants
      const availableVolunteers = Object.keys(volunteers).filter(
        (id) => !currentContestants.includes(id)
      );

      if (availableVolunteers.length === 0) {
        throw new HttpsError('failed-precondition', 'No available volunteers');
      }

      const randomIndex = Math.floor(Math.random() * availableVolunteers.length);
      targetUserId = availableVolunteers[randomIndex];
    }

    if (!volunteers[targetUserId]) {
      throw new HttpsError('invalid-argument', 'User is not a volunteer');
    }

    if (currentContestants.includes(targetUserId)) {
      throw new HttpsError('failed-precondition', 'User is already a contestant');
    }

    // Mark as contestant
    await updateParticipant(sessionId, targetUserId, {
      isContestant: true,
    });

    // Update RTDB contestants list
    const newContestants = [...currentContestants, targetUserId];

    // Initialize bet pool for this contestant
    await rtdb.ref(`sessions/${sessionId}/bets/${targetUserId}`).transaction(
      (current) => (current || 0)
    );

    await rtdb.ref(`sessions/${sessionId}`).update({
      contestants: newContestants,
      // If we were in VOLUNTEERING, maybe we should move to SELECTION?
      // Let's enforce SELECTION status if we start picking contestants.
      status: 'SELECTION',
    });

    // Ensure Firestore is also in SELECTION
    if (gameState.status === 'VOLUNTEERING') {
      await db.collection('sessions').doc(sessionId).update({
        status: 'SELECTION',
      });
    }

    logger.info(`Added contestant ${targetUserId}`);

    return { success: true, userId: targetUserId };
  }
);

// ============================================
// START BETTING PHASE
// ============================================

interface StartBettingPhaseData {
  sessionId: string;
}

// Logic restored and updated for manual flow
export const startBettingPhase = onCall<StartBettingPhaseData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;
    await validateSession(sessionId);

    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val();

    if (gameState?.status !== 'SELECTION') {
      throw new HttpsError('failed-precondition', 'Not in selection phase');
    }

    const contestants = gameState.contestants || [];
    if (contestants.length < 2) {
      throw new HttpsError('failed-precondition', 'Need at least 2 contestants to start betting');
    }

    // Refund unselected volunteers
    const volunteers = gameState.volunteers || {};
    const volunteerIds = Object.keys(volunteers);
    const unselected = volunteerIds.filter((id) => !contestants.includes(id));

    for (const uid of unselected) {
      const volunteerData = volunteers[uid];
      await updateParticipant(sessionId, uid, {
        balance: volunteerData.balanceLocked,
        lockedBalance: 0,
        isVolunteer: false,
      });
    }

    // Initialize betting pools (if not already done incrementally)
    const initialBets: Record<string, number> = {};
    contestants.forEach((id: string) => {
      initialBets[id] = 0;
    });
    // Merge with existing bets if any (addContestant initializes them)
    // Actually, addContestant initializes them to 0. So we can just ensure they exist.
    // But to be safe, let's just update the status.

    // Update Firestore
    await db.collection('sessions').doc(sessionId).update({
      status: 'BETTING',
    });

    // Update RTDB
    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'BETTING',
      bettingLocked: false,
    });

    logger.info(`Started betting phase with ${contestants.length} contestants. Refunded ${unselected.length} volunteers.`);

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

    // Validate inputs
    if (!sessionId || !userId || !contestantId || amount < 0) { // Allow 0 to remove bet? No, let's keep it simple for now > 0
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

    // Get bet status (current bets for this user)
    // We need to know if they already bet on this contestant to calculate difference
    const participantRef = rtdb.ref(`sessions/${sessionId}/participants/${userId}`);
    const participantSnapshot = await participantRef.once('value');
    const participantRTDB = participantSnapshot.val() as ParticipantRTDB; // Using RTDB for quick check

    // Get Firestore participant for secure balance source of truth
    const participant = await getParticipantData(sessionId, userId);

    // Calculate difference
    const currentBetAmount = participantRTDB?.bets?.[contestantId] || 0;
    const difference = amount - currentBetAmount;

    // Logic:
    // If difference > 0 (Increasing bet): Need (balance >= difference)
    // If difference < 0 (Decreasing bet): Refund (balance += abs(difference))
    // If difference == 0: No op

    if (difference === 0) {
      return {
        success: true,
        betId: 'no-change',
        oddsAtPlacement: gameState.odds[contestantId] || 1,
        newBalance: participant.balance,
      };
    }

    if (difference > 0 && participant.balance < difference) {
      throw new HttpsError('failed-precondition', 'Insufficient balance');
    }

    const newBalance = participant.balance - difference;
    const currentOdds = gameState.odds[contestantId] || 1;

    // Update participant balance
    await updateParticipant(sessionId, userId, {
      balance: newBalance,
    });

    // Update User's Personal Bet in RTDB (Sync for frontend)
    await rtdb.ref(`sessions/${sessionId}/participants/${userId}/bets/${contestantId}`).set(amount);

    // Record Transaction / Bet Document
    // Note: We create a NEW bet document for the RECORD, but logically it's an update.
    // Or we can overwrite a single bet document per contestant?
    // For now, let's keep a history of "moves" (transactions) but the "state" is in RTDB.
    // Actually, resolveChallenge uses Firestore 'bets' collection.
    // We should probably UPSERT in Firestore too to avoid double counting if resolve iterates all docs.
    // IMPORTANT: resolveChallenge sums up all bets?
    // Let's check resolveChallenge implementation later. For now, let's store the LATEST amount in a unique doc per user-contestant couple?
    // Or simpler: Just log this action as a transaction.
    // But wait, if resolveChallenge iterates ALL bet docs, and I have 2 docs (one for 10, one for +20), it sums to 30.
    // That works for additive. But if I DECREASE (one for 10, one for -5), I need to support negative amounts in bet docs?
    // BETTER APPROACH: Use a deterministic ID for the bet doc: `${userId}_${contestantId}`
    // This allows exact overwriting (UPSERT).

    const deterministicBetId = `${userId}_${contestantId}`;
    await db.collection('sessions').doc(sessionId).collection('bets').doc(deterministicBetId).set({
      id: deterministicBetId,
      userId,
      sessionId,
      contestantId,
      amount: amount, // The NEW total amount
      oddsAtPlacement: currentOdds, // Updates odds if they changed? Or keep original? Standard sports betting locks odds.
      // But this is Pari-Mutuel / Dynamic pool. Odds are final only at end.
      // So oddsAtPlacement is just informational here.
      status: 'PENDING',
      placedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });

    // Update Global Pool (RTDB)
    // We update by the DIFFERENCE
    await rtdb.ref(`sessions/${sessionId}/bets/${contestantId}`).transaction(
      (current) => (current || 0) + difference
    );
    
    // Also update total pool? Usually implicit sum.

    logger.info(`Bet updated: ${userId} on ${contestantId} from ${currentBetAmount} to ${amount} (diff: ${difference})`);

    return {
      success: true,
      betId: deterministicBetId,
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
// CANCEL CHALLENGE (Terminate)
// ============================================

interface CancelChallengeData {
  sessionId: string;
}

export const cancelChallenge = onCall<CancelChallengeData>(
  async (request): Promise<{ success: boolean }> => {
    const { sessionId } = request.data;

    await validateSession(sessionId);

    // Get game state
    const gameStateSnapshot = await rtdb.ref(`sessions/${sessionId}`).once('value');
    const gameState = gameStateSnapshot.val() as GameState;

    // Refund all pending bets
    const pendingBetsSnapshot = await db
      .collection('sessions')
      .doc(sessionId)
      .collection('bets')
      .where('status', '==', 'PENDING')
      .get();

    for (const doc of pendingBetsSnapshot.docs) {
      const betData = doc.data();
      const participant = await getParticipantData(sessionId, betData.userId);
      await updateParticipant(sessionId, betData.userId, {
        balance: participant.balance + betData.amount,
      });
      await doc.ref.update({
        status: 'REFUNDED', // Better semantic than CANCELLED for hard delete context
        payout: 0,
        resolvedAt: Date.now(),
      });
    }

    // Refund/Unlock all volunteers and contestants
    const volunteers = gameState.volunteers || {};
    const volunteerIds = Object.keys(volunteers);

    for (const uid of volunteerIds) {
      const participant = await getParticipantData(sessionId, uid);
      // If they have locked balance, unlock it.
      if (participant.lockedBalance > 0) {
        await updateParticipant(sessionId, uid, {
          balance: participant.balance + participant.lockedBalance,
          lockedBalance: 0,
          isVolunteer: false,
          isContestant: false,
        });
      } else {
        // Just clear flags
        await updateParticipant(sessionId, uid, {
          isVolunteer: false,
          isContestant: false,
        });
      }
    }

    // Get current challenge ID BEFORE clearing it
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const sessionData = sessionDoc.data();
    const challengeIdToDelete = sessionData?.currentChallengeId || gameState?.challengeId;

    // Update Firestore Session State
    await db.collection('sessions').doc(sessionId).update({
      status: 'OPEN',
      currentChallengeId: null,
    });

    // HARD DELETE: Delete the challenge document
    if (challengeIdToDelete) {
      const challengeRef = db.collection('sessions').doc(sessionId).collection('challenges').doc(challengeIdToDelete);
      const challengeDoc = await challengeRef.get();
      if (challengeDoc.exists) {
        await challengeRef.delete();
        logger.info(`HARD DELETED challenge ${challengeIdToDelete}`);
      }
    }

    // Reset RTDB game state
    const participantsSnapshot = await rtdb.ref(`sessions/${sessionId}/participants`).once('value');
    const participants = participantsSnapshot.val() || {};
    const participantCount = Object.keys(participants).length;

    await rtdb.ref(`sessions/${sessionId}`).update({
      status: 'OPEN',
      challengeId: null,
      challengeName: null,
      requiredParticipants: null,
      minAge: null,
      maxAge: null,
      volunteers: {},
      contestants: [],
      bets: {},
      odds: {},
      poolTotal: 0,
      winnerId: null,
      bettingLocked: true,
      participantCount,
    });

    logger.info(`Session ${sessionId} reset. Challenge hard deleted.`);

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
