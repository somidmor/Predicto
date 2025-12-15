// ============================================
// PREDICTO - Firebase SDK Initialization
// ============================================

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import type { Database } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import type { Functions } from 'firebase/functions';

// Firebase configuration
// In production, these would come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'predicto-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'predicto-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'predicto-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://predicto-demo-default-rtdb.firebaseio.com',
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let rtdb: Database;
let functions: Functions;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  rtdb = getDatabase(app);
  functions = getFunctions(app);

  // Connect to emulators in development
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Connected to Firebase Emulators');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app, db, rtdb, functions };
export default app;

