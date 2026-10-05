import express from 'express';
import path from 'path';
import fs from 'fs';
import { Booking, ComputedBooking, Coach, Slot, SlotSummary, TreatmentType, Member, PaymentRequest, CoachRegistration, EventItem, AppNotification, UtilityItem, OperatorEarning, MonthlyCheque, Contact } from './src/types';
import { loadDbFromFirestore, saveDbToFirestore, firebaseConfig, dbId } from './src/firebase-db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const DB_PATH = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(process.cwd(), 'data', 'db.json');

interface DbState {
  coaches: Coach[];
  slots: Slot[];
  bookings: Booking[];
  slotRestrictions?: Record<string, string[]>;
  disabledSlots?: string[];
  adminPassword?: string;
  members?: Member[];
  paymentRequests?: PaymentRequest[];
  maxFutureWeeks?: number;
  pendingCoachRegistrations?: CoachRegistration[];
  regolamento?: string;
  events?: EventItem[];
  quotaAmount?: number;
  iban?: string;
  ibanHolder?: string;
  paypalUrl?: string;
  satispayUrl?: string;
  notifications?: AppNotification[];
  utilities?: UtilityItem[];
  earnings?: OperatorEarning[];
  cheques?: MonthlyCheque[];
  contacts?: Contact[];
  shakePartyConfig?: {
    date: string;
    time: string;
    title?: string;
    notes?: string;
  };
  homConfig?: {
    time: string;
    title?: string;
    notes?: string;
  };
  firstMonthFree?: boolean;
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
  if (!state.disabledSlots) {
    state.disabledSlots = [];
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
  if (!state.paymentRequests) {
    state.paymentRequests = [];
  }
  if (!state.pendingCoachRegistrations) {
    state.pendingCoachRegistrations = [];
  }
  if (!state.events) {
    state.events = [];
  }
  if (!state.notifications) {
    state.notifications = [];
  }
  if (!state.utilities) {
    state.utilities = [];
  }
  if (!state.earnings) {
    state.earnings = [];
  } else {
    state.earnings = state.earnings.map((e: any) => ({
      ...e,
      type: e.type || 'skin'
    }));
  }
  if (!state.cheques) {
    state.cheques = [];
  }
  if (!state.contacts) {
    state.contacts = [];
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
  if (state.shakePartyConfig === undefined) {
    state.shakePartyConfig = { date: '', time: '20:30', title: 'Shake Party Mensile', notes: '' };
  }
  if (state.homConfig === undefined) {
    state.homConfig = { time: '20:30', title: 'HOM - Herbalife Opportunity Meeting', notes: '' };
  }
  if (state.firstMonthFree === undefined) {
    state.firstMonthFree = true;
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

let isSaving = false;
let needsSave = false;

async function triggerFirestoreSave() {
  if (isSaving) {
    needsSave = true;
    return;
  }
  isSaving = true;
  needsSave = false;
  try {
    if (cachedState) {
      await saveDbToFirestore(cachedState);
    }
  } catch (err) {
    console.error('Error writing state to Firestore background queue:', err);
  } finally {
    isSaving = false;
    if (needsSave) {
      triggerFirestoreSave();
    }
  }
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

  // Trigger Firestore save in background queue without awaiting it
  triggerFirestoreSave();
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

function extractInsiemeName(notes?: string): string {
  if (!notes) return '';
  const match = notes.match(/insieme a:\s*([^)]+)/i);
  return match ? match[1].trim().toLowerCase() : '';
}

function enrichPairInfo(bookings: Booking[]): Booking[] {
  const result: Booking[] = bookings.map(b => ({ ...b }));
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // First pass: Link bookings that already have matching groupId
  const groupMap = new Map<string, Booking[]>();
  for (const b of result) {
    if (b.groupId) {
      const list = groupMap.get(b.groupId) || [];
      list.push(b);
      groupMap.set(b.groupId, list);
    }
  }

  for (const [_, members] of groupMap.entries()) {
    if (members.length >= 2) {
      for (const m of members) {
        if (!m.pairGuestName) {
          const other = members.find(o => o.id !== m.id);
          if (other) m.pairGuestName = other.guestName;
        }
      }
    }
  }

  // Second pass: Detect unlinked pairs in the same slot and coach
  for (let i = 0; i < result.length; i++) {
    const b1 = result[i];

    for (let j = i + 1; j < result.length; j++) {
      const b2 = result[j];
      if (b1.slotId !== b2.slotId) continue;
      if (b1.coachId !== b2.coachId) continue;

      // If already in same group, done
      if (b1.groupId && b2.groupId && b1.groupId === b2.groupId) continue;

      const b1Name = norm(b1.guestName);
      const b2Name = norm(b2.guestName);

      // Check explicit pairGuestName
      const pairMatch = 
        (norm(b1.pairGuestName) && norm(b1.pairGuestName) === b2Name) ||
        (norm(b2.pairGuestName) && norm(b2.pairGuestName) === b1Name);

      // Check notes: "(Insieme a: <name>)"
      const b1Insieme = extractInsiemeName(b1.notes);
      const b2Insieme = extractInsiemeName(b2.notes);
      const notesMatch = (b1Insieme && b1Insieme === b2Name) || (b2Insieme && b2Insieme === b1Name);

      // Check id suffix & timestamp (e.g. created together with _1_ and _2_)
      const isPairById = (b1.id.includes('_1_') && b2.id.includes('_2_')) || (b1.id.includes('_2_') && b2.id.includes('_1_'));
      const timeDiff = Math.abs(b1.timestamp - b2.timestamp);
      const isPairByTimeAndId = isPairById && timeDiff <= 5000;

      if (pairMatch || notesMatch || isPairByTimeAndId) {
        const sharedGroupId = b1.groupId || b2.groupId || `party_${Math.min(b1.timestamp, b2.timestamp)}_${b1.coachId}`;
        b1.groupId = sharedGroupId;
        b2.groupId = sharedGroupId;
        if (!b1.pairGuestName) b1.pairGuestName = b2.guestName;
        if (!b2.pairGuestName) b2.pairGuestName = b1.guestName;
      }
    }
  }

  return result;
}

function computeBookingsWithStatus(bookings: Booking[]): ComputedBooking[] {
  const enriched = enrichPairInfo(bookings);

  // Group bookings by slotId
  const slotGroups: { [slotId: string]: Booking[] } = {};
  for (const b of enriched) {
    if (!slotGroups[b.slotId]) {
      slotGroups[b.slotId] = [];
    }
    slotGroups[b.slotId].push(b);
  }

  const computedBookings: ComputedBooking[] = [];

  for (const slotId in slotGroups) {
    const slotBookings = slotGroups[slotId];

    // Form parties: people booked together stay strictly adjacent in the list
    const parties: Booking[][] = [];
    const visited = new Set<string>();

    for (const b of slotBookings) {
      if (visited.has(b.id)) continue;
      visited.add(b.id);

      if (b.groupId) {
        const companions = slotBookings.filter(other => other.id !== b.id && other.groupId === b.groupId && !visited.has(other.id));
        companions.forEach(c => visited.add(c.id));
        // Sort within party so 1st guest is first, 2nd guest is second
        const party = [b, ...companions].sort((x, y) => x.timestamp - y.timestamp);
        parties.push(party);
      } else if (b.pairGuestName) {
        const normPair = (b.pairGuestName || '').trim().toLowerCase();
        const companion = slotBookings.find(other => other.id !== b.id && !visited.has(other.id) && (
          (other.guestName || '').trim().toLowerCase() === normPair ||
          (other.pairGuestName || '').trim().toLowerCase() === (b.guestName || '').trim().toLowerCase()
        ));
        if (companion) {
          visited.add(companion.id);
          const party = [b, companion].sort((x, y) => x.timestamp - y.timestamp);
          parties.push(party);
        } else {
          parties.push([b]);
        }
      } else {
        parties.push([b]);
      }
    }

    // Sort parties by the earliest timestamp of each party (chronological reservation order)
    parties.sort((p1, p2) => {
      const t1 = Math.min(...p1.map(b => b.timestamp));
      const t2 = Math.min(...p2.map(b => b.timestamp));
      return t1 - t2;
    });

    // Flatten parties into sorted slot bookings: pairs are guaranteed to be contiguous
    const orderedBookings: Booking[] = parties.flat();

    // Assign coachIndex and confirmation status (first 12 confirmed, rest riserva)
    const coachBookingCount: { [coachId: string]: number } = {};
    orderedBookings.forEach((b, sortedIndex) => {
      const cIdx = coachBookingCount[b.coachId] || 0;
      coachBookingCount[b.coachId] = cIdx + 1;

      const isUnlimited = b.slotId.startsWith('shakeparty_') || b.slotId.startsWith('hom_');
      const status = isUnlimited ? 'confermato' : (sortedIndex < 12 ? 'confermato' : 'riserva');
      computedBookings.push({
        ...b,
        coachIndex: cIdx,
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
    regolamento: db.regolamento || `Benvenuto in The Wellness Hub!\n\n1. Ogni Coach ha la responsabilità di inserire correttamente i propri ospiti.\n2. Si prega di rispettare l'orario di inizio di ogni trattamento per non creare ritardi.\n3. Per i trattamenti Corpo/Viso, la soglia massima è di 12 postazioni contemporanee.\n4. Ogni coach ha una quota prioritaria di 4 ospiti confermati per fascia oraria; oltre questo limite gli ospiti vanno in coda/riserva.\n5. Eventuali cancellazioni devono essere effettuate con almeno 24 ore di preavviso.`,
    events: db.events || [],
    quotaAmount: db.quotaAmount !== undefined ? db.quotaAmount : 30,
    iban: db.iban || "IT12X1234512345123456789012",
    ibanHolder: db.ibanHolder || "Lorenzo Wellness",
    paypalUrl: db.paypalUrl || "https://paypal.me/LorenzoWellness",
    satispayUrl: db.satispayUrl || "+39 333 1234567",
    shakePartyConfig: db.shakePartyConfig || { date: '', time: '20:30', title: 'Shake Party Mensile', notes: '' },
    homConfig: db.homConfig || { time: '20:30', title: 'HOM - Herbalife Opportunity Meeting', notes: '' },
    firstMonthFree: db.firstMonthFree !== undefined ? db.firstMonthFree : true
  });
});

// POST update admin configuration
app.post('/api/admin/config', async (req, res) => {
  const { adminPassword, maxFutureWeeks, regolamento, events, quotaAmount, iban, ibanHolder, paypalUrl, satispayUrl, shakePartyConfig, homConfig, firstMonthFree } = req.body;
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

  if (shakePartyConfig !== undefined) {
    db.shakePartyConfig = shakePartyConfig;
  }

  if (homConfig !== undefined) {
    db.homConfig = homConfig;
  }

  if (firstMonthFree !== undefined) {
    db.firstMonthFree = Boolean(firstMonthFree);
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
    satispayUrl: db.satispayUrl,
    firstMonthFree: db.firstMonthFree
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

  const isFree = db.firstMonthFree !== undefined ? db.firstMonthFree : true;
  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: memberName,
    payments: {
      [currentYM]: isFree ? true : false,
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId,
    registrationMonth: currentYM,
    firstMonthFree: isFree
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

  const isFree = db.firstMonthFree !== undefined ? db.firstMonthFree : true;
  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: memberName,
    payments: {
      [currentYM]: isFree ? true : false,
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId,
    registrationMonth: currentYM,
    firstMonthFree: isFree
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

// GET all notifications
app.get('/api/notifications', (req, res) => {
  const db = readDb();
  res.json(db.notifications || []);
});

// POST a new notification
app.post('/api/notifications', async (req, res) => {
  const { title, message, senderName, senderId, recipientId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Titolo e messaggio sono obbligatori.' });
  }

  const db = readDb();
  if (!db.notifications) {
    db.notifications = [];
  }

  const newNotification: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: title.trim(),
    message: message.trim(),
    senderName: senderName ? senderName.trim() : 'Admin',
    senderId: senderId || 'admin',
    recipientId: recipientId || 'all',
    timestamp: Date.now(),
    readBy: []
  };

  db.notifications.push(newNotification);
  await writeDb(db);

  res.json(newNotification);
});

// POST mark notification as read
app.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const { coachId } = req.body;

  if (!coachId) {
    return res.status(400).json({ error: 'coachId è obbligatorio.' });
  }

  const db = readDb();
  if (!db.notifications) {
    db.notifications = [];
  }

  const notifIdx = db.notifications.findIndex(n => n.id === id);
  if (notifIdx === -1) {
    return res.status(404).json({ error: 'Notifica non trovata.' });
  }

  const notif = db.notifications[notifIdx];
  if (!notif.readBy) {
    notif.readBy = [];
  }

  if (!notif.readBy.includes(coachId)) {
    notif.readBy.push(coachId);
    await writeDb(db);
  }

  res.json(notif);
});

// DELETE a notification (useful for admin or sender)
app.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  if (!db.notifications) {
    db.notifications = [];
  }

  const notifIdx = db.notifications.findIndex(n => n.id === id);
  if (notifIdx === -1) {
    return res.status(404).json({ error: 'Notifica non trovata.' });
  }

  db.notifications.splice(notifIdx, 1);
  await writeDb(db);

  res.json({ success: true });
});

// --- UTILITIES API ---
// GET all utilities
app.get('/api/utilities', (req, res) => {
  const db = readDb();
  res.json(db.utilities || []);
});

// POST a new utility item
app.post('/api/utilities', async (req, res) => {
  const { category, title, type, url, fileName } = req.body;
  if (!category || !title || !type || !url) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
  }

  const db = readDb();
  if (!db.utilities) {
    db.utilities = [];
  }

  const newUtility: UtilityItem = {
    id: `utility_${Date.now()}`,
    category,
    title,
    type,
    url,
    fileName,
    uploadedAt: Date.now()
  };

  db.utilities.push(newUtility);
  await writeDb(db);
  res.json(newUtility);
});

// DELETE a utility item
app.delete('/api/utilities/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  if (!db.utilities) {
    db.utilities = [];
  }

  const exists = db.utilities.some(u => u.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Elemento non trovato.' });
  }

  db.utilities = db.utilities.filter(u => u.id !== id);
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
  const { name, coachId, quotaAmount, firstMonthFree } = req.body;
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

  const isFree = firstMonthFree !== undefined ? Boolean(firstMonthFree) : (db.firstMonthFree !== undefined ? db.firstMonthFree : true);

  const newMember: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: normalized,
    payments: {
      [currentYM]: isFree ? true : false,
      [nextYM]: false   // subsequent month set to unpaid
    },
    coachId: coachId || undefined,
    registrationMonth: currentYM,
    quotaAmount: quotaAmount !== undefined ? Number(quotaAmount) : undefined,
    firstMonthFree: isFree
  };

  db.members.push(newMember);
  await writeDb(db);
  res.json(newMember);
});

// PUT (edit) a member name or toggle payments
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, payments, coachId, quotaAmount, firstMonthFree } = req.body;
  
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

