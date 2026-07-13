import express from 'express';
import path from 'path';
import fs from 'fs';
import { Booking, ComputedBooking, Coach, Slot, SlotSummary, TreatmentType, Member, CoachRegistration, EventItem } from './src/types';
import { loadDbFromFirestore, saveDbToFirestore, firebaseConfig, dbId } from './src/firebase-db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const DB_PATH = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(process.cwd(), 'data', 'db.json');

interface DbState {
  coaches: Coach[];
  slots: Slot[];
  bookings: Booking[];
  slotRestrictions?: Record<string, string[]>;
  adminPassword?: string;
  members?: Member[];
  maxFutureWeeks?: number;
  pendingCoachRegistrations?: CoachRegistration[];
  regolamento?: string;
  events?: EventItem[];
  quotaAmount?: number;
  iban?: string;
  ibanHolder?: string;
  paypalUrl?: string;
  satispayUrl?: string;
}

let cachedState: DbState | null = null;
let dbLoadPromise: Promise<void> | null = null;
let lastLoadTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache to reduce Firestore GET requests

// Synchronous-looking read helper for local fallback and initialization
function readLocalDb(): DbState {
  if (process.env.VERCEL && !fs.existsSync('/tmp/db.json')) {
    try {
      const originalPath = path.join(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(originalPath)) {
        const content = fs.readFileSync(originalPath, 'utf-8');
        fs.writeFileSync('/tmp/db.json', content, 'utf-8');
      }
    } catch (e) {
      console.error('Failed to copy initial db.json to /tmp on Vercel', e);
    }
  }

  let state: DbState;
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      state = JSON.parse(content);
    } else {
      state = {
        coaches: [
          { id: "coach_1", name: "Lorenzo", color: "emerald", pin: "1234", isAdmin: true },
          { id: "coach_2", name: "Anna", color: "purple" },
          { id: "coach_3", name: "Marco", color: "amber" },
          { id: "coach_4", name: "Sofia", color: "blue" }
        ],
        slots: [],
        bookings: [],
        slotRestrictions: {},
        members: [],
        maxFutureWeeks: 2
      };
    }
  } catch (e) {
    console.error('Error reading db.json', e);
    state = {
      coaches: [
        { id: "coach_1", name: "Lorenzo", color: "emerald", pin: "1234", isAdmin: true },
        { id: "coach_2", name: "Anna", color: "purple" },
        { id: "coach_3", name: "Marco", color: "amber" },
        { id: "coach_4", name: "Sofia", color: "blue" }
      ],
      slots: [],
      bookings: [],
      slotRestrictions: {},
      members: [],
      maxFutureWeeks: 2
    };
  }

  return normalizeDbState(state);
}

// Ensure loaded database states are normalized and migrated
function normalizeDbState(state: any): DbState {
  if (!state) {
    state = {};
  }
  if (!state.coaches) {
    state.coaches = [];
  }
  if (!state.slots) {
    state.slots = [];
  }
  if (!state.bookings) {
    state.bookings = [];
  }
  if (!state.slotRestrictions) {
    state.slotRestrictions = {};
  }
  if (!state.adminPassword) {
    state.adminPassword = 'admin123';
  }
  if (state.maxFutureWeeks === undefined) {
    state.maxFutureWeeks = 2;
  }
  if (!state.members) {
    state.members = [];
  }
  if (!state.pendingCoachRegistrations) {
    state.pendingCoachRegistrations = [];
  }
  if (!state.events) {
    state.events = [];
  }
  
  // Auto-populate members from bookings if empty
  if (state.members.length === 0 && state.bookings && state.bookings.length > 0) {
    const uniqueNames = Array.from(new Set(state.bookings.map((b: any) => b.guestName.trim()).filter(Boolean)));
    state.members = uniqueNames.map((name, i) => ({
      id: `member_${Date.now()}_${i}`,
      name,
      payments: {
        "2026-06": true,
        "2026-07": true
      }
    }));
  }

  // If Lorenzo doesn't have admin/pin, assign it
  const lorenzo = state.coaches.find((c: any) => c.id === 'coach_1' || c.name.toLowerCase() === 'lorenzo');
  if (lorenzo) {
    if (lorenzo.isAdmin === undefined) lorenzo.isAdmin = true;
    if (!lorenzo.pin) lorenzo.pin = "1234";
  } else if (state.coaches.length > 0) {
    // If no Lorenzo, make first coach admin just to have one
    if (state.coaches[0].isAdmin === undefined) state.coaches[0].isAdmin = true;
    if (!state.coaches[0].pin) state.coaches[0].pin = "1234";
  }

  if (state.quotaAmount === undefined) {
    state.quotaAmount = 30;
  }
  if (state.iban === undefined) {
    state.iban = "IT12X1234512345123456789012";
  }
  if (state.ibanHolder === undefined) {
    state.ibanHolder = "Lorenzo Wellness";
  }
  if (state.paypalUrl === undefined) {
    state.paypalUrl = "https://paypal.me/LorenzoWellness";
  }
  if (state.satispayUrl === undefined) {
    state.satispayUrl = "+39 333 1234567";
  }

  return state as DbState;
}

