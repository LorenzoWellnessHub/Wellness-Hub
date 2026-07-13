import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Helper to sanitize environment variables (removes accidental wrapping quotes from copy-paste)
const cleanVal = (val: any): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^["']|["']$/g, '').trim();
};

const apiKey = cleanVal(process.env.FIREBASE_API_KEY) || cleanVal(process.env.apiKey) || config.apiKey;
const authDomain = cleanVal(process.env.FIREBASE_AUTH_DOMAIN) || cleanVal(process.env.authDomain) || config.authDomain;
const projectId = cleanVal(process.env.FIREBASE_PROJECT_ID) || cleanVal(process.env.projectId) || config.projectId;
const storageBucket = cleanVal(process.env.FIREBASE_STORAGE_BUCKET) || cleanVal(process.env.storageBucket) || config.storageBucket;
const messagingSenderId = cleanVal(process.env.FIREBASE_MESSAGING_SENDER_ID) || cleanVal(process.env.messagingSenderId) || config.messagingSenderId;
const appId = cleanVal(process.env.FIREBASE_APP_ID) || cleanVal(process.env.appId) || config.appId;

// On Vercel, default to the standard "(default)" database to match standard Firebase deployments,
// unless overridden in environment variables.
const defaultDbId = process.env.VERCEL ? '(default)' : (config.firestoreDatabaseId || '(default)');
export const dbId = cleanVal(process.env.FIREBASE_DATABASE_ID) || cleanVal(process.env.firestoreDatabaseId) || defaultDbId;

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Initialize official Firebase App & Firestore
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, dbId);

/**
 * Loads the complete database state from Firestore config/appState document via Web SDK
 */
export async function loadDbFromFirestore(): Promise<any> {
  try {
    const docRef = doc(db, 'config', 'appState');
    console.log(`Firestore SDK GET: config/appState (Database: ${dbId})`);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log('Firestore document config/appState not found (does not exist)');
      return null;
    }
    
    return docSnap.data();
  } catch (err) {
    console.error('Error loading state from Firestore via Web SDK:', err);
    return null;
  }
}

/**
 * Saves the complete database state to Firestore config/appState document via Web SDK
 */
export async function saveDbToFirestore(state: any): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'appState');
    console.log(`Firestore SDK SET: config/appState (Database: ${dbId})`);
    
    // Clean undefined fields to avoid Firestore payload serialization errors
    const cleanedState = JSON.parse(JSON.stringify(state));
    
    await setDoc(docRef, cleanedState);
    console.log('Successfully saved state to Firestore via Web SDK');
  } catch (err) {
    console.error('Error saving state to Firestore via Web SDK:', err);
    throw err;
  }
}
