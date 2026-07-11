import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Read Firebase applet configuration
let config: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    console.warn('firebase-applet-config.json not found, using empty config');
  }
} catch (err) {
  console.error('Error reading firebase-applet-config.json', err);
}

// Support both standard environment variables and the local json configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || config.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.authDomain || config.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || config.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.storageBucket || config.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.messagingSenderId || config.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || process.env.appId || config.appId
};

// Initialize Firebase JS SDK
const firebaseApp = initializeApp(firebaseConfig);

// Since the DB has a specific firestoreDatabaseId, we MUST pass it to getFirestore!
const dbId = process.env.FIREBASE_DATABASE_ID || process.env.firestoreDatabaseId || config.firestoreDatabaseId || '(default)';
export const db = getFirestore(firebaseApp, dbId);


// Collection and Document path for state
const STATE_DOC_REF = doc(db, 'config', 'appState');

/**
 * Loads the complete database state from Firestore config/appState document
 */
export async function loadDbFromFirestore(): Promise<any> {
  try {
    const docSnap = await getDoc(STATE_DOC_REF);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Error loading state from Firestore:', err);
  }
  return null;
}

/**
 * Saves the complete database state to Firestore config/appState document
 */
export async function saveDbToFirestore(state: any): Promise<void> {
  try {
    await setDoc(STATE_DOC_REF, state);
  } catch (err) {
    console.error('Error saving state to Firestore:', err);
    throw err;
  }
}