// Ensure state is loaded from Firestore
async function ensureDbLoaded(): Promise<void> {
  const now = Date.now();
  if (cachedState && (now - lastLoadTime < CACHE_TTL_MS)) {
    return;
  }
  if (dbLoadPromise) {
    return dbLoadPromise;
  }

  dbLoadPromise = (async () => {
    try {
      console.log('Fetching state from Firestore...');
      const stateFromFirestore = await loadDbFromFirestore();
      if (stateFromFirestore) {
        cachedState = normalizeDbState(stateFromFirestore);
        lastLoadTime = Date.now();
        console.log('Successfully loaded and normalized state from Firestore');
      } else {
        console.log('No state in Firestore. Seeding database state...');
        const initialLocalState = readLocalDb();
        cachedState = initialLocalState;
        lastLoadTime = Date.now();
        await saveDbToFirestore(initialLocalState);
        console.log('Seeded Firestore with initial state');
      }
    } catch (err) {
      console.error('Error loading state from Firestore, falling back to local file:', err);
      cachedState = readLocalDb();
    } finally {
      dbLoadPromise = null;
    }
  })();

  return dbLoadPromise;
}

// Ensure DB and read (uses the cachedState which is guaranteed to be loaded by middleware)
function readDb(): DbState {
  if (!cachedState) {
    return readLocalDb();
  }
  return cachedState;
}

async function writeDb(state: DbState): Promise<void> {
  cachedState = state;
  lastLoadTime = Date.now(); // Mark as loaded right now with the latest state
  
  // Update local JSON backup file asynchronously
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf-8', (err) => {
      if (err) console.error('Error writing local backup db.json:', err);
    });
  } catch (e) {
    console.error('Error launching write local backup:', e);
  }

  // Save to Firestore and await it!
  try {
    await saveDbToFirestore(state);
  } catch (err) {
    console.error('Error writing state to Firestore:', err);
    throw err;
  }
}

// Middleware: Intercept all API routes and ensure Firestore data is loaded
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    await ensureDbLoaded();
  }
  next();
});

// Priority booking engine
function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function computeBookingsWithStatus(bookings: Booking[]): ComputedBooking[] {
  // Group bookings by slotId
  const slotGroups: { [slotId: string]: Booking[] } = {};
  for (const b of bookings) {
    if (!slotGroups[b.slotId]) {
      slotGroups[b.slotId] = [];
    }
    slotGroups[b.slotId].push(b);
  }

  const computedBookings: ComputedBooking[] = [];

  for (const slotId in slotGroups) {
    const slotBookings = slotGroups[slotId];
    
    // Check if the event date is within 2 days of "now"
    const parts = slotId.split('_');
    let isWithin2Days = false;
    if (parts.length >= 3) {
      const dateStr = parts[1]; // "YYYY-MM-DD"
      const timeStr = parts[2]; // "HH:MM"
      try {
        const eventDate = new Date(`${dateStr}T${timeStr}:00`);
        const diffMs = eventDate.getTime() - Date.now();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        isWithin2Days = diffDays <= 2;
      } catch (err) {
        // ignore parsing errors
      }
    }
    
    // Group slot bookings by coachId
    const coachGroups: { [coachId: string]: Booking[] } = {};
    for (const b of slotBookings) {
      if (!coachGroups[b.coachId]) {
        coachGroups[b.coachId] = [];
      }
      coachGroups[b.coachId].push(b);
    }

    // Sort each coach's bookings by timestamp to assign coachIndex
    const bookingsWithCoachIndex: Array<Booking & { coachIndex: number }> = [];
    for (const coachId in coachGroups) {
      const coachB = coachGroups[coachId];
      // Sort by timestamp ascending to preserve coach order
      coachB.sort((x, y) => x.timestamp - y.timestamp);
      coachB.forEach((b, index) => {
        bookingsWithCoachIndex.push({
          ...b,
          coachIndex: index,
        });
      });
    }

    // Sort bookings according to our golden priority rules:
    // If within 2 days of the event, sort strictly by timestamp ascending (first-come, first-served)
    // Else (more than 2 days away), sort by coachIndex ascending, then timestamp ascending (balancing queue)
    bookingsWithCoachIndex.sort((x, y) => {
      if (isWithin2Days) {
        return x.timestamp - y.timestamp;
      }
      if (x.coachIndex !== y.coachIndex) {
        return x.coachIndex - y.coachIndex;
      }
      return x.timestamp - y.timestamp;
    });

    // Mark status: first 15 are 'confermato', rest are 'riserva'
    bookingsWithCoachIndex.forEach((b, sortedIndex) => {
      const status = sortedIndex < 15 ? 'confermato' : 'riserva';
      computedBookings.push({
        ...b,
        status,
      });
    });
  }

  return computedBookings;
}

// GET admin configuration (e.g. admin password and settings)
app.get('/api/admin/config', (req, res) => {
  const db = readDb();
  res.json({ 
    adminPassword: db.adminPassword || 'admin123',
    maxFutureWeeks: db.maxFutureWeeks !== undefined ? db.maxFutureWeeks : 2,
    regolamento: db.regolamento || `Benvenuto in The Wellness Hub!\n\n1. Ogni Coach ha la responsabilità di inserire correttamente i propri ospiti.\n2. Si prega di rispettare l'orario di inizio di ogni trattamento per non creare ritardi.\n3. Per i trattamenti Corpo/Viso, la soglia massima è di 15 postazioni contemporanee.\n4. Ogni coach ha una quota prioritaria di 4 ospiti confermati per fascia oraria; oltre questo limite gli ospiti vanno in coda/riserva.\n5. Eventuali cancellazioni devono essere effettuate con almeno 24 ore di preavviso.`,
    events: db.events || [],
    quotaAmount: db.quotaAmount !== undefined ? db.quotaAmount : 30,
    iban: db.iban || "IT12X1234512345123456789012",
    ibanHolder: db.ibanHolder || "Lorenzo Wellness",
    paypalUrl: db.paypalUrl || "https://paypal.me/LorenzoWellness",
    satispayUrl: db.satispayUrl || "+39 333 1234567"
  });
});

