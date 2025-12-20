// ============================================
// PREDICTO - Backend Type Definitions
// ALL DATA IS SESSION-SCOPED
// ============================================

// Session Status
export type SessionStatus = 'OPEN' | 'VOLUNTEERING' | 'SELECTION' | 'BETTING' | 'IN_PROGRESS' | 'RESOLVED';

// Challenge Status
export type ChallengeStatus = 'PENDING' | 'VOLUNTEERING' | 'SELECTION' | 'BETTING' | 'IN_PROGRESS' | 'RESOLVED';

// Selection Mode
export type SelectionMode = 'MANUAL' | 'RANDOM';

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
  id: string;
  hostId: string;
  hostName?: string;
  status: SessionStatus;
  createdAt: number;
  currentChallengeId?: string;
}

export interface Challenge {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  requiredParticipants: number;
  minAge?: number;
  maxAge?: number;
  status: ChallengeStatus;
  contestants: string[];
  winnerId?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ============================================
// PARTICIPANT (Session-Scoped User)
// Each user has a separate profile per session
// ============================================

export interface Participant {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  balance: number;
  lockedBalance: number;
  joinedAt: number;
  isVolunteer: boolean;
  isContestant: boolean;
}

// ============================================
// REALTIME DATABASE TYPES (Game State)
// All in sessions/{sessionId}/
// ============================================

export interface VolunteerData {
  userId: string;
  firstName: string;
  lastName: string;
  balanceLocked: number;
  volunteeredAt: number;
}

export interface TimerState {
  endAt: number;
  duration: number;
  startedAt: number;
}

export interface GameState {
  status: SessionStatus;
  challengeId?: string;
  challengeName?: string;
  timer: TimerState | null;
  volunteers: Record<string, VolunteerData>;
  contestants: string[];
  bets: Record<string, number>;
  odds: Record<string, number>;
  poolTotal: number;
  winnerId?: string;
  bettingLocked: boolean;
  participantCount: number;
}

// ============================================
// BET TYPES (Session-Scoped)
// ============================================

export interface Bet {
  id: string;
  userId: string;
  sessionId: string;
  challengeId: string;
  contestantId: string;
  amount: number;
  oddsAtPlacement: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  payout?: number;
  placedAt: number;
  resolvedAt?: number;
}

export interface ParticipantRTDB {
  firstName: string;
  lastName: string;
  balance: number;
  lockedBalance: number;
  isVolunteer: boolean;
  isContestant: boolean;
  joinedAt: number;
  age: number;
  bets?: Record<string, number>;
}

// ============================================
// CONSTANTS
// ============================================

export const INITIAL_BALANCE = 1000;
export const MIN_BET_AMOUNT = 1;
export const VOLUNTEER_MULTIPLIER = 2;
export const DEFAULT_BETTING_DURATION = 60;
export const MIN_CONTESTANTS = 2;
export const MAX_CONTESTANTS = 10;
