// ============================================
// PREDICTO - LocalStorage Service
// Session-scoped identity management
// ============================================

import type { AdminIdentity, GuestIdentity, SessionUserIdentity, CachedUserProfile } from '../types';

const STORAGE_KEYS = {
  USER_ID: 'predicto_user_id',
  ADMIN_PREFIX: 'predicto_admin_',
  SESSION_USER_PREFIX: 'predicto_session_',
  LANGUAGE: 'predicto_language',
  CURRENT_SESSION: 'predicto_current_session',
  LAST_PROFILE: 'predicto_last_profile',
} as const;

// ============================================
// UUID Generation
// ============================================

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// User ID Management (Global across sessions)
// ============================================

export function getUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  
  return userId;
}

export function clearUserId(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
}

// ============================================
// Admin Identity Management
// ============================================

export function createAdminIdentity(sessionId: string, hostId: string): AdminIdentity {
  const identity: AdminIdentity = {
    sessionId,
    hostId,
    createdAt: Date.now(),
  };
  
  localStorage.setItem(
    `${STORAGE_KEYS.ADMIN_PREFIX}${sessionId}`,
    JSON.stringify(identity)
  );
  
  // Set as current session
  setCurrentSession(sessionId);
  
  return identity;
}

export function getAdminIdentity(sessionId: string): AdminIdentity | null {
  const stored = localStorage.getItem(`${STORAGE_KEYS.ADMIN_PREFIX}${sessionId}`);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored) as AdminIdentity;
  } catch {
    return null;
  }
}

export function isSessionAdmin(sessionId: string): boolean {
  return getAdminIdentity(sessionId) !== null;
}

export function clearAdminIdentity(sessionId: string): void {
  localStorage.removeItem(`${STORAGE_KEYS.ADMIN_PREFIX}${sessionId}`);
}

// ============================================
// Session User Identity (Per-Session)
// ============================================

export function getSessionUserKey(sessionId: string): string {
  const userId = getUserId();
  return `${STORAGE_KEYS.SESSION_USER_PREFIX}${sessionId}_${userId}`;
}

export function setSessionUserIdentity(
  sessionId: string,
  firstName: string,
  lastName: string,
  age: number
): SessionUserIdentity {
  const userId = getUserId();
  const identity: SessionUserIdentity = {
    sessionId,
    userId,
    firstName,
    lastName,
    age,
    joinedAt: Date.now(),
  };
  
  localStorage.setItem(getSessionUserKey(sessionId), JSON.stringify(identity));
  
  // Also save as last profile for convenience
  localStorage.setItem(STORAGE_KEYS.LAST_PROFILE, JSON.stringify({ firstName, lastName, age }));
  
  // Set as current session
  setCurrentSession(sessionId);
  
  return identity;
}

export function getSessionUserIdentity(sessionId: string): SessionUserIdentity | null {
  const key = getSessionUserKey(sessionId);
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored) as SessionUserIdentity;
  } catch {
    return null;
  }
}

export function hasJoinedSession(sessionId: string): boolean {
  return getSessionUserIdentity(sessionId) !== null || isSessionAdmin(sessionId);
}

export function clearSessionUserIdentity(sessionId: string): void {
  localStorage.removeItem(getSessionUserKey(sessionId));
}

// ============================================
// Guest Identity Management
// ============================================

export function getGuestIdentity(): GuestIdentity {
  return {
    userId: getUserId(),
    createdAt: Date.now(),
  };
}

// ============================================
// Current Session
// ============================================

export function getCurrentSession(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
}

export function setCurrentSession(sessionId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}

// ============================================
// User Profile Cache (Last used profile)
// ============================================

export interface LastProfile {
  firstName: string;
  lastName: string;
  age: number;
}

export function getLastProfile(): LastProfile | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE);
  
  if (!stored) {
    return null;
  }
  
  try {
    const profile = JSON.parse(stored);
    if (profile.firstName && profile.lastName && profile.age) {
      return {
        firstName: profile.firstName,
        lastName: profile.lastName,
        age: profile.age,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// Cached User Profile (for context)
// ============================================

export function getCachedUserProfile(sessionId: string): CachedUserProfile | null {
  const identity = getSessionUserIdentity(sessionId);
  if (!identity) return null;
  
  return {
    sessionId,
    userId: identity.userId,
    firstName: identity.firstName,
    lastName: identity.lastName,
    age: identity.age,
    balance: 0, // Will be updated from server
    lockedBalance: 0,
    isVolunteer: false,
    isContestant: false,
    cachedAt: Date.now(),
  };
}

export function updateCachedUserProfile(
  sessionId: string,
  updates: Partial<CachedUserProfile>
): void {
  const key = `${STORAGE_KEYS.SESSION_USER_PREFIX}${sessionId}_profile`;
  const stored = localStorage.getItem(key);
  
  let profile: Partial<CachedUserProfile> = {};
  if (stored) {
    try {
      profile = JSON.parse(stored);
    } catch {
      // Start fresh
    }
  }
  
  localStorage.setItem(key, JSON.stringify({ ...profile, ...updates, cachedAt: Date.now() }));
}

// ============================================
// Language Preference
// ============================================

export type Language = 'en' | 'fa';

export function getLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  return (stored === 'fa' ? 'fa' : 'en') as Language;
}

export function setLanguage(language: Language): void {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  
  // Update document direction
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
}

// ============================================
// Clear All Data
// ============================================

export function clearAllData(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('predicto_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// ============================================
// Get all joined sessions
// ============================================

export function getAllJoinedSessions(): SessionUserIdentity[] {
  const sessions: SessionUserIdentity[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.SESSION_USER_PREFIX) && !key.includes('_profile')) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          sessions.push(JSON.parse(stored) as SessionUserIdentity);
        } catch {
          // Skip invalid entries
        }
      }
    }
  }
  
  return sessions.sort((a, b) => b.joinedAt - a.joinedAt);
}