// POST update admin configuration
app.post('/api/admin/config', async (req, res) => {
  const { adminPassword, maxFutureWeeks, regolamento, events, quotaAmount, iban, ibanHolder, paypalUrl, satispayUrl } = req.body;
  const db = readDb();
  
  if (adminPassword !== undefined) {
    if (!adminPassword || adminPassword.trim().length === 0) {
      return res.status(400).json({ error: 'La password non può essere vuota.' });
    }
    db.adminPassword = adminPassword.trim();
  }
  
  if (maxFutureWeeks !== undefined) {
    db.maxFutureWeeks = Number(maxFutureWeeks);
  }

  if (regolamento !== undefined) {
    db.regolamento = regolamento;
  }

  if (events !== undefined) {
    db.events = events;
  }

  if (quotaAmount !== undefined) {
    db.quotaAmount = Number(quotaAmount);
  }

  if (iban !== undefined) {
    db.iban = iban;
  }

  if (ibanHolder !== undefined) {
    db.ibanHolder = ibanHolder;
  }

  if (paypalUrl !== undefined) {
    db.paypalUrl = paypalUrl;
  }

  if (satispayUrl !== undefined) {
    db.satispayUrl = satispayUrl;
  }

  await writeDb(db);
  res.json({ 
    success: true, 
    adminPassword: db.adminPassword,
    maxFutureWeeks: db.maxFutureWeeks,
    regolamento: db.regolamento,
    events: db.events,
    quotaAmount: db.quotaAmount,
    iban: db.iban,
    ibanHolder: db.ibanHolder,
    paypalUrl: db.paypalUrl,
    satispayUrl: db.satispayUrl
  });
});

// GET all coaches
app.get('/api/coaches', (req, res) => {
  const db = readDb();
  res.json(db.coaches);
});

// POST a new coach
app.post('/api/coaches', async (req, res) => {
  const { name, color, pin, isAdmin } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const db = readDb();
  
  // Clean names
  const cleanName = name.trim();
  const coachId = `coach_${Date.now()}`;

  const newCoach: Coach = {
    id: coachId,
    name: cleanName,
    color: 'emerald', // Force all coaches to have the same color
    pin: pin || '',
    isAdmin: !!isAdmin
  };
  db.coaches.push(newCoach);

  // Automatically create a matching Member (Socio) and associate it with this coach
  if (!db.members) {
    db.members = [];
  }

  let memberName = cleanName;
  const memberExists = db.members.some(m => m.name.toLowerCase().trim() === memberName.toLowerCase().trim());
  if (memberExists) {
    memberName = `${memberName} (Coach)`;
  }

  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  const nextYM = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: memberName,
    payments: {
      [currentYM]: true, // default current month to paid
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId,
    registrationMonth: currentYM
  };

  db.members.push(newMember);

  await writeDb(db);
  res.json(newCoach);
});

// PUT (edit) a coach
app.put('/api/coaches/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color, pin, isAdmin, phone, email, sponsorName, status, acceptedRules } = req.body;
  
  const db = readDb();
  const coachIdx = db.coaches.findIndex(c => c.id === id);
  if (coachIdx === -1) {
    return res.status(404).json({ error: 'Coach non trovato' });
  }
  
  if (name !== undefined) db.coaches[coachIdx].name = name;
  if (color !== undefined) db.coaches[coachIdx].color = color;
  if (pin !== undefined) db.coaches[coachIdx].pin = pin;
  if (isAdmin !== undefined) db.coaches[coachIdx].isAdmin = isAdmin;
  if (phone !== undefined) db.coaches[coachIdx].phone = phone;
  if (email !== undefined) db.coaches[coachIdx].email = email;
  if (sponsorName !== undefined) db.coaches[coachIdx].sponsorName = sponsorName;
  if (status !== undefined) db.coaches[coachIdx].status = status;
  if (acceptedRules !== undefined) db.coaches[coachIdx].acceptedRules = acceptedRules;
  
  await writeDb(db);
  res.json(db.coaches[coachIdx]);
});

// GET all pending coach registrations
app.get('/api/coach-registrations', (req, res) => {
  const db = readDb();
  res.json(db.pendingCoachRegistrations || []);
});

// POST register a new coach (public registration form)
app.post('/api/coach-registrations', async (req, res) => {
  const { name, phone, email, sponsorName } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome e Cognome sono obbligatori.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Il numero di cellulare è obbligatorio.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'L\'indirizzo email è obbligatorio.' });
  }
  if (!sponsorName || !sponsorName.trim()) {
    return res.status(400).json({ error: 'Il nome dello Sponsor è obbligatorio.' });
  }

  const db = readDb();
  if (!db.pendingCoachRegistrations) {
    db.pendingCoachRegistrations = [];
  }

  // Check if a registration with this name or email already exists to prevent duplicate spam
  const nameExists = db.pendingCoachRegistrations.some(r => r.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (nameExists) {
    return res.status(400).json({ error: 'È già presente una richiesta di registrazione con questo nome.' });
  }

  // Check if coach with this name already exists
  const coachExists = db.coaches.some(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (coachExists) {
    return res.status(400).json({ error: 'Questo coach è già registrato nel sistema.' });
  }

  const newReg: CoachRegistration = {
    id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    sponsorName: sponsorName.trim(),
    timestamp: Date.now()
  };

  db.pendingCoachRegistrations.push(newReg);
  await writeDb(db);

  res.json({ success: true, registration: newReg });
});

