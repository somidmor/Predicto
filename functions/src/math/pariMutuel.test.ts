// ============================================
// PREDICTO - Pari-Mutuel Math Tests
// ============================================

import {
  calculatePariMutuelOdds,
  calculatePotentialPayout,
  calculateOddsAfterBet,
  calculatePayouts,
  calculateVolunteerReward,
} from './pariMutuel';

describe('Pari-Mutuel Logic', () => {
  describe('calculatePariMutuelOdds', () => {
    test('calculates correct coefficients for balanced pool', () => {
      const bets = {
        'A': 50,
        'B': 50,
      };
      
      const { odds, totalPool } = calculatePariMutuelOdds(bets);
      
      expect(totalPool).toBe(100);
      expect(odds['A']).toBe(2.0); // 100 / 50 = 2.0
      expect(odds['B']).toBe(2.0);
    });

    test('calculates correct coefficients for skewed pool', () => {
      const bets = {
        'A': 80,
        'B': 20,
      };
      
      const { odds, totalPool } = calculatePariMutuelOdds(bets);
      
      expect(totalPool).toBe(100);
      expect(odds['A']).toBe(1.25); // 100 / 80 = 1.25
      expect(odds['B']).toBe(5.0);  // 100 / 20 = 5.0
    });

    test('handles heavily skewed pool', () => {
      const bets = {
        'A': 99,
        'B': 1,
      };
      
      const { odds } = calculatePariMutuelOdds(bets);
      
      expect(odds['A']).toBe(1.01); // 100/99 ≈ 1.01 (minimum)
      expect(odds['B']).toBe(100);  // 100 / 1 = 100
    });

    test('handles zero bets gracefully', () => {
      const bets = {
        'A': 100,
        'B': 0,
      };
      
      const { odds } = calculatePariMutuelOdds(bets);
      
      expect(odds['A']).toBe(1.01); // Minimum floor
      expect(odds['B']).toBe(0);    // No bets = 0 odds
    });

    test('handles empty pool', () => {
      const bets = {
        'A': 0,
        'B': 0,
      };
      
      const { odds, totalPool } = calculatePariMutuelOdds(bets);
      
      expect(totalPool).toBe(0);
      expect(odds['A']).toBe(0);
      expect(odds['B']).toBe(0);
    });

    test('floors odds to 2 decimal places', () => {
      const bets = {
        'A': 33,
        'B': 33,
        'C': 34,
      };
      
      const { odds } = calculatePariMutuelOdds(bets);
      
      // 100/33 = 3.0303... should floor to 3.03
      expect(odds['A']).toBe(3.03);
      expect(odds['B']).toBe(3.03);
      expect(odds['C']).toBe(2.94); // 100/34 = 2.9411... floors to 2.94
    });

    test('handles three-way pool', () => {
      const bets = {
        'A': 50,
        'B': 30,
        'C': 20,
      };
      
      const { odds, totalPool } = calculatePariMutuelOdds(bets);
      
      expect(totalPool).toBe(100);
      expect(odds['A']).toBe(2.0);
      expect(odds['B']).toBe(3.33);
      expect(odds['C']).toBe(5.0);
    });
  });

  describe('calculatePotentialPayout', () => {
    test('calculates correct payout', () => {
      expect(calculatePotentialPayout(50, 2.0)).toBe(100);
      expect(calculatePotentialPayout(20, 5.0)).toBe(100);
      expect(calculatePotentialPayout(33, 3.03)).toBe(99); // Floored
    });

    test('returns 0 for zero odds', () => {
      expect(calculatePotentialPayout(50, 0)).toBe(0);
    });

    test('floors payout to integer', () => {
      expect(calculatePotentialPayout(10, 1.55)).toBe(15); // 15.5 floors to 15
    });
  });

  describe('calculateOddsAfterBet', () => {
    test('calculates new odds after hypothetical bet', () => {
      const currentBets = {
        'A': 50,
        'B': 50,
      };
      
      // If we add 50 more to A
      const { odds, totalPool } = calculateOddsAfterBet(currentBets, 'A', 50);
      
      expect(totalPool).toBe(150);
      expect(odds['A']).toBe(1.5);  // 150 / 100 = 1.5
      expect(odds['B']).toBe(3.0);  // 150 / 50 = 3.0
    });

    test('handles new contestant', () => {
      const currentBets = {
        'A': 50,
        'B': 50,
      };
      
      const { odds, totalPool } = calculateOddsAfterBet(currentBets, 'C', 100);
      
      expect(totalPool).toBe(200);
      expect(odds['C']).toBe(2.0); // 200 / 100 = 2.0
    });
  });

  describe('calculatePayouts', () => {
    test('calculates payouts for winning bets', () => {
      const bets = [
        { userId: 'user1', contestantId: 'A', amount: 50 },
        { userId: 'user2', contestantId: 'A', amount: 30 },
        { userId: 'user3', contestantId: 'B', amount: 20 },
      ];
      
      const odds = { 'A': 1.25, 'B': 5.0 };
      
      const payouts = calculatePayouts(bets, 'A', odds);
      
      expect(payouts).toHaveLength(2);
      expect(payouts[0]).toEqual({ userId: 'user1', payout: 62 }); // 50 * 1.25 = 62.5 floored
      expect(payouts[1]).toEqual({ userId: 'user2', payout: 37 }); // 30 * 1.25 = 37.5 floored
    });

    test('returns empty array when no winners', () => {
      const bets = [
        { userId: 'user1', contestantId: 'A', amount: 50 },
      ];
      
      const odds = { 'A': 2.0, 'B': 2.0 };
      
      const payouts = calculatePayouts(bets, 'B', odds);
      
      expect(payouts).toHaveLength(0);
    });
  });

  describe('calculateVolunteerReward', () => {
    test('calculates 3x reward by default', () => {
      expect(calculateVolunteerReward(100)).toBe(300);
      expect(calculateVolunteerReward(50)).toBe(150);
    });

    test('uses custom multiplier', () => {
      expect(calculateVolunteerReward(100, 2)).toBe(200);
      expect(calculateVolunteerReward(100, 5)).toBe(500);
    });

    test('floors result', () => {
      expect(calculateVolunteerReward(33, 3)).toBe(99);
    });
  });
});

