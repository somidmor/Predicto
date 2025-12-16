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
  adminMakeVolunteer,
  selectContestants,
  addContestant,
  startBettingPhase,
  placeBet,
  closeBetting,
  resolveChallenge,
  cancelChallenge,
  resetSession,
} from './controllers/gameLogic';

// Database Triggers
export { calculateOdds } from './triggers/odds';