// POST approve a coach registration
app.post('/api/coach-registrations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { color, pin } = req.body;

  const db = readDb();
  if (!db.pendingCoachRegistrations) db.pendingCoachRegistrations = [];

  const regIdx = db.pendingCoachRegistrations.findIndex(r => r.id === id);
  if (regIdx === -1) {
    return res.status(404).json({ error: 'Richiesta di registrazione non trovata.' });
  }

  const reg = db.pendingCoachRegistrations[regIdx];
  const coachId = `coach_${Date.now()}`;

  // Create new coach from registration details
  const newCoach: Coach = {
    id: coachId,
    name: reg.name,
    color: 'emerald', // Force all coaches to have the same color
    pin: pin || '',
    isAdmin: false,
    phone: reg.phone,
    email: reg.email,
    sponsorName: reg.sponsorName,
    timestamp: reg.timestamp
  };

  db.coaches.push(newCoach);
  
  // Automatically create a matching Member (Socio) and associate it with this coach
  if (!db.members) {
    db.members = [];
  }

  let memberName = reg.name.trim();
  const memberExists = db.members.some(m => m.name.toLowerCase().trim() === memberName.toLowerCase().trim());
  if (memberExists) {
    memberName = `${memberName} (Coach)`;
  }

  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  const nextYM = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: memberName,
    payments: {
      [currentYM]: true, // default current month to paid
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId,
    registrationMonth: currentYM
  };

  db.members.push(newMember);

  // Remove the registration
  db.pendingCoachRegistrations.splice(regIdx, 1);
  
  await writeDb(db);

  res.json({ success: true, coach: newCoach });
});

// POST reject a coach registration
app.post('/api/coach-registrations/:id/reject', async (req, res) => {
  const { id } = req.params;

  const db = readDb();
  if (!db.pendingCoachRegistrations) db.pendingCoachRegistrations = [];

  const regIdx = db.pendingCoachRegistrations.findIndex(r => r.id === id);
  if (regIdx === -1) {
    return res.status(404).json({ error: 'Richiesta di registrazione non trovata.' });
  }

  // Remove the registration
  db.pendingCoachRegistrations.splice(regIdx, 1);
  
  await writeDb(db);

  res.json({ success: true });
});

// POST or update slot restriction
app.post('/api/slots/restrictions', async (req, res) => {
  const { slotId, allowedCoachIds } = req.body;
  if (!slotId) {
    return res.status(400).json({ error: 'slotId is required' });
  }

  const db = readDb();
  if (!db.slotRestrictions) {
    db.slotRestrictions = {};
  }

  if (!allowedCoachIds || allowedCoachIds.length === 0) {
    delete db.slotRestrictions[slotId];
  } else {
    db.slotRestrictions[slotId] = allowedCoachIds;
  }

  await writeDb(db);
  res.json({ success: true, slotRestrictions: db.slotRestrictions });
});

// DELETE a coach
app.delete('/api/coaches/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.coaches = db.coaches.filter(c => c.id !== id);
  // Cascade delete bookings
  db.bookings = db.bookings.filter(b => b.coachId !== id);
  await writeDb(db);
  res.json({ success: true });
});

// GET all members
app.get('/api/members', (req, res) => {
  const db = readDb();
  res.json(db.members || []);
});

// POST a new member
app.post('/api/members', async (req, res) => {
  const { name, coachId, quotaAmount } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Il nome del socio è richiesto.' });
  }
  const db = readDb();
  const normalized = name.trim();
  
  if (!db.members) {
    db.members = [];
  }
  
  const exists = db.members.some(m => m.name.toLowerCase() === normalized.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Un socio con questo nome esiste già.' });
  }

  if (coachId) {
    const coachAssigned = db.members.some(m => m.coachId === coachId);
    if (coachAssigned) {
      return res.status(400).json({ error: 'Questo coach è già associato a un altro socio.' });
    }
  }

  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  const nextYM = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: normalized,
    payments: {
      [currentYM]: true, // default current month to paid on manual creation
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId || undefined,
    registrationMonth: currentYM,
    quotaAmount: quotaAmount !== undefined ? Number(quotaAmount) : undefined
  };

  db.members.push(newMember);
  await writeDb(db);
  res.json(newMember);
});

// PUT (edit) a member name or toggle payments
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, payments, coachId, quotaAmount } = req.body;
  
  const db = readDb();
  if (!db.members) db.members = [];
  
  const memberIdx = db.members.findIndex(m => m.id === id);
  if (memberIdx === -1) {
    return res.status(404).json({ error: 'Socio non trovato.' });
  }
  
  if (name !== undefined) {
    const normalized = name.trim();
    if (normalized.length === 0) {
      return res.status(400).json({ error: 'Il nome del socio non può essere vuoto.' });
    }
    // Check if name already in use by another member
    const existsOther = db.members.some((m, idx) => idx !== memberIdx && m.name.toLowerCase() === normalized.toLowerCase());
    if (existsOther) {
      return res.status(400).json({ error: 'Un altro socio ha già questo nome.' });
    }
    db.members[memberIdx].name = normalized;
  }

  if (quotaAmount !== undefined) {
    db.members[memberIdx].quotaAmount = quotaAmount !== null ? Number(quotaAmount) : undefined;
  }
  
  if (payments !== undefined) {
    db.members[memberIdx].payments = {
      ...(db.members[memberIdx].payments || {}),
      ...payments
    };
  }

  if (coachId !== undefined) {
    const updatedCoachId = coachId || undefined;
    if (updatedCoachId) {
      const coachAssigned = db.members.some(m => m.id !== id && m.coachId === updatedCoachId);
      if (coachAssigned) {
        return res.status(400).json({ error: 'Questo coach è già associato a un altro socio.' });
      }
    }
    db.members[memberIdx].coachId = updatedCoachId;

    // Automatic synchronization: Update all bookings of this member to the newly associated coachId
    const memberNameNormalized = db.members[memberIdx].name.toLowerCase().trim();
    if (db.bookings) {
      db.bookings = db.bookings.map(b => {
        if (b.guestName.toLowerCase().trim() === memberNameNormalized) {
          return {
            ...b,
            coachId: updatedCoachId || b.coachId
          };
        }
        return b;
      });
    }
  }
  
  await writeDb(db);
  res.json(db.members[memberIdx]);
});

