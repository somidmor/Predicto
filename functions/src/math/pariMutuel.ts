// ============================================
// PREDICTO - Pari-Mutuel Betting Math
// Calculates odds based on pool distribution
// ============================================

export interface OddsResult {
  odds: Record<string, number>;
  totalPool: number;
}

/**
 * Calculate pari-mutuel odds for all contestants
 * 
 * Formula: Coefficient_A = TotalPool / Pool_A
 * 
 * @param bets - Object mapping contestantId to total amount bet on them
 * @returns odds for each contestant and total pool
 */
export function calculatePariMutuelOdds(bets: Record<string, number>): OddsResult {
  // Calculate total pool
  const totalPool = Object.values(bets).reduce((sum, val) => sum + val, 0);
  
  const odds: Record<string, number> = {};
  
  Object.keys(bets).forEach((contestantId) => {
    const pool = bets[contestantId];
    
    if (pool > 0) {
      let coeff = totalPool / pool;
      // Floor to 2 decimal places for consistency
      coeff = Math.floor(coeff * 100) / 100;
      // Minimum odds of 1.01 to ensure some return
      odds[contestantId] = coeff < 1.01 ? 1.01 : coeff;
    } else {
      // No bets on this contestant - odds are undefined/0
      odds[contestantId] = 0;
    }
  });
  
  return { odds, totalPool };
}

/**
 * Calculate potential payout for a bet
 * 
 * @param betAmount - Amount being bet
 * @param odds - Current odds for the contestant
 * @returns potential payout
 */
export function calculatePotentialPayout(betAmount: number, odds: number): number {
  if (odds <= 0) return 0;
  return Math.floor(betAmount * odds);
}

/**
 * Calculate what the new odds would be if a bet were placed
 * 
 * @param currentBets - Current bet distribution
 * @param contestantId - Contestant to bet on
 * @param betAmount - Amount to bet
 * @returns new odds after the hypothetical bet
 */
export function calculateOddsAfterBet(
  currentBets: Record<string, number>,
  contestantId: string,
  betAmount: number
): OddsResult {
  const newBets = { ...currentBets };
  newBets[contestantId] = (newBets[contestantId] || 0) + betAmount;
  return calculatePariMutuelOdds(newBets);
}

/**
 * Distribute payouts to winners
 * 
 * @param bets - Array of individual bets with userId, contestantId, amount
 * @param winnerId - The winning contestant ID
 * @param odds - Final odds at resolution
 * @returns Array of payouts { userId, payout }
 */
export function calculatePayouts(
  bets: Array<{ userId: string; contestantId: string; amount: number }>,
  winnerId: string,
  odds: Record<string, number>
): Array<{ userId: string; payout: number }> {
  const winningOdds = odds[winnerId] || 0;
  
  return bets
    .filter((bet) => bet.contestantId === winnerId)
    .map((bet) => ({
      userId: bet.userId,
      payout: calculatePotentialPayout(bet.amount, winningOdds),
    }));
}

/**
 * Calculate volunteer winner reward
 * 
 * @param lockedBalance - Amount the volunteer locked
 * @param multiplier - Win multiplier (default 3x)
 * @returns reward amount
 */
export function calculateVolunteerReward(
  lockedBalance: number,
  multiplier: number = 3
): number {
  return Math.floor(lockedBalance * multiplier);
}

