import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  Loader2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface CoachInfo {
  id: string;
  name: string;
  color: string;
  isBlocked: boolean;
  blockedMonthLabel: string;
}

interface AvailableSlot {
  slotId: string;
  treatmentType: 'viso';
  date: string;
  time: string;
  isCustom: boolean;
  confirmedCount: number;
  availableStations: number;
}

interface PublicClientBookingProps {
  coachId: string;
  onBackToLogin: () => void;
}

export default function PublicClientBooking({ coachId, onBackToLogin }: PublicClientBookingProps) {
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [partySize, setPartySize] = useState<1 | 2>(1);
  const [guestName, setGuestName] = useState<string>('');
  const [secondGuestName, setSecondGuestName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Selected date filter
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch coach details and verification
        const coachRes = await fetch(`/api/public-bookings/coach/${coachId}`);
        if (!coachRes.ok) {
          const errData = await coachRes.json();
          throw new Error(errData.error || 'Impossibile caricare le informazioni del coach.');
        }
        const coachData: CoachInfo = await coachRes.json();
        setCoachInfo(coachData);

        if (coachData.isBlocked) {
          setLoading(false);
          return;
        }

        // Fetch available slots
        const slotsRes = await fetch(`/api/public-bookings/slots?coachId=${coachId}`);
        if (!slotsRes.ok) {
          throw new Error('Impossibile caricare gli orari disponibili.');
        }
        const slotsData: AvailableSlot[] = await slotsRes.json();
        setSlots(slotsData);

        // Auto-select first date if available
        if (slotsData.length > 0) {
          const uniqueDates = Array.from(new Set(slotsData.map(s => s.date))) as string[];
          if (uniqueDates.length > 0) {
            setSelectedDate(uniqueDates[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Errore imprevisto durante il caricamento.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coachId]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Seleziona una data e un orario per il tuo trattamento.');
      return;
    }
    if (!guestName.trim()) {
      setError('Inserisci il tuo nome e cognome.');
      return;
    }
    if (partySize === 2 && !secondGuestName.trim()) {
      setError('Inserisci il nome del secondo ospite.');
      return;
    }
    if (!phone.trim()) {
      setError('Inserisci un numero di cellulare valido.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/public-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slotId: selectedSlot.slotId,
          coachId,
          guestName: guestName.trim(),
          secondGuestName: secondGuestName.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          partySize
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Errore durante la prenotazione.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Errore imprevisto. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCoachColorTheme = (color: string) => {
    const themes: { [key: string]: { solid: string, light: string, text: string } } = {
      blue: { solid: 'bg-blue-600', light: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      emerald: { solid: 'bg-emerald-600', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      purple: { solid: 'bg-purple-600', light: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      amber: { solid: 'bg-amber-600', light: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      rose: { solid: 'bg-rose-600', light: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
      sky: { solid: 'bg-sky-600', light: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
      violet: { solid: 'bg-violet-600', light: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
      indigo: { solid: 'bg-indigo-600', light: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    };
    return themes[color] || themes.emerald;
  };

  const formatItalianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const parts = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).split(' ');
      // Capitalize weekday
      if (parts.length > 0) {
        parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
      return parts.join(' ');
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Caricamento disponibilità in corso...</p>
      </div>
    );
  }

  const theme = coachInfo ? getCoachColorTheme(coachInfo.color) : getCoachColorTheme('emerald');
  const coachFirstName = coachInfo ? coachInfo.name.split(' ')[0] : '';

  // Blocked Screen
  if (coachInfo?.isBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-slate-800">Canale Prenotazioni non Attivo</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Il canale di prenotazione online per il coach <strong>{coachFirstName}</strong> non è momentaneamente attivo.
            </p>
          </div>
          <div className="bg-rose-50/50 p-4 rounded-2xl text-xs text-rose-700 border border-rose-100 font-medium leading-relaxed">
            I trattamenti viso sono momentaneamente sospesi o riservati a prenotazioni manuali da parte del personale di riferimento.
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all shadow-sm"
          >
            Accedi come Coach
          </button>
        </motion.div>
      </div>
    );
  }

  // Success Screen
  if (success && coachInfo && selectedSlot) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Prenotazione Completata!
            </span>
            <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Prenotazione Confermata!</h2>
            <p className="text-sm text-slate-500">
              Grazie <strong>{guestName}</strong>{partySize === 2 && secondGuestName.trim() ? (
                <> e <strong>{secondGuestName.trim()}</strong>, la vostra prenotazione è stata registrata con successo e inserita in agenda.</>
              ) : (
                <>, la tua prenotazione è stata registrata con successo e inserita in agenda.</>
              )}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="text-sm font-medium">{formatItalianDate(selectedSlot.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Clock className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="text-sm font-medium">Ore {selectedSlot.time}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="text-sm font-medium">Coach: {coachFirstName}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex -space-x-1 text-slate-400 shrink-0">
                <User className="w-4 h-4" />
                {partySize === 2 && <User className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium text-slate-700">
                Prenotato per: <span className="font-bold text-emerald-600">{partySize} {partySize === 2 ? 'persone' : 'persona'}</span>
                {partySize === 2 && secondGuestName.trim() && (
                  <span className="text-xs text-slate-500 block mt-1 font-normal">
                    Ospiti: {guestName} & {secondGuestName}
                  </span>
                )}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Il tuo Coach è stato avvisato in tempo reale. Se hai bisogno di disdire o modificare l&apos;appuntamento, contatta direttamente il coach.
          </p>

          <button
            onClick={() => {
              setSuccess(false);
              setSelectedSlot(null);
              setPartySize(1);
              setGuestName('');
              setSecondGuestName('');
              setPhone('');
              setNotes('');
            }}
            className={`w-full py-3.5 ${theme.solid} hover:opacity-95 text-white rounded-2xl font-bold text-sm transition-all shadow-md`}
          >
            Fai un&apos;altra prenotazione
          </button>
        </motion.div>
      </div>
    );
  }

  const uniqueDates = Array.from(new Set(slots.map(s => s.date))) as string[];
  const slotsForSelectedDate = slots.filter(s => s.date === selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 py-5 px-4 sm:px-6 shadow-xs relative z-30">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
              WH
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">The Wellness Hub</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prenotazione Trattamento Viso</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Intro Card */}
        {coachInfo && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" /> Servizio Esclusivo Clienti
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-none">
                Trattamento Viso Skin Rigenerante
              </h2>
              <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                Prenota in completa autonomia la tua sessione di cura della pelle con il tuo Coach di riferimento. Scegli il giorno e l&apos;orario che preferisci tra quelli disponibili.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-xl ${theme.solid} flex items-center justify-center text-white font-display font-black text-lg shadow-sm`}>
                {coachFirstName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Il tuo Coach</p>
                <p className="text-sm font-bold text-slate-800">{coachFirstName}</p>
                <p className="text-xs text-slate-500">The Wellness Hub</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form + Slot Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Step 1: Slot Picker (Lefthand/Main block) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">1. Seleziona Giorno e Orario</h3>
                  <p className="text-xs text-slate-400">Vengono mostrati solo i turni con postazioni disponibili</p>
                </div>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">Nessun turno disponibile nei prossimi giorni.</p>
                  <p className="text-xs text-slate-400">Contatta il tuo coach per maggiori informazioni o per prenotare manualmente.</p>
                </div>
              ) : (
                <>
                  {/* Party Size Selector */}
                  <div className="space-y-2 pb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Per quante persone prenoti?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        key="party-size-1"
                        id="party-size-1"
                        type="button"
                        onClick={() => {
                          setPartySize(1);
                          // Clear selected slot if it becomes unavailable
                          if (selectedSlot && selectedSlot.availableStations < 1) {
                            setSelectedSlot(null);
                          }
                        }}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          partySize === 1
                            ? `${theme.solid} text-white shadow-sm border-transparent`
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        1 Persona sola
                      </button>
                      <button
                        key="party-size-2"
                        id="party-size-2"
                        type="button"
                        onClick={() => {
                          setPartySize(2);
                          // Clear selected slot if it doesn't support 2 people
                          if (selectedSlot && selectedSlot.availableStations < 2) {
                            setSelectedSlot(null);
                          }
                        }}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          partySize === 2
                            ? `${theme.solid} text-white shadow-sm border-transparent`
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex -space-x-1">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <User className="w-3.5 h-3.5 shrink-0" />
                        </div>
                        2 Persone (2 postazioni)
                      </button>
                    </div>
                  </div>

                  {/* Dates Selection Scroll */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Giorni Disponibili</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueDates.map(dateStr => {
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedSlot(null); // reset selected slot on date change
                            }}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border cursor-pointer ${
                              isSelected 
                                ? `${theme.solid} text-white shadow-md border-transparent` 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {formatItalianDate(dateStr)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Times Selection List for Active Date */}
                  {selectedDate && (
                    <div className="space-y-3 pt-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Fasce Orarie Disponibili</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {slotsForSelectedDate.map(slot => {
                          const isSelected = selectedSlot?.slotId === slot.slotId;
                          const isAvailable = slot.availableStations >= partySize;
                          return (
                            <button
                              key={slot.slotId}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? `border-slate-800 bg-slate-900 text-white shadow-md` 
                                  : isAvailable
                                    ? `border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-800`
                                    : `border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed`
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                                <span className={`font-mono font-bold text-sm ${!isAvailable ? 'line-through opacity-60' : ''}`}>{slot.time}</span>
                              </div>
                              <div className="text-right">
                                {isAvailable ? (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isSelected ? 'text-slate-100 bg-slate-800 border-slate-700' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'} rounded-full px-2.5 py-0.5 border`}>
                                    Disponibile
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 border">
                                    Al completo
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Step 2: Guest Details Form (Righthand block) */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmitBooking} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">2. Inserisci i tuoi Dati</h3>
                  <p className="text-xs text-slate-400">Inserisci i dati per confermare l&apos;appuntamento</p>
                </div>
              </div>

              {/* Error messages */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl font-medium flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nome e Cognome *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Mario Rossi"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-900 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Second Guest Name */}
              {partySize === 2 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Nome Secondo Ospite *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Solo Nome (es. Giulia)"
                      value={secondGuestName}
                      onChange={(e) => setSecondGuestName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-900 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Numero di Cellulare *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="3331234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-900 transition-all text-slate-800 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Usato solo per comunicazioni relative al trattamento.</p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Note o Esigenze Particolari (Opzionale)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    placeholder="Esempio: allergie a cosmetici, prima volta..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-900 transition-all text-slate-800 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Booking Button */}
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${
                  !selectedSlot 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : `${theme.solid} hover:opacity-95 shadow-md active:scale-[0.98]`
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrazione in corso...
                  </>
                ) : (
                  <>
                    Conferma Prenotazione
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Selected slot recap */}
              {selectedSlot && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">Orario Scelto:</div>
                  <div className="font-bold text-slate-800 text-right">
                    {formatItalianDate(selectedSlot.date)} @ {selectedSlot.time}
                  </div>
                </div>
              )}
            </form>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-semibold text-slate-500">The Wellness Hub • Piattaforma Trattamenti & Priority Management</p>
          <p>© 2026 Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