// DELETE a member
app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (db.members) {
    db.members = db.members.filter(m => m.id !== id);
  }
  await writeDb(db);
  res.json({ success: true });
});

// GET custom slots
app.get('/api/slots', (req, res) => {
  const db = readDb();
  res.json(db.slots);
});

// POST a custom slot (weekly flexible slots)
app.post('/api/slots', async (req, res) => {
  const { treatmentType, date, time } = req.body;
  if (!treatmentType || !date || !time) {
    return res.status(400).json({ error: 'Missing slot details' });
  }
  const db = readDb();
  const id = `${treatmentType}_${date}_${time}`;
  
  // Check if standard slot or already exists
  const exists = db.slots.some(s => s.id === id);
  if (exists) {
    return res.status(400).json({ error: 'Questo slot esiste già' });
  }

  const newSlot: Slot = {
    id,
    treatmentType,
    date,
    time,
    isCustom: true
  };
  db.slots.push(newSlot);
  await writeDb(db);
  res.json(newSlot);
});

// DELETE a custom slot
app.delete('/api/slots/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.slots = db.slots.filter(s => s.id !== id);
  // Cascade delete bookings
  db.bookings = db.bookings.filter(b => b.slotId !== id);
  await writeDb(db);
  res.json({ success: true });
});

// Diagnostic route to check Firebase connectivity and credentials on Vercel
app.get('/api/diagnose', async (req, res) => {
  const mask = (s: string | undefined) => {
    if (!s) return 'MISSING';
    if (s.length <= 8) return 'PRESENT (too short)';
    return `${s.slice(0, 4)}...${s.slice(-4)} (${s.length} chars)`;
  };

  const results: any = {
    env: {
      VERCEL: process.env.VERCEL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
    firebaseConfigKeys: {
      apiKey: mask(firebaseConfig.apiKey),
      authDomain: mask(firebaseConfig.authDomain),
      projectId: mask(firebaseConfig.projectId),
      storageBucket: mask(firebaseConfig.storageBucket),
      messagingSenderId: mask(firebaseConfig.messagingSenderId),
      appId: mask(firebaseConfig.appId),
    },
    databaseId: dbId,
    firestoreTest: 'not started',
  };

  try {
    const { loadDbFromFirestore } = await import('./src/firebase-db');
    
    results.firestoreTest = 'Attempting REST loadDbFromFirestore...';
    const state = await loadDbFromFirestore();
    results.firestoreTest = 'REST load completed!';
    results.appStateExists = state !== null;
    if (state) {
      results.appStateKeys = Object.keys(state);
    }
  } catch (err: any) {
    results.firestoreTest = `FAILED: ${err?.message || err}`;
    results.errorDetails = {
      name: err?.name,
      code: err?.code,
      stack: err?.stack,
    };
  }

  res.json(results);
});

// GET booking state & summaries for a given date range (usually a week)
app.get('/api/schedule/summary', (req, res) => {
  const { monday } = req.query;
  if (!monday || typeof monday !== 'string') {
    return res.status(400).json({ error: 'Monday query param required YYYY-MM-DD' });
  }

  const db = readDb();
  
  // 1. Calculate active bookings with their priorities
  const computedAllBookings = computeBookingsWithStatus(db.bookings);

  // 2. Generate date array for the week (Monday to Sunday)
  const mondayDate = new Date(monday);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  const resultSummaries: SlotSummary[] = [];

  // Standard treatment slot configuration: Monday (0), Wednesday (2), Friday (4)
  const standardDaysIdx = [0, 2, 4]; // Monday, Wednesday, Friday
  const standardTimes = ['15:00', '17:00', '19:00'];
  const treatmentTypes: TreatmentType[] = ['viso'];

  // Add all standard slots for this week
  standardDaysIdx.forEach(dayIdx => {
    const dateStr = weekDates[dayIdx];
    if (!dateStr) return;

    treatmentTypes.forEach(treatmentType => {
      standardTimes.forEach(time => {
        const slotId = `${treatmentType}_${dateStr}_${time}`;
        
        // Find bookings for this slot
        const slotBookings = computedAllBookings.filter(b => b.slotId === slotId);
        const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;
        const reserveCount = slotBookings.filter(b => b.status === 'riserva').length;

        resultSummaries.push({
          slotId,
          treatmentType,
          date: dateStr,
          time,
          isCustom: false,
          totalBookings: slotBookings.length,
          confirmedCount,
          reserveCount,
          bookings: slotBookings,
        });
      });
    });
  });

  // Add custom slots that fall into this week
  db.slots.forEach(slot => {
    // If slot falls into this week's dates and is of type 'viso'
    if (slot.treatmentType === 'viso' && weekDates.includes(slot.date)) {
      // Avoid duplication with standard slots just in case
      const isAlreadyAdded = resultSummaries.some(s => s.slotId === slot.id);
      if (!isAlreadyAdded) {
        const slotBookings = computedAllBookings.filter(b => b.slotId === slot.id);
        const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;
        const reserveCount = slotBookings.filter(b => b.status === 'riserva').length;

        resultSummaries.push({
          slotId: slot.id,
          treatmentType: slot.treatmentType,
          date: slot.date,
          time: slot.time,
          isCustom: true,
          totalBookings: slotBookings.length,
          confirmedCount,
          reserveCount,
          bookings: slotBookings,
        });
      }
    }
  });

  // Extract all 'corpo' bookings belonging to this week
  const corpoBookings = computedAllBookings.filter(b => {
    if (!b.slotId.startsWith('corpo_')) return false;
    const parts = b.slotId.split('_');
    const dateStr = parts[1];
    return weekDates.includes(dateStr);
  });

  res.json({
    monday,
    weekDates,
    summaries: resultSummaries,
    corpoBookings,
    coaches: db.coaches,
    slotRestrictions: db.slotRestrictions || {},
    maxFutureWeeks: db.maxFutureWeeks !== undefined ? db.maxFutureWeeks : 2,
    members: db.members || []
  });
});

// GET all computed bookings
app.get('/api/bookings', (req, res) => {
  const db = readDb();
  const computed = computeBookingsWithStatus(db.bookings);
  res.json(computed);
});

// POST a new booking
app.post('/api/bookings', async (req, res) => {
  const { slotId, coachId, guestName, notes } = req.body;
  if (!slotId || !coachId || !guestName) {
    return res.status(400).json({ error: 'Missing booking details' });
  }

  const db = readDb();
  
  // Verify coach exists
  const coachExists = db.coaches.some(c => c.id === coachId);
  if (!coachExists) {
    return res.status(400).json({ error: 'Coach non trovato' });
  }

  const normalizedName = guestName.trim();
  if (normalizedName.length === 0) {
    return res.status(400).json({ error: 'Il nome dell\'ospite non può essere vuoto.' });
  }

  // Find associated member for this coach
  if (!db.members) db.members = [];
  const member = db.members.find(m => m.coachId === coachId);
  if (!member) {
    return res.status(400).json({ error: 'Questo coach non ha un socio associato. Chiedi all\'Amministratore di associare un socio a questo profilo prima di prenotare.' });
  }

  // Check payment rule: Block booking if unpaid and past the deadline (30th of the previous month)
  const today = new Date();
  const currentYear = today.getFullYear();

  let isBlocked = false;
  let blockedMonthLabel = "";

  // Check next month down to previous 3 months (oldest first to ensure correct precedence of blocks)
  for (let offset = 3; offset >= -1; offset--) {
    const checkDate = new Date(currentYear, today.getMonth() - offset, 15);
    const y = checkDate.getFullYear();
    const mNum = checkDate.getMonth() + 1;
    const ymKey = `${y}-${mNum < 10 ? '0' + mNum : mNum}`;

    const isPaid = member.payments && member.payments[ymKey] !== false; // default to paid if not explicitly false

    if (!isPaid) {
      const prevY = mNum === 1 ? y - 1 : y;
      const prevM = mNum === 1 ? 12 : mNum - 1;

      const lastDayOfPrevM = new Date(prevY, prevM, 0).getDate();
      const deadlineDay = Math.min(30, lastDayOfPrevM);

      let isDeadlinePassed = false;

      if (today.getFullYear() > prevY) {
        isDeadlinePassed = true;
      } else if (today.getFullYear() === prevY) {
        if (today.getMonth() + 1 > prevM) {
          isDeadlinePassed = true;
        } else if (today.getMonth() + 1 === prevM) {
          if (today.getDate() > deadlineDay) {
            isDeadlinePassed = true;
          }
        }
      }

      if (isDeadlinePassed) {
        isBlocked = true;
        const itMonths = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        blockedMonthLabel = `${itMonths[mNum - 1]} ${y}`;
        break;
      }
    }
  }

  if (isBlocked) {
    return res.status(403).json({
      error: `Impossibile completare la prenotazione: il socio "${member.name}" associato al coach non è in regola con il pagamento della quota mensile di ${blockedMonthLabel} (scadenza entro il 30 del mese precedente).`
    });
  }

  // 40-minute validation / concurrent validation for body evaluations ('corpo')
  if (slotId.startsWith('corpo_')) {
    const parts = slotId.split('_');
    const date = parts[1];
    const time = parts[2];
    const newMinutes = parseTimeToMinutes(time);

    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mer, 4: Gio, 5: Ven, 6: Sab
    const isMonWedFri = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    const isMonWedFriAfternoon = isMonWedFri && (newMinutes >= 840); // Pomeriggio (dalle 14:00 in poi)

    if (isMonWedFriAfternoon) {
      const overlapBooking = db.bookings.find(b => {
        if (!b.slotId.startsWith('corpo_')) return false;
        const [_, otherDate, otherTime] = b.slotId.split('_');
        if (otherDate !== date) return false;
        const otherMinutes = parseTimeToMinutes(otherTime);
        return Math.abs(newMinutes - otherMinutes) < 40;
      });

      if (overlapBooking) {
        const [_, __, overlapTime] = overlapBooking.slotId.split('_');
        return res.status(400).json({ 
          error: `Questo orario si sovrappone a una valutazione già prenotata per le ore ${overlapTime}. Il lunedì, mercoledì e venerdì dalle 14 in poi è consentita solo 1 valutazione ogni 40 minuti.` 
        });
      }
    } else {
      // Altri giorni/orari: fino a 3 valutazioni in contemporanea per lo stesso slotId
      const concurrentBookings = db.bookings.filter(b => b.slotId === slotId);
      if (concurrentBookings.length >= 3) {
        return res.status(400).json({
          error: `Ci sono già 3 valutazioni prenotate in contemporanea per le ore ${time}. Negli altri orari/giorni il limite massimo è di 3 valutazioni in contemporanea.`
        });
      }
    }
  }

  const finalCoachId = (member && member.coachId) ? member.coachId : coachId;

  const newBooking: Booking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    slotId,
    coachId: finalCoachId,
    guestName,
    notes: notes || '',
    timestamp: Date.now(),
  };

  db.bookings.push(newBooking);
  await writeDb(db);

  // Recompute with new booking and return the specific computed booking
  const allComputed = computeBookingsWithStatus(db.bookings);
  const created = allComputed.find(b => b.id === newBooking.id);
  res.json(created || newBooking);
});

