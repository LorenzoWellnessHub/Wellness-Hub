import { initializeApp } from 'firebase/app';
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

// Since the DB has a specific firestoreDatabaseId, we MUST pass it to getFirestore!
export const dbId = cleanVal(process.env.FIREBASE_DATABASE_ID) || cleanVal(process.env.firestoreDatabaseId) || config.firestoreDatabaseId || '(default)';
export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Initialize Firebase JS SDK
const firebaseApp = initializeApp(firebaseConfig);
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
