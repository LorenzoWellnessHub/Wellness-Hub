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