// PUT (edit) a booking
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { guestName, notes, slotId, requesterCoachId } = req.body;

  const db = readDb();
  const bookingIdx = db.bookings.findIndex(b => b.id === id);
  if (bookingIdx === -1) {
    return res.status(404).json({ error: 'Prenotazione non trovata' });
  }

  const booking = db.bookings[bookingIdx];

  // Restrict to the owner coach of this booking
  if (booking.coachId !== requesterCoachId) {
    return res.status(403).json({ error: 'Non puoi modificare la prenotazione di un altro coach' });
  }

  if (guestName !== undefined) {
    const normalizedName = guestName.trim();
    if (normalizedName.length === 0) {
      return res.status(400).json({ error: 'Il nome dell\'ospite non può essere vuoto.' });
    }

    // Find associated member for this coach
    if (!db.members) db.members = [];
    const member = db.members.find(m => m.coachId === booking.coachId);
    if (!member) {
      return res.status(400).json({ error: 'Questo coach non ha un socio associato. Chiedi all\'Amministratore di associare un socio a questo profilo.' });
    }

    // Check payment rule: Block booking if unpaid and past the deadline (30th of the previous month)
    const today = new Date();
    const currentYear = today.getFullYear();

    let isBlocked = false;
    let blockedMonthLabel = "";

    // Check next month down to previous 3 months (oldest first to ensure correct precedence of blocks)
    for (let offset = 3; offset >= -1; offset--) {
      const checkDate = new Date(currentYear, today.getMonth() - offset, 15);
      const y = checkDate.getFullYear();
      const mNum = checkDate.getMonth() + 1;
      const ymKey = `${y}-${mNum < 10 ? '0' + mNum : mNum}`;

      const isPaid = member.payments && member.payments[ymKey] !== false; // default to paid if not explicitly false

      if (!isPaid) {
        const prevY = mNum === 1 ? y - 1 : y;
        const prevM = mNum === 1 ? 12 : mNum - 1;

        const lastDayOfPrevM = new Date(prevY, prevM, 0).getDate();
        const deadlineDay = Math.min(30, lastDayOfPrevM);

        let isDeadlinePassed = false;

        if (today.getFullYear() > prevY) {
          isDeadlinePassed = true;
        } else if (today.getFullYear() === prevY) {
          if (today.getMonth() + 1 > prevM) {
            isDeadlinePassed = true;
          } else if (today.getMonth() + 1 === prevM) {
            if (today.getDate() > deadlineDay) {
              isDeadlinePassed = true;
            }
          }
        }

        if (isDeadlinePassed) {
          isBlocked = true;
          const itMonths = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
          blockedMonthLabel = `${itMonths[mNum - 1]} ${y}`;
          break;
        }
      }
    }

    if (isBlocked) {
      return res.status(403).json({
        error: `Impossibile completare la prenotazione: il socio "${member.name}" associato al coach non è in regola con il pagamento della quota mensile di ${blockedMonthLabel} (scadenza entro il 30 del mese precedente).`
      });
    }

    db.bookings[bookingIdx].guestName = normalizedName;
  }

  // 40-minute / concurrency validation for body evaluations if slotId is being updated
  const targetSlotId = slotId !== undefined ? slotId : booking.slotId;
  if (targetSlotId.startsWith('corpo_')) {
    const parts = targetSlotId.split('_');
    const date = parts[1];
    const time = parts[2];
    const newMinutes = parseTimeToMinutes(time);

    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mer, 4: Gio, 5: Ven, 6: Sab
    const isMonWedFri = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    const isMonWedFriAfternoon = isMonWedFri && (newMinutes >= 840); // Pomeriggio (dalle 14:00 in poi)

    if (isMonWedFriAfternoon) {
      const overlapBooking = db.bookings.find(b => {
        if (b.id === id) return false; // exclude itself
        if (!b.slotId.startsWith('corpo_')) return false;
        const [_, otherDate, otherTime] = b.slotId.split('_');
        if (otherDate !== date) return false;
        const otherMinutes = parseTimeToMinutes(otherTime);
        return Math.abs(newMinutes - otherMinutes) < 40;
      });

      if (overlapBooking) {
        const [_, __, overlapTime] = overlapBooking.slotId.split('_');
        return res.status(400).json({ 
          error: `Questo orario si sovrappone a una valutazione già prenotata per le ore ${overlapTime}. Il lunedì, mercoledì e venerdì dalle 14 in poi è consentita solo 1 valutazione ogni 40 minuti.` 
        });
      }
    } else {
      // Altri giorni/orari: fino a 3 valutazioni in contemporanea per lo stesso slotId
      const concurrentBookings = db.bookings.filter(b => b.slotId === targetSlotId && b.id !== id);
      if (concurrentBookings.length >= 3) {
        return res.status(400).json({
          error: `Ci sono già 3 valutazioni prenotate in contemporanea per le ore ${time}. Negli altri orari/giorni il limite massimo è di 3 valutazioni in contemporanea.`
        });
      }
    }
  }

  if (guestName !== undefined) db.bookings[bookingIdx].guestName = guestName;
  if (notes !== undefined) db.bookings[bookingIdx].notes = notes;
  if (slotId !== undefined) db.bookings[bookingIdx].slotId = slotId;

  await writeDb(db);

  const allComputed = computeBookingsWithStatus(db.bookings);
  const updated = allComputed.find(b => b.id === id);
  res.json(updated);
});

