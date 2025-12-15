// ============================================
// PREDICTO - Firebase Admin Service
// Centralized Firebase Admin SDK initialization
// ============================================

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export initialized services
export const db = admin.firestore();
export const rtdb = admin.database();

// Re-export admin for FieldValue access etc.
export { admin };

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a short session ID (6 characters, uppercase alphanumeric)
 */
export function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a secure admin token (64 hex characters)
 */
export function generateAdminToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token for storage (simple hash for demo - use bcrypt in production)
 */
export function hashToken(token: string): string {
  // Simple hash using SHA-256-like approach
  // In production, use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Verify an admin token against its hash
 */
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * Generate a UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

