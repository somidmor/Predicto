// ============================================
// PREDICTO - Odds Calculation Trigger
// Recalculates odds when bets change
// ============================================

import { onValueWritten } from 'firebase-functions/v2/database';
import * as logger from 'firebase-functions/logger';
import { rtdb } from '../services/adminService';
import { calculatePariMutuelOdds } from '../math/pariMutuel';

/**
 * Trigger that fires when bets are updated in RTDB
 * Recalculates and updates odds for all contestants
 */
export const calculateOdds = onValueWritten(
  'sessions/{sessionId}/bets',
  async (event) => {
    const sessionId = event.params.sessionId;
    const bets = event.data.after.val() as Record<string, number> | null;

    if (!bets) {
      logger.info(`No bets for session ${sessionId}`);
      return;
    }

    // Calculate new odds using pari-mutuel formula
    const { odds, totalPool } = calculatePariMutuelOdds(bets);

    // Update RTDB with new odds and pool total
    // Writing to 'odds' path won't trigger this function (different path than 'bets')
    await rtdb.ref(`sessions/${sessionId}/odds`).set(odds);
    await rtdb.ref(`sessions/${sessionId}/poolTotal`).set(totalPool);

    logger.info(`Updated odds for session ${sessionId}:`, odds, `Total pool: ${totalPool}`);
  }
);