// DELETE a booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { coachId } = req.query;

  const db = readDb();
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Prenotazione non trovata' });
  }

  // Restrict to the owner coach of this booking
  if (booking.coachId !== coachId) {
    return res.status(403).json({ error: 'Non sei autorizzato a cancellare la prenotazione di un altro coach' });
  }

  db.bookings = db.bookings.filter(b => b.id !== id);
  await writeDb(db);
  res.json({ success: true });
});

// --- PAYMENTS API ---
// Lazy-loaded Stripe initializer
let stripeClient: any = null;
function getStripeInstance() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return null;
    }
    // Lazy require stripe to prevent crash on startup if missing
    const Stripe = require('stripe');
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Create a Stripe checkout session or fallback to simulated flow
app.post('/api/payments/create-checkout-session', async (req, res) => {
  const { memberId, monthKey } = req.body;
  if (!memberId || !monthKey) {
    return res.status(400).json({ error: 'memberId and monthKey are required' });
  }

  const db = readDb();
  const member = db.members?.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Socio non trovato.' });
  }

  const stripe = getStripeInstance();
  const amount = member.quotaAmount !== undefined ? member.quotaAmount : (db.quotaAmount !== undefined ? db.quotaAmount : 30);

  if (stripe) {
    try {
      const itMonths = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
      const [year, month] = monthKey.split('-');
      const monthLabel = `${itMonths[parseInt(month, 10) - 1]} ${year}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Quota Club - ${monthLabel}`,
                description: `Ricarica abbonamento socio ${member.name} per il mese di ${monthLabel}`,
              },
              unit_amount: amount * 100, // in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin || 'http://localhost:3000'}?payment_session_id={CHECKOUT_SESSION_ID}&payment_status=success&payment_member_id=${memberId}&payment_month_key=${monthKey}`,
        cancel_url: `${req.headers.origin || 'http://localhost:3000'}?payment_status=cancelled`,
        metadata: {
          memberId,
          monthKey,
        },
      });

      return res.json({ url: session.url, isSimulated: false });
    } catch (err: any) {
      console.error('Error creating Stripe checkout session:', err);
      return res.status(500).json({ error: 'Errore durante la creazione della sessione Stripe: ' + err.message });
    }
  } else {
    // Return simulated info
    return res.json({ isSimulated: true, amount });
  }
});

