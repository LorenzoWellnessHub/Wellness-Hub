import React, { useState } from 'react';
import { Coach, SlotSummary, ComputedBooking } from '../types';
import {
  getItalianDayName,
  formatItalianDate,
  formatItalianDateWithYear,
  formatItalianMonth,
  parseBookingSlotId,
} from '../utils/dateUtils';

interface PersonalReportProps {
  currentCoachId: string;
  coaches: Coach[];
  summaries: SlotSummary[];
  corpoBookings: ComputedBooking[];
  allBookings: ComputedBooking[];
  getCoachColorClasses: (color: string) => {
    bg: string;
    text: string;
    border: string;
    ring: string;
    solid: string;
    lightText: string;
    hover: string;
  };
}

export const PersonalReport: React.FC<PersonalReportProps> = ({
  currentCoachId,
  coaches,
  summaries,
  corpoBookings,
  allBookings,
  getCoachColorClasses,
}) => {
  const [personalReportPeriod, setPersonalReportPeriod] = useState<'daily' | 'monthly'>('daily');
  const [personalReportDate, setPersonalReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [personalReportMonth, setPersonalReportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [personalReportSearch, setPersonalReportSearch] = useState<string>('');
  const [personalReportTypeFilter, setPersonalReportTypeFilter] = useState<'all' | 'viso' | 'corpo'>('all');

  const activeCoach = coaches.find((c) => c.id === currentCoachId);
  const coachName = activeCoach ? activeCoach.name : 'Operatore';
  const coachColorStyles = activeCoach
    ? getCoachColorClasses(activeCoach.color)
    : {
        solid: 'bg-emerald-600',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'ring-emerald-500/10',
        lightText: 'text-emerald-600',
        hover: 'hover:bg-emerald-100',
      };

  // Build full list of bookings for the active coach
  const synthesizedVisoBookings: ComputedBooking[] = [];
  summaries.forEach((s) => {
    (s.bookings || []).forEach((b) => {
      synthesizedVisoBookings.push({
        ...b,
        slotId: s.slotId,
      });
    });
  });
  const combinedAll = allBookings.length > 0 ? allBookings : [...synthesizedVisoBookings, ...corpoBookings];

  // All bookings for this coach
  const myAllBookings = combinedAll.filter((b) => b.coachId === currentCoachId);

  // Daily Data
  const targetDayStr = personalReportDate || new Date().toISOString().split('T')[0];
  const myDayBookings = myAllBookings
    .filter((b) => {
      const { date } = parseBookingSlotId(b.slotId);
      return date === targetDayStr;
    })
    .sort((a, b) => {
      const tA = parseBookingSlotId(a.slotId).time;
      const tB = parseBookingSlotId(b.slotId).time;
      return tA.localeCompare(tB);
    });

  const myDayViso = myDayBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'viso');
  const myDayCorpo = myDayBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'corpo');

  // Monthly Data
  const targetMonthStr = personalReportMonth || new Date().toISOString().slice(0, 7);
  const myMonthBookings = myAllBookings
    .filter((b) => {
      const { date } = parseBookingSlotId(b.slotId);
      return date.startsWith(targetMonthStr);
    })
    .sort((a, b) => {
      const dA = parseBookingSlotId(a.slotId).date + ' ' + parseBookingSlotId(a.slotId).time;
      const dB = parseBookingSlotId(b.slotId).date + ' ' + parseBookingSlotId(b.slotId).time;
      return dA.localeCompare(dB);
    });

  const myMonthViso = myMonthBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'viso');
  const myMonthCorpo = myMonthBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'corpo');
  const myMonthActiveDays = new Set(myMonthBookings.map((b) => parseBookingSlotId(b.slotId).date)).size;

  // Filtered list for display
  const displayedDayBookings = myDayBookings.filter((b) => {
    const { type } = parseBookingSlotId(b.slotId);
    if (personalReportTypeFilter === 'viso' && type !== 'viso') return false;
    if (personalReportTypeFilter === 'corpo' && type !== 'corpo') return false;
    return true;
  });

  const displayedMonthBookings = myMonthBookings.filter((b) => {
    const { type } = parseBookingSlotId(b.slotId);
    if (personalReportTypeFilter === 'viso' && type !== 'viso') return false;
    if (personalReportTypeFilter === 'corpo' && type !== 'corpo') return false;
    if (personalReportSearch.trim()) {
      const q = personalReportSearch.toLowerCase();
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchNotes = (b.notes || '').toLowerCase().includes(q);
      return matchName || matchNotes;
    }
    return true;
  });

  // Group monthly bookings by date
  const monthBookingsByDate: Record<string, ComputedBooking[]> = {};
  displayedMonthBookings.forEach((b) => {
    const { date } = parseBookingSlotId(b.slotId);
    if (!monthBookingsByDate[date]) {
      monthBookingsByDate[date] = [];
    }
    monthBookingsByDate[date].push(b);
  });

  const handleShiftDay = (offset: number) => {
    const curr = new Date(targetDayStr);
    curr.setDate(curr.getDate() + offset);
    const nextStr = curr.toISOString().split('T')[0];
    setPersonalReportDate(nextStr);
  };

  const handleShiftMonth = (offset: number) => {
    const [yStr, mStr] = targetMonthStr.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + offset;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setPersonalReportMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Title & Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <h3 className="font-display font-extrabold text-xl text-slate-950">
              Benvenuto, <span className={`${coachColorStyles.text} font-black`}>{coachName}</span>!
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Resoconto Personale: consulta e analizza la tua attività giornaliera e mensile nel club.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Switcher (Giornaliero / Mensile) */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setPersonalReportPeriod('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                personalReportPeriod === 'daily'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>📅</span>
              <span>Giornaliero</span>
            </button>
            <button
              onClick={() => setPersonalReportPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                personalReportPeriod === 'monthly'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>📊</span>
              <span>Mensile</span>
            </button>
          </div>

          {activeCoach && (
            <div
              className={`hidden sm:flex px-3.5 py-1.5 rounded-2xl border text-xs font-bold items-center gap-2 shadow-2xs ${coachColorStyles.bg} ${coachColorStyles.border} ${coachColorStyles.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${coachColorStyles.solid} animate-pulse`} />
              <span>Profilo Attivo</span>
            </div>
          )}
        </div>
      </div>

      {/* Period-specific Content */}
      {personalReportPeriod === 'daily' ? (
        /* DAILY REPORT VIEW */
        <div className="space-y-5 animate-fade-in">
          {/* Date Selector Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  {getItalianDayName(targetDayStr)} {formatItalianDateWithYear(targetDayStr)}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {targetDayStr === new Date().toISOString().split('T')[0]
                    ? 'Oggi in tempo reale'
                    : 'Resoconto per la data selezionata'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleShiftDay(-1)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                title="Giorno precedente"
              >
                ◀ Prec.
              </button>
              <button
                onClick={() => setPersonalReportDate(new Date().toISOString().split('T')[0])}
                className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer ${
                  targetDayStr === new Date().toISOString().split('T')[0]
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Oggi
              </button>
              <button
                onClick={() => handleShiftDay(1)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                title="Giorno successivo"
              >
                Succ. ▶
              </button>
              <input
                type="date"
                value={targetDayStr}
                onChange={(e) => setPersonalReportDate(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-100 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  PRENOTAZIONI DEL GIORNO
                </span>
                <span className="font-display font-black text-3xl text-emerald-950 block mt-0.5">
                  {myDayBookings.length}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  {myDayBookings.length === 1 ? '1 ospite in carico' : `${myDayBookings.length} ospiti in carico`}
                </span>
              </div>
              <span className="text-3xl opacity-80">📋</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  TRATTAMENTI VISO
                </span>
                <span className="font-display font-black text-3xl text-slate-900 block mt-0.5">
                  {myDayViso.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {myDayViso.length === 1 ? '1 seduta viso' : `${myDayViso.length} sedute viso`}
                </span>
              </div>
              <span className="text-3xl opacity-80">🌸</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  VALUTAZIONI CORPOREE
                </span>
                <span className="font-display font-black text-3xl text-slate-900 block mt-0.5">
                  {myDayCorpo.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {myDayCorpo.length === 1 ? '1 valutazione corpo' : `${myDayCorpo.length} valutazioni corpo`}
                </span>
              </div>
              <span className="text-3xl opacity-80">⚖️</span>
            </div>
          </div>

          {/* Filter Pills & Detailed List */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-display font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🕒</span> Elenco Appuntamenti di {formatItalianDate(targetDayStr)}
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPersonalReportTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    personalReportTypeFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tutti ({myDayBookings.length})
                </button>
                <button
                  onClick={() => setPersonalReportTypeFilter('viso')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    personalReportTypeFilter === 'viso'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                  }`}
                >
                  🌸 Viso ({myDayViso.length})
                </button>
                <button
                  onClick={() => setPersonalReportTypeFilter('corpo')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    personalReportTypeFilter === 'corpo'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                  }`}
                >
                  ⚖️ Corpo ({myDayCorpo.length})
                </button>
              </div>
            </div>

            {displayedDayBookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-slate-600">Nessun appuntamento in carico per questa data.</p>
                <p className="text-[11px] text-slate-400">
                  Seleziona un'altra data o prenota un nuovo trattamento dai turni settimanali.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayedDayBookings.map((b) => {
                  const { type, time } = parseBookingSlotId(b.slotId);
                  const isViso = type === 'viso';
                  const isReserve = b.status === 'riserva';

                  return (
                    <div
                      key={b.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-3xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start gap-3 overflow-hidden">
                        <span className="bg-slate-100 text-slate-800 text-xs font-extrabold px-2.5 py-1 rounded-xl font-mono shrink-0">
                          ⏱ {time}
                        </span>
                        <div className="space-y-1 overflow-hidden text-left">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-slate-900 truncate">{b.guestName}</h5>
                          </div>
                          {b.notes && <p className="text-xs text-slate-500 font-medium">📝 {b.notes}</p>}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                isViso
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : 'bg-blue-50 border-blue-100 text-blue-700'
                              }`}
                            >
                              {isViso ? '🌸 Viso' : '⚖️ Corpo'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isReserve
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}
                            >
                              {isReserve ? 'In Riserva' : 'Confermato'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MONTHLY REPORT VIEW */
        <div className="space-y-5 animate-fade-in">
          {/* Month Selector Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Resoconto di {formatItalianMonth(targetMonthStr)}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Totale presenze, sedute ed elaborazione completa per tutto il mese
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleShiftMonth(-1)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                title="Mese precedente"
              >
                ◀ Mese Prec.
              </button>
              <button
                onClick={() => setPersonalReportMonth(new Date().toISOString().slice(0, 7))}
                className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer ${
                  targetMonthStr === new Date().toISOString().slice(0, 7)
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Mese Corrente
              </button>
              <button
                onClick={() => handleShiftMonth(1)}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                title="Mese successivo"
              >
                Mese Succ. ▶
              </button>
              <input
                type="month"
                value={targetMonthStr}
                onChange={(e) => setPersonalReportMonth(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-100 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                OSPITI TOTALI DEL MESE
              </span>
              <span className="font-display font-black text-3xl text-emerald-950 block mt-0.5">
                {myMonthBookings.length}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                {myMonthBookings.length === 1
                  ? '1 ospite registrato'
                  : `${myMonthBookings.length} ospiti registrati`}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TRATTAMENTI VISO
              </span>
              <span className="font-display font-black text-3xl text-slate-900 block mt-0.5">
                {myMonthViso.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                {myMonthBookings.length > 0
                  ? Math.round((myMonthViso.length / myMonthBookings.length) * 100)
                  : 0}
                % sul totale mensile
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                VALUTAZIONI CORPOREE
              </span>
              <span className="font-display font-black text-3xl text-slate-900 block mt-0.5">
                {myMonthCorpo.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                {myMonthBookings.length > 0
                  ? Math.round((myMonthCorpo.length / myMonthBookings.length) * 100)
                  : 0}
                % sul totale mensile
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                GIORNI ATTIVI
              </span>
              <span className="font-display font-black text-3xl text-slate-900 block mt-0.5">
                {myMonthActiveDays}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                giorni con appuntamenti
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Cerca ospite o nota nel mese..."
                value={personalReportSearch}
                onChange={(e) => setPersonalReportSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPersonalReportTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  personalReportTypeFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tutti ({myMonthBookings.length})
              </button>
              <button
                onClick={() => setPersonalReportTypeFilter('viso')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  personalReportTypeFilter === 'viso'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                }`}
              >
                🌸 Viso ({myMonthViso.length})
              </button>
              <button
                onClick={() => setPersonalReportTypeFilter('corpo')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  personalReportTypeFilter === 'corpo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                }`}
              >
                ⚖️ Corpo ({myMonthCorpo.length})
              </button>
            </div>
          </div>

          {/* Grouped Month Bookings */}
          {Object.keys(monthBookingsByDate).length === 0 ? (
            <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-1">
              <p className="text-xs font-bold text-slate-600">
                Nessun ospite trovato per il mese di {formatItalianMonth(targetMonthStr)}.
              </p>
              <p className="text-[11px] text-slate-400">
                Non ci sono trattamenti o valutazioni registrati per questo periodo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(monthBookingsByDate)
                .sort()
                .map((dStr) => {
                  const dayList = monthBookingsByDate[dStr];
                  const dayName = getItalianDayName(dStr);

                  return (
                    <div
                      key={dStr}
                      className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <h5 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          {dayName} {formatItalianDate(dStr)}
                        </h5>
                        <span className="text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full shadow-3xs">
                          {dayList.length === 1 ? '1 appuntamento' : `${dayList.length} appuntamenti`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {dayList.map((b) => {
                          const { type, time } = parseBookingSlotId(b.slotId);
                          const isViso = type === 'viso';
                          const isReserve = b.status === 'riserva';

                          return (
                            <div
                              key={b.id}
                              className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-start justify-between gap-2.5 shadow-3xs"
                            >
                              <div className="flex items-start gap-2.5 overflow-hidden">
                                <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg font-mono shrink-0">
                                  {time}
                                </span>
                                <div className="space-y-0.5 overflow-hidden text-left">
                                  <h6 className="font-bold text-xs text-slate-900 truncate">
                                    {b.guestName}
                                  </h6>
                                  {b.notes && (
                                    <p className="text-[10px] text-slate-500 font-medium truncate">
                                      📝 {b.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                    isViso
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                      : 'bg-blue-50 border-blue-100 text-blue-700'
                                  }`}
                                >
                                  {isViso ? '🌸 Viso' : '⚖️ Corpo'}
                                </span>
                                {isReserve && (
                                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                    Riserva
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
