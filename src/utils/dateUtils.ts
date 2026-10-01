export const getItalianDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[date.getDay()] || '';
};

export const formatItalianDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
};

export const formatItalianDateWithYear = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatItalianMonth = (ymStr: string): string => {
  if (!ymStr) return '';
  const [y, m] = ymStr.split('-');
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const monthIdx = parseInt(m, 10) - 1;
  return `${months[monthIdx] || m} ${y}`;
};

export const parseBookingSlotId = (slotId: string): { type: 'viso' | 'corpo'; date: string; time: string } => {
  const parts = (slotId || '').split('_');
  const type = (parts[0] === 'corpo' ? 'corpo' : 'viso') as 'viso' | 'corpo';
  const date = parts[1] || '';
  const time = parts[2] || '00:00';
  return { type, date, time };
};

export const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getNextTuesday = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mer, 4: Gio, 5: Ven, 6: Sab
  // Se oggi è martedì viene mostrato il martedì odierno (fino alle 23:59), dal mercoledì scatta il martedì successivo
  const diff = (2 - day + 7) % 7;
  const target = new Date();
  target.setDate(now.getDate() + diff);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const dayStr = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

export const getWeekDates = (mondayStr: string): string[] => {
  if (!mondayStr) return [];
  const mondayDate = new Date(mondayStr);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};
