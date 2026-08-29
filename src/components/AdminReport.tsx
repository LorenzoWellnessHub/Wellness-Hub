import React, { useState } from 'react';
import { Coach, SlotSummary, ComputedBooking } from '../types';
import {
  getItalianDayName,
  formatItalianDate,
  formatItalianDateWithYear,
  formatItalianMonth,
  parseBookingSlotId,
  getWeekDates,
} from '../utils/dateUtils';

interface AdminReportProps {
  coaches: Coach[];
  summaries: SlotSummary[];
  corpoBookings: ComputedBooking[];
  allBookings: ComputedBooking[];
  selectedMonday: string;
  getCoachColorClasses: (color: string) => {
    bg: string;
    text: string;
    border: string;
    ring: string;
    solid: string;
    lightText: string;
    hover: string;
  };
  renderEarningsTracker: (isAdmin: boolean) => React.ReactNode;
}

export const AdminReport: React.FC<AdminReportProps> = ({
  coaches,
  summaries,
  corpoBookings,
  allBookings,
  selectedMonday,
  getCoachColorClasses,
  renderEarningsTracker,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reportSubTab, setReportSubTab] = useState<'club' | 'coaches'>('club');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'viso' | 'corpo'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Period targets
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetMonday, setTargetMonday] = useState<string>(selectedMonday || new Date().toISOString().split('T')[0]);
  const [targetMonth, setTargetMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Synthesize complete list of bookings
  const synthesizedVisoBookings: ComputedBooking[] = [];
  summaries.forEach((s) => {
    (s.bookings || []).forEach((b) => {
      synthesizedVisoBookings.push({
        ...b,
        slotId: s.slotId,
      });
    });
  });
  const allMasterBookings =
    allBookings.length > 0 ? allBookings : [...synthesizedVisoBookings, ...corpoBookings];

  // Helper to check if a booking matches the period
  const isBookingInPeriod = (slotId: string): boolean => {
    const { date } = parseBookingSlotId(slotId);
    if (!date) return false;
    if (reportPeriod === 'daily') {
      return date === targetDate;
    }
    if (reportPeriod === 'weekly') {
      const dates = getWeekDates(targetMonday);
      return dates.includes(date);
    }
    if (reportPeriod === 'monthly') {
      return date.startsWith(targetMonth);
    }
    return false;
  };

  // Filtered bookings for the period
  const periodBookings = allMasterBookings.filter((b) => isBookingInPeriod(b.slotId));

  // Filtered further by type & search for displays
  const displayFilteredBookings = periodBookings.filter((b) => {
    const { type } = parseBookingSlotId(b.slotId);
    if (typeFilter === 'viso' && type !== 'viso') return false;
    if (typeFilter === 'corpo' && type !== 'corpo') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (b.guestName || '').toLowerCase().includes(q);
      const matchNotes = (b.notes || '').toLowerCase().includes(q);
      const coach = coaches.find((c) => c.id === b.coachId);
      const matchCoach = coach ? coach.name.toLowerCase().includes(q) : false;
      return matchName || matchNotes || matchCoach;
    }
    return true;
  });

  const periodVisoBookings = periodBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'viso');
  const periodCorpoBookings = periodBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'corpo');

  // Stats by coach for the period
  const coachStatsMap: Record<
    string,
    { viso: number; corpo: number; total: number; activeDays: Set<string> }
  > = {};

  coaches.forEach((c) => {
    coachStatsMap[c.id] = { viso: 0, corpo: 0, total: 0, activeDays: new Set() };
  });

  periodBookings.forEach((b) => {
    const { type, date } = parseBookingSlotId(b.slotId);
    if (!coachStatsMap[b.coachId]) {
      coachStatsMap[b.coachId] = { viso: 0, corpo: 0, total: 0, activeDays: new Set() };
    }
    if (type === 'viso') {
      coachStatsMap[b.coachId].viso += 1;
    } else {
      coachStatsMap[b.coachId].corpo += 1;
    }
    coachStatsMap[b.coachId].total += 1;
    if (date) {
      coachStatsMap[b.coachId].activeDays.add(date);
    }
  });

  // Calculate Capacity occupied for Viso
  let activeVisoSlotsCount = 0;
  if (reportPeriod === 'daily') {
    activeVisoSlotsCount = summaries.filter((s) => s.date === targetDate).length;
  } else if (reportPeriod === 'weekly') {
    const dates = getWeekDates(targetMonday);
    activeVisoSlotsCount = summaries.filter((s) => dates.includes(s.date)).length;
  } else {
    // monthly: estimate unique slots
    const uniqueSlots = new Set(periodVisoBookings.map((b) => b.slotId));
    activeVisoSlotsCount = uniqueSlots.size || 1;
  }
  const maxPossibleVisoCapacity = Math.max(1, activeVisoSlotsCount * 15);
  const visoCapacityPercent = Math.min(100, Math.round((periodVisoBookings.length / maxPossibleVisoCapacity) * 100));

  // Handlers for date navigation
  const handleShiftDay = (offset: number) => {
    const curr = new Date(targetDate);
    curr.setDate(curr.getDate() + offset);
    setTargetDate(curr.toISOString().split('T')[0]);
  };

  const handleShiftWeek = (offset: number) => {
    const curr = new Date(targetMonday);
    curr.setDate(curr.getDate() + offset * 7);
    setTargetMonday(curr.toISOString().split('T')[0]);
  };

  const handleShiftMonth = (offset: number) => {
    const [yStr, mStr] = targetMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + offset;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setTargetMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Dates to show in breakdown
  const activeDatesList: string[] = (() => {
    if (reportPeriod === 'daily') {
      return [targetDate];
    }
    if (reportPeriod === 'weekly') {
      return getWeekDates(targetMonday);
    }
    // monthly: get all unique dates with bookings or all days in month
    const datesSet = new Set<string>();
    periodBookings.forEach((b) => {
      const { date } = parseBookingSlotId(b.slotId);
      if (date) datesSet.add(date);
    });
    return Array.from(datesSet).sort();
  })();

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Banner & Navigation */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              Resoconto e Statistiche di Lavoro (Admin)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Analisi completa delle performance del club e carico di lavoro per coach con viste Giornaliera, Settimanale e Mensile.
          </p>
        </div>

        {/* Period Selector Tabs (Giornaliero / Settimanale / Mensile) */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/50 shrink-0 shadow-inner">
          <button
            onClick={() => setReportPeriod('daily')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportPeriod === 'daily'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📅</span>
            <span>Giornaliero</span>
          </button>
          <button
            onClick={() => setReportPeriod('weekly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportPeriod === 'weekly'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🗓️</span>
            <span>Settimanale</span>
          </button>
          <button
            onClick={() => setReportPeriod('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportPeriod === 'monthly'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📊</span>
            <span>Mensile</span>
          </button>
        </div>
      </div>

      {/* Period Navigation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">
            {reportPeriod === 'daily' ? '📅' : reportPeriod === 'weekly' ? '🗓️' : '📊'}
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              {reportPeriod === 'daily' && (
                <>
                  {getItalianDayName(targetDate)} {formatItalianDateWithYear(targetDate)}
                </>
              )}
              {reportPeriod === 'weekly' && (
                <>
                  Settimana dal {formatItalianDate(targetMonday)} al{' '}
                  {(() => {
                    const dates = getWeekDates(targetMonday);
                    return formatItalianDateWithYear(dates[6] || targetMonday);
                  })()}
                </>
              )}
              {reportPeriod === 'monthly' && (
                <>Resoconto del Mese di {formatItalianMonth(targetMonth)}</>
              )}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              Filtro periodo attivo: {periodBookings.length} prenotazioni totali rilevate
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {reportPeriod === 'daily' && (
            <>
              <button
                onClick={() => handleShiftDay(-1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                ◀ Ieri
              </button>
              <button
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer ${
                  targetDate === new Date().toISOString().split('T')[0]
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Oggi
              </button>
              <button
                onClick={() => handleShiftDay(1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                Domani ▶
              </button>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </>
          )}

          {reportPeriod === 'weekly' && (
            <>
              <button
                onClick={() => handleShiftWeek(-1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                ◀ Sett. Prec.
              </button>
              <button
                onClick={() => setTargetMonday(selectedMonday)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                Settimana Corrente
              </button>
              <button
                onClick={() => handleShiftWeek(1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                Sett. Succ. ▶
              </button>
            </>
          )}

          {reportPeriod === 'monthly' && (
            <>
              <button
                onClick={() => handleShiftMonth(-1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                ◀ Mese Prec.
              </button>
              <button
                onClick={() => setTargetMonth(new Date().toISOString().slice(0, 7))}
                className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer ${
                  targetMonth === new Date().toISOString().slice(0, 7)
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Mese Corrente
              </button>
              <button
                onClick={() => handleShiftMonth(1)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
              >
                Mese Succ. ▶
              </button>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher: Andamento Club vs Singoli Coach */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportSubTab('club')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportSubTab === 'club'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>🏫</span>
            <span>Andamento Club</span>
          </button>
          <button
            onClick={() => setReportSubTab('coaches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportSubTab === 'coaches'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>👥</span>
            <span>Singoli Coach</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full hidden sm:block">
          <input
            type="text"
            placeholder="Cerca ospite, coach o nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
        </div>
      </div>

      {/* SUBTAB 1: ANDAMENTO CLUB */}
      {reportSubTab === 'club' ? (
        <div className="space-y-6">
          {/* KPI STATS CARDS FOR CLUB */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                PRENOTAZIONI NEL PERIODO
              </span>
              <span className="font-display font-black text-3xl text-emerald-950 block mt-1">
                {periodBookings.length}
              </span>
              <span className="text-xs text-emerald-700 mt-1.5 block font-semibold">
                {periodVisoBookings.length} Viso + {periodCorpoBookings.length} Corporee
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                CAPACITÀ OCCUPATA VISO
              </span>
              <span className="font-display font-black text-3xl text-slate-800 block mt-1">
                {visoCapacityPercent}%
              </span>
              <span className="text-xs text-slate-400 mt-1.5 block">
                {periodVisoBookings.length} ospiti registrati su {activeVisoSlotsCount} turni attivi
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                DISTRIBUZIONE CARICO
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {coaches.map((c) => {
                  const stats = coachStatsMap[c.id] || { total: 0 };
                  const coachStyles = getCoachColorClasses(c.color);
                  return (
                    <span
                      key={c.id}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-700"
                    >
                      <span className={`w-2 h-2 rounded-full ${coachStyles.solid}`} />
                      {c.name}: <strong className="text-slate-900">{stats.total}</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DAY BY DAY OR PERIOD BREAKDOWN */}
          <div className="space-y-4">
            {activeDatesList.length === 0 || periodBookings.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-2">
                <span className="text-3xl block">📋</span>
                <h5 className="font-bold text-slate-700 text-sm">
                  Nessuna prenotazione presente nel periodo selezionato
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Non risultano trattamenti viso o valutazioni corporee registrati per la data o il periodo impostato.
                </p>
              </div>
            ) : (
              activeDatesList.map((dateStr) => {
                const dayName = getItalianDayName(dateStr);
                const dayBookings = displayFilteredBookings.filter((b) => {
                  const { date } = parseBookingSlotId(b.slotId);
                  return date === dateStr;
                });

                const dayViso = dayBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'viso');
                const dayCorpo = dayBookings.filter((b) => parseBookingSlotId(b.slotId).type === 'corpo');

                if (dayBookings.length === 0 && reportPeriod === 'monthly') return null;

                return (
                  <div
                    key={dateStr}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                          {dayName} {formatItalianDate(dateStr)}
                        </span>
                      </div>
                      <span className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-0.5 rounded-full">
                        {dayBookings.length} {dayBookings.length === 1 ? 'prenotazione' : 'prenotazioni'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Viso column */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                          🌸 Trattamenti Viso ({dayViso.length})
                        </h5>
                        {dayViso.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nessun trattamento viso in questa data.</p>
                        ) : (
                          <div className="space-y-2">
                            {dayViso.map((b) => {
                              const { time } = parseBookingSlotId(b.slotId);
                              const coach = coaches.find((c) => c.id === b.coachId);
                              const coachStyles = coach
                                ? getCoachColorClasses(coach.color)
                                : { solid: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };

                              return (
                                <div
                                  key={b.id}
                                  className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                      ⏱ {time}
                                    </span>
                                    <strong className="text-slate-900 truncate">{b.guestName}</strong>
                                    {b.notes && (
                                      <span className="text-[10px] text-slate-400 italic truncate max-w-[100px]">
                                        ({b.notes})
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}
                                  >
                                    {coach?.name || 'Coach'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Corpo column */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-bold uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                          ⚖️ Valutazioni Corporee ({dayCorpo.length})
                        </h5>
                        {dayCorpo.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nessuna valutazione corporea in questa data.</p>
                        ) : (
                          <div className="space-y-2">
                            {dayCorpo.map((b) => {
                              const { time } = parseBookingSlotId(b.slotId);
                              const coach = coaches.find((c) => c.id === b.coachId);
                              const coachStyles = coach
                                ? getCoachColorClasses(coach.color)
                                : { solid: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };

                              return (
                                <div
                                  key={b.id}
                                  className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                      ⏱ {time}
                                    </span>
                                    <strong className="text-slate-900 truncate">{b.guestName}</strong>
                                    {b.notes && (
                                      <span className="text-[10px] text-slate-400 italic truncate max-w-[100px]">
                                        ({b.notes})
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}
                                  >
                                    {coach?.name || 'Coach'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* SUBTAB 2: SINGOLI COACH */
        <div className="space-y-6">
          {/* Coach Selection Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wide">
              Seleziona un Coach per analizzare i suoi numeri nel dettaglio
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Card "Tutti i Coach" */}
              <button
                onClick={() => setSelectedCoachId('all')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCoachId === 'all'
                    ? 'border-emerald-600 bg-emerald-50/20 text-emerald-950 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-extrabold text-sm">Tutti i Coach</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Confronto e tabella riassuntiva di tutti gli operatori
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Totale periodo:</span>
                  <strong className="text-slate-900 font-extrabold font-mono">
                    {periodBookings.length} prenotazioni
                  </strong>
                </div>
              </button>

              {/* Individual Coach Cards */}
              {coaches.map((c) => {
                const stats = coachStatsMap[c.id] || { viso: 0, corpo: 0, total: 0, activeDays: new Set() };
                const totalClub = periodBookings.length;
                const pct = totalClub > 0 ? Math.round((stats.total / totalClub) * 100) : 0;
                const coachStyles = getCoachColorClasses(c.color);

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCoachId(c.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedCoachId === c.id
                        ? 'border-emerald-600 bg-emerald-50/10 text-slate-900 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${coachStyles.solid}`} />
                          <span className="font-bold text-sm text-slate-800">{c.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}
                        >
                          {pct}% Lavoro
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {stats.viso} Viso • {stats.corpo} Corporee
                      </p>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${coachStyles.solid}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Quota periodo:</span>
                        <strong className="text-slate-800 font-mono">{stats.total} prenotazioni</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAILED VIEW: ALL OR SINGLE COACH */}
          {selectedCoachId === 'all' ? (
            /* ALL COACHES COMPARISON TABLE */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                    <span>⚖️</span> Tabella Comparativa Carico di Lavoro
                  </h4>
                  <p className="text-xs text-slate-400">
                    Confronto dettagliato delle attività svolte da ciascun coach per il periodo selezionato.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-150">
                      <th className="p-4">COACH / OPERATORE</th>
                      <th className="p-4 text-center">TRATTAMENTI VISO</th>
                      <th className="p-4 text-center">VALUTAZIONI CORPO</th>
                      <th className="p-4 text-center">PRENOTAZIONI TOTALI</th>
                      <th className="p-4 text-center">GIORNI ATTIVI</th>
                      <th className="p-4 text-right">QUOTA LAVORO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coaches.map((c) => {
                      const stats = coachStatsMap[c.id] || { viso: 0, corpo: 0, total: 0, activeDays: new Set() };
                      const totalClub = periodBookings.length;
                      const pct = totalClub > 0 ? Math.round((stats.total / totalClub) * 100) : 0;
                      const coachStyles = getCoachColorClasses(c.color);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 flex items-center gap-2.5 font-bold text-slate-800">
                            <span className={`w-3 h-3 rounded-full ${coachStyles.solid}`} />
                            {c.name}
                          </td>
                          <td className="p-4 text-center font-mono font-medium text-slate-600">
                            {stats.viso}
                          </td>
                          <td className="p-4 text-center font-mono font-medium text-slate-600">
                            {stats.corpo}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-slate-900">
                            {stats.total}
                          </td>
                          <td className="p-4 text-center text-slate-500 font-semibold">
                            {stats.activeDays.size} {stats.activeDays.size === 1 ? 'giorno' : 'giorni'}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap pr-6">
                            <div className="flex items-center justify-end gap-3">
                              <span className="font-mono font-bold text-slate-800">{pct}%</span>
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${coachStyles.solid}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Summary Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-100/70 font-extrabold text-slate-900 border-t border-slate-200">
                      <td className="p-4">TOTALE CLUB</td>
                      <td className="p-4 text-center font-mono">{periodVisoBookings.length}</td>
                      <td className="p-4 text-center font-mono">{periodCorpoBookings.length}</td>
                      <td className="p-4 text-center font-mono text-emerald-800">{periodBookings.length}</td>
                      <td className="p-4 text-center">-</td>
                      <td className="p-4 text-right pr-6 font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* SINGLE COACH DETAILED REPORT */
            selectedCoach && (() => {
              const stats = coachStatsMap[selectedCoach.id] || { viso: 0, corpo: 0, total: 0, activeDays: new Set() };
              const totalClub = periodBookings.length;
              const pct = totalClub > 0 ? Math.round((stats.total / totalClub) * 100) : 0;
              const coachStyles = getCoachColorClasses(selectedCoach.color);

              const coachPeriodBookings = periodBookings
                .filter((b) => b.coachId === selectedCoach.id)
                .sort((a, b) => {
                  const dA = parseBookingSlotId(a.slotId).date + ' ' + parseBookingSlotId(a.slotId).time;
                  const dB = parseBookingSlotId(b.slotId).date + ' ' + parseBookingSlotId(b.slotId).time;
                  return dA.localeCompare(dB);
                });

              return (
                <div className="space-y-6 animate-scale-up">
                  {/* Coach Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="border p-5 rounded-2xl shadow-xs bg-white border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        PRENOTAZIONI TOTALI
                      </span>
                      <span className="font-display font-extrabold text-3xl text-slate-800 block mt-1">
                        {stats.total}
                      </span>
                      <span
                        className={`text-[10px] font-bold mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${coachStyles.bg} ${coachStyles.text} border ${coachStyles.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${coachStyles.solid}`} />
                        Coach {selectedCoach.name}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        TRATTAMENTI VISO
                      </span>
                      <span className="font-display font-extrabold text-3xl text-slate-800 block mt-1">
                        {stats.viso}
                      </span>
                      <span className="text-xs text-slate-400 mt-2 block">
                        {stats.total > 0 ? Math.round((stats.viso / stats.total) * 100) : 0}% sul totale coach
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        VALUTAZIONI CORPO
                      </span>
                      <span className="font-display font-extrabold text-3xl text-slate-800 block mt-1">
                        {stats.corpo}
                      </span>
                      <span className="text-xs text-slate-400 mt-2 block">
                        {stats.total > 0 ? Math.round((stats.corpo / stats.total) * 100) : 0}% sul totale coach
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        QUOTA LAVORO CLUB
                      </span>
                      <span className="font-display font-extrabold text-3xl text-slate-800 block mt-1">
                        {pct}%
                      </span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2.5">
                        <div className={`h-full ${coachStyles.solid}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Coach Agenda Details */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-display font-extrabold text-base text-slate-800">
                          📅 Agenda di {selectedCoach.name} nel periodo
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tutti gli appuntamenti e gli orari in carico a {selectedCoach.name}.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        Giorni lavorati: <strong className="text-slate-800">{stats.activeDays.size}</strong>
                      </span>
                    </div>

                    {coachPeriodBookings.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-xs font-bold text-slate-500">
                          Nessun appuntamento in carico a {selectedCoach.name} in questo periodo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeDatesList.map((dateStr) => {
                          const dayBookings = coachPeriodBookings.filter((b) => {
                            const { date } = parseBookingSlotId(b.slotId);
                            return date === dateStr;
                          });

                          if (dayBookings.length === 0) return null;
                          const dayName = getItalianDayName(dateStr);

                          return (
                            <div
                              key={dateStr}
                              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                            >
                              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                <span className="font-bold text-xs text-slate-700 uppercase font-display">
                                  {dayName} {formatItalianDate(dateStr)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  {dayBookings.length} {dayBookings.length === 1 ? 'appuntamento' : 'appuntamenti'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {dayBookings.map((b) => {
                                  const { type, time } = parseBookingSlotId(b.slotId);
                                  const isViso = type === 'viso';
                                  const isReserve = b.status === 'riserva';

                                  return (
                                    <div
                                      key={b.id}
                                      className="bg-white border border-slate-200/70 rounded-xl p-3 flex items-start justify-between gap-2 shadow-3xs"
                                    >
                                      <div className="flex items-start gap-2.5 overflow-hidden">
                                        <span className="font-mono text-[10px] font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                                          {time}
                                        </span>
                                        <div className="space-y-0.5 overflow-hidden">
                                          <h6 className="text-xs font-bold text-slate-800 truncate">
                                            {b.guestName}
                                          </h6>
                                          {b.notes && (
                                            <p className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
                                              📝 {b.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
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
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Operator earnings tracker at the bottom */}
      <div className="mt-6">{renderEarningsTracker(true)}</div>
    </div>
  );
};
