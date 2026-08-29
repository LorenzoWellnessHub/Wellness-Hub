import React, { useState } from 'react';
import { Coach, SlotSummary, ComputedBooking } from '../types';
import { getItalianDayName, formatItalianDate } from '../utils/dateUtils';
import { ChevronDown, ChevronUp, Users, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CompactWeeklyCalendarProps {
  isLoading: boolean;
  groupedSlots: { [date: string]: SlotSummary[] };
  sortedDates: string[];
  coaches: Coach[];
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

export const CompactWeeklyCalendar: React.FC<CompactWeeklyCalendarProps> = ({
  isLoading,
  groupedSlots,
  sortedDates,
  coaches,
  getCoachColorClasses,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});

  const toggleSlotExpand = (slotId: string) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const totalShiftsCount = sortedDates.reduce((acc, d) => acc + (groupedSlots[d]?.length || 0), 0);
  const totalGuestsCount = sortedDates.reduce((acc, d) => {
    const slots = groupedSlots[d] || [];
    return acc + slots.reduce((sAcc, s) => sAcc + s.confirmedCount, 0);
  }, 0);

  const activeDates =
    selectedDayFilter === 'all' || !sortedDates.includes(selectedDayFilter)
      ? sortedDates
      : [selectedDayFilter];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="space-y-0.5">
          <h4 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <span className="text-base">🗓️</span> Calendario Turni della Settimana
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Panoramica compatta e ordinata dei turni attivi nel club ({totalShiftsCount} turni, {totalGuestsCount} ospiti totali)
          </p>
        </div>

        {/* Day selection pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedDayFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>Tutti ({totalShiftsCount})</span>
          </button>

          {sortedDates.map((dateStr) => {
            const daySlots = groupedSlots[dateStr] || [];
            const isSelected = selectedDayFilter === dateStr;
            const dayShort = getItalianDayName(dateStr).substring(0, 3);
            const dayNum = new Date(dateStr).getDate();

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDayFilter(dateStr)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80'
                }`}
              >
                <span className="opacity-75 uppercase text-[9px]">{dayShort}</span>
                <span className="font-extrabold text-xs">{dayNum}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-md font-bold ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {daySlots.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-8 text-center space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Aggiornamento del calendario...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="p-6 text-center space-y-1.5 bg-slate-50 rounded-2xl border border-dashed border-slate-200/80">
          <span className="text-xl block">📁</span>
          <h5 className="font-bold text-slate-700 text-xs">Nessun turno programmato</h5>
          <p className="text-[11px] text-slate-400">Non ci sono turni attivi per questa settimana.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {activeDates.map((dateStr) => {
            const daySlots = groupedSlots[dateStr] || [];
            if (daySlots.length === 0) return null;
            const dayName = getItalianDayName(dateStr);

            return (
              <div
                key={dateStr}
                className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-3xs bg-white flex flex-col justify-between"
              >
                {/* Day Header */}
                <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                      {dayName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatItalianDate(dateStr)}
                    </span>
                  </div>
                  <span className="bg-white border border-slate-200 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-md">
                    {daySlots.length} {daySlots.length === 1 ? 'turno' : 'turni'}
                  </span>
                </div>

                {/* Slots in this Day */}
                <div className="divide-y divide-slate-100 p-1 bg-white">
                  {daySlots.map((slot) => {
                    const isFull = slot.confirmedCount >= 15;
                    const isExpanded = !!expandedSlots[slot.slotId];

                    // Group bookings by coach
                    const bookingsList: ComputedBooking[] = slot.bookings || [];
                    const bookingsByCoach: Record<
                      string,
                      { name: string; color: string; count: number; riservaCount: number }
                    > = {};

                    bookingsList.forEach((b) => {
                      const coach = coaches.find((c) => c.id === b.coachId);
                      const name = coach ? coach.name : 'Sconosciuto';
                      const color = coach ? coach.color : 'slate';
                      if (!bookingsByCoach[b.coachId]) {
                        bookingsByCoach[b.coachId] = { name, color, count: 0, riservaCount: 0 };
                      }
                      if (b.status === 'riserva') {
                        bookingsByCoach[b.coachId].riservaCount++;
                      } else {
                        bookingsByCoach[b.coachId].count++;
                      }
                    });

                    return (
                      <div key={slot.slotId} className="p-2.5 hover:bg-slate-50/50 rounded-xl transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          {/* Time & Slot Type */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-slate-900 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {slot.time}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                isFull
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}
                            >
                              {slot.confirmedCount}/15 {isFull ? 'Pieno' : 'Posti'}
                            </span>
                          </div>

                          {/* Coach Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-start sm:justify-end min-w-0">
                            {Object.keys(bookingsByCoach).length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">0 ospiti</span>
                            ) : (
                              Object.entries(bookingsByCoach).map(([coachId, info]) => {
                                const coachStyles = getCoachColorClasses(info.color);
                                return (
                                  <span
                                    key={coachId}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${coachStyles.bg} ${coachStyles.border} ${coachStyles.text}`}
                                  >
                                    <span className={`w-1 h-1 rounded-full ${coachStyles.solid}`} />
                                    <span>{info.name}:</span>
                                    <strong className="text-slate-900">{info.count}</strong>
                                    {info.riservaCount > 0 && (
                                      <span className="text-[8px] opacity-75">+{info.riservaCount}r</span>
                                    )}
                                  </span>
                                );
                              })
                            )}

                            {/* Expand/Collapse Guests list toggle */}
                            {slot.bookings && slot.bookings.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleSlotExpand(slot.slotId)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                title={isExpanded ? 'Nascondi ospiti' : 'Mostra ospiti'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Guest Detail List */}
                        {isExpanded && slot.bookings && slot.bookings.length > 0 && (
                          <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 space-y-1.5 animate-fadeIn">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Ospiti registrati per questo turno:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {slot.bookings.map((b, idx) => {
                                const coach = coaches.find((c) => c.id === b.coachId);
                                const coachStyles = coach
                                  ? getCoachColorClasses(coach.color)
                                  : { solid: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };

                                return (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-3xs"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${coachStyles.solid}`} />
                                    <strong className="text-slate-800">{b.guestName}</strong>
                                    <span className="text-[9px] text-slate-400">({coach?.name || 'Coach'})</span>
                                    {b.status === 'riserva' && (
                                      <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                        Riserva
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
  );
};