  if (firstMonthFree !== undefined) {
    const isFree = Boolean(firstMonthFree);
    db.members[memberIdx].firstMonthFree = isFree;
    const regMonth = db.members[memberIdx].registrationMonth || Object.keys(db.members[memberIdx].payments || {}).sort()[0];
    if (regMonth && (!payments || payments[regMonth] === undefined)) {
      if (!db.members[memberIdx].payments) db.members[memberIdx].payments = {};
      db.members[memberIdx].payments[regMonth] = isFree;
    }
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
  const { treatmentType, date, time, slotType } = req.body;
  if (!treatmentType || !date || !time) {
    return res.status(400).json({ error: 'Missing slot details' });
  }
  const db = readDb();
  if (!db.slots) db.slots = [];
  if (!db.disabledSlots) db.disabledSlots = [];

  const id = `${treatmentType}_${date}_${time}`;
  
  // Re-enable if in disabledSlots
  db.disabledSlots = db.disabledSlots.filter(sId => sId !== id);

  const existingSlot = db.slots.find(s => s.id === id);
  if (existingSlot) {
    if (slotType) {
      existingSlot.slotType = slotType;
    }
    await writeDb(db);
    return res.json(existingSlot);
  }

  const newSlot: Slot = {
    id,
    treatmentType,
    date,
    time,
    isCustom: true,
    slotType: slotType === 'fisso' ? 'fisso' : 'extra'
  };
  db.slots.push(newSlot);
  await writeDb(db);
  res.json(newSlot);
});

