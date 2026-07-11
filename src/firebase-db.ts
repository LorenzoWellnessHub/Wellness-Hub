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

// Initialize Firebase JS SDK
const firebaseApp = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// Since the DB has a specific firestoreDatabaseId, we MUST pass it to getFirestore!
export const db = getFirestore(firebaseApp, config.firestoreDatabaseId || '(default)');

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
