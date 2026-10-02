export type TreatmentType = 'viso' | 'corpo';

export interface Coach {
  id: string;
  name: string;
  color: string; // Tailwind color class suffix, e.g., 'blue', 'emerald', 'purple', 'amber'
  pin?: string; // Optional PIN for security
  isAdmin?: boolean; // Admin privileges
  phone?: string;
  email?: string;
  sponsorName?: string;
  timestamp?: number;
  status?: string;
  acceptedRules?: boolean;
}

export interface Slot {
  id: string; // e.g., "viso_2026-07-06_15:00"
  treatmentType: TreatmentType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isCustom?: boolean; // True if it is a weekly flexible time slot
  slotType?: 'fisso' | 'extra'; // Turno fisso o turno extra
}

export interface Booking {
  id: string;
  slotId: string;
  coachId: string;
  guestName: string;
  notes?: string;
  timestamp: number; // For priority queue calculation
}

// Derived booking with state calculated at runtime
export interface ComputedBooking extends Booking {
  coachIndex: number; // 0-based index of this guest among the coach's guests for this slot
  status: 'confermato' | 'riserva';
}

export interface Member {
  id: string;
  name: string;
  payments: Record<string, boolean>; // key: "YYYY-MM" -> value: boolean (true = paid, false = unpaid)
  coachId?: string; // Associated coach
  registrationMonth?: string; // e.g. "2026-07"
  quotaAmount?: number; // Specific monthly quota for this member
  firstMonthFree?: boolean; // Se true, il primo mese è omaggio/gratis; se false, la quota va pagata
}

export interface CoachRegistration {
  id: string;
  name: string;
  phone: string;
  email: string;
  sponsorName: string;
  timestamp: number;
}

// Summary of a slot's capacity and current bookings
export interface SlotSummary {
  slotId: string;
  treatmentType: TreatmentType;
  date: string;
  time: string;
  isCustom: boolean;
  slotType?: 'fisso' | 'extra';
  totalBookings: number;
  confirmedCount: number;
  reserveCount: number;
  bookings: ComputedBooking[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string; // HH:MM
  location?: string;
  description?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderId: string; // "admin" or coachId
  recipientId: 'all' | string; // 'all' or a specific coachId
  timestamp: number;
  readBy: string[]; // List of coachIds who have read it
}

export interface UtilityItem {
  id: string;
  category: 'locandine' | 'startup' | 'listino' | 'regolamento';
  title: string;
  type: 'link' | 'file';
  url: string; // URL link or base64 data string
  fileName?: string;
  uploadedAt: number;
}

export interface OperatorEarning {
  id: string;
  coachId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'skin' | 'corpo';
  timestamp: number;
}

export interface MonthlyCheque {
  id: string;
  coachId: string;
  yearMonth: string; // YYYY-MM
  amount: number;
  timestamp: number;
}

export interface Contact {
  id: string;
  coachId: string;
  contactName: string;
  phone: string; // Cellulare
  skinDate: string; // YYYY-MM-DD or text
  evaluation: boolean; // Valutazione
  activityInfo: boolean; // Info Attività
  sport: boolean; // Sport
  smartboxTagliando?: boolean; // Tagliando Smartbox
  productsPurchased: string; // Prodotti acquistati
  notes: string; // Note
  timestamp: number;
  // Personal reminder / follow-up fields
  hasReminder?: boolean;
  reminderDays?: number; // Chosen number of days (e.g. 3, 7, 14, 21, 30, custom)
  reminderDate?: string; // Target reminder date: YYYY-MM-DD
  reminderNote?: string; // Reason / note for the reminder
  reminderCreatedAt?: number; // Timestamp when reminder was created
  reminderCompleted?: boolean; // True if user marked as handled/completed
  reminderCompletedAt?: number; // Timestamp when completed
}

export interface ShakePartyConfig {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title?: string;
  notes?: string;
}

export interface HomConfig {
  time: string; // HH:MM
  title?: string;
  notes?: string;
}


