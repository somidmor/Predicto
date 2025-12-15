// ============================================
// PREDICTO - Cloud Functions Entry Point
// Exports all callable functions and triggers
// ============================================

// Session Management
export {
  createSession,
  joinSession,
  getSession,
  getParticipant,
} from './controllers/session';

// Game Logic
export {
  createChallenge,
  startVolunteerPhase,
  closeVolunteering,
  volunteerForChallenge,
  selectContestants,
  startBettingPhase,
  placeBet,
  closeBetting,
  resolveChallenge,
  resetSession,
} from './controllers/gameLogic';

// Database Triggers
export { calculateOdds } from './triggers/odds';