// POST batch create slots for a day
app.post('/api/slots/batch', async (req, res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'Nessun turno specificato nella richiesta.' });
  }

  const db = readDb();
  if (!db.slots) db.slots = [];
  if (!db.disabledSlots) db.disabledSlots = [];

  const createdOrUpdated: Slot[] = [];

  for (const s of slots) {
    const treatmentType = (s.treatmentType || 'viso') as TreatmentType;
    const date = s.date;
    const time = s.time;
    const slotType = s.slotType === 'fisso' ? 'fisso' : 'extra';
    if (!date || !time) continue;

    const id = `${treatmentType}_${date}_${time}`;

    // Remove from disabled list if it was previously hidden/deleted
    db.disabledSlots = db.disabledSlots.filter(sId => sId !== id);

    const existingIndex = db.slots.findIndex(slot => slot.id === id);
    if (existingIndex >= 0) {
      db.slots[existingIndex].slotType = slotType;
      createdOrUpdated.push(db.slots[existingIndex]);
    } else {
      const newSlot: Slot = {
        id,
        treatmentType,
        date,
        time,
        isCustom: true,
        slotType
      };
      db.slots.push(newSlot);
      createdOrUpdated.push(newSlot);
    }
  }

  await writeDb(db);
  res.json({ success: true, count: createdOrUpdated.length, slots: createdOrUpdated });
});

// PATCH toggle or set slot type (fisso / extra)
app.patch('/api/slots/:id/type', async (req, res) => {
  const { id } = req.params;
  const { slotType } = req.body;
  if (slotType !== 'fisso' && slotType !== 'extra') {
    return res.status(400).json({ error: 'slotType deve essere fisso o extra' });
  }

  const db = readDb();
  if (!db.slots) db.slots = [];
  if (!db.disabledSlots) db.disabledSlots = [];

  // Remove from disabled slots if it was there
  db.disabledSlots = db.disabledSlots.filter(sId => sId !== id);

  let slot = db.slots.find(s => s.id === id);
  if (slot) {
    slot.slotType = slotType;
  } else {
    // If standard slot not in db.slots, add it with the new slotType
    const parts = id.split('_');
    const treatmentType = (parts[0] || 'viso') as TreatmentType;
    const date = parts[1] || '';
    const time = parts[2] || '';
    slot = {
      id,
      treatmentType,
      date,
      time,
      isCustom: false,
      slotType
    };
    db.slots.push(slot);
  }

  await writeDb(db);
  res.json({ success: true, slot });
});

