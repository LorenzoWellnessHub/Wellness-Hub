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

