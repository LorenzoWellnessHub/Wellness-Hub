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

export const dbId = cleanVal(process.env.FIREBASE_DATABASE_ID) || cleanVal(process.env.firestoreDatabaseId) || config.firestoreDatabaseId || '(default)';
export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Recursive helper to convert a JS value to Firestore REST API format
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      if (val[key] !== undefined) {
        fields[key] = toFirestoreValue(val[key]);
      }
    }
    return {
      mapValue: {
        fields
      }
    };
  }
  return { stringValue: String(val) };
}

// Recursive helper to convert Firestore REST API format to a JS value
function fromFirestoreValue(fieldVal: any): any {
  if (!fieldVal) return null;
  if ('nullValue' in fieldVal) {
    return null;
  }
  if ('booleanValue' in fieldVal) {
    return fieldVal.booleanValue;
  }
  if ('integerValue' in fieldVal) {
    return parseInt(fieldVal.integerValue, 10);
  }
  if ('doubleValue' in fieldVal) {
    return parseFloat(fieldVal.doubleValue);
  }
  if ('stringValue' in fieldVal) {
    return fieldVal.stringValue;
  }
  if ('arrayValue' in fieldVal) {
    const arr = fieldVal.arrayValue.values || [];
    return arr.map(fromFirestoreValue);
  }
  if ('mapValue' in fieldVal) {
    const fields = fieldVal.mapValue.fields || {};
    const res: Record<string, any> = {};
    for (const key of Object.keys(fields)) {
      res[key] = fromFirestoreValue(fields[key]);
    }
    return res;
  }
  return null;
}

// REST Endpoint URL Helper
function getDocUrl(collectionId: string, documentId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionId}/${documentId}?key=${apiKey}`;
}

/**
 * Loads the complete database state from Firestore config/appState document via HTTP REST
 */
export async function loadDbFromFirestore(): Promise<any> {
  try {
    const url = getDocUrl('config', 'appState');
    console.log(`Firestore REST GET: ${url.replace(apiKey || '', '***')}`);
    
    const response = await fetch(url);
    if (response.status === 404) {
      console.log('Firestore document config/appState not found (404)');
      return null;
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Firestore REST GET failed with status ${response.status}: ${errText}`);
    }

    const docJson = await response.json();
    const res: any = {};
    const fields = docJson.fields || {};
    for (const key of Object.keys(fields)) {
      res[key] = fromFirestoreValue(fields[key]);
    }
    return res;
  } catch (err) {
    console.error('Error loading state from Firestore via REST:', err);
  }
  return null;
}

/**
 * Saves the complete database state to Firestore config/appState document via HTTP REST
 */
export async function saveDbToFirestore(state: any): Promise<void> {
  try {
    const url = getDocUrl('config', 'appState');
    console.log(`Firestore REST PATCH: ${url.replace(apiKey || '', '***')}`);

    const fields: Record<string, any> = {};
    for (const key of Object.keys(state)) {
      if (state[key] !== undefined) {
        fields[key] = toFirestoreValue(state[key]);
      }
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Firestore REST PATCH failed with status ${response.status}: ${errText}`);
    }
    console.log('Successfully saved state to Firestore via REST');
  } catch (err) {
    console.error('Error saving state to Firestore via REST:', err);
    throw err;
  }
}