// DELETE a slot (custom or disable standard)
app.delete('/api/slots/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.disabledSlots) db.disabledSlots = [];

  // Remove from custom slots
  db.slots = db.slots.filter(s => s.id !== id);

  // Add to disabledSlots so even standard slot is hidden
  if (!db.disabledSlots.includes(id)) {
    db.disabledSlots.push(id);
  }

  // Cascade delete bookings for this slot
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
        
        // Skip if slot is disabled by admin
        if (db.disabledSlots && db.disabledSlots.includes(slotId)) {
          return;
        }

        // Find bookings for this slot
        const slotBookings = computedAllBookings.filter(b => b.slotId === slotId);
        const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;
        const reserveCount = slotBookings.filter(b => b.status === 'riserva').length;

        // Check if overridden in db.slots for slotType
        const customDef = db.slots.find(s => s.id === slotId);
        const slotType = customDef?.slotType || 'fisso';

        resultSummaries.push({
          slotId,
          treatmentType,
          date: dateStr,
          time,
          isCustom: !!customDef,
          slotType,
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
      if (db.disabledSlots && db.disabledSlots.includes(slot.id)) {
        return;
      }
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
          slotType: slot.slotType || 'extra',
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
    allBookings: computedAllBookings,
    allCustomSlots: db.slots || [],
    coaches: db.coaches,
    slotRestrictions: db.slotRestrictions || {},
    maxFutureWeeks: db.maxFutureWeeks !== undefined ? db.maxFutureWeeks : 2,
    members: db.members || [],
    shakePartyConfig: db.shakePartyConfig || { date: '', time: '20:30', title: 'Shake Party Mensile', notes: '' },
    homConfig: db.homConfig || { time: '20:30', title: 'HOM - Herbalife Opportunity Meeting', notes: '' }
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
  const { slotId, coachId, guestName, secondGuestName, partySize, notes } = req.body;
  if (!slotId || !coachId || !guestName) {
    return res.status(400).json({ error: 'Missing booking details' });
  }

  const requestedPartySize = Number(partySize) === 2 ? 2 : 1;
  const normalizedSecondName = (secondGuestName || '').trim();
  if (requestedPartySize === 2 && normalizedSecondName.length === 0) {
    return res.status(400).json({ error: 'Il nome del secondo ospite non può essere vuoto.' });
  }

  const db = readDb();
  
  // Verify coach exists
  const coach = db.coaches.find(c => c.id === coachId);
  if (!coach) {
    return res.status(400).json({ error: 'Coach non trovato' });
  }

  // Check slot restrictions
  if (!coach.isAdmin && db.slotRestrictions && db.slotRestrictions[slotId]) {
    const allowedCoachIds = db.slotRestrictions[slotId];
    if (allowedCoachIds.length > 0 && !allowedCoachIds.includes(coachId)) {
      return res.status(400).json({ error: 'Spiacenti, questo orario non è abilitato o visibile per questo coach.' });
    }
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

    const regMonth = member.registrationMonth || Object.keys(member.payments || {}).sort()[0];
    if (regMonth && ymKey < regMonth) {
      continue;
    }
    if (regMonth && ymKey === regMonth && member.firstMonthFree !== false) {
      continue;
    }

    const isPaid = member.payments && member.payments[ymKey] !== false; // default to paid if not explicitly false

    if (!isPaid) {
      let isDeadlinePassed = false;

      if (today.getFullYear() > y) {
        isDeadlinePassed = true;
      } else if (today.getFullYear() === y) {
        if (today.getMonth() + 1 > mNum) {
          isDeadlinePassed = true;
        } else if (today.getMonth() + 1 === mNum) {
          if (today.getDate() > 5) {
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
      error: `Impossibile completare la prenotazione: il socio "${member.name}" associato al coach non è in regola con il pagamento della quota mensile di ${blockedMonthLabel} (scadenza entro il 5 del mese).`
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
  const timestamp = Date.now();

  if (requestedPartySize === 2) {
    const sName = normalizedSecondName;
    const groupId = `party_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
    const b1: Booking = {
      id: `booking_${timestamp}_1_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId: finalCoachId,
      guestName: normalizedName,
      notes: notes ? `${notes} (Insieme a: ${sName})` : `(Insieme a: ${sName})`,
      timestamp,
      groupId,
      pairGuestName: sName,
    };
    const b2: Booking = {
      id: `booking_${timestamp}_2_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId: finalCoachId,
      guestName: sName,
      notes: notes ? `${notes} (Insieme a: ${normalizedName})` : `(Insieme a: ${normalizedName})`,
      timestamp: timestamp + 1,
      groupId,
      pairGuestName: normalizedName,
    };

    db.bookings.push(b1, b2);
    await writeDb(db);

    const allComputed = computeBookingsWithStatus(db.bookings);
    const created1 = allComputed.find(b => b.id === b1.id);
    res.json(created1 || b1);
  } else {
    const newBooking: Booking = {
      id: `booking_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId: finalCoachId,
      guestName: normalizedName,
      notes: notes || '',
      timestamp,
    };

    db.bookings.push(newBooking);
    await writeDb(db);

    // Recompute with new booking and return the specific computed booking
    const allComputed = computeBookingsWithStatus(db.bookings);
    const created = allComputed.find(b => b.id === newBooking.id);
    res.json(created || newBooking);
  }
});

// GET public coach info for booking page
app.get('/api/public-bookings/coach/:coachId', (req, res) => {
  const { coachId } = req.params;
  const db = readDb();
  const coach = db.coaches.find(c => c.id === coachId);
  if (!coach) {
    return res.status(404).json({ error: 'Coach non trovato' });
  }

  // Check if they have a member associated, and if that member is blocked due to unpaid quotas
  if (!db.members) db.members = [];
  const member = db.members.find(m => m.coachId === coachId);
  
  let isBlocked = false;
  let blockedMonthLabel = "";

  if (member) {
    const today = new Date();
    const currentYear = today.getFullYear();

    for (let offset = 3; offset >= -1; offset--) {
      const checkDate = new Date(currentYear, today.getMonth() - offset, 15);
      const y = checkDate.getFullYear();
      const mNum = checkDate.getMonth() + 1;
      const ymKey = `${y}-${mNum < 10 ? '0' + mNum : mNum}`;

      const regMonth = member.registrationMonth || Object.keys(member.payments || {}).sort()[0];
      if (regMonth && ymKey < regMonth) {
        continue;
      }
      if (regMonth && ymKey === regMonth && member.firstMonthFree !== false) {
        continue;
      }

      const isPaid = member.payments && member.payments[ymKey] !== false;

      if (!isPaid) {
        let isDeadlinePassed = false;

        if (today.getFullYear() > y) {
          isDeadlinePassed = true;
        } else if (today.getFullYear() === y) {
          if (today.getMonth() + 1 > mNum) {
            isDeadlinePassed = true;
          } else if (today.getMonth() + 1 === mNum) {
            if (today.getDate() > 5) {
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
  } else {
    isBlocked = true;
    blockedMonthLabel = "Nessun socio associato al profilo Coach";
  }

  res.json({
    id: coach.id,
    name: coach.name,
    color: coach.color,
    isBlocked,
    blockedMonthLabel
  });
});

// GET available facial treatment slots for public booking
app.get('/api/public-bookings/slots', (req, res) => {
  const { coachId } = req.query;
  if (!coachId || typeof coachId !== 'string') {
    return res.status(400).json({ error: 'Coach ID richiesto' });
  }

  const db = readDb();
  
  const coach = db.coaches.find(c => c.id === coachId);
  if (!coach) {
    return res.status(404).json({ error: 'Coach non trovato' });
  }

  const computedAllBookings = computeBookingsWithStatus(db.bookings);
  
  const maxFutureWeeks = db.maxFutureWeeks !== undefined ? db.maxFutureWeeks : 2;
  const limit = maxFutureWeeks === -1 ? 4 : maxFutureWeeks;

  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(today.getFullYear(), today.getMonth(), diff);

  const availableSlots: any[] = [];

  for (let weekOffset = 0; weekOffset <= limit; weekOffset++) {
    const mondayDate = new Date(currentMonday);
    mondayDate.setDate(currentMonday.getDate() + weekOffset * 7);
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const standardDaysIdx = [0, 2, 4];
    const standardTimes = ['15:00', '17:00', '19:00'];

    standardDaysIdx.forEach(dayIdx => {
      const dateStr = weekDates[dayIdx];
      if (!dateStr) return;

      standardTimes.forEach(time => {
        const slotId = `viso_${dateStr}_${time}`;

        // Skip if disabled by admin
        if (db.disabledSlots && db.disabledSlots.includes(slotId)) {
          return;
        }

        const slotDateTime = new Date(`${dateStr}T${time}:00`);
        if (slotDateTime.getTime() < Date.now()) return;

        // Check if restricted and coach is not in the allowed list
        if (db.slotRestrictions && db.slotRestrictions[slotId]) {
          const allowedCoachIds = db.slotRestrictions[slotId];
          if (allowedCoachIds.length > 0 && !allowedCoachIds.includes(coachId)) {
            return;
          }
        }

        const slotBookings = computedAllBookings.filter(b => b.slotId === slotId);
        const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;

        const customDef = db.slots?.find(s => s.id === slotId);
        const slotType = customDef?.slotType || 'fisso';

        if (confirmedCount < 12) {
          availableSlots.push({
            slotId,
            treatmentType: 'viso',
            date: dateStr,
            time,
            isCustom: !!customDef,
            slotType,
            confirmedCount,
            availableStations: 12 - confirmedCount
          });
        }
      });
    });

    if (db.slots) {
      db.slots.forEach(slot => {
        if (slot.treatmentType === 'viso' && weekDates.includes(slot.date)) {
          if (db.disabledSlots && db.disabledSlots.includes(slot.id)) {
            return;
          }

          const isAlreadyAdded = availableSlots.some(s => s.slotId === slot.id);
          if (!isAlreadyAdded) {
            const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
            if (slotDateTime.getTime() < Date.now()) return;

            // Check if restricted and coach is not in the allowed list
            if (db.slotRestrictions && db.slotRestrictions[slot.id]) {
              const allowedCoachIds = db.slotRestrictions[slot.id];
              if (allowedCoachIds.length > 0 && !allowedCoachIds.includes(coachId)) {
                return;
              }
            }

            const slotBookings = computedAllBookings.filter(b => b.slotId === slot.id);
            const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;

            if (confirmedCount < 12) {
              availableSlots.push({
                slotId: slot.id,
                treatmentType: 'viso',
                date: slot.date,
                time: slot.time,
                isCustom: true,
                slotType: slot.slotType || 'extra',
                confirmedCount,
                availableStations: 12 - confirmedCount
              });
            }
          }
        }
      });
    }
  }

  availableSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  res.json(availableSlots);
});

// POST a new public client booking
app.post('/api/public-bookings', async (req, res) => {
  const { slotId, coachId, guestName, secondGuestName, phone, notes, partySize } = req.body;
  if (!slotId || !coachId || !guestName || !phone) {
    return res.status(400).json({ error: 'Tutti i campi (nome, telefono, orario) sono obbligatori.' });
  }

  const db = readDb();

  const coach = db.coaches.find(c => c.id === coachId);
  if (!coach) {
    return res.status(400).json({ error: 'Coach non trovato.' });
  }

  // Check slot restrictions
  if (db.slotRestrictions && db.slotRestrictions[slotId]) {
    const allowedCoachIds = db.slotRestrictions[slotId];
    if (allowedCoachIds.length > 0 && !allowedCoachIds.includes(coachId)) {
      return res.status(400).json({ error: 'Spiacenti, questo orario non è abilitato per questo coach.' });
    }
  }

  const requestedSize = partySize === 2 ? 2 : 1;

  const computedAllBookings = computeBookingsWithStatus(db.bookings);
  const slotBookings = computedAllBookings.filter(b => b.slotId === slotId);
  const confirmedCount = slotBookings.filter(b => b.status === 'confermato').length;

  if (confirmedCount + requestedSize > 12) {
    return res.status(400).json({ error: `Spiacenti, questo orario non ha abbastanza postazioni libere (${12 - confirmedCount} disponibili). Scegli un altro orario.` });
  }

  if (!db.members) db.members = [];
  const member = db.members.find(m => m.coachId === coachId);
  if (!member) {
    return res.status(400).json({ error: 'Spiacenti, questo coach non può ricevere prenotazioni esterne (nessun socio associato).' });
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  let isBlocked = false;
  let blockedMonthLabel = "";

  for (let offset = 3; offset >= -1; offset--) {
    const checkDate = new Date(currentYear, today.getMonth() - offset, 15);
    const y = checkDate.getFullYear();
    const mNum = checkDate.getMonth() + 1;
    const ymKey = `${y}-${mNum < 10 ? '0' + mNum : mNum}`;

    const regMonth = member.registrationMonth || Object.keys(member.payments || {}).sort()[0];
    if (regMonth && ymKey < regMonth) {
      continue;
    }
    if (regMonth && ymKey === regMonth && member.firstMonthFree !== false) {
      continue;
    }

    const isPaid = member.payments && member.payments[ymKey] !== false;

    if (!isPaid) {
      let isDeadlinePassed = false;

      if (today.getFullYear() > y) {
        isDeadlinePassed = true;
      } else if (today.getFullYear() === y) {
        if (today.getMonth() + 1 > mNum) {
          isDeadlinePassed = true;
        } else if (today.getMonth() + 1 === mNum) {
          if (today.getDate() > 5) {
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
      error: `Spiacenti, il coach ${coach.name} non è abilitato a ricevere prenotazioni esterne in questo momento.`
    });
  }

  const cleanPhone = phone.trim();
  const cleanNotes = notes ? notes.trim() : '';

  const bookingsCreated: Booking[] = [];
  const timestamp = Date.now();

  if (requestedSize === 2) {
    const sName = secondGuestName && secondGuestName.trim() ? secondGuestName.trim() : `${guestName.trim()} (Ospite 2)`;
    const publicGroupId = `party_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
    const b1: Booking = {
      id: `booking_${timestamp}_1_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId,
      guestName: guestName.trim(),
      notes: `Prenotato autonomamente tramite Link Cliente (Gruppo da 2, Ospite 1: ${guestName.trim()}). Cell: ${cleanPhone}${cleanNotes ? ` - Note: ${cleanNotes}` : ''}`,
      timestamp,
      groupId: publicGroupId,
      pairGuestName: sName,
    };
    const b2: Booking = {
      id: `booking_${timestamp}_2_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId,
      guestName: sName,
      notes: `Prenotato autonomamente tramite Link Cliente (Gruppo da 2, Ospite 2: ${sName}). Cell: ${cleanPhone}${cleanNotes ? ` - Note: ${cleanNotes}` : ''}`,
      timestamp: timestamp + 1,
      groupId: publicGroupId,
      pairGuestName: guestName.trim(),
    };
    db.bookings.push(b1, b2);
    bookingsCreated.push(b1, b2);
  } else {
    const b1: Booking = {
      id: `booking_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      slotId,
      coachId,
      guestName: guestName.trim(),
      notes: `Prenotato autonomamente tramite Link Cliente. Cell: ${cleanPhone}${cleanNotes ? ` - Note: ${cleanNotes}` : ''}`,
      timestamp,
    };
    db.bookings.push(b1);
    bookingsCreated.push(b1);
  }

  if (!db.contacts) db.contacts = [];
  const contactExists = db.contacts.some(c => c.coachId === coachId && c.phone === cleanPhone);
  if (!contactExists) {
    const parts = slotId.split('_');
    const dateStr = parts.length >= 2 ? parts[1] : '';
    
    const secondGuestNoteStr = (requestedSize === 2 && secondGuestName && secondGuestName.trim()) 
      ? ` (Insieme a: ${secondGuestName.trim()})` 
      : (requestedSize === 2 ? ' (Gruppo di 2 persone)' : '');

    db.contacts.push({
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      coachId,
      contactName: guestName.trim(),
      phone: cleanPhone,
      skinDate: dateStr,
      evaluation: false,
      activityInfo: false,
      sport: false,
      smartboxTagliando: false,
      productsPurchased: '',
      notes: `Registrato automaticamente da Link Prenotazione Cliente Trattamento Viso${secondGuestNoteStr}.`,
      timestamp: Date.now()
    });
  }

  if (!db.notifications) db.notifications = [];
  
  const parts = slotId.split('_');
  const dateStr = parts.length >= 2 ? parts[1] : '';
  const timeStr = parts.length >= 3 ? parts[2] : '';
  
  let friendlyDate = dateStr;
  try {
    const d = new Date(dateStr);
    friendlyDate = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch (err) {}

  const secondGuestMsgStr = (requestedSize === 2 && secondGuestName && secondGuestName.trim())
    ? `, Secondo Ospite: "${secondGuestName.trim()}"`
    : '';

  const bookingDetailsMsg = requestedSize === 2 
    ? `L'ospite "${guestName.trim()}" (Cell: ${cleanPhone}) ha prenotato per 2 PERSONE (occupando 2 postazioni)${secondGuestMsgStr}` 
    : `L'ospite "${guestName.trim()}" (Cell: ${cleanPhone}) si è prenotato`;

  db.notifications.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: requestedSize === 2 ? '🎉 Nuova Prenotazione Doppia da Link Cliente' : '🎉 Nuova Prenotazione da Link Cliente',
    message: `${bookingDetailsMsg} autonomamente per il Trattamento Viso del ${friendlyDate} alle ore ${timeStr} usando il tuo link prenotazione!`,
    senderName: 'Prenotazioni Web',
    senderId: 'system',
    recipientId: coachId,
    timestamp: Date.now(),
    readBy: []
  });

  await writeDb(db);

  res.json({ success: true, bookings: bookingsCreated });
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

      const regMonth = member.registrationMonth || Object.keys(member.payments || {}).sort()[0];
      if (regMonth && ymKey < regMonth) {
        continue;
      }
      if (regMonth && ymKey === regMonth && member.firstMonthFree !== false) {
        continue;
      }

      const isPaid = member.payments && member.payments[ymKey] !== false; // default to paid if not explicitly false

      if (!isPaid) {
        let isDeadlinePassed = false;

        if (today.getFullYear() > y) {
          isDeadlinePassed = true;
        } else if (today.getFullYear() === y) {
          if (today.getMonth() + 1 > mNum) {
            isDeadlinePassed = true;
          } else if (today.getMonth() + 1 === mNum) {
            if (today.getDate() > 5) {
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
        error: `Impossibile completare la prenotazione: il socio "${member.name}" associato al coach non è in regola con il pagamento della quota mensile di ${blockedMonthLabel} (scadenza entro il 5 del mese).`
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

  if (guestName !== undefined) {
    const oldName = db.bookings[bookingIdx].guestName;
    db.bookings[bookingIdx].guestName = guestName;

    // If this booking has a companion in the same group, sync the companion's pairGuestName
    const currentGroupId = db.bookings[bookingIdx].groupId;
    const companion = db.bookings.find(b => b.id !== id && (
      (currentGroupId && b.groupId === currentGroupId) ||
      (b.slotId === db.bookings[bookingIdx].slotId && b.coachId === db.bookings[bookingIdx].coachId && (b.pairGuestName === oldName || b.notes?.includes(oldName)))
    ));

    if (companion) {
      companion.pairGuestName = guestName;
      if (companion.notes && oldName) {
        companion.notes = companion.notes.replace(oldName, guestName);
      }
    }
  }
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

  // If this booking had a companion in the same group or mutual pair info, clear the companion's pair reference
  if (booking.groupId) {
    const companion = db.bookings.find(b => b.id !== id && b.groupId === booking.groupId);
    if (companion) {
      delete companion.pairGuestName;
      delete companion.groupId;
    }
  } else if (booking.pairGuestName) {
    const companion = db.bookings.find(b => b.id !== id && b.slotId === booking.slotId && (b.pairGuestName === booking.guestName || b.guestName === booking.pairGuestName));
    if (companion) {
      delete companion.pairGuestName;
      delete companion.groupId;
    }
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

// Directly confirm simulated payment (admin manual or legacy)
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

// --- PAYMENT REQUESTS / BANK TRANSFER VERIFICATION API ---
// GET all payment requests
app.get('/api/payment-requests', (req, res) => {
  const db = readDb();
  res.json(db.paymentRequests || []);
});

// POST a new payment request when coach/socio confirms bank transfer
app.post('/api/payment-requests', async (req, res) => {
  const { memberId, monthKey, notes, cro } = req.body;
  if (!memberId || !monthKey) {
    return res.status(400).json({ error: 'memberId e monthKey sono obbligatori' });
  }

  const db = readDb();
  if (!db.paymentRequests) db.paymentRequests = [];
  if (!db.members) db.members = [];
  if (!db.coaches) db.coaches = [];
  if (!db.notifications) db.notifications = [];

  const member = db.members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Socio non trovato.' });
  }

  const coach = member.coachId ? db.coaches.find(c => c.id === member.coachId) : undefined;
  const quotaAmount = member.quotaAmount !== undefined ? member.quotaAmount : (db.quotaAmount || 30);

  // Parse month label in Italian
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10);
  const mNum = parseInt(mStr, 10);
  const itMonths = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  const monthLabel = `${itMonths[mNum - 1] || monthKey} ${y || ''}`.trim();

  // Check if there is an existing pending request for this member and monthKey
  const existingReqIdx = db.paymentRequests.findIndex(pr => pr.memberId === memberId && pr.monthKey === monthKey && pr.status === 'pending');

  let pReq: PaymentRequest;
  if (existingReqIdx !== -1) {
    if (notes) db.paymentRequests[existingReqIdx].notes = notes.trim();
    if (cro) db.paymentRequests[existingReqIdx].cro = cro.trim();
    db.paymentRequests[existingReqIdx].createdAt = Date.now();
    pReq = db.paymentRequests[existingReqIdx];
  } else {
    pReq = {
      id: `preq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      memberId: member.id,
      memberName: member.name,
      coachId: member.coachId,
      coachName: coach ? coach.name : undefined,
      monthKey,
      monthLabel,
      amount: quotaAmount,
      status: 'pending',
      createdAt: Date.now(),
      notes: notes ? notes.trim() : undefined,
      cro: cro ? cro.trim() : undefined,
    };
    db.paymentRequests.unshift(pReq);
  }

  // Create notification for admin
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `🏦 Bonifico Quota Ricevuto - ${member.name} (${monthLabel})`,
    message: `Il socio "${member.name}"${coach ? ` (Coach: ${coach.name})` : ''} ha confermato il bonifico di €${quotaAmount} per la quota di ${monthLabel}.${cro ? ` CRO/Rif: ${cro}.` : ''}${notes ? ` Note: ${notes}.` : ''} In attesa di approvazione per lo sblocco.`,
    senderName: member.name,
    senderId: member.coachId || member.id,
    recipientId: 'admin',
    timestamp: Date.now(),
    readBy: []
  };
  db.notifications.unshift(newNotif);

  await writeDb(db);
  res.json({ success: true, paymentRequest: pReq });
});

// Admin approves a payment request and unlocks the member
app.post('/api/payment-requests/:id/approve', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.paymentRequests) db.paymentRequests = [];
  if (!db.members) db.members = [];
  if (!db.notifications) db.notifications = [];

  const reqIdx = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIdx === -1) {
    return res.status(404).json({ error: 'Richiesta di pagamento non trovata.' });
  }

  const pReq = db.paymentRequests[reqIdx];
  pReq.status = 'approved';
  pReq.processedAt = Date.now();

  // Mark member as paid for this month
  const memberIdx = db.members.findIndex(m => m.id === pReq.memberId);
  let updatedMember: Member | undefined;
  if (memberIdx !== -1) {
    db.members[memberIdx].payments = {
      ...(db.members[memberIdx].payments || {}),
      [pReq.monthKey]: true
    };
    updatedMember = db.members[memberIdx];
  }

  // Notify the coach that their quota has been verified and unlocked
  if (pReq.coachId) {
    const approvalNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `✅ Bonifico Approvato - Quota ${pReq.monthLabel}`,
      message: `Il bonifico di €${pReq.amount} per la quota di ${pReq.monthLabel} (${pReq.memberName}) è stato verificato e approvato dall'amministratore. Il profilo è ora sbloccato e le prenotazioni sono attive!`,
      senderName: 'Amministrazione',
      senderId: 'admin',
      recipientId: pReq.coachId,
      timestamp: Date.now(),
      readBy: []
    };
    db.notifications.unshift(approvalNotif);
  }

  await writeDb(db);
  res.json({ success: true, paymentRequest: pReq, member: updatedMember });
});

// Admin rejects a payment request
app.post('/api/payment-requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = readDb();
  if (!db.paymentRequests) db.paymentRequests = [];
  if (!db.notifications) db.notifications = [];

  const reqIdx = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIdx === -1) {
    return res.status(404).json({ error: 'Richiesta di pagamento non trovata.' });
  }

  const pReq = db.paymentRequests[reqIdx];
  pReq.status = 'rejected';
  pReq.processedAt = Date.now();

  if (pReq.coachId) {
    const rejectNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `⚠️ Verifica Bonifico non Riscontrata - Quota ${pReq.monthLabel}`,
      message: `Il bonifico per la quota di ${pReq.monthLabel} (${pReq.memberName}) non è stato riscontrato o è stato rifiutato dall'amministrazione.${reason ? ` Motivo: ${reason}` : ' Ti invitiamo a verificare con la tua banca o ricontattare l\'amministratore.'}`,
      senderName: 'Amministrazione',
      senderId: 'admin',
      recipientId: pReq.coachId,
      timestamp: Date.now(),
      readBy: []
    };
    db.notifications.unshift(rejectNotif);
  }

  await writeDb(db);
  res.json({ success: true, paymentRequest: pReq });
});

// --- OPERATOR EARNINGS API ---
// GET all earnings records
app.get('/api/earnings', (req, res) => {
  const db = readDb();
  res.json(db.earnings || []);
});

// POST or update an earning record
app.post('/api/earnings', async (req, res) => {
  const { coachId, date, amount, type } = req.body;
  if (!coachId || !date || amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: 'Dati di inserimento non validi.' });
  }

  const db = readDb();
  if (!db.earnings) {
    db.earnings = [];
  }

  const earningType = (type === 'skin' || type === 'corpo') ? type : 'skin';

  // Find if there is an existing record for this coach on this exact day with this exact type
  const existingIndex = db.earnings.findIndex(e => e.coachId === coachId && e.date === date && e.type === earningType);
  const numAmount = Number(amount);

  if (existingIndex !== -1) {
    // Update existing record
    db.earnings[existingIndex].amount = numAmount;
    db.earnings[existingIndex].timestamp = Date.now();
  } else {
    // Add new record
    db.earnings.push({
      id: `earning_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coachId,
      date,
      amount: numAmount,
      type: earningType,
      timestamp: Date.now()
    });
  }

  await writeDb(db);
  res.json({ success: true, earnings: db.earnings });
});

// DELETE an earning record (for corrections)
app.delete('/api/earnings/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.earnings) {
    db.earnings = [];
  }
  const initialLen = db.earnings.length;
  db.earnings = db.earnings.filter(e => e.id !== id);
  if (db.earnings.length === initialLen) {
    return res.status(404).json({ error: 'Guadagno non trovato.' });
  }
  await writeDb(db);
  res.json({ success: true, earnings: db.earnings });
});

// --- OPERATOR CHEQUES API ---
// GET all cheques
app.get('/api/cheques', (req, res) => {
  const db = readDb();
  res.json(db.cheques || []);
});

// POST or update a cheque record
app.post('/api/cheques', async (req, res) => {
  const { coachId, yearMonth, amount } = req.body;
  if (!coachId || !yearMonth || amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: 'Dati di inserimento non validi.' });
  }

  const db = readDb();
  if (!db.cheques) {
    db.cheques = [];
  }

  const numAmount = Number(amount);
  const existingIndex = db.cheques.findIndex(c => c.coachId === coachId && c.yearMonth === yearMonth);

  if (existingIndex !== -1) {
    if (numAmount === 0) {
      // If amount is set to 0, we can remove it or keep it at 0
      db.cheques[existingIndex].amount = 0;
    } else {
      db.cheques[existingIndex].amount = numAmount;
    }
    db.cheques[existingIndex].timestamp = Date.now();
  } else {
    db.cheques.push({
      id: `cheque_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coachId,
      yearMonth,
      amount: numAmount,
      timestamp: Date.now()
    });
  }

  await writeDb(db);
  res.json({ success: true, cheques: db.cheques });
});

// --- OPERATOR CONTACTS DATABASE API ---
// GET contacts (optionally filtered by coachId)
app.get('/api/contacts', (req, res) => {
  const { coachId } = req.query;
  const db = readDb();
  let list = db.contacts || [];
  if (coachId) {
    list = list.filter(c => c.coachId === coachId);
  }
  res.json(list);
});

// POST or UPDATE a contact
app.post('/api/contacts', async (req, res) => {
  const { 
    id, 
    coachId, 
    contactName, 
    phone, 
    skinDate, 
    evaluation, 
    activityInfo, 
    sport, 
    smartboxTagliando, 
    productsPurchased, 
    notes,
    hasReminder,
    reminderDays,
    reminderDate,
    reminderNote,
    reminderCreatedAt,
    reminderCompleted,
    reminderCompletedAt
  } = req.body;

  if (!coachId || !contactName) {
    return res.status(400).json({ error: 'Nome contatto e Coach ID sono obbligatori.' });
  }

  const db = readDb();
  if (!db.contacts) {
    db.contacts = [];
  }

  const existingIndex = id ? db.contacts.findIndex(c => c.id === id) : -1;

  if (existingIndex !== -1) {
    // Update existing
    db.contacts[existingIndex] = {
      ...db.contacts[existingIndex],
      contactName,
      phone: phone || '',
      skinDate: skinDate || '',
      evaluation: !!evaluation,
      activityInfo: !!activityInfo,
      sport: !!sport,
      smartboxTagliando: !!smartboxTagliando,
      productsPurchased: productsPurchased || '',
      notes: notes || '',
      hasReminder: hasReminder !== undefined ? !!hasReminder : db.contacts[existingIndex].hasReminder,
      reminderDays: reminderDays !== undefined ? (reminderDays ? Number(reminderDays) : undefined) : db.contacts[existingIndex].reminderDays,
      reminderDate: reminderDate !== undefined ? (reminderDate || '') : db.contacts[existingIndex].reminderDate,
      reminderNote: reminderNote !== undefined ? (reminderNote || '') : db.contacts[existingIndex].reminderNote,
      reminderCreatedAt: reminderCreatedAt || db.contacts[existingIndex].reminderCreatedAt || (hasReminder ? Date.now() : undefined),
      reminderCompleted: reminderCompleted !== undefined ? !!reminderCompleted : db.contacts[existingIndex].reminderCompleted,
      reminderCompletedAt: reminderCompleted ? (reminderCompletedAt || Date.now()) : (reminderCompleted === false ? undefined : db.contacts[existingIndex].reminderCompletedAt),
      timestamp: Date.now()
    };
  } else {
    // Create new
    db.contacts.push({
      id: id || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coachId,
      contactName,
      phone: phone || '',
      skinDate: skinDate || '',
      evaluation: !!evaluation,
      activityInfo: !!activityInfo,
      sport: !!sport,
      smartboxTagliando: !!smartboxTagliando,
      productsPurchased: productsPurchased || '',
      notes: notes || '',
      hasReminder: !!hasReminder,
      reminderDays: reminderDays ? Number(reminderDays) : undefined,
      reminderDate: reminderDate || '',
      reminderNote: reminderNote || '',
      reminderCreatedAt: hasReminder ? (reminderCreatedAt || Date.now()) : undefined,
      reminderCompleted: !!reminderCompleted,
      reminderCompletedAt: reminderCompleted ? (reminderCompletedAt || Date.now()) : undefined,
      timestamp: Date.now()
    });
  }

  await writeDb(db);
  res.json({ success: true, contacts: db.contacts });
});

// PATCH a contact reminder (snooze, complete, update, delete reminder)
app.patch('/api/contacts/:id/reminder', async (req, res) => {
  const { id } = req.params;
  const { 
    completed, 
    snoozeDays, 
    reminderDate, 
    reminderDays, 
    reminderNote, 
    hasReminder, 
    removeReminder 
  } = req.body;

  const db = readDb();
  if (!db.contacts) db.contacts = [];

  const contactIndex = db.contacts.findIndex(c => c.id === id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contatto non trovato.' });
  }

  const contact = db.contacts[contactIndex];

  if (removeReminder) {
    contact.hasReminder = false;
    contact.reminderDays = undefined;
    contact.reminderDate = undefined;
    contact.reminderNote = undefined;
    contact.reminderCompleted = false;
    contact.reminderCompletedAt = undefined;
  } else {
    if (completed !== undefined) {
      contact.reminderCompleted = !!completed;
      contact.reminderCompletedAt = completed ? Date.now() : undefined;
    }
    if (snoozeDays && typeof snoozeDays === 'number') {
      const now = new Date();
      now.setDate(now.getDate() + snoozeDays);
      contact.reminderDate = now.toISOString().split('T')[0];
      contact.reminderDays = snoozeDays;
      contact.reminderCompleted = false;
      contact.reminderCompletedAt = undefined;
      contact.hasReminder = true;
    }
    if (reminderDate !== undefined) {
      contact.reminderDate = reminderDate;
    }
    if (reminderDays !== undefined) {
      contact.reminderDays = Number(reminderDays);
    }
    if (reminderNote !== undefined) {
      contact.reminderNote = reminderNote;
    }
    if (hasReminder !== undefined) {
      contact.hasReminder = !!hasReminder;
    }
  }

  contact.timestamp = Date.now();
  db.contacts[contactIndex] = contact;
  await writeDb(db);

  res.json({ success: true, contact, contacts: db.contacts });
});

// DELETE a contact
app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.contacts) {
    db.contacts = [];
  }

  const initialLen = db.contacts.length;
  db.contacts = db.contacts.filter(c => c.id !== id);

  if (db.contacts.length === initialLen) {
    return res.status(404).json({ error: 'Contatto non trovato.' });
  }

  await writeDb(db);
  res.json({ success: true, contacts: db.contacts });
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