// Verify completed Stripe checkout session
app.post('/api/payments/verify-checkout-session', async (req, res) => {
  const { sessionId, memberId, monthKey } = req.body;
  if (!sessionId || !memberId || !monthKey) {
    return res.status(400).json({ error: 'Missing parameters for verification' });
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe non configurato sul server.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const db = readDb();
      const memberIdx = db.members?.findIndex(m => m.id === memberId);
      if (memberIdx !== undefined && memberIdx !== -1 && db.members) {
        db.members[memberIdx].payments = {
          ...(db.members[memberIdx].payments || {}),
          [monthKey]: true,
        };
        await writeDb(db);
        return res.json({ success: true, member: db.members[memberIdx] });
      }
      return res.status(404).json({ error: 'Socio non trovato durante la verifica.' });
    } else {
      return res.status(400).json({ error: 'Il pagamento per questa sessione non è andato a buon fine.' });
    }
  } catch (err: any) {
    console.error('Error verifying Stripe checkout session:', err);
    return res.status(500).json({ error: 'Errore di verifica: ' + err.message });
  }
});

// Directly confirm simulated payment
app.post('/api/payments/confirm-simulated', async (req, res) => {
  const { memberId, monthKey, paymentMethod } = req.body;
  if (!memberId || !monthKey) {
    return res.status(400).json({ error: 'memberId and monthKey are required' });
  }

  const db = readDb();
  if (!db.members) db.members = [];

  const memberIdx = db.members.findIndex(m => m.id === memberId);
  if (memberIdx === -1) {
    return res.status(404).json({ error: 'Socio non trovato.' });
  }

  db.members[memberIdx].payments = {
    ...(db.members[memberIdx].payments || {}),
    [monthKey]: true,
  };

  await writeDb(db);
  res.json({ success: true, member: db.members[memberIdx] });
});

// Export app for serverless environments (e.g., Vercel)
export default app;

// Setup Vite or Production Handlers
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
