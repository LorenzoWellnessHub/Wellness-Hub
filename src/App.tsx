import React, { useState, useEffect } from 'react';
import logoUrl from './assets/images/wellness_hub_logo_1783331564869.jpg';
import { 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  SlidersHorizontal,
  Info,
  Layers,
  Heart,
  Scale,
  Pencil,
  Check,
  X,
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Settings,
  Mail,
  Phone,
  UserCheck,
  Crown,
  Bell,
  Menu,
  Link,
  FileText,
  Image,
  ExternalLink,
  Upload
} from 'lucide-react';
import { Coach, Slot, SlotSummary, Booking, ComputedBooking, TreatmentType, Member, EventItem, AppNotification, UtilityItem, OperatorEarning, MonthlyCheque, Contact } from './types';
import PublicClientBooking from './components/PublicClientBooking';
import { PersonalReport } from './components/PersonalReport';
import { AdminReport } from './components/AdminReport';
import { CompactWeeklyCalendar } from './components/CompactWeeklyCalendar';
import {
  getItalianDayName,
  formatItalianDate,
  formatItalianDateWithYear,
  formatItalianMonth,
  parseBookingSlotId,
  getWeekDates,
} from './utils/dateUtils';


export default function App() {
  // Navigation & context states
  const [selectedMonday, setSelectedMonday] = useState<string>('');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [summaries, setSummaries] = useState<SlotSummary[]>([]);
  const [corpoBookings, setCorpoBookings] = useState<ComputedBooking[]>([]);
  const [allBookings, setAllBookings] = useState<ComputedBooking[]>([]);
  const [allCustomSlots, setAllCustomSlots] = useState<Slot[]>([]);
  const [currentCoachId, setCurrentCoachId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'viso' | 'corpo' | 'resoconto'>('dashboard');
  const [selectedCorpoDate, setSelectedCorpoDate] = useState<string>('');
  const [bookingCoachId, setBookingCoachId] = useState<string | null>(null);

  // Personal Report states (Coach Dashboard)
  const [personalReportPeriod, setPersonalReportPeriod] = useState<'daily' | 'monthly'>('daily');
  const [personalReportDate, setPersonalReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [personalReportMonth, setPersonalReportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [personalReportSearch, setPersonalReportSearch] = useState<string>('');
  const [personalReportTypeFilter, setPersonalReportTypeFilter] = useState<'all' | 'viso' | 'corpo'>('all');

  // Admin Report states (Resoconto Tab)
  const [adminReportPeriod, setAdminReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [adminReportDate, setAdminReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adminReportMonday, setAdminReportMonday] = useState<string>('');
  const [adminReportMonth, setAdminReportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [adminReportSearch, setAdminReportSearch] = useState<string>('');

  // Members & Weeks persistence states
  const [members, setMembers] = useState<Member[]>([]);
  const [maxFutureWeeks, setMaxFutureWeeks] = useState<number>(2);
  const [adminMgmtTab, setAdminMgmtTab] = useState<'coaches' | 'members' | 'settings' | 'notifications'>('coaches');
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberCoachId, setNewMemberCoachId] = useState<string>('');
  const [newMemberQuota, setNewMemberQuota] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // Payments configuration & status states
  const [quotaAmount, setQuotaAmount] = useState<number>(30);
  const [iban, setIban] = useState<string>('IT12X1234512345123456789012');
  const [ibanHolder, setIbanHolder] = useState<string>('Lorenzo Wellness');
  const [paypalUrl, setPaypalUrl] = useState<string>('https://paypal.me/LorenzoWellness');
  const [satispayUrl, setSatispayUrl] = useState<string>('+39 333 1234567');

  const [newQuotaAmount, setNewQuotaAmount] = useState<string>('30');
  const [newIban, setNewIban] = useState<string>('');
  const [newIbanHolder, setNewIbanHolder] = useState<string>('');
  const [newPaypalUrl, setNewPaypalUrl] = useState<string>('');
  const [newSatispayUrl, setNewSatispayUrl] = useState<string>('');

  // Notifications states
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [newNotificationTitle, setNewNotificationTitle] = useState<string>('');
  const [newNotificationMessage, setNewNotificationMessage] = useState<string>('');
  const [newNotificationRecipientId, setNewNotificationRecipientId] = useState<string>('all');
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);
  const [justSentNotification, setJustSentNotification] = useState<AppNotification | null>(null);
  const [expandedWhatsAppNotifIds, setExpandedWhatsAppNotifIds] = useState<Record<string, boolean>>({});

  // Utilities states
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [selectedUtilityCategory, setSelectedUtilityCategory] = useState<'locandine' | 'startup' | 'listino' | 'regolamento' | null>(null);
  const [isUtilityDropdownOpen, setIsUtilityDropdownOpen] = useState<boolean>(false);
  const [isAddUtilityModalOpen, setIsAddUtilityModalOpen] = useState<boolean>(false);
  const [newUtilityTitle, setNewUtilityTitle] = useState<string>('');
  const [newUtilityType, setNewUtilityType] = useState<'link' | 'file'>('link');
  const [newUtilityUrl, setNewUtilityUrl] = useState<string>('');
  const [newUtilityFileName, setNewUtilityFileName] = useState<string>('');
  const [isSavingUtility, setIsSavingUtility] = useState<boolean>(false);

  // Operator Earnings states
  const [earnings, setEarnings] = useState<OperatorEarning[]>([]);
  const [cheques, setCheques] = useState<MonthlyCheque[]>([]);
  const [earningInputDate, setEarningInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earningInputAmount, setEarningInputAmount] = useState<string>('');
  const [earningInputType, setEarningInputType] = useState<'skin' | 'corpo'>('skin');
  const [isSavingEarning, setIsSavingEarning] = useState<boolean>(false);
  const [isEarningPanelOpen, setIsEarningPanelOpen] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAnnualBreakdownOpen, setIsAnnualBreakdownOpen] = useState<boolean>(false);
  const [editingChequeMonth, setEditingChequeMonth] = useState<string | null>(null);
  const [chequeInputAmount, setChequeInputAmount] = useState<string>('');
  const [isSavingCheque, setIsSavingCheque] = useState<boolean>(false);

  // Contacts states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isContactsDbOpen, setIsContactsDbOpen] = useState<boolean>(false);
  const [searchContactQuery, setSearchContactQuery] = useState<string>('');
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactSkinDate, setNewContactSkinDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newContactEvaluation, setNewContactEvaluation] = useState<boolean>(false);
  const [newContactActivityInfo, setNewContactActivityInfo] = useState<boolean>(false);
  const [newContactSport, setNewContactSport] = useState<boolean>(false);
  const [newContactSmartboxTagliando, setNewContactSmartboxTagliando] = useState<boolean>(false);
  const [newContactProducts, setNewContactProducts] = useState<string>('');
  const [newContactNotes, setNewContactNotes] = useState<string>('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);

  // Payment popup/checkout modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentTargetMonth, setPaymentTargetMonth] = useState<string>('');
  const [paymentTargetMember, setPaymentTargetMember] = useState<Member | null>(null);
  const [paymentInProgress, setPaymentInProgress] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'card' | 'bank_transfer' | 'paypal' | 'satispay'>('card');
  const [stripeCardNumber, setStripeCardNumber] = useState<string>('');
  const [stripeCardExpiry, setStripeCardExpiry] = useState<string>('');
  const [stripeCardCvc, setStripeCardCvc] = useState<string>('');
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>('');

  // Initial user login states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasDismissedPaymentNotice, setHasDismissedPaymentNotice] = useState<boolean>(false);
  const [alertPaymentChoice, setAlertPaymentChoice] = useState<'bonifico' | 'paypal'>('bonifico');
  const [isUtilityPaymentModalOpen, setIsUtilityPaymentModalOpen] = useState<boolean>(false);
  const [utilityPaymentChoice, setUtilityPaymentChoice] = useState<'bonifico' | 'paypal'>('bonifico');
  const [selectedCalendarOverviewDay, setSelectedCalendarOverviewDay] = useState<string>('all');
  const [loginSelectedCoach, setLoginSelectedCoach] = useState<Coach | null>(null);
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [isSettingInitialPin, setIsSettingInitialPin] = useState<boolean>(false);

  // Admin and PIN Security states
  const [slotRestrictions, setSlotRestrictions] = useState<Record<string, string[]>>({});
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [showPinVerifyModal, setShowPinVerifyModal] = useState<boolean>(false);
  const [pendingCoachId, setPendingCoachId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showSlotRestrictionModal, setShowSlotRestrictionModal] = useState<SlotSummary | null>(null);

  // Admin dropdown & quick settings states
  const [showAdminDropdown, setShowAdminDropdown] = useState<boolean>(false);
  const [selectedCoachToChangePin, setSelectedCoachToChangePin] = useState<string>('');
  const [newPinForSelectedCoach, setNewPinForSelectedCoach] = useState<string>('');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState<string>('');

  // Editing Coach State
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editingCoachName, setEditingCoachName] = useState<string>('');
  const [editingCoachColor, setEditingCoachColor] = useState<string>('emerald');
  const [editingCoachPin, setEditingCoachPin] = useState<string>('');
  const [editingCoachIsAdmin, setEditingCoachIsAdmin] = useState<boolean>(false);
  
  // Filters
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | TreatmentType>('all');
  const [coachFilter, setCoachFilter] = useState<'all' | string>('all');
  const [resocontoSubTab, setResocontoSubTab] = useState<'club' | 'coaches'>('club');
  const [selectedResocontoCoachId, setSelectedResocontoCoachId] = useState<string>('all');
  
  // Modals / Dialogs toggles
  const [activeBookingSlot, setActiveBookingSlot] = useState<SlotSummary | null>(null);
  const [showCoachMgmt, setShowCoachMgmt] = useState(false);
  const [showCustomSlotModal, setShowCustomSlotModal] = useState(false);
  const [showRulesExplanation, setShowRulesExplanation] = useState(false);
  const [showCorpoBookingModal, setShowCorpoBookingModal] = useState(false);
  const [selectedCoachForDetails, setSelectedCoachForDetails] = useState<Coach | null>(null);
  const [isEditingCoach, setIsEditingCoach] = useState<boolean>(false);
  const [editCoachName, setEditCoachName] = useState<string>('');
  const [editCoachPhone, setEditCoachPhone] = useState<string>('');
  const [editCoachEmail, setEditCoachEmail] = useState<string>('');
  const [editCoachSponsorName, setEditCoachSponsorName] = useState<string>('');
  const [editCoachPin, setEditCoachPin] = useState<string>('');
  const [editCoachStatus, setEditCoachStatus] = useState<string>('');

  // Regolamento and Events States
  const [regolamento, setRegolamento] = useState<string>('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showRegolamentoAccordion, setShowRegolamentoAccordion] = useState<boolean>(false);
  const [showEventsAccordion, setShowEventsAccordion] = useState<boolean>(false);
  const [isEditingRegolamento, setIsEditingRegolamento] = useState<boolean>(false);
  const [editRegolamentoValue, setEditRegolamentoValue] = useState<string>('');
  const [rulesAcceptedCheckbox, setRulesAcceptedCheckbox] = useState<boolean>(false);

  // Event creation/editing Form States
  const [showEventFormModal, setShowEventFormModal] = useState<boolean>(false);
  const [eventFormTitle, setEventFormTitle] = useState<string>('');
  const [eventFormDate, setEventFormDate] = useState<string>('');
  const [eventFormTime, setEventFormTime] = useState<string>('20:00');
  const [eventFormEndTime, setEventFormEndTime] = useState<string>('');
  const [eventFormLocation, setEventFormLocation] = useState<string>('');
  const [eventFormDescription, setEventFormDescription] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const handleCloseDetails = () => {
    setSelectedCoachForDetails(null);
    setIsEditingCoach(false);
  };

  // Coach self-registration states
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [showCoachRegisterModal, setShowCoachRegisterModal] = useState<boolean>(false);
  const [showPendingRegistrationsModal, setShowPendingRegistrationsModal] = useState<boolean>(false);
  
  // Registration Form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSponsor, setRegSponsor] = useState('');

  // Form states
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestNotes, setNewGuestNotes] = useState('');
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachColor, setNewCoachColor] = useState('emerald');
  const [customSlotDate, setCustomSlotDate] = useState('');
  const [customSlotTime, setCustomSlotTime] = useState('15:00');
  const [customSlotType, setCustomSlotType] = useState<TreatmentType>('viso');
  
  // Inline edit states
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState<string>('');
  
  const [corpoTime, setCorpoTime] = useState('09:00');
  const [corpoGuestName, setCorpoGuestName] = useState('');
  const [corpoNotes, setCorpoNotes] = useState('');

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const getFriendlyError = (err: any, defaultMsg: string): string => {
    return err?.message || defaultMsg;
  };

  // Set initial Monday to the current week's Monday
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
    const monday = new Date(today.setDate(diff));
    const mondayStr = monday.toISOString().split('T')[0];
    setSelectedMonday(mondayStr);
    setAdminReportMonday(mondayStr);
  }, []);

  // Set dynamic favicon matching the site logo
  useEffect(() => {
    const link = (document.querySelector("link[rel~='icon']") || document.createElement('link')) as HTMLLinkElement;
    link.type = 'image/jpeg';
    link.rel = 'icon';
    link.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);



  // Fetch coaches and slot summaries
  const fetchData = async () => {
    if (!selectedMonday) return;
    setIsLoading(true);
    try {
      // Fetch schedule summary
      const response = await fetch(`/api/schedule/summary?monday=${selectedMonday}`);
      if (!response.ok) {
        throw new Error('Errore durante il recupero dei dati.');
      }
      const data = await response.json();
      setSummaries(data.summaries || []);
      setCorpoBookings(data.corpoBookings || []);
      setAllBookings(data.allBookings || []);
      setAllCustomSlots(data.allCustomSlots || []);
      setCoaches(data.coaches || []);
      setSlotRestrictions(data.slotRestrictions || {});
      setMembers(data.members || []);
      setMaxFutureWeeks(data.maxFutureWeeks !== undefined ? data.maxFutureWeeks : 2);
      
      // Fetch admin password config
      const adminConfResponse = await fetch('/api/admin/config');
      if (adminConfResponse.ok) {
        const adminData = await adminConfResponse.json();
        setAdminPassword(adminData.adminPassword || 'admin123');
        if (adminData.maxFutureWeeks !== undefined) {
          setMaxFutureWeeks(adminData.maxFutureWeeks);
        }
        if (adminData.regolamento !== undefined) {
          setRegolamento(adminData.regolamento);
          setEditRegolamentoValue(adminData.regolamento);
        }
        if (adminData.events !== undefined) {
          setEvents(adminData.events);
        }
        if (adminData.quotaAmount !== undefined) {
          setQuotaAmount(adminData.quotaAmount);
          setNewQuotaAmount(String(adminData.quotaAmount));
        }
        if (adminData.iban !== undefined) {
          setIban(adminData.iban);
          setNewIban(adminData.iban);
        }
        if (adminData.ibanHolder !== undefined) {
          setIbanHolder(adminData.ibanHolder);
          setNewIbanHolder(adminData.ibanHolder);
        }
        if (adminData.paypalUrl !== undefined) {
          setPaypalUrl(adminData.paypalUrl);
          setNewPaypalUrl(adminData.paypalUrl);
        }
        if (adminData.satispayUrl !== undefined) {
          setSatispayUrl(adminData.satispayUrl);
          setNewSatispayUrl(adminData.satispayUrl);
        }
      }

      // Fetch pending coach registrations
      const regResponse = await fetch('/api/coach-registrations');
      if (regResponse.ok) {
        const regData = await regResponse.json();
        setPendingRegistrations(regData || []);
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/notifications');
      if (notificationsResponse.ok) {
        const notifData = await notificationsResponse.json();
        setNotifications(notifData || []);
      }

      // Fetch utilities
      const utilitiesResponse = await fetch('/api/utilities');
      if (utilitiesResponse.ok) {
        const utilData = await utilitiesResponse.json();
        setUtilities(utilData || []);
      }

      // Fetch operator earnings
      const earningsResponse = await fetch('/api/earnings');
      if (earningsResponse.ok) {
        const earnData = await earningsResponse.json();
        setEarnings(earnData || []);
      }

      // Fetch monthly cheques
      const chequesResponse = await fetch('/api/cheques');
      if (chequesResponse.ok) {
        const chequeData = await chequesResponse.json();
        setCheques(chequeData || []);
      }

      // Restores the logged in coach from localStorage if found
      const savedCoachId = localStorage.getItem('wellness_hub_logged_coach_id');
      if (savedCoachId && data.coaches && data.coaches.some((c: Coach) => c.id === savedCoachId)) {
        setCurrentCoachId(savedCoachId);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyError(err, 'Impossibile connettersi al server. Se stai usando Safari o l\'anteprima in iframe, apri l\'app in una nuova scheda.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonday]);

  useEffect(() => {
    // Check query params for Stripe checkout results
    const urlParams = new URLSearchParams(window.location.search);
    const bCoachId = urlParams.get('bookingCoachId');
    if (bCoachId) {
      setBookingCoachId(bCoachId);
    }
    const status = urlParams.get('payment_status');
    const sessionId = urlParams.get('payment_session_id');
    const memberId = urlParams.get('payment_member_id');
    const monthKey = urlParams.get('payment_month_key');

    if (status === 'success' && sessionId && memberId && monthKey) {
      const verifyStripePayment = async () => {
        try {
          const res = await fetch('/api/payments/verify-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, memberId, monthKey })
          });
          if (res.ok) {
            setPaymentSuccessMessage(`Pagamento con carta completato con successo! Quota di ${monthKey} registrata.`);
            fetchData(); // reload data to show unblocked status
            setTimeout(() => setPaymentSuccessMessage(''), 8000);
          } else {
            const err = await res.json();
            setErrorMessage('Verifica pagamento fallita: ' + (err.error || 'Errore sconosciuto'));
          }
        } catch (e: any) {
          setErrorMessage('Errore durante la verifica della transazione: ' + e.message);
        }
      };
      verifyStripePayment();
      
      // Clean query parameters from URL to avoid duplicate triggers
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (status === 'cancelled') {
      setErrorMessage('Pagamento annullato dal socio.');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    if (selectedMonday) {
      setSelectedCorpoDate(selectedMonday);
    }
  }, [selectedMonday]);

  useEffect(() => {
    if (!isAdminMode && activeTab === 'resoconto') {
      setActiveTab('dashboard');
    }
  }, [isAdminMode, activeTab]);

  useEffect(() => {
    if (isLoggedIn && currentCoachId) {
      fetchContacts(currentCoachId);
    } else {
      setContacts([]);
    }
  }, [isLoggedIn, currentCoachId]);

  const getCurrentWeekMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
    const mon = new Date(today.setDate(diff));
    return mon.toISOString().split('T')[0];
  };

  const isNextWeekDisabled = () => {
    if (isAdminMode) return false;
    if (maxFutureWeeks === -1) return false;
    if (!selectedMonday) return false;
    const currentMon = getCurrentWeekMonday();
    const currentMonDate = new Date(currentMon);
    const selectedMonDate = new Date(selectedMonday);
    const weeksAhead = Math.round((selectedMonDate.getTime() - currentMonDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeksAhead >= maxFutureWeeks;
  };

  // Navigate weeks
  const handlePrevWeek = () => {
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() - 7);
    setSelectedMonday(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const currentMon = getCurrentWeekMonday();
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() + 7);
    const nextMonStr = d.toISOString().split('T')[0];

    if (!isAdminMode && maxFutureWeeks !== -1) {
      const currentMonDate = new Date(currentMon);
      const targetMonDate = new Date(nextMonStr);
      const weeksAhead = Math.round((targetMonDate.getTime() - currentMonDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAhead > maxFutureWeeks) {
        setErrorMessage(`Impossibile andare oltre: l'amministratore ha bloccato le prenotazioni a un massimo di ${maxFutureWeeks} settiman${maxFutureWeeks === 1 ? 'a' : 'e'} successive.`);
        return;
      }
    }
    setSelectedMonday(nextMonStr);
  };

  const handleResetToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setSelectedMonday(monday.toISOString().split('T')[0]);
  };

  // Add a new guest booking
  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingSlot || !currentCoachId || !newGuestName.trim()) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: activeBookingSlot.slotId,
          coachId: currentCoachId,
          guestName: newGuestName.trim(),
          notes: newGuestNotes.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la prenotazione.');
      }

      await fetchData();
      
      const coachName = coaches.find(c => c.id === currentCoachId)?.name || 'Coach';
      setSuccessMessage(`Ospite "${newGuestName}" inserito con successo per il coach ${coachName}!`);
      
      // Reset form & modal
      setNewGuestName('');
      setNewGuestNotes('');
      setActiveBookingSlot(null);
      
      // Auto-clear success message after 4s
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile completare la prenotazione.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add a new corpo (body evaluation) booking
  const handleAddCorpoBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCorpoDate || !corpoTime || !currentCoachId || !corpoGuestName.trim()) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: `corpo_${selectedCorpoDate}_${corpoTime}`,
          coachId: currentCoachId,
          guestName: corpoGuestName.trim(),
          notes: corpoNotes.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la prenotazione della valutazione.');
      }

      await fetchData();
      
      const coachName = coaches.find(c => c.id === currentCoachId)?.name || 'Coach';
      setSuccessMessage(`Valutazione per "${corpoGuestName}" inserita alle ${corpoTime} con il coach ${coachName}!`);
      
      // Reset form & close modal
      setCorpoGuestName('');
      setCorpoNotes('');
      setShowCorpoBookingModal(false);
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile completare la prenotazione.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a booking
  const handleDeleteBooking = async (bookingId: string, guestName: string, ownerCoachId?: string) => {
    if (!window.confirm(`Sei sicuro di voler annullare la prenotazione per "${guestName}"?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    try {
      const queryCoachId = (isAdminMode && ownerCoachId) ? ownerCoachId : currentCoachId;
      const response = await fetch(`/api/bookings/${bookingId}?coachId=${queryCoachId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la cancellazione.');
      }

      await fetchData();
      setSuccessMessage(`Prenotazione per "${guestName}" annullata.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile eliminare la prenotazione.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save edited guest name
  const handleSaveBookingName = async (bookingId: string, ownerCoachId?: string) => {
    if (!editingGuestName.trim()) return;

     // Pre-check payment status
     const coachIdToCheck = ownerCoachId || currentCoachId;
     const checkResult = checkCoachPaymentStatus(coachIdToCheck);
     if (checkResult && checkResult.status === 'blocked') {
       setErrorMessage(`Socio non in regola con il pagamento: "${checkResult.member.name}" (associato al coach) non ha versato la quota di ${checkResult.monthLabel}.`);
       return;
     }

    setActionLoading(true);
    setErrorMessage('');
    try {
      const requesterCoachId = (isAdminMode && ownerCoachId) ? ownerCoachId : currentCoachId;
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: editingGuestName.trim(),
          requesterCoachId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la modifica.');
      }

      await fetchData();
      setSuccessMessage('Nome ospite modificato con successo!');
      setEditingBookingId(null);
      setEditingGuestName('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile modificare il nome dell\'ospite.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add a custom flexible weekly slot
  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlotDate || !customSlotTime) return;

    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentType: customSlotType,
          date: customSlotDate,
          time: customSlotTime
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la creazione del turno flessibile.');
      }

      await fetchData();
      setSuccessMessage('Nuovo turno flessibile settimanale aggiunto con successo!');
      setShowCustomSlotModal(false);
      
      // Reset custom slot fields
      setCustomSlotDate('');
      setCustomSlotTime('15:00');
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile aggiungere il turno.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a custom slot (and bookings)
  const handleDeleteCustomSlot = async (slotId: string, info: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il turno flessibile delle ${info}? Saranno eliminate anche tutte le prenotazioni ad esso collegate.`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Errore durante la rimozione del turno.');
      }

      await fetchData();
      setSuccessMessage('Turno flessibile rimosso.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile eliminare il turno.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSelectedCoach) return;

    if (isSettingInitialPin) {
      if (loginPinInput.length !== 4) {
        setErrorMessage('Il PIN deve essere composto esattamente da 4 cifre.');
        return;
      }
      setActionLoading(true);
      setErrorMessage('');
      try {
        const response = await fetch(`/api/coaches/${loginSelectedCoach.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin: loginPinInput
          })
        });

        if (!response.ok) {
          throw new Error('Errore durante l\'impostazione del PIN.');
        }

        await fetchData();
        localStorage.setItem('wellness_hub_logged_coach_id', loginSelectedCoach.id);
        setCurrentCoachId(loginSelectedCoach.id);
        setIsLoggedIn(true);
        setLoginSelectedCoach(null);
        setLoginPinInput('');
        setIsSettingInitialPin(false);
        setSuccessMessage(`Benvenuto ${loginSelectedCoach.name}! Il tuo PIN di sicurezza è stato impostato con successo.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Impossibile salvare il PIN.');
      } finally {
        setActionLoading(false);
      }
    } else {
      if (loginSelectedCoach.pin === loginPinInput) {
        localStorage.setItem('wellness_hub_logged_coach_id', loginSelectedCoach.id);
        setCurrentCoachId(loginSelectedCoach.id);
        setIsLoggedIn(true);
        setLoginSelectedCoach(null);
        setLoginPinInput('');
        setSuccessMessage(`Accesso effettuato! Benvenuto ${loginSelectedCoach.name}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('PIN non valido. Riprova.');
      }
    }
  };

  // Switch coach after PIN verification
  const handleCoachSelect = (c: Coach) => {
    if (c.id === currentCoachId) return;
    
    // Bypass PIN check if we are in admin mode OR if the target coach has no pin configured
    if (isAdminMode || !c.pin) {
      setCurrentCoachId(c.id);
      return;
    }

    // Require PIN verify
    setPendingCoachId(c.id);
    setPinInput('');
    setShowPinVerifyModal(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoachId) return;

    const targetCoach = coaches.find(c => c.id === pendingCoachId);
    if (targetCoach && targetCoach.pin === pinInput) {
      setCurrentCoachId(pendingCoachId);
      setShowPinVerifyModal(false);
      setPendingCoachId(null);
      setPinInput('');
      setSuccessMessage(`Operazione come ${targetCoach.name} autorizzata!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('PIN non valido. Riprova.');
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === adminPassword) {
      setIsAdminMode(true);
      setShowAdminLoginModal(false);
      setAdminPasswordInput('');
      setSuccessMessage('Sei entrato in Modalità Amministratore! Ora puoi gestire le utenze e i turni.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage('Password Amministratore errata.');
    }
  };

  const handleCoachRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/coach-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail,
          sponsorName: regSponsor
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante la registrazione.');
      }
      setSuccessMessage('Richiesta inviata con successo! Un amministratore la valuterà a breve.');
      setTimeout(() => setSuccessMessage(''), 6000);
      
      // Reset form & close
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegSponsor('');
      setShowCoachRegisterModal(false);
      
      // Fetch latest registrations
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile inviare la richiesta.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRegistration = async (id: string, color: string, pin: string) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/coach-registrations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color, pin })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Impossibile approvare la richiesta.');
      }
      setSuccessMessage('Coach approvato e aggiunto con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante l\'approvazione.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditingCoach = (coach: Coach) => {
    setEditCoachName(coach.name || '');
    setEditCoachPhone(coach.phone || '');
    setEditCoachEmail(coach.email || '');
    setEditCoachSponsorName(coach.sponsorName || '');
    setEditCoachPin(coach.pin || '');
    setEditCoachStatus(coach.status || 'Distributore');
    setIsEditingCoach(true);
  };

  const handleUpdateCoach = async (coachId: string) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/coaches/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCoachName.trim(),
          phone: editCoachPhone.trim(),
          email: editCoachEmail.trim(),
          sponsorName: editCoachSponsorName.trim(),
          pin: editCoachPin.trim(),
          status: editCoachStatus
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Impossibile aggiornare i dati del coach.');
      }
      
      const updatedCoach = await response.json();
      setSelectedCoachForDetails(updatedCoach);
      setIsEditingCoach(false);
      
      setSuccessMessage('Anagrafica del coach aggiornata con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
      
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante l\'aggiornamento.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler rifiutare questa richiesta di registrazione?')) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/coach-registrations/${id}/reject`, {
        method: 'POST'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Impossibile rifiutare la richiesta.');
      }
      setSuccessMessage('Richiesta di registrazione rifiutata.');
      setTimeout(() => setSuccessMessage(''), 4000);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il rifiuto.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRegolamento = async (text: string) => {
    if (!isAdminMode) {
      setErrorMessage("Solo l'amministratore può modificare il regolamento.");
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regolamento: text })
      });
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio del regolamento.");
      }
      setRegolamento(text);
      setIsEditingRegolamento(false);
      setSuccessMessage('Regolamento salvato con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Impossibile salvare il regolamento.");
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRegolamento = async (coachId: string) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/coaches/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedRules: true })
      });
      if (!response.ok) {
        throw new Error("Errore durante l'accettazione del regolamento.");
      }
      
      // Update local coaches state
      setCoaches(prev => prev.map(c => c.id === coachId ? { ...c, acceptedRules: true } : c));
      setSuccessMessage('Regolamento accettato con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
      setRulesAcceptedCheckbox(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Impossibile accettare il regolamento.");
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminMode) {
      setErrorMessage("Solo l'amministratore può modificare gli eventi.");
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!eventFormTitle.trim() || !eventFormDate) return;
    
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const newEvent: EventItem = {
      id: editingEventId || 'event_' + Date.now(),
      title: eventFormTitle.trim(),
      date: eventFormDate,
      time: eventFormTime,
      endTime: eventFormEndTime || undefined,
      location: eventFormLocation.trim(),
      description: eventFormDescription.trim()
    };
    
    let updatedEvents = [...events];
    if (editingEventId) {
      updatedEvents = updatedEvents.map(ev => ev.id === editingEventId ? newEvent : ev);
    } else {
      updatedEvents.push(newEvent);
    }
    
    // Sort events by date & time
    updatedEvents.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time || '00:00'}`;
      const dateTimeB = `${b.date}T${b.time || '00:00'}`;
      return dateTimeA.localeCompare(dateTimeB);
    });
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents })
      });
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio dell'evento.");
      }
      setEvents(updatedEvents);
      setShowEventFormModal(false);
      setEventFormTitle('');
      setEventFormDate('');
      setEventFormTime('20:00');
      setEventFormEndTime('');
      setEventFormLocation('');
      setEventFormDescription('');
      setEditingEventId(null);
      setSuccessMessage('Evento salvato con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Impossibile salvare l'evento.");
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isAdminMode) {
      setErrorMessage("Solo l'amministratore può eliminare gli eventi.");
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!window.confirm('Sei sicuro di voler eliminare questo evento?')) return;
    
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const updatedEvents = events.filter(ev => ev.id !== eventId);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedEvents })
      });
      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione dell'evento.");
      }
      setEvents(updatedEvents);
      setSuccessMessage('Evento eliminato con successo!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Impossibile eliminare l'evento.");
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoachId || !editingCoachName.trim()) return;

    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/coaches/${editingCoachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCoachName.trim(),
          color: editingCoachColor,
          pin: editingCoachPin.trim(),
          isAdmin: editingCoachIsAdmin
        })
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio delle modifiche.');
      }

      await fetchData();
      setEditingCoachId(null);
      setSuccessMessage('Modifiche dell\'utenza salvate con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile aggiornare il coach.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSlotRestrictions = async (slotId: string, allowedCoachIds: string[]) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/slots/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, allowedCoachIds })
      });
      if (!response.ok) {
        throw new Error('Errore nel salvataggio delle restrizioni.');
      }
      const data = await response.json();
      setSlotRestrictions(data.slotRestrictions || {});
      setShowSlotRestrictionModal(null);
      setSuccessMessage('Restrizioni di visibilità salvate per questo turno!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile salvare le restrizioni.');
    } finally {
      setActionLoading(false);
    }
  };

  // Operator Earnings Handlers
  const handleSaveEarning = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentCoachId) {
      alert('Seleziona prima il tuo profilo operatore per inserire un guadagno.');
      return;
    }
    const numAmount = parseFloat(earningInputAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Inserisci un importo valido (maggiore o uguale a 0).');
      return;
    }

    setIsSavingEarning(true);
    try {
      const response = await fetch('/api/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: currentCoachId,
          date: earningInputDate,
          amount: numAmount,
          type: earningInputType
        })
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio del guadagno.');
      }

      const result = await response.json();
      if (result.success && result.earnings) {
        setEarnings(result.earnings);
        setEarningInputAmount('');
        setSuccessMessage('Guadagno salvato con successo!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Errore di connessione durante il salvataggio.');
    } finally {
      setIsSavingEarning(false);
    }
  };

  const handleDeleteEarning = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo record di guadagno?')) {
      return;
    }

    try {
      const response = await fetch(`/api/earnings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del guadagno.');
      }

      const result = await response.json();
      if (result.success && result.earnings) {
        setEarnings(result.earnings);
        setSuccessMessage('Guadagno eliminato con successo!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Errore di connessione durante l\'eliminazione.');
    }
  };

  const handleSaveCheque = async (yearMonth: string, amount: number) => {
    if (!currentCoachId) {
      alert('Seleziona prima il tuo profilo operatore per inserire un assegno.');
      return;
    }
    setIsSavingCheque(true);
    try {
      const response = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: currentCoachId,
          yearMonth,
          amount
        })
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio dell\'assegno.');
      }

      const result = await response.json();
      if (result.success && result.cheques) {
        setCheques(result.cheques);
        setEditingChequeMonth(null);
        setChequeInputAmount('');
        setSuccessMessage('Importo assegno aggiornato con successo!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Errore di connessione durante il salvataggio dell\'assegno.');
    } finally {
      setIsSavingCheque(false);
    }
  };

  const fetchContacts = async (coachId?: string) => {
    const targetCoachId = coachId || currentCoachId;
    if (!targetCoachId) {
      setContacts([]);
      return;
    }
    try {
      const response = await fetch(`/api/contacts?coachId=${targetCoachId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data || []);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei contatti', err);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoachId) {
      alert('Effettua prima l\'accesso come operatore.');
      return;
    }
    if (!newContactName.trim()) {
      alert('Il nome del contatto è obbligatorio.');
      return;
    }

    setIsSavingContact(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContactId || undefined,
          coachId: currentCoachId,
          contactName: newContactName.trim(),
          phone: newContactPhone.trim(),
          skinDate: newContactSkinDate,
          evaluation: !!newContactEvaluation,
          activityInfo: !!newContactActivityInfo,
          sport: !!newContactSport,
          smartboxTagliando: !!newContactSmartboxTagliando,
          productsPurchased: newContactProducts.trim(),
          notes: newContactNotes.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio del contatto.');
      }

      const result = await response.json();
      if (result.success) {
        // reload
        await fetchContacts(currentCoachId);
        
        // Reset states
        setNewContactName('');
        setNewContactPhone('');
        setNewContactSkinDate(new Date().toISOString().split('T')[0]);
        setNewContactEvaluation(false);
        setNewContactActivityInfo(false);
        setNewContactSport(false);
        setNewContactSmartboxTagliando(false);
        setNewContactProducts('');
        setNewContactNotes('');
        setEditingContactId(null);
        
        setSuccessMessage(editingContactId ? 'Contatto aggiornato con successo!' : 'Contatto aggiunto con successo!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Errore durante il salvataggio.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchContacts(currentCoachId || undefined);
        setSuccessMessage('Contatto eliminato con successo!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Errore durante l\'eliminazione.');
      }
    } catch (err: any) {
      alert(err.message || 'Impossibile eliminare il contatto.');
    }
  };

  const handleEditContactClick = (contact: Contact) => {
    setEditingContactId(contact.id);
    setNewContactName(contact.contactName);
    setNewContactPhone(contact.phone || '');
    setNewContactSkinDate(contact.skinDate);
    setNewContactEvaluation(contact.evaluation);
    setNewContactActivityInfo(contact.activityInfo);
    setNewContactSport(contact.sport);
    setNewContactSmartboxTagliando(!!contact.smartboxTagliando);
    setNewContactProducts(contact.productsPurchased);
    setNewContactNotes(contact.notes);
  };

  const handleCancelContactEdit = () => {
    setEditingContactId(null);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactSkinDate(new Date().toISOString().split('T')[0]);
    setNewContactEvaluation(false);
    setNewContactActivityInfo(false);
    setNewContactSport(false);
    setNewContactSmartboxTagliando(false);
    setNewContactProducts('');
    setNewContactNotes('');
  };

  // Member & Payment Management Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newMemberName.trim(),
          coachId: newMemberCoachId || undefined,
          quotaAmount: newMemberQuota ? Number(newMemberQuota) : undefined
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Errore durante l\'aggiunta del socio.');
      }
      const created = await response.json();
      setMembers(prev => [...prev, created]);
      setNewMemberName('');
      setNewMemberCoachId('');
      setNewMemberQuota('');
      setSuccessMessage(`Socio "${created.name}" aggiunto correttamente.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(getFriendlyError(err, 'Errore durante l\'aggiunta del socio. Se stai usando Safari o l\'anteprima in iframe, aprilo in una nuova scheda.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMemberCoach = async (member: Member, coachId: string) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: coachId || null
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Errore durante l\'aggiornamento del coach.');
      }
      const updatedMember = await response.json();
      setMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
      setSuccessMessage(`Coach associato aggiornato per ${member.name}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante l\'aggiornamento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMemberQuota = async (member: Member, amount: number | undefined) => {
    // Optimistic update
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        return {
          ...m,
          quotaAmount: amount
        };
      }
      return m;
    }));

    setErrorMessage('');
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotaAmount: amount !== undefined ? amount : null
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Errore durante l\'aggiornamento della quota.');
      }
      const updatedMember = await response.json();
      setMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
      setSuccessMessage(`Quota mensile aggiornata per ${member.name}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      // Revert optimistic update
      setMembers(prev => prev.map(m => {
        if (m.id === member.id) {
          return {
            ...m,
            quotaAmount: member.quotaAmount
          };
        }
        return m;
      }));
      setErrorMessage(err.message || 'Errore durante l\'aggiornamento.');
    }
  };

  const handleInitiatePayment = (member: Member, monthKey: string) => {
    setPaymentTargetMember(member);
    setPaymentTargetMonth(monthKey);
    setPaymentMode('bank');
    setStripeCardNumber('');
    setStripeCardExpiry('');
    setStripeCardCvc('');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!paymentTargetMember || !paymentTargetMonth) return;

    setPaymentInProgress(true);
    setErrorMessage('');
    try {
      if (paymentMode === 'card') {
        const response = await fetch('/api/payments/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: paymentTargetMember.id,
            monthKey: paymentTargetMonth,
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Errore durante l\'avvio del pagamento.');
        }

        const data = await response.json();
        if (!data.isSimulated && data.url) {
          // Real Stripe checkout redirect
          window.location.href = data.url;
          return;
        }

        // Simulated card checkout delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Call confirm payment API
      const confirmResponse = await fetch('/api/payments/confirm-simulated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: paymentTargetMember.id,
          monthKey: paymentTargetMonth,
          paymentMethod: paymentMode
        })
      });

      if (!confirmResponse.ok) {
        const errData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Errore durante la conferma del pagamento.');
      }

      const confirmData = await confirmResponse.json();
      
      // Update members state
      setMembers(prev => prev.map(m => m.id === paymentTargetMember.id ? confirmData.member : m));
      
      const memberQuota = paymentTargetMember.quotaAmount !== undefined ? paymentTargetMember.quotaAmount : quotaAmount;
      setPaymentSuccessMessage(`Pagamento di €${memberQuota} per ${paymentTargetMonth} registrato correttamente!`);
      setTimeout(() => setPaymentSuccessMessage(''), 5000);
      setIsPaymentModalOpen(false);
      fetchData(); // Reload schedule state
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il pagamento.');
    } finally {
      setPaymentInProgress(false);
    }
  };

  const handleTogglePayment = async (member: Member, ymKey: string, currentVal: boolean) => {
    const newVal = !currentVal;
    
    // Optimistic update
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        return {
          ...m,
          payments: {
            ...(m.payments || {}),
            [ymKey]: newVal
          }
        };
      }
      return m;
    }));

    setErrorMessage('');
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: {
            [ymKey]: newVal
          }
        })
      });
      if (!response.ok) {
        let errMsg = 'Errore durante il salvataggio dello stato di pagamento.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const updatedMember = await response.json();
      setMembers(prev => prev.map(m => m.id === member.id ? updatedMember : m));
    } catch (err: any) {
      // Revert optimistic update
      setMembers(prev => prev.map(m => {
        if (m.id === member.id) {
          return {
            ...m,
            payments: {
              ...(m.payments || {}),
              [ymKey]: currentVal
            }
          };
        }
        return m;
      }));
      setErrorMessage(err.message || 'Errore durante l\'aggiornamento.');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere il socio "${name}"?`)) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        let errMsg = 'Errore durante la rimozione del socio.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      setMembers(prev => prev.filter(m => m.id !== id));
      setSuccessMessage(`Socio "${name}" rimosso correttamente.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: newAdminPasswordInput.trim() || undefined,
          maxFutureWeeks: maxFutureWeeks,
          quotaAmount: Number(newQuotaAmount),
          iban: newIban.trim(),
          ibanHolder: newIbanHolder.trim(),
          paypalUrl: newPaypalUrl.trim(),
          satispayUrl: newSatispayUrl.trim()
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Errore durante il salvataggio.');
      }
      const data = await response.json();
      if (data.adminPassword) {
        setAdminPassword(data.adminPassword);
        setNewAdminPasswordInput('');
      }
      if (data.quotaAmount !== undefined) {
        setQuotaAmount(data.quotaAmount);
      }
      if (data.iban !== undefined) {
        setIban(data.iban);
      }
      if (data.ibanHolder !== undefined) {
        setIbanHolder(data.ibanHolder);
      }
      if (data.paypalUrl !== undefined) {
        setPaypalUrl(data.paypalUrl);
      }
      if (data.satispayUrl !== undefined) {
        setSatispayUrl(data.satispayUrl);
      }
      setSuccessMessage('Impostazioni, quote e sblocco settimane salvate correttamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add a new coach
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim()) return;

    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCoachName.trim(),
          color: newCoachColor
        })
      });

      if (!response.ok) {
        let errMsg = 'Errore durante la creazione del coach.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const added = await response.json();
      await fetchData();
      setNewCoachName('');
      setSuccessMessage(`Coach "${added.name}" aggiunto con successo!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(getFriendlyError(err, 'Impossibile aggiungere il coach. Se stai usando Safari o l\'anteprima in iframe, aprilo in una nuova scheda.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a coach
  const handleDeleteCoach = async (coachId: string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere il coach "${name}"? Verranno eliminate anche tutte le sue prenotazioni attive.`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/coaches/${coachId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let errMsg = 'Errore durante la rimozione del coach.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (currentCoachId === coachId) {
        setCurrentCoachId('');
      }

      await fetchData();
      setSuccessMessage(`Coach "${name}" rimosso dal sistema.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile rimuovere il coach.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format WhatsApp links correctly
  const getWhatsAppLink = (phone: string, title: string, message: string) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      cleaned = '39' + cleaned;
    }
    const fullText = `📢 *${title}*\n\n${message}`;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(fullText)}`;
  };

  const getWhatsAppGroupLink = (title: string, message: string) => {
    const fullText = `📢 *${title}*\n\n${message}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
  };

  // Send a new notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotificationTitle.trim() || !newNotificationMessage.trim()) {
      alert('Titolo e messaggio sono obbligatori.');
      return;
    }

    setIsSendingNotification(true);
    setErrorMessage('');
    try {
      const sender = isAdminMode 
        ? { id: 'admin', name: 'Amministratore' } 
        : (coaches.find(c => c.id === currentCoachId) || { id: currentCoachId || 'coach', name: 'Coach' });

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNotificationTitle.trim(),
          message: newNotificationMessage.trim(),
          senderName: sender.name,
          senderId: sender.id,
          recipientId: newNotificationRecipientId
        })
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'invio della notifica.');
      }

      const createdNotif = await response.json();
      await fetchData();
      setNewNotificationTitle('');
      setNewNotificationMessage('');
      setNewNotificationRecipientId('all');
      setSuccessMessage('Notifica inviata con successo!');
      // Store the recently created notification to prompt for WhatsApp forwarding
      setJustSentNotification(createdNotif);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile inviare la notifica.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Utilities Handlers
  const handleUtilityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert('Attenzione: Il caricamento diretto è limitato a file minori di 800KB per ottimizzare lo spazio cloud. Per documenti pesanti o PDF completi, ti consigliamo vivamente di caricarli su Google Drive o Dropbox e incollare il Link qui!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewUtilityUrl(reader.result);
        setNewUtilityFileName(file.name);
      }
    };
    reader.onerror = () => {
      alert('Errore durante la lettura del file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminMode) {
      alert("Solo l'amministratore può inserire o modificare elementi.");
      return;
    }
    if (!newUtilityTitle.trim()) {
      alert('Il titolo è obbligatorio.');
      return;
    }
    if (!selectedUtilityCategory) {
      alert('La categoria è obbligatoria.');
      return;
    }

    let finalUrl = newUtilityUrl.trim();

    if (newUtilityType === 'file') {
      if (!finalUrl) {
        alert('Carica prima un file o una foto.');
        return;
      }
    } else {
      if (!finalUrl) {
        alert('Inserisci un link URL valido.');
        return;
      }
    }

    setIsSavingUtility(true);
    try {
      const response = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedUtilityCategory,
          title: newUtilityTitle.trim(),
          type: newUtilityType,
          url: finalUrl,
          fileName: newUtilityType === 'file' ? newUtilityFileName : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Impossibile salvare l\'elemento.');
      }

      await fetchData();
      setNewUtilityTitle('');
      setNewUtilityType('link');
      setNewUtilityUrl('');
      setNewUtilityFileName('');
      setIsAddUtilityModalOpen(false);
      setSuccessMessage('Utility aggiunta con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il salvataggio.');
    } finally {
      setIsSavingUtility(false);
    }
  };

  const handleDeleteUtility = async (id: string) => {
    if (!isAdminMode) {
      alert("Solo l'amministratore può eliminare elementi.");
      return;
    }
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;
    try {
      const response = await fetch(`/api/utilities/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione.');
      }
      await fetchData();
      setSuccessMessage('Elemento rimosso con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante l\'eliminazione.');
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentCoachId) return;
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: currentCoachId })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => {
          if (n.id === notificationId) {
            const readBy = n.readBy || [];
            if (!readBy.includes(currentCoachId)) {
              return { ...n, readBy: [...readBy, currentCoachId] };
            }
          }
          return n;
        }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (notificationId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa notifica?')) return;
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della notifica.');
      }
      await fetchData();
      setSuccessMessage('Notifica eliminata con successo.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossibile eliminare la notifica.');
    }
  };

  // Coach style lookup mapper
  const getCoachColorClasses = (color: string) => {
    const map: { [key: string]: { bg: string, text: string, border: string, ring: string, solid: string, lightText: string, hover: string } } = {
      emerald: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200', 
        ring: 'ring-emerald-500/10', 
        solid: 'bg-emerald-600',
        lightText: 'text-emerald-600',
        hover: 'hover:bg-emerald-100'
      },
      purple: { 
        bg: 'bg-purple-50', 
        text: 'text-purple-700', 
        border: 'border-purple-200', 
        ring: 'ring-purple-500/10', 
        solid: 'bg-purple-600',
        lightText: 'text-purple-600',
        hover: 'hover:bg-purple-100'
      },
      amber: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200', 
        ring: 'ring-amber-500/10', 
        solid: 'bg-amber-600',
        lightText: 'text-amber-600',
        hover: 'hover:bg-amber-100'
      },
      blue: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200', 
        ring: 'ring-blue-500/10', 
        solid: 'bg-blue-600',
        lightText: 'text-blue-600',
        hover: 'hover:bg-blue-100'
      },
      indigo: { 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-700', 
        border: 'border-indigo-200', 
        ring: 'ring-indigo-500/10', 
        solid: 'bg-indigo-600',
        lightText: 'text-indigo-600',
        hover: 'hover:bg-indigo-100'
      },
      pink: { 
        bg: 'bg-pink-50', 
        text: 'text-pink-700', 
        border: 'border-pink-200', 
        ring: 'ring-pink-500/10', 
        solid: 'bg-pink-600',
        lightText: 'text-pink-600',
        hover: 'hover:bg-pink-100'
      },
      rose: { 
        bg: 'bg-rose-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200', 
        ring: 'ring-rose-500/10', 
        solid: 'bg-rose-600',
        lightText: 'text-rose-600',
        hover: 'hover:bg-rose-100'
      },
      cyan: { 
        bg: 'bg-cyan-50', 
        text: 'text-cyan-700', 
        border: 'border-cyan-200', 
        ring: 'ring-cyan-500/10', 
        solid: 'bg-cyan-600',
        lightText: 'text-cyan-600',
        hover: 'hover:bg-cyan-100'
      },
    };
    // Force all coaches to have the same visual color (emerald)
    return map['emerald'];
  };

  const getMonthlyAccumulatedEarnings = (coachId: string, targetDateStr: string) => {
    if (!targetDateStr) return 0;
    const yearMonth = targetDateStr.substring(0, 7); // "YYYY-MM"
    return earnings
      .filter(e => e.coachId === coachId && e.date.startsWith(yearMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getDailyEarnings = (coachId: string, dateStr: string) => {
    return earnings
      .filter(e => e.coachId === coachId && e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const renderEarningsTracker = (isAdminView: boolean = false) => {
    const activeCoach = coaches.find(c => c.id === currentCoachId);
    const activeCoachName = activeCoach ? activeCoach.name : 'Operatore';
    const activeCoachStyles = activeCoach 
      ? getCoachColorClasses(activeCoach.color) 
      : { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500/10', solid: 'bg-emerald-600', lightText: 'text-emerald-600', hover: 'hover:bg-emerald-100' };

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const todayStr = `${year}-${month}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

    const currentMonthCheque = activeCoach
      ? cheques
          .filter(c => c.coachId === activeCoach.id && c.yearMonth === currentMonthStr)
          .reduce((sum, c) => sum + c.amount, 0)
      : 0;

    const accumulatedMonthTotal = activeCoach 
      ? getMonthlyAccumulatedEarnings(activeCoach.id, todayStr) + currentMonthCheque
      : 0;

    const accumulatedSkinMonthTotal = activeCoach
      ? earnings
          .filter(e => e.coachId === activeCoach.id && e.date.startsWith(currentMonthStr) && e.type === 'skin')
          .reduce((sum, e) => sum + e.amount, 0)
      : 0;

    const accumulatedCorpoMonthTotal = activeCoach
      ? earnings
          .filter(e => e.coachId === activeCoach.id && e.date.startsWith(currentMonthStr) && e.type === 'corpo')
          .reduce((sum, e) => sum + e.amount, 0)
      : 0;

    // Annual Earnings calculation for active coach
    const activeCoachId = activeCoach?.id;
    const currentYearStr = selectedYear.toString();

    const annualEarningsSum = activeCoachId
      ? earnings
          .filter(e => e.coachId === activeCoachId && e.date.startsWith(currentYearStr))
          .reduce((sum, e) => sum + e.amount, 0)
      : 0;

    const annualChequesSum = activeCoachId
      ? cheques
          .filter(c => c.coachId === activeCoachId && c.yearMonth.startsWith(currentYearStr))
          .reduce((sum, c) => sum + c.amount, 0)
      : 0;

    const accumulatedYearTotal = annualEarningsSum + annualChequesSum;

    const coachLogs = earnings
      .filter(e => e.coachId === currentCoachId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const adminSummary = coaches.map(c => {
      const yearMonth = todayStr.substring(0, 7);
      const coachMonthlyEarnings = getMonthlyAccumulatedEarnings(c.id, todayStr);
      const coachMonthlyCheque = cheques
        .filter(ch => ch.coachId === c.id && ch.yearMonth === yearMonth)
        .reduce((sum, ch) => sum + ch.amount, 0);
      const coachMonthly = coachMonthlyEarnings + coachMonthlyCheque;

      const coachMonthlySkin = earnings
        .filter(e => e.coachId === c.id && e.date.startsWith(yearMonth) && e.type === 'skin')
        .reduce((sum, e) => sum + e.amount, 0);
      const coachMonthlyCorpo = earnings
        .filter(e => e.coachId === c.id && e.date.startsWith(yearMonth) && e.type === 'corpo')
        .reduce((sum, e) => sum + e.amount, 0);

      const coachToday = getDailyEarnings(c.id, todayStr);
      const coachTodaySkin = earnings
        .filter(e => e.coachId === c.id && e.date === todayStr && e.type === 'skin')
        .reduce((sum, e) => sum + e.amount, 0);
      const coachTodayCorpo = earnings
        .filter(e => e.coachId === c.id && e.date === todayStr && e.type === 'corpo')
        .reduce((sum, e) => sum + e.amount, 0);

      const styles = getCoachColorClasses(c.color);
      return {
        ...c,
        monthlyTotal: coachMonthly,
        monthlyCheque: coachMonthlyCheque,
        monthlySkin: coachMonthlySkin,
        monthlyCorpo: coachMonthlyCorpo,
        todayTotal: coachToday,
        todaySkin: coachTodaySkin,
        todayCorpo: coachTodayCorpo,
        styles
      };
    });

    const totalClubEarningsThisMonth = adminSummary.reduce((sum, c) => sum + c.monthlyTotal, 0);

    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        {/* Accordion Trigger Header */}
        <button
          onClick={() => setIsEarningPanelOpen(!isEarningPanelOpen)}
          className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h4 className="font-display font-extrabold text-base text-slate-900">
                Gestione Guadagni Giornalieri
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5 animate-pulse">
                {activeCoach 
                  ? `Inserisci e traccia i tuoi compensi. Totale: €${accumulatedMonthTotal} (Skin: €${accumulatedSkinMonthTotal} | Corpo: €${accumulatedCorpoMonthTotal})`
                  : "Seleziona un profilo operatore per tracciare i guadagni."
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCoach && (
              <span className="hidden sm:inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                Mese: €{accumulatedMonthTotal}
              </span>
            )}
            <span className="text-slate-400 font-bold transition-transform duration-200 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-100">
              {isEarningPanelOpen ? '▲ Chiudi' : '▼ Apri'}
            </span>
          </div>
        </button>

        {/* Accordion Content */}
        {isEarningPanelOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-6 animate-slide-down">
            {!currentCoachId ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center text-xs text-amber-800 font-medium">
                ⚠️ Per favore, seleziona prima il tuo profilo operatore in alto a destra per registrare i guadagni di oggi.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Form & Personal Stats */}
                <div className="lg:col-span-5 space-y-5">
                  <div className={`p-4 rounded-2xl border ${activeCoachStyles.bg} ${activeCoachStyles.border} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">INSERISCI GUADAGNO</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${activeCoachStyles.solid} text-white`}>
                        {activeCoachName}
                      </span>
                    </div>

                    <form onSubmit={handleSaveEarning} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Giorno</label>
                          <input
                            type="date"
                            value={earningInputDate}
                            onChange={(e) => setEarningInputDate(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Compenso (€)</label>
                          <input
                            type="number"
                            placeholder="es. 45"
                            value={earningInputAmount}
                            onChange={(e) => setEarningInputAmount(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      {/* Choice between Skin and Valutazione Corporea */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo Guadagno</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEarningInputType('skin')}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                              earningInputType === 'skin'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            🧴 Viso / Skin
                          </button>
                          <button
                            type="button"
                            onClick={() => setEarningInputType('corpo')}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                              earningInputType === 'corpo'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            📊 Val. Corporea
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingEarning}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSavingEarning ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Salvataggio...</span>
                          </>
                        ) : (
                          <>
                            <span>📥</span> Registra Guadagno
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Personal accumulated stats box with split breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accumulato nel mese</span>
                        <span className="font-display font-extrabold text-2xl text-slate-900 block mt-0.5">
                          € {accumulatedMonthTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                        €
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-200/60 text-[9px] font-medium text-slate-500">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                        <span className="text-purple-600 block font-bold mb-0.5 leading-tight">🧴 Viso/Skin</span>
                        <strong className="text-slate-800 text-xs font-black">€ {accumulatedSkinMonthTotal.toFixed(2)}</strong>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                        <span className="text-blue-600 block font-bold mb-0.5 leading-tight">📊 Corporea</span>
                        <strong className="text-slate-800 text-xs font-black">€ {accumulatedCorpoMonthTotal.toFixed(2)}</strong>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                        <span className="text-emerald-600 block font-bold mb-0.5 leading-tight">✉️ Assegno</span>
                        <strong className="text-slate-800 text-xs font-black">€ {currentMonthCheque.toFixed(2)}</strong>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium block">Filtro: {today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
                  </div>

                  {/* Annual accumulated stats box */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear(new Date().getFullYear());
                      setIsAnnualBreakdownOpen(true);
                    }}
                    className="w-full text-left bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-200 hover:border-emerald-300 rounded-2xl p-4 flex flex-col gap-2 transition-all cursor-pointer shadow-3xs group"
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Guadagno Annuale ({selectedYear})</span>
                        <span className="font-display font-extrabold text-2xl text-slate-900 block mt-0.5 group-hover:text-emerald-700 transition-colors">
                          € {accumulatedYearTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200/80 transition-all flex items-center justify-center text-emerald-600 font-bold text-lg">
                        📅
                      </div>
                    </div>
                    <div className="text-[9.5px] text-emerald-700 font-bold flex items-center gap-1">
                      <span>🔍 Clicca per vedere il dettaglio mensile</span>
                      <span className="animate-bounce">→</span>
                    </div>
                  </button>
                </div>

                {/* Right Column: Historical logs or Admin review */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Switchable views: History of the active coach OR Admin view of all coaches */}
                  <div className="flex border-b border-slate-100 pb-2 justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      {isAdminView ? '📈 Riepilogo di Tutti i Coach (Admin)' : '🕒 La tua cronologia di inserimento'}
                    </span>
                  </div>

                  {!isAdminView ? (
                    /* Active coach logs list */
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {coachLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200/50">
                          Nessun guadagno registrato finora.
                        </p>
                      ) : (
                        coachLogs.map((log) => (
                          <div key={log.id} className="bg-white border border-slate-150 rounded-xl p-3 flex items-center justify-between shadow-3xs hover:bg-slate-50/50 transition-colors animate-fade-in">
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg font-mono">
                                {formatItalianDate(log.date)}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">Compenso registrato</span>
                                <span className={`text-[10px] font-bold mt-0.5 ${
                                  log.type === 'corpo' ? 'text-blue-600' : 'text-purple-600'
                                }`}>
                                  {log.type === 'corpo' ? '📊 Valutazione Corporea' : '🧴 Viso / Skin'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                + €{log.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleDeleteEarning(log.id)}
                                className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                title="Elimina"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Admin list: All coaches performance of the month */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Totale Club Compensi</span>
                          <strong className="text-lg font-black text-slate-900 block mt-0.5">€ {totalClubEarningsThisMonth.toFixed(2)}</strong>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Compensi di Oggi</span>
                          <strong className="text-lg font-black text-emerald-600 block mt-0.5">
                            € {adminSummary.reduce((sum, c) => sum + c.todayTotal, 0).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                              <th className="p-3">COACH</th>
                              <th className="p-3 text-center">OGGI (SPLIT)</th>
                              <th className="p-3 text-right pr-4 font-black">MENSILE ACCUMULATO (SPLIT)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {adminSummary.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-3 flex items-center gap-2 font-bold text-slate-800">
                                  <span className={`w-2.5 h-2.5 rounded-full ${c.styles.solid}`} />
                                  {c.name}
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-500">
                                  {c.todayTotal > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-extrabold text-slate-800">€ {c.todayTotal.toFixed(2)}</span>
                                      <span className="text-[9px] text-slate-400 mt-0.5 font-sans">
                                        (🧴 €{c.todaySkin.toFixed(0)} | 📊 €{c.todayCorpo.toFixed(0)})
                                      </span>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td className="p-3 text-right font-mono pr-4">
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-emerald-600 text-xs">€ {c.monthlyTotal.toFixed(2)}</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 font-sans">
                                      (🧴 €{c.monthlySkin.toFixed(0)} | 📊 €{c.monthlyCorpo.toFixed(0)})
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const colorsList = ['emerald', 'purple', 'amber', 'blue', 'indigo', 'pink', 'rose', 'cyan'];

  // Helper to render Italian Day names
  const getMemberRegistrationMonth = (m: Member): string => {
    if (m.registrationMonth) {
      return m.registrationMonth;
    }
    const keys = Object.keys(m.payments || {});
    if (keys.length > 0) {
      const sortedKeys = [...keys].sort();
      return sortedKeys[0];
    }
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  };

  const getRecentMonths = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIdx = today.getMonth(); // 0-11
    
    const months = [];
    const itMonths = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    
    for (let i = -2; i <= 1; i++) {
      const d = new Date(currentYear, currentMonthIdx + i, 15);
      const y = d.getFullYear();
      const mIdx = d.getMonth();
      const ymKey = `${y}-${(mIdx + 1) < 10 ? '0' + (mIdx + 1) : (mIdx + 1)}`;
      const label = `${itMonths[mIdx]} ${y}`;
      months.push({ ymKey, label });
    }
    return months;
  };

  const checkCoachPaymentStatus = (coachId: string | undefined) => {
    if (!coachId) return null;
    const m = members.find(mem => mem.coachId === coachId);
    if (!m) return null;

    const today = new Date();
    const currentYear = today.getFullYear();

    // Check next month down to previous 3 months (oldest first to ensure correct precedence of blocks)
    for (let offset = 3; offset >= -1; offset--) {
      const checkDate = new Date(currentYear, today.getMonth() - offset, 15);
      const y = checkDate.getFullYear();
      const mNum = checkDate.getMonth() + 1;
      const ymKey = `${y}-${mNum < 10 ? '0' + mNum : mNum}`;

      const regMonth = getMemberRegistrationMonth(m);
      if (ymKey < regMonth) {
        continue;
      }

      const isPaid = m.payments && m.payments[ymKey] !== false;

      if (!isPaid) {
        const prevY = mNum === 1 ? y - 1 : y;
        const prevM = mNum === 1 ? 12 : mNum - 1;

        const lastDayOfPrevM = new Date(prevY, prevM, 0).getDate();
        const deadlineDay = Math.min(30, lastDayOfPrevM);

        let isDeadlinePassed = false;
        let isReminderZone = false;

        if (today.getFullYear() > prevY) {
          isDeadlinePassed = true;
        } else if (today.getFullYear() === prevY) {
          if (today.getMonth() + 1 > prevM) {
            isDeadlinePassed = true;
          } else if (today.getMonth() + 1 === prevM) {
            if (today.getDate() > deadlineDay) {
              isDeadlinePassed = true;
            } else if (today.getDate() >= deadlineDay - 5 && today.getDate() <= deadlineDay) {
              isReminderZone = true;
            }
          }
        }

        const itMonths = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        const monthLabel = `${itMonths[mNum - 1]} ${y}`;

        if (isDeadlinePassed) {
          return { status: 'blocked', monthLabel, member: m, ymKey };
        } else if (isReminderZone) {
          return { status: 'reminder', monthLabel, member: m, ymKey };
        }
      }
    }

    return null;
  };

  // Group slots by day
  const getGroupedSlots = () => {
    // We only display Trattamento Viso in the main slots calendar grid now
    let filtered = summaries.filter(s => s.treatmentType === 'viso');

    // Filter by visibility restriction
    filtered = filtered.filter(s => {
      // Admin sees everything
      if (isAdminMode) return true;
      
      const allowedCoaches = slotRestrictions[s.slotId];
      if (!allowedCoaches || allowedCoaches.length === 0) {
        // Unrestricted, visible to all
        return true;
      }
      
      // Restricted: only visible if current coach is allowed
      return allowedCoaches.includes(currentCoachId);
    });

    // Sort summaries by date, then by time, then by treatment type
    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time !== b.time) return a.time.localeCompare(b.time);
      return a.treatmentType.localeCompare(b.treatmentType);
    });

    const groups: { [date: string]: SlotSummary[] } = {};
    sorted.forEach(s => {
      if (!groups[s.date]) {
        groups[s.date] = [];
      }
      groups[s.date].push(s);
    });

    return groups;
  };

  const groupedSlots = getGroupedSlots();
  const sortedDates = Object.keys(groupedSlots).sort();

  const weekDates = getWeekDates(selectedMonday);

  // Selected coach object helper
  const activeCoach = coaches.find(c => c.id === currentCoachId);

  // Stats calculation for the current week (sum of Viso summaries + Corpo bookings)
  const totalBookingsCount = summaries.reduce((acc, s) => acc + s.totalBookings, 0) + corpoBookings.length;
  const totalConfirmedCount = summaries.reduce((acc, s) => acc + s.confirmedCount, 0) + corpoBookings.length;
  const totalReserveCount = summaries.reduce((acc, s) => acc + s.reserveCount, 0);

  // Notifications filtering & unread count calculations
  const coachNotifications = notifications.filter(n => {
    if (isAdminMode) return true;
    if (!currentCoachId) return false;
    return n.recipientId === 'all' || n.recipientId === currentCoachId;
  });

  const unreadCount = coachNotifications.filter(n => {
    if (!currentCoachId) return false;
    return !n.readBy || !n.readBy.includes(currentCoachId);
  }).length;

  // Active coach total bookings this week
  const getCoachWeeklyConfirmedCount = (coachId: string) => {
    let count = 0;
    summaries.forEach(s => {
      s.bookings.forEach(b => {
        if (b.coachId === coachId && b.status === 'confermato') {
          count++;
        }
      });
    });
    return count;
  };

  if (bookingCoachId) {
    return (
      <PublicClientBooking 
        coachId={bookingCoachId} 
        onBackToLogin={() => {
          setBookingCoachId(null);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 shadow-xs relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm p-0">
              <img 
                src={logoUrl} 
                alt="The Wellness Hub Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to text initials icon if image has trouble loading
                  e.currentTarget.style.display = 'none';
                  const fb = document.getElementById('logo-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div 
                id="logo-fallback" 
                style={{ display: 'none' }}
                className="absolute inset-0 bg-emerald-600 text-white font-bold text-xl items-center justify-center"
              >
                WH
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">The Wellness Hub</span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  Gestione Coach
                </span>
              </div>
              <p className="text-xs text-slate-500">Pianificatore Benessere & Priority Management</p>
            </div>
          </div>

          {/* Quick Stats Panel for the Week */}
          {(isLoggedIn || isAdminMode) && (
            <div className="flex items-center gap-4 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80">
              <div className="px-3 border-r border-slate-200 text-center">
                <span className="block font-bold text-slate-800 text-sm">{totalBookingsCount}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ospiti Totali</span>
              </div>
              <div className="px-3 border-r border-slate-200 text-center">
                <span className="block font-bold text-emerald-600 text-sm">{totalConfirmedCount}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Confermati</span>
              </div>
              <div className="px-3 text-center">
                <span className="block font-bold text-amber-500 text-sm">{totalReserveCount}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">In Riserva</span>
              </div>
            </div>
          )}

          {/* Core Profile switcher / Active Coach Selector */}
          {(isLoggedIn || isAdminMode) && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {isAdminMode ? (
                <>
                  <span className="text-xs font-semibold text-slate-500 px-2">Stai operando come:</span>
                  {coaches.map(c => {
                    const styles = getCoachColorClasses(c.color);
                    const isActive = c.id === currentCoachId;
                    const hasPin = !!c.pin;
                    return (
                      <button
                        id={`coach-selector-${c.id}`}
                        key={c.id}
                        onClick={() => handleCoachSelect(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          isActive 
                            ? `${styles.solid} text-white shadow-xs` 
                            : `bg-white hover:bg-slate-50 text-slate-700 border border-slate-200`
                        }`}
                        title={hasPin ? "Richiede un PIN di sicurezza" : "Accesso libero"}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : styles.solid}`} />
                        {c.name}
                        {hasPin && (
                          <Lock className={`w-2.5 h-2.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        )}
                      </button>
                    );
                  })}
                </>
              ) : (
                (() => {
                  const activeCoach = coaches.find(c => c.id === currentCoachId);
                  if (!activeCoach) return null;
                  const styles = getCoachColorClasses(activeCoach.color);
                  return (
                    <div className="flex items-center gap-2.5 px-2">
                      <span className="text-xs font-semibold text-slate-500">Operatore Attivo:</span>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs ${styles.solid} flex items-center gap-1.5`}>
                        <span className="w-2 h-2 rounded-full bg-white" />
                        {activeCoach.name}
                      </div>
                      <button
                        id="btn-logout"
                        onClick={() => {
                          localStorage.removeItem('wellness_hub_logged_coach_id');
                          setIsLoggedIn(false);
                          setCurrentCoachId('');
                          setLoginSelectedCoach(null);
                          setSuccessMessage('Arrivederci! Sessione terminata.');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Scollegati ed esci dal tuo profilo"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Cambia Utente
                      </button>
                    </div>
                  );
                })()
              )}
              
              {isAdminMode && (
                <button
                  id="btn-manage-coaches"
                  onClick={() => setShowCoachMgmt(!showCoachMgmt)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-xs ${
                    showCoachMgmt 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'hover:bg-slate-200 text-slate-700 bg-slate-100 border border-slate-250/60'
                  }`}
                  title="Gestione Coach & Utenze (Riservato Admin)"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gestione</span>
                </button>
              )}

              {/* Utility Dropdown (3 lines / hamburger menu) */}
              {(isLoggedIn || isAdminMode) && (
                <div className="relative">
                  <button
                    id="btn-utilities-toggle"
                    onClick={() => setIsUtilityDropdownOpen(!isUtilityDropdownOpen)}
                    className={`p-2 rounded-xl transition-all relative cursor-pointer border ${
                      isUtilityDropdownOpen 
                        ? 'bg-slate-200 text-slate-800 border-slate-300' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200 shadow-2xs'
                    }`}
                    title="Utility (Locandine, Start Up, Listino)"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  {isUtilityDropdownOpen && (
                    <>
                      {/* Mobile & desktop backdrop to close dropdown on tap outside */}
                      <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none z-[100]" 
                        onClick={() => setIsUtilityDropdownOpen(false)} 
                      />
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm md:absolute md:top-auto md:left-auto md:translate-x-0 md:translate-y-0 md:right-0 md:mt-2 md:w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-[110] text-slate-800 animate-scale-up max-h-[85vh] md:max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            📁 Utility e Risorse
                          </span>
                          <button
                            onClick={() => setIsUtilityDropdownOpen(false)}
                            className="md:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUtilityCategory('locandine');
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">🖼️</span> Locandine
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUtilityCategory('startup');
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">🚀</span> Start Up
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUtilityCategory('listino');
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">💰</span> Listino prezzi aggiornato
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUtilityCategory('regolamento');
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">📄</span> Regolamento del Club
                        </button>
                        <button
                          onClick={() => {
                            setIsUtilityPaymentModalOpen(true);
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">💳</span> Paga Quota
                        </button>
                        <button
                          onClick={() => {
                            if (!currentCoachId) {
                              alert('Seleziona un profilo operatore prima di accedere al Database Contatti.');
                            } else {
                              setIsContactsDbOpen(true);
                            }
                            setIsUtilityDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 font-bold text-slate-700 transition-colors"
                        >
                          <span className="text-sm">🗂️</span> Database Contatti
                        </button>
                        {currentCoachId && (
                          <>
                            <div className="border-t border-slate-100 my-1.5 pt-1.5" />
                            <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              🔗 Prenotazioni Clienti
                            </div>
                            <div className="px-3.5 py-1.5 space-y-1.5">
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}?bookingCoachId=${currentCoachId}`;
                                  navigator.clipboard.writeText(link)
                                    .then(() => {
                                      setSuccessMessage('Link copiato negli appunti!');
                                      setTimeout(() => setSuccessMessage(''), 3000);
                                    })
                                    .catch(() => {
                                      alert(`Copia il link manualmente: ${link}`);
                                    });
                                  setIsUtilityDropdownOpen(false);
                                }}
                                className="w-full text-center px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer block"
                              >
                                📋 Copia Link Cliente
                              </button>
                            </div>
                          </>
                        )}
                        <div className="border-t border-slate-100 my-1.5 pt-1.5" />
                        <button
                          id="btn-admin-toggle"
                          onClick={() => {
                            setIsUtilityDropdownOpen(false);
                            if (isAdminMode) {
                              setIsAdminMode(false);
                              setShowAdminDropdown(false);
                              setShowCoachMgmt(false);
                              setSuccessMessage('Modalità Amministratore disattivata.');
                              setTimeout(() => setSuccessMessage(''), 3000);
                            } else {
                              setShowAdminLoginModal(true);
                              setAdminPasswordInput('');
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 font-bold transition-colors cursor-pointer ${
                            isAdminMode 
                              ? 'hover:bg-red-50 text-red-700 hover:text-red-800' 
                              : 'hover:bg-amber-50 text-amber-800 hover:text-amber-900'
                          }`}
                        >
                          <Shield className={`w-3.5 h-3.5 ${isAdminMode ? 'text-red-600' : 'text-amber-600'}`} />
                          <span>{isAdminMode ? 'Disattiva Amministratore' : 'Accedi Admin'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isAdminMode && (
                <button
                  id="btn-pending-registrations"
                  onClick={() => setShowPendingRegistrationsModal(true)}
                  className="relative p-2 rounded-lg text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-150 border border-amber-200 transition-all cursor-pointer flex items-center justify-center"
                  title={`${pendingRegistrations.length} Richieste registrazione coach in attesa`}
                >
                  <UserPlus className="w-4 h-4" />
                  {pendingRegistrations.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white animate-bounce">
                      {pendingRegistrations.length}
                    </span>
                  )}
                </button>
              )}

              {isAdminMode && (
                <div className="relative">
                  <button
                    id="btn-admin-dropdown-toggle"
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer bg-slate-850 hover:bg-slate-750 text-slate-100 border border-slate-700 shadow-sm`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Strumenti ▾
                  </button>

                  {showAdminDropdown && (
                    <>
                      {/* Mobile backdrop to close admin dropdown on tap outside */}
                      <div 
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] md:hidden z-45" 
                        onClick={() => setShowAdminDropdown(false)} 
                      />
                      <div className="fixed inset-x-4 top-[150px] md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-2 w-auto md:w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-4 z-50 text-slate-800 animate-scale-up max-h-[75vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            Strumenti Admin
                          </h4>
                          <button
                            onClick={() => setShowAdminDropdown(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                          >
                            ✕
                          </button>
                        </div>


                      {/* USER PASSWORDS / PINS MANAGEMENT */}
                      <div className="space-y-1.5 text-left">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          🔑 Modifica PIN Operatori
                        </label>
                        <select
                          value={selectedCoachToChangePin}
                          onChange={(e) => {
                            setSelectedCoachToChangePin(e.target.value);
                            const coach = coaches.find(c => c.id === e.target.value);
                            setNewPinForSelectedCoach(coach?.pin || '');
                          }}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50"
                        >
                          <option value="">Seleziona Coach...</option>
                          {coaches.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.id === currentCoachId ? '(Tu)' : ''} {c.isAdmin ? '👑' : ''}
                            </option>
                          ))}
                        </select>
                        {selectedCoachToChangePin && (
                          <div className="space-y-1.5 mt-1.5 animate-slide-down">
                            <input
                              type="text"
                              maxLength={4}
                              pattern="[0-9]*"
                              placeholder="Nuovo PIN (4 cifre)"
                              value={newPinForSelectedCoach}
                              onChange={(e) => setNewPinForSelectedCoach(e.target.value.replace(/\D/g, ''))}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!selectedCoachToChangePin) return;
                                try {
                                  const response = await fetch(`/api/coaches/${selectedCoachToChangePin}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pin: newPinForSelectedCoach })
                                  });
                                  if (!response.ok) {
                                    const errData = await response.json();
                                    throw new Error(errData.error || "Errore durante l'aggiornamento.");
                                  }
                                  setSuccessMessage("PIN utente aggiornato con successo!");
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                  await fetchData();
                                  setSelectedCoachToChangePin('');
                                  setNewPinForSelectedCoach('');
                                  setShowAdminDropdown(false);
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Impossibile aggiornare il PIN.');
                                  setTimeout(() => setErrorMessage(''), 4000);
                                }
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Salva PIN Coach
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ADMIN PASSWORD CHANGE */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-left">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          🛡 Cambia Password Accesso Admin
                        </label>
                        <input
                          type="password"
                          placeholder="Nuova Password Admin"
                          value={newAdminPasswordInput}
                          onChange={(e) => setNewAdminPasswordInput(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newAdminPasswordInput.trim()) return;
                            try {
                              const response = await fetch('/api/admin/config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminPassword: newAdminPasswordInput.trim() })
                              });
                              if (!response.ok) throw new Error("Errore durante l'aggiornamento.");
                              setSuccessMessage("Password Amministratore aggiornata!");
                              setTimeout(() => setSuccessMessage(''), 3000);
                              setAdminPassword(newAdminPasswordInput.trim());
                              setNewAdminPasswordInput('');
                              setShowAdminDropdown(false);
                            } catch (err: any) {
                              setErrorMessage(err.message || 'Impossibile salvare la password.');
                              setTimeout(() => setErrorMessage(''), 4000);
                            }
                          }}
                          disabled={!newAdminPasswordInput.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          Salva Nuova Password Admin
                        </button>
                      </div>

                      {/* QUICK SYSTEM CONTROLS */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-left">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          ⚙️ Gestione Rapida
                        </label>
                        <div className="grid grid-cols-1 gap-1.5 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCoachMgmt(!showCoachMgmt);
                              setShowAdminDropdown(false);
                            }}
                            className="w-full text-left text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {showCoachMgmt ? 'Nascondi Gestione Coach' : 'Apri Gestione Coach'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomSlotModal(true);
                              setShowAdminDropdown(false);
                            }}
                            className="w-full text-left text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Aggiungi Turno Personalizzato
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('resoconto');
                              setShowAdminDropdown(false);
                            }}
                            className="w-full text-left text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Apri Resoconto Giornaliero
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {!isLoggedIn && !isAdminMode ? (
          <div className="max-w-md w-full mx-auto py-12 px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6 animate-scale-up">
              
              <div className="text-center space-y-3">
                <div className="inline-flex overflow-hidden rounded-3xl border border-slate-200 shadow-md w-36 h-36 mx-auto bg-white p-0">
                  <img 
                    src={logoUrl} 
                    alt="The Wellness Hub Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">The Wellness Hub Planner</h2>
                  <p className="text-xs text-slate-500 mt-1">Seleziona il tuo profilo operatore per iniziare ad operare sul calendario.</p>
                </div>
              </div>

              {/* Dynamic alert notices */}
              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-100 flex items-start gap-2 animate-shake">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="bg-emerald-50 text-emerald-700 text-xs p-3.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {!loginSelectedCoach ? (
                // Step 1: Select Coach profile
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Profili Attivi</span>
                  
                  {coaches.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      Nessun profilo coach configurato. Accedi come Amministratore per aggiungere operatori.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {coaches.map(c => {
                        const styles = getCoachColorClasses(c.color);
                        const hasPin = !!c.pin;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setLoginSelectedCoach(c);
                              setLoginPinInput('');
                              setErrorMessage('');
                              if (!c.pin) {
                                setIsSettingInitialPin(true);
                              } else {
                                setIsSettingInitialPin(false);
                              }
                            }}
                            className="w-full p-4 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all text-left flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-3.5 h-3.5 rounded-full ${styles.solid} group-hover:scale-110 transition-transform`} />
                              <span className="font-semibold text-sm text-slate-800">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              {hasPin ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">Primo Accesso</span>
                              )}
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-center">
                    <button
                      onClick={() => {
                        setShowAdminLoginModal(true);
                        setAdminPasswordInput('');
                        setErrorMessage('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      Sei l&apos;Amministratore? Accedi Qui
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCoachRegisterModal(true);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-extrabold flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      Sei un nuovo coach? Registrati Qui
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Enter PIN
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setLoginSelectedCoach(null);
                        setLoginPinInput('');
                        setErrorMessage('');
                        setIsSettingInitialPin(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Indietro
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Autenticazione</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getCoachColorClasses(loginSelectedCoach.color).solid}`} />
                      <span className="font-bold text-slate-800 text-sm">{loginSelectedCoach.name}</span>
                    </div>
                    {isSettingInitialPin ? (
                      <p className="text-[11px] text-amber-600 font-medium">
                        Questo è il tuo primo accesso. Imposta un codice PIN personale a 4 cifre per proteggere le tue prenotazioni.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Inserisci il tuo PIN di sicurezza personale a 4 cifre.
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 text-center">
                        {isSettingInitialPin ? 'Crea Nuovo PIN (4 cifre)' : 'Inserisci il tuo PIN'}
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        pattern="[0-9]*"
                        autoFocus
                        placeholder="••••"
                        value={loginPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setLoginPinInput(val);
                          if (val.length === 4 && !isSettingInitialPin) {
                            setTimeout(() => {
                              if (loginSelectedCoach.pin === val) {
                                localStorage.setItem('wellness_hub_logged_coach_id', loginSelectedCoach.id);
                                setCurrentCoachId(loginSelectedCoach.id);
                                setIsLoggedIn(true);
                                setLoginSelectedCoach(null);
                                setLoginPinInput('');
                                setSuccessMessage(`Accesso effettuato! Benvenuto ${loginSelectedCoach.name}.`);
                                setTimeout(() => setSuccessMessage(''), 3000);
                              } else {
                                setErrorMessage('PIN non valido. Riprova.');
                              }
                            }, 100);
                          }
                        }}
                        className="w-full text-center text-2xl tracking-widest font-bold border border-slate-200 rounded-2xl px-3.5 py-3 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono bg-slate-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginPinInput.length < 4 || actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {isSettingInitialPin ? 'Salva PIN e Accedi' : 'Accedi al Calendario'}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        ) : (
          <>
            {/* Admin Mode active banner */}
            {isAdminMode && (
          <div className="bg-amber-500/10 border-l-4 border-amber-600 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="text-sm text-amber-900 font-extrabold uppercase tracking-wider">Pannello Amministratore Attivo</p>
                <p className="text-xs text-amber-700">Puoi gestire le utenze dei coach, assegnare PIN di accesso e configurare la visibilità di ciascun turno.</p>
              </div>
            </div>
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">Bypass PIN Attivo</span>
          </div>
        )}

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-red-800 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 font-bold text-xs">Chiudi</button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-emerald-800 font-medium">{successMessage}</div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 font-bold text-xs">Chiudi</button>
          </div>
        )}

        {/* Payment Warning / Status Banner */}
        {(() => {
          if (!currentCoachId) return null;
          const statusResult = checkCoachPaymentStatus(currentCoachId);
          if (!statusResult) return null;

          const isBlocked = statusResult.status === 'blocked';
          return (
            <div className={`border-l-4 p-5 rounded-2xl flex flex-col gap-4 shadow-xs animate-fade-in ${
              isBlocked 
                ? 'bg-red-50/70 border-red-500 text-slate-800' 
                : 'bg-amber-50/70 border-amber-500 text-slate-800'
            }`}>
              {/* Header: Title and explanation */}
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{isBlocked ? '⚠️' : '🔔'}</span>
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                    {isBlocked ? 'Blocco Attivo: Quota Club Scaduta!' : 'Promemoria: Quota Club in Scadenza!'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-600 font-medium leading-relaxed">
                    Il socio <strong className="font-bold text-slate-900">"{statusResult.member.name}"</strong> (associato a questo profilo coach) {isBlocked ? 'non ha versato la quota' : 'ha la quota in scadenza'} per il mese di <strong className="font-bold text-slate-900">{statusResult.monthLabel}</strong>.
                    {isBlocked 
                      ? ' Non puoi inserire nuove prenotazioni fino al completamento del pagamento.' 
                      : ' Ricorda di regolarizzare entro il giorno 30.'}
                  </p>
                </div>
              </div>

              {/* Toggle Buttons to select payment method */}
              <div className="flex gap-2 border-b border-slate-200/50 pb-2">
                <button
                  type="button"
                  onClick={() => setAlertPaymentChoice('bonifico')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertPaymentChoice === 'bonifico'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  🏦 Bonifico Bancario
                </button>
                <button
                  type="button"
                  onClick={() => setAlertPaymentChoice('paypal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertPaymentChoice === 'paypal'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  🔵 Link PayPal
                </button>
              </div>

              {/* Dynamic Content based on selection */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {alertPaymentChoice === 'bonifico' ? (
                  <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Intestatario IBAN</span>
                        <strong className="text-slate-800 font-semibold block mt-0.5 select-all">{ibanHolder || "Lorenzo Wellness"}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">IBAN per Bonifico</span>
                        <strong className="text-slate-800 font-mono font-bold block mt-0.5 select-all break-all">{iban || "IT00A0000000000000000000000"}</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                      Causale: <strong className="font-semibold text-slate-700">"Quota {statusResult.monthLabel} - {statusResult.member.name}"</strong>
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs text-slate-600 font-medium">
                      Puoi effettuare il pagamento online in modo sicuro e immediato tramite PayPal.
                    </p>
                    <div className="inline-flex">
                      <a
                        href={paypalUrl || "https://paypal.me/LorenzoWellness"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>🔗</span> Apri Link PayPal
                      </a>
                    </div>
                  </div>
                )}

                {/* Right / CTA Section: Button to confirm/pay */}
                <div className="shrink-0 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode(alertPaymentChoice === 'bonifico' ? 'bank_transfer' : 'paypal');
                      handleInitiatePayment(statusResult.member, statusResult.ymKey);
                    }}
                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isBlocked 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/10' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10'
                    }`}
                  >
                    <span>💳</span>
                    Conferma e Registra (€{statusResult.member.quotaAmount !== undefined ? statusResult.member.quotaAmount : quotaAmount})
                  </button>
                </div>
              </div>
            </div>
          );
        })()}


        {/* COLLAPSIBLE EVENTI ACCORDION */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-4">
          <div
            className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/40 transition-colors text-left"
          >
            {/* Clickable area for toggling the accordion */}
            <div 
              onClick={() => setShowEventsAccordion(!showEventsAccordion)}
              className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                  <span className="text-lg">📅</span>
                  <span>Calendario Eventi del Mese</span>
                  <span className="text-xs text-slate-400 font-semibold ml-1">
                    {showEventsAccordion ? 'Nascondi ▲' : 'Mostra ▾'}
                  </span>
                </div>
                {!showEventsAccordion && (
                  <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                    Clicca per espandere e vedere tutti i dettagli o gestire gli eventi.
                  </p>
                )}
              </div>

              {/* Compact Miniature Preview of upcoming events when COLLAPSED */}
              {!showEventsAccordion && (
                <div className="flex flex-wrap gap-2 items-center">
                  {(() => {
                    const sortedEvents = [...events].sort((a, b) => {
                      const dateTimeA = `${a.date}T${a.time || '00:00'}`;
                      const dateTimeB = `${b.date}T${b.time || '00:00'}`;
                      return dateTimeA.localeCompare(dateTimeB);
                    });
                    const todayStr = new Date().toISOString().split('T')[0];
                    let previewEvents = sortedEvents.filter(ev => ev.date >= todayStr);
                    if (previewEvents.length === 0) {
                      previewEvents = sortedEvents.slice(0, 3);
                    } else {
                      previewEvents = previewEvents.slice(0, 3);
                    }

                    if (previewEvents.length === 0) {
                      return <span className="text-[11px] font-semibold text-slate-400 italic">Nessun evento programmato</span>;
                    }

                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {previewEvents.map(event => {
                          const dateObj = new Date(event.date);
                          const dayNum = isNaN(dateObj.getTime()) ? '?' : dateObj.getDate();
                          const itMonthsShort = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
                          const monthName = isNaN(dateObj.getTime()) ? 'MESE' : itMonthsShort[dateObj.getMonth()];
                          
                          return (
                            <div key={event.id} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-3xs max-w-[155px] shrink-0">
                              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-150 rounded-md w-7 h-7 shrink-0">
                                <span className="text-[10px] font-black text-slate-850 leading-none">{dayNum}</span>
                                <span className="text-[6.5px] font-bold text-emerald-700 leading-none tracking-tight uppercase">{monthName}</span>
                              </div>
                              <div className="text-left overflow-hidden pr-0.5">
                                <p className="text-[9px] font-bold text-slate-800 truncate max-w-[100px] leading-tight">{event.title}</p>
                                <p className="text-[8px] font-semibold text-slate-400 truncate leading-none">
                                  {event.time ? `🕒 ${event.time}${event.endTime ? ` - ${event.endTime}` : ''}` : ''} {event.location ? `• ${event.location}` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quick Action in Header for Admins */}
            {isAdminMode && (
              <button
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  setEventFormTitle('');
                  setEventFormDate(new Date().toISOString().split('T')[0]);
                  setEventFormTime('20:00');
                  setEventFormEndTime('');
                  setEventFormLocation('');
                  setEventFormDescription('');
                  setShowEventFormModal(true);
                }}
                className="mt-2 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer self-start md:self-auto shrink-0"
              >
                <Plus className="w-3 h-3" />
                Aggiungi
              </button>
            )}
          </div>

          {showEventsAccordion && (
            <div className="p-5 border-t border-slate-150 bg-white space-y-4 animate-slide-down">
              {events.length === 0 ? (
                <div className="text-center py-6 text-slate-400 italic text-xs space-y-3">
                  <p>Nessun evento in calendario per questo mese.</p>
                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(null);
                        setEventFormTitle('');
                        setEventFormDate(new Date().toISOString().split('T')[0]);
                        setEventFormTime('20:00');
                        setEventFormEndTime('');
                        setEventFormLocation('');
                        setEventFormDescription('');
                        setShowEventFormModal(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Aggiungi Primo Evento
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {[...events]
                    .sort((a, b) => {
                      const dateTimeA = `${a.date}T${a.time || '00:00'}`;
                      const dateTimeB = `${b.date}T${b.time || '00:00'}`;
                      return dateTimeA.localeCompare(dateTimeB);
                    })
                    .map((event) => {
                      const dateObj = new Date(event.date);
                      const dayNum = isNaN(dateObj.getTime()) ? '?' : dateObj.getDate();
                      const itMonthsShort = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
                      const monthName = isNaN(dateObj.getTime()) ? 'MESE' : itMonthsShort[dateObj.getMonth()];
                      const dayOfWeekNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
                      const dayOfWeek = isNaN(dateObj.getTime()) ? '' : dayOfWeekNames[dateObj.getDay()];
                      const fullItalianDate = isNaN(dateObj.getTime())
                        ? event.date
                        : `${dayOfWeek} ${dayNum} ${["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"][dateObj.getMonth()]} ${dateObj.getFullYear()}`;

                      return (
                        <div
                          key={event.id}
                          className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm transition-all duration-300 rounded-xl p-4 flex gap-4 items-start relative overflow-hidden"
                        >
                          {/* Event Date Badge */}
                          <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-150 rounded-xl w-12 h-12 shrink-0 shadow-3xs gap-0.5">
                            <span className="text-lg font-black text-slate-850 leading-none">
                              {dayNum}
                            </span>
                            <span className="text-[8px] font-black text-emerald-700 tracking-wider uppercase leading-none">
                              {monthName}
                            </span>
                          </div>

                          {/* Event Details Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-display font-extrabold text-xs text-slate-900 tracking-tight leading-tight truncate max-w-[200px]">
                                {event.title}
                              </h4>
                              {event.time && (
                                <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-650 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                  {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                                </span>
                              )}
                              {event.location && (
                                <span className="inline-flex items-center text-emerald-700 text-[9px] font-bold">
                                  📍 {event.location}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                              {fullItalianDate}
                            </p>

                            {event.description && (
                              <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-line bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>

                          {/* Admin Action buttons */}
                          {isAdminMode && (
                            <div className="flex gap-1 shrink-0 self-center">
                              <button
                                onClick={() => {
                                  setEditingEventId(event.id);
                                  setEventFormTitle(event.title);
                                  setEventFormDate(event.date);
                                  setEventFormTime(event.time || '20:00');
                                  setEventFormEndTime(event.endTime || '');
                                  setEventFormLocation(event.location || '');
                                  setEventFormDescription(event.description || '');
                                  setShowEventFormModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-slate-150"
                                title="Modifica Evento"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer border border-slate-150"
                                title="Elimina Evento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coach Management Section (Collapsible) */}
        {isAdminMode && showCoachMgmt && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-slide-down space-y-5">
            {/* Header of Panel */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h2 className="font-display font-bold text-lg text-slate-800">
                  Pannello di Gestione
                </h2>
              </div>
              <button 
                onClick={() => {
                  setShowCoachMgmt(false);
                  setEditingCoachId(null);
                }} 
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Nascondi
              </button>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-2 pb-px text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminMgmtTab('coaches')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  adminMgmtTab === 'coaches'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                👥 Utenze Coach ({coaches.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminMgmtTab('members')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  adminMgmtTab === 'members'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                💳 Soci & Quote Club ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminMgmtTab('settings')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  adminMgmtTab === 'settings'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ⚙️ Impostazioni Generali
              </button>
              <button
                type="button"
                onClick={() => setAdminMgmtTab('notifications')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  adminMgmtTab === 'notifications'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🔔 Notifiche Coach
              </button>
            </div>

            {/* Tab Content: 1. COACHES */}
            {adminMgmtTab === 'coaches' && (
              <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
                {/* Form to Add / Edit Coach */}
                {editingCoachId ? (
                  <form onSubmit={handleEditCoachSubmit} className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Modifica Utenza Coach
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingCoachId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Coach</label>
                      <input
                        type="text"
                        required
                        value={editingCoachName}
                        onChange={(e) => setEditingCoachName(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">PIN di Sicurezza (4 cifre)</label>
                      <input
                        type="text"
                        maxLength={4}
                        pattern="[0-9]*"
                        value={editingCoachPin}
                        onChange={(e) => setEditingCoachPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Lascia vuoto per nessun PIN"
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Se impostato, l'accesso a questa utenza richiederà questo PIN.</p>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        id="edit-is-admin-checkbox"
                        type="checkbox"
                        checked={editingCoachIsAdmin}
                        onChange={(e) => setEditingCoachIsAdmin(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="edit-is-admin-checkbox" className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        Privilegi Amministratore (Admin)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Salva Modifiche
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddCoach} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <h3 className="text-sm font-bold text-slate-700">Aggiungi Nuovo Coach</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Coach</label>
                      <input
                        type="text"
                        required
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        placeholder="Es. Roberta, Giorgio"
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Salva Coach
                    </button>
                  </form>
                )}

                {/* List of current Coaches with Edit and Delete capability */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-700">Coach Attivi nel Sistema</h3>
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {coaches.map(c => {
                      const styles = getCoachColorClasses(c.color);
                      const weeklyCount = getCoachWeeklyConfirmedCount(c.id);
                      const hasPin = !!c.pin;
                      const isCoachAdmin = !!c.isAdmin;
                      return (
                        <div key={c.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${styles.solid}`} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCoachForDetails(c)}
                                  className="text-sm font-bold text-slate-800 hover:text-emerald-600 hover:underline transition-all text-left cursor-pointer"
                                  title="Visualizza anagrafica coach"
                                >
                                  {c.name}
                                </button>
                                {isCoachAdmin && (
                                  <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-0.5">
                                    <Shield className="w-2.5 h-2.5" /> Admin
                                  </span>
                                )}
                                {hasPin && (
                                  <span className="bg-slate-100 text-slate-600 text-[9px] font-medium px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5" title={`PIN protetto: ${c.pin}`}>
                                    <Lock className="w-2.5 h-2.5" /> PIN: {c.pin}
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-500">{weeklyCount} ospiti confermati questa settimana</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCoachId(c.id);
                                setEditingCoachName(c.name);
                                setEditingCoachColor(c.color);
                                setEditingCoachPin(c.pin || '');
                                setEditingCoachIsAdmin(!!c.isAdmin);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Modifica Utenza (PIN, Permessi, Colore)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteCoach(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Rimuovi Coach"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: 2. MEMBERS & QUOTAS */}
            {adminMgmtTab === 'members' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {/* Search socio */}
                  <div className="w-full md:w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Cerca Socio</label>
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Filtra per nome socio..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Add manual socio */}
                  <form onSubmit={handleAddMember} className="w-full md:w-1/2 flex flex-col sm:flex-row items-end gap-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Registra Nuovo Socio Manualmente</label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Nome e cognome socio..."
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="w-full sm:w-44">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Coach Associato</label>
                      <select
                        value={newMemberCoachId}
                        onChange={(e) => setNewMemberCoachId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700 h-[34px]"
                      >
                        <option value="">-- Nessuno --</option>
                        {coaches.map(c => {
                          const isAssigned = members.some(m => m.coachId === c.id);
                          return (
                            <option key={c.id} value={c.id} disabled={isAssigned}>
                              {c.name} {isAssigned ? ' (Già associato)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Quota (€)</label>
                      <input
                        type="number"
                        min="1"
                        value={newMemberQuota}
                        onChange={(e) => setNewMemberQuota(e.target.value)}
                        placeholder={`${quotaAmount}`}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold text-slate-700 h-[34px]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading || !newMemberName.trim()}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap h-[34px]"
                    >
                      Aggiungi
                    </button>
                  </form>
                </div>

                {/* Info Box about deadline block */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Regola delle Quote Mensili:</span> Le quote scadono il giorno 30 di ogni mese. I soci che non pagano entro il giorno successivo (il 31 del mese o il 1° del mese successivo) vengono <strong>bloccati automaticamente</strong> e non potranno inserire nuove prenotazioni nel sistema finché non vengono registrati come paganti.
                  </div>
                </div>

                {/* Table of Members */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                        <th className="p-3">Nome Socio</th>
                        <th className="p-3">Coach Associato</th>
                        <th className="p-3">Quota Mensile</th>
                        {getRecentMonths().map(m => (
                          <th key={m.ymKey} className="p-3 text-center">{m.label}</th>
                        ))}
                        <th className="p-3 text-right">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                        .map(m => {
                          const recentMonths = getRecentMonths();
                          return (
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{m.name}</td>
                              <td className="p-3">
                                <select
                                  value={m.coachId || ''}
                                  disabled={actionLoading}
                                  onChange={(e) => handleUpdateMemberCoach(m, e.target.value)}
                                  className="text-xs bg-white border border-slate-200 rounded-lg p-1 px-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer animate-fade-in"
                                >
                                  <option value="">-- Nessuno --</option>
                                  {coaches.map(c => {
                                    const isAssignedToOther = members.some(other => other.id !== m.id && other.coachId === c.id);
                                    return (
                                      <option key={c.id} value={c.id} disabled={isAssignedToOther}>
                                        {c.name} {isAssignedToOther ? ' (Già associato)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                              <td className="p-3">
                                <MemberQuotaInput
                                  member={m}
                                  defaultQuota={quotaAmount}
                                  onUpdate={handleUpdateMemberQuota}
                                />
                              </td>
                              {recentMonths.map(month => {
                                const regMonth = getMemberRegistrationMonth(m);
                                if (month.ymKey < regMonth) {
                                  return (
                                    <td key={month.ymKey} className="p-3 text-center">
                                      <span className="text-slate-300 font-bold text-xs">-</span>
                                    </td>
                                  );
                                }
                                
                                if (month.ymKey === regMonth) {
                                  return (
                                    <td key={month.ymKey} className="p-3 text-center">
                                      <span className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 shadow-sm select-none">
                                        🎁 Mese omaggio
                                      </span>
                                    </td>
                                  );
                                }

                                const isPaid = m.payments && m.payments[month.ymKey] !== false; // default to true
                                return (
                                  <td key={month.ymKey} className="p-3 text-center">
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() => handleTogglePayment(m, month.ymKey, isPaid)}
                                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                        isPaid
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                          : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                                      }`}
                                    >
                                      {isPaid ? (
                                        <>✓ Pagato</>
                                      ) : (
                                        <>✗ Da Pagare</>
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m.id, m.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Elimina socio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {members.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400 italic">
                            Nessun socio trovato.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Content: 3. SETTINGS */}
            {adminMgmtTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl animate-fade-in bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Parametri di Configurazione del Club</h3>
                
                {/* Max Future Weeks visibility slider */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Sblocca Settimane Future Visibili ai Soci:
                  </label>
                  <div className="flex items-center gap-4">
                    <select
                      value={maxFutureWeeks}
                      onChange={(e) => setMaxFutureWeeks(Number(e.target.value))}
                      className="text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold flex-1"
                    >
                      <option value={1}>Solo 1 settimana successiva (Molto restrittivo)</option>
                      <option value={2}>Massimo 2 settimane successive (Consigliato)</option>
                      <option value={3}>Massimo 3 settimane successive</option>
                      <option value={4}>Massimo 4 settimane successive</option>
                      <option value={8}>Massimo 8 settimane successive (2 mesi)</option>
                      <option value={-1}>Sbloccato (Senza limiti future, navigazione illimitata)</option>
                    </select>
                    <span className="text-xs font-bold bg-slate-200/60 px-3 py-2 rounded-lg text-slate-700">
                      {maxFutureWeeks === -1 ? 'Senza limiti' : `+ ${maxFutureWeeks} sett.`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    I soci potranno navigare e prenotare solo le settimane sbloccate oltre a quella corrente. L'amministratore può navigare sempre senza alcuna restrizione.
                  </p>
                </div>

                {/* Parametri Pagamento Quota */}
                <div className="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💳</span> Dettagli per il Pagamento della Quota (Bonifico Bancario)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configura la quota mensile predefinita, l'intestatario e l'IBAN per il pagamento dei soci.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500">Importo Quota Mensile Predefinita (€)</label>
                      <input
                        type="number"
                        min="1"
                        value={newQuotaAmount}
                        onChange={(e) => setNewQuotaAmount(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500">Intestatario IBAN</label>
                      <input
                        type="text"
                        value={newIbanHolder}
                        onChange={(e) => setNewIbanHolder(e.target.value)}
                        placeholder="Es: Lorenzo Wellness"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">IBAN per Bonifico Bancario</label>
                    <input
                      type="text"
                      value={newIban}
                      onChange={(e) => setNewIban(e.target.value)}
                      placeholder="IT..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500">Link PayPal per Pagamento Quota</label>
                      <input
                        type="text"
                        value={newPaypalUrl}
                        onChange={(e) => setNewPaypalUrl(e.target.value)}
                        placeholder="Es: https://paypal.me/LorenzoWellness"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500">Contatto Satispay (Opzionale)</label>
                      <input
                        type="text"
                        value={newSatispayUrl}
                        onChange={(e) => setNewSatispayUrl(e.target.value)}
                        placeholder="Es: +39 333 1234567"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Password reset */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700">
                    Cambia Password di Gestione Amministrativa:
                  </label>
                  <input
                    type="password"
                    value={newAdminPasswordInput}
                    onChange={(e) => setNewAdminPasswordInput(e.target.value)}
                    placeholder="Lascia vuoto per non cambiarla"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Password corrente: <span className="font-mono text-slate-600 font-bold">{adminPassword}</span>. Se modificata, cambierà la password d'accesso a questa modalità.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  <Check className="w-4 h-4" />
                  Salva Impostazioni Amministrative
                </button>
              </form>
            )}

            {/* Tab Content: 4. NOTIFICATIONS */}
            {adminMgmtTab === 'notifications' && (
              <div className="grid md:grid-cols-2 gap-6 animate-fade-in text-left">
                {/* Draft Composer */}
                <div className="space-y-4">
                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200/80">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                      <span>📱</span> Prepara Comunicazione WhatsApp
                    </h3>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Destinatario Principale
                      </label>
                      <select
                        value={newNotificationRecipientId}
                        onChange={(e) => setNewNotificationRecipientId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="all">📢 Tutti i Coach (Messaggio di Gruppo)</option>
                        {coaches.filter(c => !c.isAdmin).map(c => (
                          <option key={c.id} value={c.id}>👤 Solo a: {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Titolo Comunicazione
                      </label>
                      <input
                        type="text"
                        placeholder="Es. Sostituzione Orari Sabato / Chiusura Straordinaria"
                        value={newNotificationTitle}
                        onChange={(e) => setNewNotificationTitle(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Testo Dettagliato
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Inserisci il testo della comunicazione..."
                        value={newNotificationMessage}
                        onChange={(e) => setNewNotificationMessage(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-100/50 p-2.5 rounded-lg leading-relaxed">
                      💡 <strong>Come Funziona:</strong> Compila i campi sopra. A destra vedrai la preview in tempo reale. Potrai inviare istantaneamente il messaggio sul gruppo WhatsApp dei Coach o nelle chat individuali.
                    </div>
                  </div>
                </div>

                {/* Dispatch & Preview Center */}
                <div className="space-y-4">
                  <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/80 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/50 pb-2 mb-3">
                      <span>👀</span> Preview e Invio Rapido
                    </h3>

                    {/* WhatsApp Bubble Preview */}
                    <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-inner flex-1 flex flex-col justify-between min-h-[180px] max-h-[300px] overflow-y-auto mb-4 relative bg-[url('https://user-images.githubusercontent.com/15075759/145196467-3320539e-1090-4835-8ec0-22e6900da202.png')] bg-cover">
                      <div className="bg-[#dcf8c6] text-slate-800 rounded-lg p-3 text-xs shadow-xs max-w-[85%] self-end relative border border-[#c4e5a9]/50">
                        <span className="font-bold block text-[#075e54] text-[10px] uppercase tracking-wide mb-1">
                          Anteprima Messaggio
                        </span>
                        <p className="font-bold font-sans">📢 {newNotificationTitle || '(Inserisci un titolo...)'}</p>
                        <p className="whitespace-pre-line mt-1.5 leading-relaxed text-slate-700">
                          {newNotificationMessage || '(Inserisci il testo dettagliato...)'}
                        </p>
                        <span className="text-[8px] text-slate-400 block text-right mt-1.5">
                          {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                      {newNotificationRecipientId === 'all' ? (
                        <div className="space-y-3">
                          <a
                            href={getWhatsAppGroupLink(newNotificationTitle || '(Messaggio)', newNotificationMessage || '(Testo)')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                          >
                            <span>👥</span> Invia sul gruppo WhatsApp
                          </a>

                          <div className="border-t border-slate-200 pt-3">
                            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">
                              Oppure invia ai singoli coach:
                            </span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                              {coaches.filter(c => !c.isAdmin).length === 0 ? (
                                <span className="text-xs text-slate-400 italic">Nessun coach configurato.</span>
                              ) : (
                                coaches.filter(c => !c.isAdmin).map(c => {
                                  const link = c.phone ? getWhatsAppLink(c.phone, newNotificationTitle || '(Messaggio)', newNotificationMessage || '(Testo)') : '';
                                  return (
                                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-150 text-xs shadow-3xs">
                                      <span className="font-bold text-slate-700">{c.name}</span>
                                      {link ? (
                                        <a
                                          href={link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-3 py-1 rounded-md transition-all border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>💬</span> Invia
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-red-500 italic font-semibold">Senza telefono</span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(() => {
                            const selectedCoach = coaches.find(c => c.id === newNotificationRecipientId);
                            if (!selectedCoach) {
                              return <span className="text-xs text-slate-400 italic">Nessun destinatario selezionato.</span>;
                            }
                            const waLink = selectedCoach.phone ? getWhatsAppLink(selectedCoach.phone, newNotificationTitle || '(Messaggio)', newNotificationMessage || '(Testo)') : '';
                            return (
                              <div className="space-y-2">
                                {waLink ? (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                                  >
                                    <span>💬</span> Invia a {selectedCoach.name} su WhatsApp
                                  </a>
                                ) : (
                                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                                    ⚠️ Il coach <strong>{selectedCoach.name}</strong> non ha inserito un numero di cellulare nelle sue impostazioni.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Screen Tabs Switcher */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3.5 border-b-2 text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-base">🏠</span>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('viso')}
            className={`px-6 py-3.5 border-b-2 text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'viso'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-base">🌸</span>
            Trattamenti Viso
          </button>
          <button
            onClick={() => setActiveTab('corpo')}
            className={`px-6 py-3.5 border-b-2 text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'corpo'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-base">⚖️</span>
            Valutazioni Corporee
          </button>
          {isAdminMode && (
            <button
              onClick={() => setActiveTab('resoconto')}
              className={`px-6 py-3.5 border-b-2 text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'resoconto'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-base">📊</span>
              Resoconto Giorno per Giorno
            </button>
          )}
        </div>

        {/* 2. Calendar Week Navigation & Controls Dashboard */}
        {activeTab !== 'dashboard' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Week Nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
                title="Settimana Precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center px-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PIANIFICAZIONE</span>
                <span className="font-display font-bold text-base text-slate-800">
                  Settimana del {selectedMonday && formatItalianDate(selectedMonday)}
                </span>
              </div>

              <button
                onClick={handleNextWeek}
                disabled={isNextWeekDisabled()}
                className={`p-2 rounded-xl border transition-all ${
                  isNextWeekDisabled()
                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                    : 'hover:bg-slate-100 border-slate-200 text-slate-600 cursor-pointer'
                }`}
                title={isNextWeekDisabled() ? "Settimane successive bloccate dall'amministratore" : "Settimana Successiva"}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleResetToCurrentWeek}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold ml-2 underline px-1"
              >
                Oggi
              </button>
            </div>

            {/* Action buttons & Rules Explanations Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              
              {activeTab === 'viso' ? (
                <>
                  {/* Priority explanation toggle */}
                  <button
                    onClick={() => setShowRulesExplanation(!showRulesExplanation)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      showRulesExplanation 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>Regole Priorità</span>
                  </button>

                  {/* Custom Slot (Flexible Turn) Adder */}
                  {isAdminMode && (
                    <button
                      onClick={() => setShowCustomSlotModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Nuovo Turno Settimanale
                    </button>
                  )}
                </>
              ) : activeTab === 'corpo' ? (
                <button
                  onClick={() => {
                    setCorpoTime('09:00');
                    setCorpoGuestName('');
                    setCorpoNotes('');
                    setShowCorpoBookingModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Prenota Valutazione Corporea
                </button>
              ) : null}

            </div>

          </section>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Benvenuto & Resoconto Personale */}
            <PersonalReport
              currentCoachId={currentCoachId}
              coaches={coaches}
              summaries={summaries}
              corpoBookings={corpoBookings}
              allBookings={allBookings}
              getCoachColorClasses={getCoachColorClasses}
            />

            {/* Operator earnings tracker under the welcome/active stats report */}
            {renderEarningsTracker(isAdminMode)}

            {/* 2. Unified Clean Weekly Calendar Overview */}
            <CompactWeeklyCalendar
              isLoading={isLoading}
              groupedSlots={groupedSlots}
              sortedDates={sortedDates}
              coaches={coaches}
              getCoachColorClasses={getCoachColorClasses}
            />
          </div>
        )}

        {/* 3. Priority Algorithm Explanation Box */}
        {activeTab === 'viso' && showRulesExplanation && (
          <section className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3 animate-slide-down">
            <h3 className="font-display font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Algoritmo Automatico di Assegnazione Posti & Riserve (Coda)
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Il club mette a disposizione un massimo di <strong>15 postazioni</strong> per ogni fascia oraria di trattamento.
              Per garantire un'assegnazione equa a tutti i coach, l'applicazione applica in tempo reale queste regole:
            </p>
            <ul className="text-xs text-amber-800 space-y-1.5 list-disc pl-5">
              <li>
                <strong>Soglia Coach (4 Ospiti):</strong> Ogni coach ha diritto a registrare fino a 4 ospiti prioritari per turno. Dal 5° ospite in poi, vengono catalogati automaticamente come &quot;Riserva&quot; (Coda).
              </li>
              <li>
                <strong>Ribilanciamento Automatico:</strong> Se un turno è pieno (15 persone registrate), ma un coach ha meno di 4 ospiti confermati, i suoi ospiti in coda saltano automaticamente la fila, prendendo la priorità rispetto ai quinti o sesti ospiti di coach che hanno già saturato la loro soglia di 4.
              </li>
              <li>
                <strong>Esempio Pratico:</strong> Se Lorenzo ha 4 ospiti confermati e 1 in riserva, e Anna ha solo 2 ospiti registrati, il 3° ospite inserito da Anna passerà <strong>automaticamente in cima</strong>, diventando confermato e mandando in riserva il 5° ospite di Lorenzo, perché Anna non ha ancora raggiunto la quota di 4 ospiti.
              </li>
              <li>
                <strong>Trasparenza Totale:</strong> Non serve spostare nessuno manualmente. Basta aggiungere o rimuovere ospiti: l'app ricalcola all'istante l'ordine di entrata e la coda in base alle prenotazioni inserite!
              </li>
            </ul>
          </section>
        )}

        {activeTab === 'viso' && (
          <>
            {/* 4. Filters & Search Section */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Trattamento Selezionato:
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <span>🌸</span> Trattamenti Viso (15 postazioni per fascia)
                </span>
              </div>

              {/* Coach filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Ospiti di:</span>
                <select
                  value={coachFilter}
                  onChange={(e) => setCoachFilter(e.target.value)}
                  className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-48"
                >
                  <option value="all">Tutti i Coach</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>Solo {c.name}</option>
                  ))}
                </select>
              </div>

            </section>

            {/* 5. Calendar Dynamic Scheduler */}
            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-xs text-center space-y-4">
                <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Recupero del calendario del club in corso...</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-xs text-center space-y-4">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-display font-bold text-slate-700 text-lg">Nessun turno disponibile</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Non ci sono turni standard o personalizzati configurati per questa settimana.{isAdminMode && ' Clicca su "Nuovo Turno Settimanale" per aggiungerne uno personalizzato!'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map(dateStr => {
                  const daySlots = groupedSlots[dateStr];
                  const isStandardDay = ['Lunedì', 'Mercoledì', 'Venerdì'].includes(getItalianDayName(dateStr));
                  
                  return (
                    <div key={dateStr} className="space-y-4 animate-fade-in">
                      
                      {/* Day Header Banner */}
                      <div className="flex items-baseline gap-3 border-b border-slate-200 pb-2">
                        <h3 className="font-display font-extrabold text-xl text-slate-800">
                          {getItalianDayName(dateStr)}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">
                          {formatItalianDate(dateStr)}
                        </span>
                        {!isStandardDay && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                            Turno flessibile straordinario
                          </span>
                        )}
                      </div>

                      {/* Day's Slots Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {daySlots.map(slot => {
                          // Filter bookings shown by selected coach filter
                          let displayBookings = slot.bookings;
                          if (coachFilter !== 'all') {
                            displayBookings = slot.bookings.filter(b => b.coachId === coachFilter);
                          }

                          const isFull = slot.confirmedCount >= 15;
                          const treatmentLabel = slot.treatmentType === 'viso' ? 'Trattamento Viso' : 'Valutazione Corporea';
                          const treatmentEmoji = slot.treatmentType === 'viso' ? '🌸' : '⚖️';
                          
                          return (
                            <div 
                              id={`slot-card-${slot.slotId}`}
                              key={slot.slotId}
                              className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 ${
                                isFull ? 'border-amber-200 ring-2 ring-amber-500/5' : 'border-slate-200/80'
                              }`}
                            >
                              
                              {/* Slot Header */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                                      {treatmentEmoji} {treatmentLabel}
                                    </span>
                                    {slotRestrictions[slot.slotId] && slotRestrictions[slot.slotId].length > 0 && (
                                      <span 
                                        className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 cursor-help"
                                        title={`Visibilità limitata a: ${slotRestrictions[slot.slotId].map(id => coaches.find(c => c.id === id)?.name || id).join(', ')}`}
                                      >
                                        <Lock className="w-2.5 h-2.5" /> Riservato
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {isAdminMode && (
                                      <button
                                        onClick={() => setShowSlotRestrictionModal(slot)}
                                        className={`p-1 rounded-md transition-all cursor-pointer ${
                                          slotRestrictions[slot.slotId] && slotRestrictions[slot.slotId].length > 0
                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                        title="Modifica visibilità turno (Solo Admin)"
                                      >
                                        <Shield className="w-3 h-3" />
                                      </button>
                                    )}
                                    {slot.isCustom && (
                                      <button
                                        onClick={() => handleDeleteCustomSlot(slot.slotId, `${getItalianDayName(slot.date)} alle ${slot.time}`)}
                                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                        title="Elimina Turno Flessibile"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      {slot.time}
                                    </span>
                                  </div>
                                </div>

                                {/* Capacity status meter */}
                                <div className="space-y-1.5 mt-3">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className={`${isFull ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                                      {isFull ? 'Turno al Completo' : 'Posti Disponibili'}
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {slot.confirmedCount} / 15 confermati
                                      {slot.reserveCount > 0 && ` (+${slot.reserveCount} riserve)`}
                                    </span>
                                  </div>
                                  
                                  {/* Sleek multi-color Progress Bar */}
                                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    {/* Confirmed spots proportion */}
                                    <div 
                                      className={`h-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                      style={{ width: `${Math.min(100, (slot.confirmedCount / 15) * 100)}%` }}
                                    />
                                    {/* Waitlist proportion */}
                                    {slot.reserveCount > 0 && (
                                      <div 
                                        className="h-full bg-slate-400 transition-all duration-500" 
                                        style={{ width: `${Math.min(100, (slot.reserveCount / 15) * 100)}%` }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Slot Guest list */}
                              <div className="flex-1 space-y-2 py-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  ELENCO PRENOTATI ({displayBookings.length})
                                </span>
                                
                                {displayBookings.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                                    Nessun ospite prenotato per questo turno.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                    {/* 1. Confirmed bookings list mapped to their stations (Postazioni 1-15) */}
                                    <div className="space-y-1">
                                      {Array.from({ length: 15 }).map((_, i) => {
                                        const postNum = i + 1;
                                        const confirmedList = slot.bookings.filter(b => b.status === 'confermato');
                                        const booking = confirmedList[i];
                                        
                                        // If coach filter is active, check if this booking belongs to that coach
                                        if (booking && coachFilter !== 'all' && booking.coachId !== coachFilter) {
                                          return null;
                                        }

                                        if (!booking) {
                                          // If no booking at this station and we are filtering by a specific coach, hide empty stations to keep the view clean.
                                          // Otherwise, if showing all coaches, show it as Libera.
                                          if (coachFilter !== 'all') {
                                            return null;
                                          }
                                          return (
                                            <div 
                                              key={`post-${postNum}`}
                                              className="p-1.5 px-2.5 rounded-lg border border-dashed border-slate-200/60 bg-slate-50/20 flex items-center justify-between text-[11px] text-slate-400"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 text-[9px] min-w-[20px] text-center">
                                                  {postNum}
                                                </span>
                                                <span className="italic text-slate-400/80">Postazione Libera</span>
                                              </div>
                                            </div>
                                          );
                                        }

                                        const guestCoach = coaches.find(c => c.id === booking.coachId);
                                        const coachStyles = getCoachColorClasses(guestCoach?.color || 'indigo');
                                         return (
                                          <div 
                                            key={booking.id}
                                            className="p-2 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-200/85 transition-all"
                                          >
                                            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                              {/* Postazione Number Badge */}
                                              <span className={`font-mono font-extrabold text-white rounded px-2 py-0.5 text-[10px] min-w-[24px] text-center shrink-0 ${coachStyles.solid}`}>
                                                {postNum}
                                              </span>
                                              
                                              <div className="flex-1 min-w-0">
                                                {editingBookingId === booking.id ? (
                                                  <div className="flex items-center gap-1.5 py-0.5 max-w-sm">
                                                    <input
                                                      type="text"
                                                      value={editingGuestName}
                                                      onChange={(e) => setEditingGuestName(e.target.value)}
                                                      className="text-xs font-bold text-slate-800 px-1.5 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full bg-white"
                                                      autoFocus
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveBookingName(booking.id, booking.coachId);
                                                        if (e.key === 'Escape') { setEditingBookingId(null); setEditingGuestName(''); }
                                                      }}
                                                    />
                                                    <button
                                                      onClick={() => handleSaveBookingName(booking.id, booking.coachId)}
                                                      className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-slate-100 shrink-0"
                                                      title="Salva"
                                                    >
                                                      <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => { setEditingBookingId(null); setEditingGuestName(''); }}
                                                      className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 shrink-0"
                                                      title="Annulla"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-slate-800 truncate block">
                                                      {booking.guestName}
                                                    </span>
                                                    {(booking.coachId === currentCoachId || isAdminMode) && (
                                                      <button
                                                        onClick={() => {
                                                          setEditingBookingId(booking.id);
                                                          setEditingGuestName(booking.guestName);
                                                        }}
                                                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                                        title="Modifica nome ospite"
                                                      >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
 
                                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 flex-wrap">
                                                  <span className={`px-1.5 py-0.2 rounded-xs font-semibold border ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}>
                                                    Coach {guestCoach?.name || 'Sconosciuto'}
                                                  </span>
                                                  <span className="text-slate-400">
                                                    Ospite #{booking.coachIndex + 1}
                                                  </span>
                                                  {booking.notes && (
                                                    <span className="text-slate-400 italic truncate max-w-[130px]" title={booking.notes}>
                                                      &quot;{booking.notes}&quot;
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
 
                                            {/* Deletion icon */}
                                            {(booking.coachId === currentCoachId || isAdminMode) && editingBookingId !== booking.id && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteBooking(booking.id, booking.guestName, booking.coachId)}
                                                className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                                                title="Elimina Prenotazione"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* 2. Waitlist/Reserves section if any */}
                                    {(() => {
                                      let reserves = slot.bookings.filter(b => b.status === 'riserva');
                                      if (coachFilter !== 'all') {
                                        reserves = reserves.filter(b => b.coachId === coachFilter);
                                      }

                                      if (reserves.length === 0) return null;

                                      return (
                                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 uppercase tracking-wider inline-block">
                                              ⚠️ LISTA D&apos;ATTESA (RISERVE)
                                            </span>
                                            <span className="text-[9px] font-bold text-amber-600">
                                              {reserves.length} in attesa
                                            </span>
                                          </div>
                                          <div className="space-y-1">
                                            {reserves.map((booking) => {
                                              const guestCoach = coaches.find(c => c.id === booking.coachId);
                                              const coachStyles = getCoachColorClasses(guestCoach?.color || 'indigo');

                                              return (
                                                <div 
                                                  key={booking.id}
                                                  className="p-2 rounded-xl border border-amber-100/50 bg-amber-50/10 flex items-center justify-between gap-2 transition-all"
                                                >
                                                  <div className="flex-1 min-w-0">
                                                    {editingBookingId === booking.id ? (
                                                      <div className="flex items-center gap-1.5 py-0.5 max-w-sm">
                                                        <input
                                                          type="text"
                                                          value={editingGuestName}
                                                          onChange={(e) => setEditingGuestName(e.target.value)}
                                                          className="text-xs font-bold text-slate-800 px-1.5 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full bg-white"
                                                          autoFocus
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveBookingName(booking.id);
                                                            if (e.key === 'Escape') { setEditingBookingId(null); setEditingGuestName(''); }
                                                          }}
                                                        />
                                                        <button
                                                          onClick={() => handleSaveBookingName(booking.id)}
                                                          className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-slate-100 shrink-0"
                                                          title="Salva"
                                                        >
                                                          <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                          onClick={() => { setEditingBookingId(null); setEditingGuestName(''); }}
                                                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 shrink-0"
                                                          title="Annulla"
                                                        >
                                                          <X className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-amber-900 truncate block">
                                                          {booking.guestName}
                                                        </span>
                                                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-bold px-1 rounded-full inline-flex items-center gap-0.5">
                                                          <Clock className="w-2.5 h-2.5" /> Riserva
                                                         </span>
                                                         {(booking.coachId === currentCoachId || isAdminMode) && (
                                                          <button
                                                            onClick={() => {
                                                              setEditingBookingId(booking.id);
                                                              setEditingGuestName(booking.guestName);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                                            title="Modifica nome ospite"
                                                          >
                                                            <Pencil className="w-2.5 h-2.5" />
                                                          </button>
                                                        )}
                                                      </div>
                                                    )}
 
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500">
                                                      <span className={`px-1 rounded-xs font-semibold border ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}>
                                                        Coach {guestCoach?.name || 'Sconosciuto'}
                                                      </span>
                                                      <span className="text-slate-400">
                                                        Ospite #{booking.coachIndex + 1}
                                                      </span>
                                                    </div>
                                                    {booking.notes && (
                                                      <p className="text-[9px] text-slate-400 mt-0.5 italic line-clamp-1" title={booking.notes}>
                                                        &quot;{booking.notes}&quot;
                                                      </p>
                                                    )}
                                                  </div>
 
                                                  {(booking.coachId === currentCoachId || isAdminMode) && editingBookingId !== booking.id && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteBooking(booking.id, booking.guestName, booking.coachId)}
                                                      className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                                                      title="Elimina Prenotazione"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>

                              {/* Quick booking trigger */}
                              <div className="pt-2 border-t border-slate-100">
                                {activeCoach ? (
                                  <button
                                    onClick={() => setActiveBookingSlot(slot)}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                                      getCoachColorClasses(activeCoach.color).bg
                                    } ${getCoachColorClasses(activeCoach.color).text} hover:opacity-90`}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    Prenota come {activeCoach.name}
                                  </button>
                                ) : (
                                  <p className="text-center text-xs text-slate-400">Seleziona un coach in alto per prenotare</p>
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
          </>
        )}

        {activeTab === 'corpo' && (
          <>
            {/* 4. Days of the week horizontal selector bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {weekDates.map((dateStr) => {
                const dayName = getItalianDayName(dateStr);
                const isSelected = selectedCorpoDate === dateStr;
                const dayBookings = corpoBookings.filter(b => {
                  const parts = b.slotId.split('_');
                  return parts[1] === dateStr;
                });
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCorpoDate(dateStr)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10 scale-102 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                      {dayName}
                    </span>
                    <span className="text-base font-extrabold mt-1">
                      {new Date(dateStr).getDate()} {new Date(dateStr).toLocaleDateString('it-IT', { month: 'short' })}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {dayBookings.length} {dayBookings.length === 1 ? 'valutazione' : 'valutazioni'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SELETTORE FASCE ORARIE OGNI 30 MINUTI (NEW) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                    <span>⏰</span> Fasce Orarie (Ogni 30 Minuti)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clicca su una fascia per visualizzarla, prenotarla o gestirla per {getItalianDayName(selectedCorpoDate)} {formatItalianDate(selectedCorpoDate)}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {(() => {
                  const slots30Min = [
                    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
                    '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
                    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                  ];

                  // Helper function to get status of slot
                  const getSlotStatus = (timeStr: string) => {
                    const [h, m] = timeStr.split(':').map(Number);
                    const minutes = h * 60 + m;

                    const d = new Date(selectedCorpoDate);
                    const dayOfWeek = d.getDay(); // 0: Dom, 1: Lun, ...
                    const isMonWedFri = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
                    const isMonWedFriAfternoon = isMonWedFri && (minutes >= 840); // 14:00 on is 840 mins

                    const slotId = `corpo_${selectedCorpoDate}_${timeStr}`;
                    const directBookings = corpoBookings.filter(b => b.slotId === slotId);

                    if (isMonWedFriAfternoon) {
                      // 1 person every 40 minutes rule. Check overlap within same day.
                      const overlapBooking = corpoBookings.find(b => {
                        const parts = b.slotId.split('_');
                        const otherDate = parts[1];
                        if (otherDate !== selectedCorpoDate) return false;
                        const otherTime = parts[2];
                        const [oh, om] = otherTime.split(':').map(Number);
                        const otherMinutes = oh * 60 + om;
                        return Math.abs(minutes - otherMinutes) < 40;
                      });

                      if (overlapBooking) {
                        const isDirect = overlapBooking.slotId === slotId;
                        return {
                          type: isDirect ? 'direct_booked' : 'overlap_locked',
                          bookings: [overlapBooking],
                          maxCapacity: 1,
                          isMonWedFriAfternoon: true,
                          label: isDirect ? `Occupato` : `Bloccato (${overlapBooking.slotId.split('_')[2]})`,
                          overlapTime: overlapBooking.slotId.split('_')[2],
                          guestName: overlapBooking.guestName
                        };
                      }

                      return {
                        type: 'free',
                        bookings: [],
                        maxCapacity: 1,
                        isMonWedFriAfternoon: true,
                        label: 'Libero'
                      };
                    } else {
                      // Normal slot: up to 3 people in contemporanea
                      if (directBookings.length >= 3) {
                        return {
                          type: 'full',
                          bookings: directBookings,
                          maxCapacity: 3,
                          isMonWedFriAfternoon: false,
                          label: 'Al completo'
                        };
                      } else if (directBookings.length > 0) {
                        return {
                          type: 'partially_booked',
                          bookings: directBookings,
                          maxCapacity: 3,
                          isMonWedFriAfternoon: false,
                          label: `${directBookings.length}/3 Prenotati`
                        };
                      } else {
                        return {
                          type: 'free',
                          bookings: [],
                          maxCapacity: 3,
                          isMonWedFriAfternoon: false,
                          label: 'Libero'
                        };
                      }
                    }
                  };

                  return slots30Min.map(timeStr => {
                    const status = getSlotStatus(timeStr);
                    const isSelected = corpoTime === timeStr;

                    let buttonClasses = 'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ';
                    let labelContent = '';

                    if (status.type === 'direct_booked') {
                      buttonClasses += isSelected
                        ? 'bg-amber-600 border-amber-600 text-white font-bold scale-102 shadow-xs'
                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
                      labelContent = `👤 ${status.guestName}`;
                    } else if (status.type === 'overlap_locked') {
                      buttonClasses += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      labelContent = `🚫 Sovra. ${status.overlapTime}`;
                    } else if (status.type === 'full') {
                      buttonClasses += 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100';
                      labelContent = '👥 Al completo';
                    } else if (status.type === 'partially_booked') {
                      buttonClasses += isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold scale-102'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70';
                      labelContent = `👥 ${status.bookings.length}/3 Prenotati`;
                    } else {
                      buttonClasses += isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold scale-102'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                      labelContent = 'Libero';
                    }

                    return (
                      <button
                        key={timeStr}
                        type="button"
                        onClick={() => {
                          setCorpoTime(timeStr);
                          if (status.type === 'direct_booked') {
                            setSuccessMessage(`Fascia delle ore ${timeStr} occupata da ${status.guestName}`);
                            setTimeout(() => setSuccessMessage(''), 3000);
                          } else if (status.type === 'overlap_locked') {
                            setErrorMessage(`Questa fascia oraria si sovrappone a una valutazione già prenotata per le ore ${status.overlapTime}. Il lunedì, mercoledì e venerdì dalle 14:00 in poi è consentita solo 1 valutazione ogni 40 minuti.`);
                            setTimeout(() => setErrorMessage(''), 5000);
                          } else if (status.type === 'full') {
                            setErrorMessage(`Questa fascia oraria ha già raggiunto il limite massimo di 3 prenotazioni in contemporanea.`);
                            setTimeout(() => setErrorMessage(''), 4000);
                          } else {
                            // Partially booked or free
                            setCorpoGuestName('');
                            setCorpoNotes('');
                            setShowCorpoBookingModal(true);
                          }
                        }}
                        className={buttonClasses}
                      >
                        <span className="text-xs font-bold font-mono">{timeStr}</span>
                        <span className="text-[9px] font-bold mt-1 truncate max-w-full block">
                          {labelContent}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 5. Timeline for Corpo Tab */}
            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-xs text-center space-y-4">
                <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Recupero del calendario del club in corso...</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
                      <span>⚖️</span> Valutazioni Corporee di {getItalianDayName(selectedCorpoDate)} {formatItalianDate(selectedCorpoDate)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Lunedì, mercoledì e venerdì dalle 14:00 in poi: max 1 persona ogni 40 minuti. Altri orari/giorni: fino a 3 persone in contemporanea.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Coach filter inside Corpo tab */}
                    <select
                      value={coachFilter}
                      onChange={(e) => setCoachFilter(e.target.value)}
                      className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-40"
                    >
                      <option value="all">Tutti i Coach</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>Solo {c.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setCorpoTime('09:00');
                        setCorpoGuestName('');
                        setCorpoNotes('');
                        setShowCorpoBookingModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Prenota Valutazione
                    </button>
                  </div>
                </div>

                {/* Filtered evaluations list */}
                {(() => {
                  let filteredCorpo = corpoBookings.filter(b => {
                    const parts = b.slotId.split('_');
                    return parts[1] === selectedCorpoDate;
                  });

                  if (coachFilter !== 'all') {
                    filteredCorpo = filteredCorpo.filter(b => b.coachId === coachFilter);
                  }

                  // Sort chronological by time
                  filteredCorpo.sort((a, b) => {
                    const timeA = a.slotId.split('_')[2];
                    const timeB = b.slotId.split('_')[2];
                    return timeA.localeCompare(timeB);
                  });

                  if (filteredCorpo.length === 0) {
                    return (
                      <div className="text-center py-16 space-y-4">
                        <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                          <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700">Nessuna valutazione corporea</p>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Non ci sono valutazioni registrate per questa giornata. Lunedì, mercoledì e venerdì pomeriggio: max 1 persona ogni 40m. Altri giorni/orari: max 3 persone in contemporanea.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCorpoTime('09:00');
                            setCorpoGuestName('');
                            setCorpoNotes('');
                            setShowCorpoBookingModal(true);
                          }}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-emerald-200 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Prenota la Prima Ora
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-5 py-2">
                      {filteredCorpo.map(b => {
                        const timeStr = b.slotId.split('_')[2];
                        const bCoach = coaches.find(c => c.id === b.coachId);
                        const coachStyles = getCoachColorClasses(bCoach?.color || 'indigo');

                        return (
                          <div key={b.id} className="relative group">
                            {/* Timeline circle dot */}
                            <span className={`absolute -left-[33px] top-2.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-slate-100 flex items-center justify-center ${coachStyles.solid}`} />

                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                    {timeStr}
                                  </span>
                                  {editingBookingId === b.id ? (
                                    <div className="flex items-center gap-1.5 py-0.5">
                                      <input
                                        type="text"
                                        value={editingGuestName}
                                        onChange={(e) => setEditingGuestName(e.target.value)}
                                        className="text-xs font-bold text-slate-800 px-1.5 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-[150px] bg-white"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveBookingName(b.id);
                                          if (e.key === 'Escape') { setEditingBookingId(null); setEditingGuestName(''); }
                                        }}
                                      />
                                      <button
                                        onClick={() => handleSaveBookingName(b.id)}
                                        className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-slate-200/50 shrink-0"
                                        title="Salva"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => { setEditingBookingId(null); setEditingGuestName(''); }}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 shrink-0"
                                        title="Annulla"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-sm font-bold text-slate-900">{b.guestName}</h4>
                                      {b.coachId === currentCoachId && (
                                        <button
                                          onClick={() => {
                                            setEditingBookingId(b.id);
                                            setEditingGuestName(b.guestName);
                                          }}
                                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                          title="Modifica nome ospite"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] border ${coachStyles.bg} ${coachStyles.text} ${coachStyles.border}`}>
                                    Coach {bCoach?.name || 'Sconosciuto'}
                                  </span>
                                </div>

                                {b.notes && (
                                  <p className="text-xs text-slate-500 italic bg-white/50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                                    &quot;{b.notes}&quot;
                                  </p>
                                )}
                              </div>

                              {b.coachId === currentCoachId && editingBookingId !== b.id && (
                                <button
                                  onClick={() => handleDeleteBooking(b.id, b.guestName)}
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer self-end sm:self-center"
                                  title="Annulla Valutazione"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {activeTab === 'resoconto' && (
          <AdminReport
            coaches={coaches}
            summaries={summaries}
            corpoBookings={corpoBookings}
            allBookings={allBookings}
            selectedMonday={selectedMonday}
            getCoachColorClasses={getCoachColorClasses}
            renderEarningsTracker={renderEarningsTracker}
          />
        )}

        {/* 6. Advanced Priority Rules Interactive Simulator Visualizer */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">GUIDA AL SISTEMA</span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-900">Automatico</span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mt-1">
                La Coda Equilibrata di Riserva
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Priorità garantita per chi ha meno ospiti attivi</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-xs text-emerald-400 font-mono">1</span>
                <span>Quota Prioritaria</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tutti i coach possono prenotare ospiti. I primi <strong>4 ospiti</strong> inseriti da ciascun coach hanno lo status prioritario di prenotazione, se ci sono ancora delle postazioni libere nel club.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-xs text-emerald-400 font-mono">2</span>
                <span>Attivazione Riserva</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quando il turno raggiunge le 15 postazioni, i successivi ospiti inseriti finiscono in lista d&apos;attesa. Ma se un coach che ha pochi ospiti ne inserisce uno, questo passa automaticamente davanti!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-xs text-emerald-400 font-mono">3</span>
                <span>Assegnazione Dinamica</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Se elimini un ospite, la coda si riordina da sola. Un ospite in lista d&apos;attesa del coach con meno clientela verrà immediatamente confermato per riempire il posto vuoto!
              </p>
            </div>

          </div>

          {/* Demonstration Diagram */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">Simulazione Grafica dell&apos;Assegnazione</span>
            
            <div className="flex flex-col md:flex-row items-stretch justify-around gap-4 text-xs">
              
              {/* Scenario */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex-1 space-y-2">
                <span className="font-bold text-slate-300 block text-center border-b border-slate-800 pb-1.5">Coach Lorenzo (4 ospiti)</span>
                <div className="space-y-1">
                  <div className="flex justify-between bg-emerald-950/40 border border-emerald-900/50 p-1 px-2 rounded text-[11px]">
                    <span className="text-emerald-400 font-bold">1° - 4° Ospite</span>
                    <span className="text-emerald-500">Confermati ✓</span>
                  </div>
                  <div className="flex justify-between bg-amber-950/40 border border-amber-900/50 p-1 px-2 rounded text-[11px]">
                    <span className="text-amber-400 font-bold">5° Ospite</span>
                    <span className="text-amber-500">In Riserva ⏱</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center font-bold text-emerald-400 py-2">
                <span>⚡️</span>
              </div>

              {/* Action */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex-1 space-y-2">
                <span className="font-bold text-slate-300 block text-center border-b border-slate-800 pb-1.5">Coach Anna (2 ospiti)</span>
                <div className="space-y-1">
                  <div className="flex justify-between bg-emerald-950/40 border border-emerald-900/50 p-1 px-2 rounded text-[11px]">
                    <span className="text-emerald-400 font-bold">1° e 2° Ospite</span>
                    <span className="text-emerald-500">Confermati ✓</span>
                  </div>
                  <div className="flex justify-between bg-emerald-950/40 border border-emerald-900/50 p-1 px-2 rounded text-[11px]">
                    <span className="text-emerald-300 font-bold">3° Ospite (Nuovo)</span>
                    <span className="text-emerald-400 font-bold">Salta la coda! ✓</span>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col justify-center text-center space-y-1">
                <span className="font-bold text-emerald-400">Esito Automatico:</span>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Il 3° ospite di Anna viene inserito direttamente nel club occupando un posto, mentre il 5° di Lorenzo aspetta in riserva perché Lorenzo ha già 4 ospiti attivi.
                </p>
              </div>

            </div>
          </div>
        </section>
        </>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 bg-white rounded-xl border border-slate-200/80 p-0 shadow-2xs hover:scale-105 transition-all">
          <img 
            src={logoUrl} 
            alt="The Wellness Hub Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <p className="font-bold text-slate-600">The Wellness Hub © 2026</p>
          <p className="mt-0.5 text-slate-400">Piattaforma intelligente di prenotazione per trattamenti viso e valutazioni corporee.</p>
        </div>
      </footer>

      {/* Global Datalist for Guest Autocomplete */}
      <datalist id="guest-names-datalist">
        {members.map(m => (
          <option key={m.id} value={m.name}>
            {m.coachId ? `Coach: ${coaches.find(c => c.id === m.coachId)?.name || ''}` : ''}
          </option>
        ))}
      </datalist>

      {/* 7. Modal: BOOK GUEST FORM */}
      {activeBookingSlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Nuova Prenotazione</h3>
                <p className="text-xs text-slate-500">
                  {activeBookingSlot.treatmentType === 'viso' ? '🌸 Trattamento Viso' : '⚖️ Valutazione Corporea'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setActiveBookingSlot(null);
                  setNewGuestName('');
                  setNewGuestNotes('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Data e Ora:</span>
                <span className="font-bold text-slate-800">
                  {getItalianDayName(activeBookingSlot.date)} {formatItalianDate(activeBookingSlot.date)} alle {activeBookingSlot.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Occupazione Attuale:</span>
                <span className="font-bold text-slate-800">
                  {activeBookingSlot.confirmedCount} / 15 confermati
                </span>
              </div>
              {activeCoach && (
                <div className="flex justify-between border-t border-slate-200/60 pt-1.5 mt-1">
                  <span className="font-semibold text-slate-500">Prenotato da Coach:</span>
                  <span className={`font-bold text-slate-800 flex items-center gap-1.5`}>
                    <span className={`w-2 h-2 rounded-full ${getCoachColorClasses(activeCoach.color).solid}`} />
                    {activeCoach.name}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome dell&apos;Ospite *</label>
                <input
                  list="guest-names-datalist"
                  type="text"
                  required
                  autoFocus
                  placeholder="Nome e Cognome ospite"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              {/* Reactive Payment Warnings */}
              {(() => {
                const paymentCheckNew = checkCoachPaymentStatus(currentCoachId);
                if (!paymentCheckNew) return null;
                
                if (paymentCheckNew.status === 'blocked') {
                  return (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2 animate-fade-in">
                      <span className="text-sm">⚠️</span>
                      <div className="flex-1">
                        <p className="font-bold">Socio non in regola con il pagamento!</p>
                        <p className="text-[11px] text-red-700 font-normal mt-0.5">
                          Il socio "{paymentCheckNew.member.name}" (associato a questo profilo coach) non ha versato la quota di {paymentCheckNew.monthLabel} (scaduta il 30). Non è abilitato a inserire prenotazioni nel sistema.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(paymentCheckNew.member, paymentCheckNew.ymKey)}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Paga Quota (€{paymentCheckNew.member.quotaAmount !== undefined ? paymentCheckNew.member.quotaAmount : quotaAmount})
                        </button>
                      </div>
                    </div>
                  );
                } else if (paymentCheckNew.status === 'reminder') {
                  return (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2 animate-fade-in">
                      <span className="text-sm">🔔</span>
                      <div className="flex-1">
                        <p className="font-bold">Promemoria quota in scadenza!</p>
                        <p className="text-[11px] text-amber-700 font-normal mt-0.5">
                          Ricorda al socio "{paymentCheckNew.member.name}" (associato a questo profilo coach) di saldare la quota di {paymentCheckNew.monthLabel} entro il 30.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(paymentCheckNew.member, paymentCheckNew.ymKey)}
                          className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Paga Quota (€{paymentCheckNew.member.quotaAmount !== undefined ? paymentCheckNew.member.quotaAmount : quotaAmount})
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Note / Richieste Particolari (Opzionale)</label>
                <textarea
                  placeholder="Es. pelle sensibile, prima volta, preferenze particolari..."
                  value={newGuestNotes}
                  onChange={(e) => setNewGuestNotes(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100/50 flex gap-2 items-start text-[11px] text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  L&apos;ospite verrà automaticamente confermato o inserito in riserva in base alle altre prenotazioni inserite per questo turno e alle quote attive dei coach.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBookingSlot(null);
                    setNewGuestName('');
                    setNewGuestNotes('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newGuestName.trim() || checkCoachPaymentStatus(currentCoachId)?.status === 'blocked'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  Confirmata Prenotazione
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. Modal: ADD CUSTOM WEEKLY FLEXIBLE SLOT */}
      {showCustomSlotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Aggiungi Turno Straordinario</h3>
                <p className="text-xs text-slate-500">Crea una fascia oraria flessibile per la settimana</p>
              </div>
              <button 
                onClick={() => setShowCustomSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomSlot} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Trattamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomSlotType('viso')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      customSlotType === 'viso' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🌸</span> Trattamento Viso
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomSlotType('corpo')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      customSlotType === 'corpo' 
                        ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/10' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>⚖️</span> Valutazione Corporea
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Data del Turno</label>
                <input
                  type="date"
                  required
                  value={customSlotDate}
                  onChange={(e) => setCustomSlotDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Suggerimento: I turni standard Lun, Mer e Ven (15:00, 17:00, 19:00) sono già attivi per impostazione predefinita.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Orario d&apos;inizio</label>
                <select
                  value={customSlotTime}
                  onChange={(e) => setCustomSlotTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none"
                >
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomSlotModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !customSlotDate}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  Aggiungi Turno
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 9. Modal: ADMIN PASSWORD LOGIN */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-red-600" /> Accesso Amministratore
              </h3>
              <button 
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setAdminPasswordInput('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Inserisci Password Amministratore</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Password Amministratore"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-red-500/25 focus:border-red-500 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLoginModal(false);
                    setAdminPasswordInput('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" /> Accedi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: COACH PIN VERIFICATION */}
      {showPinVerifyModal && pendingCoachId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-emerald-600" /> Verifica Identità Coach
              </h3>
              <button 
                onClick={() => {
                  setShowPinVerifyModal(false);
                  setPendingCoachId(null);
                  setPinInput('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              L'utenza di <strong>{coaches.find(c => c.id === pendingCoachId)?.name}</strong> è protetta da PIN. Inserisci il codice a 4 cifre per autenticarti.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Inserisci il PIN di Sicurezza</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="[0-9]*"
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-lg tracking-widest font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinVerifyModal(false);
                    setPendingCoachId(null);
                    setPinInput('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Verifica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Modal: SLOT VISIBILITY RESTRICTIONS */}
      {showSlotRestrictionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-amber-600" /> Restrizioni Visibilità Turno
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Definisci quali coach possono visualizzare e prenotare questo turno</p>
              </div>
              <button 
                onClick={() => setShowSlotRestrictionModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Giorno e Fascia Oraria:</span>
                <span className="font-bold text-slate-800">
                  {getItalianDayName(showSlotRestrictionModal.date)} {formatItalianDate(showSlotRestrictionModal.date)} alle {showSlotRestrictionModal.time}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Seleziona i Coach Abilitati a visualizzare:</label>
              
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {coaches.map(c => {
                  const isChecked = (slotRestrictions[showSlotRestrictionModal.slotId] || []).includes(c.id);
                  return (
                    <label 
                      key={c.id} 
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getCoachColorClasses(c.color).solid}`} />
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentAllowed = slotRestrictions[showSlotRestrictionModal.slotId] || [];
                          let nextAllowed: string[];
                          if (e.target.checked) {
                            nextAllowed = [...currentAllowed, c.id];
                          } else {
                            nextAllowed = currentAllowed.filter(id => id !== c.id);
                          }
                          setSlotRestrictions({
                            ...slotRestrictions,
                            [showSlotRestrictionModal.slotId]: nextAllowed
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">Nota: se nessun coach viene selezionato, il turno sarà considerato di pubblico accesso (visibile a tutti).</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSlotRestrictionModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  const allowedList = slotRestrictions[showSlotRestrictionModal.slotId] || [];
                  handleSaveSlotRestrictions(showSlotRestrictionModal.slotId, allowedList);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Salva Restrizioni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Modal: ADD CORPO BOOKING (VALUTAZIONI CORPOREE) */}
      {showCorpoBookingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <span>⚖️</span> Nuova Valutazione Corporea
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fissa un appuntamento per {getItalianDayName(selectedCorpoDate)} {formatItalianDate(selectedCorpoDate)} alle ore {corpoTime}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowCorpoBookingModal(false);
                  setCorpoGuestName('');
                  setCorpoNotes('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCorpoBooking} className="space-y-4">
              {/* Coach Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Coach Operatore</label>
                <select
                  value={currentCoachId}
                  onChange={(e) => setCurrentCoachId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50 font-semibold"
                >
                  <option value="">Seleziona Coach...</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome Ospite / Cliente</label>
                <input
                  list="guest-names-datalist"
                  type="text"
                  required
                  autoFocus
                  placeholder="E.g., Maria Rossi"
                  value={corpoGuestName}
                  onChange={(e) => setCorpoGuestName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              {/* Reactive Payment Warnings */}
              {(() => {
                const paymentCheckCorpo = checkCoachPaymentStatus(currentCoachId);
                if (!paymentCheckCorpo) return null;
                
                if (paymentCheckCorpo.status === 'blocked') {
                  return (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2 animate-fade-in">
                      <span className="text-sm">⚠️</span>
                      <div className="flex-1">
                        <p className="font-bold">Socio non in regola con il pagamento!</p>
                        <p className="text-[11px] text-red-700 font-normal mt-0.5">
                          Il socio "{paymentCheckCorpo.member.name}" (associato a questo profilo coach) non ha versato la quota di {paymentCheckCorpo.monthLabel} (scaduta il 30). Non è abilitato a inserire prenotazioni nel sistema.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(paymentCheckCorpo.member, paymentCheckCorpo.ymKey)}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Paga Quota (€{paymentCheckCorpo.member.quotaAmount !== undefined ? paymentCheckCorpo.member.quotaAmount : quotaAmount})
                        </button>
                      </div>
                    </div>
                  );
                } else if (paymentCheckCorpo.status === 'reminder') {
                  return (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2 animate-fade-in">
                      <span className="text-sm">🔔</span>
                      <div className="flex-1">
                        <p className="font-bold">Promemoria quota in scadenza!</p>
                        <p className="text-[11px] text-amber-700 font-normal mt-0.5">
                          Ricorda al socio "{paymentCheckCorpo.member.name}" (associato a questo profilo coach) di saldare la quota di {paymentCheckCorpo.monthLabel} entro il 30.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(paymentCheckCorpo.member, paymentCheckCorpo.ymKey)}
                          className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          Paga Quota (€{paymentCheckCorpo.member.quotaAmount !== undefined ? paymentCheckCorpo.member.quotaAmount : quotaAmount})
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Note / Obiettivi (Opzionale)</label>
                <textarea
                  placeholder="E.g., Impedenziometria, consigli alimentari, prima visita..."
                  value={corpoNotes}
                  onChange={(e) => setCorpoNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none h-20 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCorpoBookingModal(false);
                    setCorpoGuestName('');
                    setCorpoNotes('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !corpoGuestName.trim() || !currentCoachId || checkCoachPaymentStatus(currentCoachId)?.status === 'blocked'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Prenota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: COACH SELF-REGISTRATION */}
      {showCoachRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Registrati come Coach
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Invia la tua richiesta di registrazione all'amministratore</p>
              </div>
              <button 
                onClick={() => {
                  setShowCoachRegisterModal(false);
                  setRegName('');
                  setRegPhone('');
                  setRegEmail('');
                  setRegSponsor('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCoachRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Mario Rossi"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Cellulare *</label>
                <input
                  type="tel"
                  required
                  placeholder="E.g., +39 333 1234567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="E.g., mario.rossi@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome Sponsor *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Luigi Verdi"
                  value={regSponsor}
                  onChange={(e) => setRegSponsor(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCoachRegisterModal(false);
                    setRegName('');
                    setRegPhone('');
                    setRegEmail('');
                    setRegSponsor('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !regName.trim() || !regPhone.trim() || !regEmail.trim() || !regSponsor.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Invio in corso...' : 'Invia Richiesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ADMIN PENDING REGISTRATIONS MANAGER */}
      {showPendingRegistrationsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-amber-600" /> Gestione Richieste Registrazione
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualizza e decidi l'approvazione dei nuovi coach registrati autonomamente
                </p>
              </div>
              <button 
                onClick={() => setShowPendingRegistrationsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic text-sm">
                Nessuna richiesta di registrazione in attesa.
              </div>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {pendingRegistrations.map((reg) => (
                  <PendingRegistrationRow 
                    key={reg.id} 
                    reg={reg} 
                    onApprove={async (id, color, pin) => {
                      await handleApproveRegistration(id, color, pin);
                    }} 
                    onReject={async (id) => {
                      await handleRejectRegistration(id);
                    }}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPendingRegistrationsModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: COACH REGISTRY DETAILS */}
      {selectedCoachForDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  {isEditingCoach ? 'Modifica Anagrafica Coach' : 'Anagrafica Completa Coach'}
                </h3>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Header profile with large letter / initials */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className={`w-12 h-12 rounded-full ${getCoachColorClasses(selectedCoachForDetails.color).solid} flex items-center justify-center text-white font-display font-extrabold text-xl shadow-inner`}>
                  {selectedCoachForDetails.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                    {selectedCoachForDetails.name}
                    {selectedCoachForDetails.isAdmin && (
                      <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">ID: {selectedCoachForDetails.id}</span>
                </div>
              </div>

              {isEditingCoach ? (
                /* EDIT MODE FORM */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateCoach(selectedCoachForDetails.id);
                  }}
                  className="space-y-3 text-left"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Modifica Dati Coach</span>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nome</label>
                    <input
                      type="text"
                      value={editCoachName}
                      onChange={(e) => setEditCoachName(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">Telefono / Cellulare</label>
                    <input
                      type="tel"
                      value={editCoachPhone}
                      onChange={(e) => setEditCoachPhone(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="es. +39 34567890"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">Email</label>
                    <input
                      type="email"
                      value={editCoachEmail}
                      onChange={(e) => setEditCoachEmail(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="es. coach@esempio.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">Sponsor</label>
                    <input
                      type="text"
                      value={editCoachSponsorName}
                      onChange={(e) => setEditCoachSponsorName(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="Nome dello Sponsor"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">PIN di Sicurezza (4 Cifre)</label>
                    <input
                      type="text"
                      maxLength={4}
                      inputMode="numeric"
                      value={editCoachPin}
                      onChange={(e) => setEditCoachPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN a 4 cifre"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500">Qualifica</label>
                    <select
                      value={editCoachStatus}
                      onChange={(e) => setEditCoachStatus(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-medium cursor-pointer"
                    >
                      {[
                        'Distributore',
                        'Senior Consultant',
                        'Qualified Producer',
                        'Supervisore',
                        'World Team',
                        'Active World Team',
                        'GET',
                        'GET 2.5k',
                        'Millionaire Team',
                        'Milionarie Team 7.5K',
                        'President Team'
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-1"
                    >
                      {actionLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCoach(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-1"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW MODE DISPLAY */
                <div className="space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Dati Personali & Contatti</span>
                  
                  <div className="flex items-start gap-3 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Telefono / Cellulare</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedCoachForDetails.phone || 'Non specificato'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Email</span>
                      <span className="font-bold text-slate-800 text-sm break-all">
                        {selectedCoachForDetails.email || 'Non specificato'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Sponsor</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedCoachForDetails.sponsorName || 'N/D'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Data Registrazione</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedCoachForDetails.timestamp 
                          ? new Date(selectedCoachForDetails.timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Utenza di sistema iniziale'
                        }
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pt-2 pb-1">Inquadramento & Sicurezza</span>

                  <div className="flex items-start gap-3 text-xs">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Qualifica</span>
                      <span className="font-bold text-emerald-800 text-xs bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full inline-block mt-0.5">
                        {selectedCoachForDetails.status || 'Distributore'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">PIN di Sicurezza</span>
                      <span className="font-bold text-slate-800 font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5 inline-block">
                        {selectedCoachForDetails.pin || 'Nessun PIN (Accesso Libero)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-medium">Attività Settimanale</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {getCoachWeeklyConfirmedCount(selectedCoachForDetails.id)} ospiti confermati questa settimana
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => startEditingCoach(selectedCoachForDetails)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                    >
                      ✏️ Modifica Dati
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex-1"
                    >
                      Chiudi Anagrafica
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORCE RULES ACCEPTANCE POPUP (FIRST ACCESS) */}
      {isLoggedIn && activeCoach && !activeCoach.acceptedRules && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Regolamento The Wellness Hub</h2>
              <p className="text-xs text-slate-500">
                Ciao {activeCoach.name}, prima di accedere al tuo account e iniziare ad inserire prenotazioni, ti chiediamo di leggere e accettare il regolamento del club.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-700 text-xs leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto text-left font-medium">
              {regolamento || "Nessun regolamento impostato."}
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 text-slate-800 text-xs font-semibold cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-150 select-none">
                <input
                  type="checkbox"
                  checked={rulesAcceptedCheckbox}
                  onChange={(e) => setRulesAcceptedCheckbox(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5"
                />
                <span className="flex-1 text-slate-700 font-bold">
                  Ho letto e accetto integralmente il regolamento del club
                </span>
              </label>

              <button
                type="button"
                disabled={!rulesAcceptedCheckbox || actionLoading}
                onClick={() => handleAcceptRegolamento(activeCoach.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Procedi e Accedi al Calendario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORCE/AUTOMATIC PAYMENT REMINDER OR BLOCK NOTICE POPUP */}
      {isLoggedIn && currentCoachId && !isAdminMode && !hasDismissedPaymentNotice && (() => {
        const paymentStatus = checkCoachPaymentStatus(currentCoachId);
        if (!paymentStatus) return null;
        
        const isBlocked = paymentStatus.status === 'blocked';
        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-250 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-scale-up text-left">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  <span className="text-2xl">{isBlocked ? '⚠️' : '🔔'}</span>
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 tracking-tight">
                    {isBlocked ? 'Accesso Limitato: Quota Scaduta' : 'Scadenza Quota in Arrivo'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isBlocked 
                      ? 'Rilevato mancato pagamento della quota mensile stabilita per accedere ai servizi del club.' 
                      : 'Gentile socio, ti ricordiamo la scadenza imminente della quota associativa mensile.'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-slate-700 text-xs space-y-1.5 leading-relaxed">
                <p>
                  Il socio associato a questo account, <strong className="font-bold text-slate-900">"{paymentStatus.member.name}"</strong>, ha la quota mensile impostata a <strong className="font-bold text-slate-900">€{paymentStatus.member.quotaAmount !== undefined ? paymentStatus.member.quotaAmount : quotaAmount}</strong> per il mese di <strong className="font-bold text-slate-900">{paymentStatus.monthLabel}</strong>.
                </p>
                <p className="text-[11px] text-slate-500">
                  {isBlocked 
                    ? 'Le funzionalità di inserimento nuove prenotazioni sono temporaneamente sospese fino al versamento della quota.' 
                    : 'Ricorda di regolarizzare entro il giorno 30 del mese per evitare limitazioni.'}
                </p>
              </div>

              {/* Selector inside popup */}
              <div className="flex gap-2 border-b border-slate-200/50 pb-2">
                <button
                  type="button"
                  onClick={() => setAlertPaymentChoice('bonifico')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertPaymentChoice === 'bonifico'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🏦 Bonifico
                </button>
                <button
                  type="button"
                  onClick={() => setAlertPaymentChoice('paypal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    alertPaymentChoice === 'paypal'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🔵 PayPal
                </button>
              </div>

              {alertPaymentChoice === 'bonifico' ? (
                <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-100 space-y-3">
                  <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    Coordinate per il Pagamento (Solo Bonifico):
                  </span>
                  
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] text-slate-400 font-sans font-bold uppercase tracking-wider">Intestatario IBAN</span>
                      <strong className="text-slate-800 text-xs font-semibold block mt-0.5 select-all">{ibanHolder || "Lorenzo Wellness"}</strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] text-slate-400 font-sans font-bold uppercase tracking-wider">IBAN</span>
                      <strong className="text-slate-800 text-xs font-mono block mt-0.5 select-all break-all">{iban || "IT00A0000000000000000000000"}</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    Causale da inserire: <strong className="font-semibold text-slate-600">"Quota {paymentStatus.monthLabel} - {paymentStatus.member.name}"</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-100 space-y-3">
                  <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    Pagamento via PayPal:
                  </span>
                  <p className="text-xs text-slate-600">
                    Puoi effettuare il pagamento in modo immediato tramite PayPal usando il pulsante qui sotto:
                  </p>
                  <a
                    href={paypalUrl || "https://paypal.me/LorenzoWellness"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>🔗</span> Apri Link PayPal
                  </a>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasDismissedPaymentNotice(true);
                    setPaymentMode(alertPaymentChoice === 'bonifico' ? 'bank_transfer' : 'paypal');
                    handleInitiatePayment(paymentStatus.member, paymentStatus.ymKey);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💳</span> Regolarizza Ora
                </button>
                <button
                  type="button"
                  onClick={() => setHasDismissedPaymentNotice(true)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all border border-slate-200 cursor-pointer"
                >
                  {isBlocked ? 'Accedi Comunque' : 'Ignora'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: ADD/EDIT EVENT FORM */}
      {showEventFormModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {editingEventId ? 'Modifica Evento' : 'Aggiungi Nuovo Evento'}
              </h3>
              <button 
                onClick={() => setShowEventFormModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Titolo Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Aperitivo Benessere / Training Day"
                  value={eventFormTitle}
                  onChange={(e) => setEventFormTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={eventFormDate}
                    onChange={(e) => setEventFormDate(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-2 sm:px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1" title="Ora Inizio">Inizio</label>
                  <input
                    type="time"
                    value={eventFormTime}
                    onChange={(e) => setEventFormTime(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1" title="Ora Fine">Fine</label>
                  <input
                    type="time"
                    value={eventFormEndTime}
                    onChange={(e) => setEventFormEndTime(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Luogo / Piattaforma</label>
                <input
                  type="text"
                  placeholder="E.g., Sede Club / Zoom"
                  value={eventFormLocation}
                  onChange={(e) => setEventFormLocation(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrizione / Dettagli</label>
                <textarea
                  rows={3}
                  placeholder="Inserisci dettagli utili, relatori o note..."
                  value={eventFormDescription}
                  onChange={(e) => setEventFormDescription(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none font-medium bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventFormModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !eventFormTitle.trim() || !eventFormDate}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Salvataggio...' : 'Salva Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT PROCESSOR MODAL */}
      {isPaymentModalOpen && paymentTargetMember && paymentTargetMonth && (() => {
        const currentTargetQuota = paymentTargetMember.quotaAmount !== undefined ? paymentTargetMember.quotaAmount : quotaAmount;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-scale-up text-slate-800">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <div>
                    <h3 className="font-display font-extrabold text-sm tracking-wide">SBLOCCO QUOTA CLUB</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Transazione Protetta</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Member & Month Info Banner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Socio Intestatario</span>
                    <span className="text-xs font-bold text-slate-700 block">{paymentTargetMember.name}</span>
                    <span className="text-[10px] text-slate-500 block">Mensilità: <strong className="font-semibold">{paymentTargetMonth}</strong></span>
                  </div>
                  <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider block opacity-70">Importo</span>
                    <span className="text-lg font-mono font-black block">€{currentTargetQuota}</span>
                  </div>
                </div>

              {/* Payment Details (IBAN or PayPal) */}
              <div className="space-y-4">
                {paymentMode === 'paypal' ? (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3 text-left">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔵</span> Pagamento via PayPal
                    </h4>
                    
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <p className="text-[11px] leading-relaxed">
                        Fai clic sul pulsante qui sotto per procedere al pagamento immediato e sicuro tramite PayPal:
                      </p>
                      
                      <a
                        href={paypalUrl || "https://paypal.me/LorenzoWellness"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shadow-blue-600/10"
                      >
                        🔗 Paga con PayPal (€{currentTargetQuota})
                      </a>

                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                        Una volta inviato il pagamento tramite PayPal, fai clic su <strong className="font-semibold text-slate-600">"Conferma"</strong> qui sotto per registrare l'avvenuta transazione nel sistema.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3 text-left">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏦</span> Coordinate per il Bonifico Bancario
                    </h4>
                    
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs relative">
                        <span className="block text-[9px] text-slate-400 font-sans font-bold uppercase tracking-wider">Intestatario IBAN</span>
                        <strong className="text-slate-800 text-xs font-semibold block mt-0.5 select-all">{ibanHolder || "Lorenzo Wellness"}</strong>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs relative">
                        <span className="block text-[9px] text-slate-400 font-sans font-bold uppercase tracking-wider">IBAN</span>
                        <strong className="text-slate-800 text-xs font-mono block mt-0.5 select-all break-all">{iban || "IT00A0000000000000000000000"}</strong>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                        Causale consigliata: <strong className="font-semibold text-slate-600">"Quota {paymentTargetMonth} - {paymentTargetMember.name}"</strong>. 
                        Una volta effettuato il bonifico, fai clic sul pulsante <strong className="font-semibold text-slate-600">"Conferma"</strong> qui sotto per registrare il pagamento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleProcessPayment()}
                disabled={paymentInProgress}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {paymentInProgress ? (
                  <>
                    <span className="border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5 animate-spin" />
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{paymentMode === 'card' ? 'Paga Ora' : 'Conferma'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )})}

      {/* Modal: UTILITY PAYMENT ("Paga Quota") */}
      {isUtilityPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-scale-up text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="font-display font-extrabold text-sm tracking-wide">PAGAMENTO QUOTA CLUB</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Dettagli e Link Sicuri</p>
                </div>
              </div>
              <button
                onClick={() => setIsUtilityPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-left">
              <p className="text-xs text-slate-600 leading-relaxed">
                Scegli il metodo che preferisci per saldare la quota mensile del club (€{quotaAmount}).
              </p>

              {/* Tab Selector */}
              <div className="flex gap-2 border-b border-slate-200/50 pb-2">
                <button
                  type="button"
                  onClick={() => setUtilityPaymentChoice('bonifico')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    utilityPaymentChoice === 'bonifico'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🏦 Bonifico Bancario
                </button>
                <button
                  type="button"
                  onClick={() => setUtilityPaymentChoice('paypal')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    utilityPaymentChoice === 'paypal'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🔵 Link PayPal
                </button>
              </div>

              {/* Tabs Content */}
              {utilityPaymentChoice === 'bonifico' ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] text-slate-400 font-sans font-bold uppercase tracking-wider">Intestatario IBAN</span>
                      <strong className="text-slate-800 text-xs font-semibold block mt-0.5 select-all">{ibanHolder || "Lorenzo Wellness"}</strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] text-slate-400 font-sans font-bold uppercase tracking-wider">IBAN per Bonifico</span>
                      <strong className="text-slate-800 text-xs font-mono block mt-0.5 select-all break-all">{iban || "IT00A0000000000000000000000"}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
                    Inserisci il tuo nome e cognome e il mese di riferimento nella causale del bonifico.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Puoi effettuare il pagamento online in modo sicuro e immediato tramite PayPal usando il pulsante qui sotto:
                    </p>
                    <a
                      href={paypalUrl || "https://paypal.me/LorenzoWellness"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shadow-blue-600/10"
                    >
                      🔗 Apri Link PayPal (€{quotaAmount})
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUtilityPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ANNUAL EARNINGS BREAKDOWN */}
      {isAnnualBreakdownOpen && activeCoach && (() => {
        const ITALIAN_MONTHS = [
          'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
          'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];

        const activeCoachId = activeCoach?.id;
        const currentYearStr = selectedYear.toString();

        const annualEarningsSum = activeCoachId
          ? earnings
              .filter(e => e.coachId === activeCoachId && e.date.startsWith(currentYearStr))
              .reduce((sum, e) => sum + e.amount, 0)
          : 0;

        const annualChequesSum = activeCoachId
          ? cheques
              .filter(c => c.coachId === activeCoachId && c.yearMonth.startsWith(currentYearStr))
              .reduce((sum, c) => sum + c.amount, 0)
          : 0;

        const accumulatedYearTotal = annualEarningsSum + annualChequesSum;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-150 overflow-hidden animate-scale-up text-slate-800 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div className="text-left">
                    <h3 className="font-display font-extrabold text-sm tracking-wide uppercase">Riepilogo Guadagni Annuali</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Coach: <strong className="text-white">{activeCoach.name}</strong></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnnualBreakdownOpen(false);
                    setEditingChequeMonth(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Annual summary widget */}
                <div className="bg-emerald-650 bg-emerald-600 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 block">Totale Guadagno Lordo ({selectedYear})</span>
                    <span className="text-2xl font-display font-black block mt-0.5">€ {accumulatedYearTotal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-left">
                      <span className="block opacity-75 text-[9px] font-bold uppercase">Trattamenti</span>
                      <strong className="font-mono font-black">€ {annualEarningsSum.toFixed(2)}</strong>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-left">
                      <span className="block opacity-75 text-[9px] font-bold uppercase">Assegni</span>
                      <strong className="font-mono font-black">€ {annualChequesSum.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Year Selector */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedYear(prev => prev - 1);
                      setEditingChequeMonth(null);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-bold text-xs cursor-pointer text-slate-750"
                  >
                    ◀ {selectedYear - 1}
                  </button>
                  <span className="font-display font-black text-base text-slate-800">{selectedYear}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedYear(prev => prev + 1);
                      setEditingChequeMonth(null);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-bold text-xs cursor-pointer text-slate-750"
                  >
                    {selectedYear + 1} ▶
                  </button>
                </div>

                {/* Months detailed list */}
                <div className="space-y-2.5">
                  {ITALIAN_MONTHS.map((monthName, idx) => {
                    const monthNum = String(idx + 1).padStart(2, '0');
                    const yearMonthStr = `${selectedYear}-${monthNum}`;

                    // Work logs and Cheques for this coach & month
                    const monthLogsVal = earnings
                      .filter(e => e.coachId === activeCoach.id && e.date.startsWith(yearMonthStr))
                      .reduce((sum, e) => sum + e.amount, 0);

                    const monthSkinVal = earnings
                      .filter(e => e.coachId === activeCoach.id && e.date.startsWith(yearMonthStr) && e.type === 'skin')
                      .reduce((sum, e) => sum + e.amount, 0);

                    const monthCorpoVal = earnings
                      .filter(e => e.coachId === activeCoach.id && e.date.startsWith(yearMonthStr) && e.type === 'corpo')
                      .reduce((sum, e) => sum + e.amount, 0);

                    const monthChequeVal = cheques
                      .filter(c => c.coachId === activeCoach.id && c.yearMonth === yearMonthStr)
                      .reduce((sum, c) => sum + c.amount, 0);

                    const monthTotalVal = monthLogsVal + monthChequeVal;
                    const isEditing = editingChequeMonth === yearMonthStr;

                    return (
                      <div 
                        key={yearMonthStr} 
                        className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs hover:bg-slate-50/40 transition-colors"
                      >
                        {/* Month Info */}
                        <div className="text-left">
                          <h4 className="font-display font-black text-sm text-slate-800">
                            {monthName}
                          </h4>
                          <div className="flex gap-2.5 mt-1 text-[10px] font-medium text-slate-400">
                            <span>🧴 Viso: <strong className="text-slate-600 font-bold">€{monthSkinVal.toFixed(2)}</strong></span>
                            <span>•</span>
                            <span>📊 Corpo: <strong className="text-slate-600 font-bold">€{monthCorpoVal.toFixed(2)}</strong></span>
                            <span>•</span>
                            <span>💼 Trattamenti: <strong className="text-slate-700 font-extrabold">€{monthLogsVal.toFixed(2)}</strong></span>
                          </div>
                        </div>

                        {/* Interactive Cheque Input & Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {/* Cheque Bonus Box */}
                          <div className="bg-slate-50/50 border border-slate-150 rounded-xl px-3 py-2 flex flex-col justify-center text-left min-w-[160px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Importo Assegno</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="relative">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">€</span>
                                  <input
                                    type="number"
                                    value={chequeInputAmount}
                                    onChange={(e) => setChequeInputAmount(e.target.value)}
                                    className="w-16 pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-black text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                    autoFocus
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = parseFloat(chequeInputAmount);
                                    handleSaveCheque(yearMonthStr, isNaN(val) ? 0 : val);
                                  }}
                                  disabled={isSavingCheque}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-1.5 py-1 rounded transition-colors cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingChequeMonth(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] font-bold px-1.5 py-1 rounded transition-colors cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-emerald-800">
                                  € {monthChequeVal.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingChequeMonth(yearMonthStr);
                                    setChequeInputAmount(monthChequeVal > 0 ? monthChequeVal.toString() : '');
                                  }}
                                  className="text-[9.5px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                                >
                                  ✏️ Modifica
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Final Row Total */}
                          <div className="text-right min-w-[80px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Totale</span>
                            <span className="text-sm font-black text-slate-900 block mt-0.5">
                              € {monthTotalVal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAnnualBreakdownOpen(false);
                    setEditingChequeMonth(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Chiudi Dettaglio
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: CONTACTS DATABASE */}
      {isContactsDbOpen && (() => {
        const activeCoach = coaches.find(c => c.id === currentCoachId);
        if (!activeCoach) return null;

        // Filter contacts by search query
        const filteredContacts = contacts.filter(c => {
          if (!searchContactQuery.trim()) return true;
          const query = searchContactQuery.toLowerCase();
          return (
            c.contactName.toLowerCase().includes(query) ||
            (c.phone && String(c.phone).toLowerCase().includes(query)) ||
            c.productsPurchased.toLowerCase().includes(query) ||
            c.notes.toLowerCase().includes(query) ||
            ((query.includes('smartbox') || query.includes('tagliando')) && c.smartboxTagliando)
          );
        });

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-150 overflow-hidden animate-scale-up text-slate-800 flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🗂️</span>
                  <div className="text-left">
                    <h3 className="font-display font-extrabold text-sm tracking-wide uppercase">Database Contatti Privato</h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Operatore: <strong className="text-white">{activeCoach.name}</strong> • 🔒 Archivio privato visibile solo a te
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsContactsDbOpen(false);
                    handleCancelContactEdit();
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Add / Edit Form */}
                  <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-3xs text-left">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      {editingContactId ? '✏️ Modifica Contatto' : '➕ Nuovo Contatto'}
                    </h4>
                    
                    <form onSubmit={handleSaveContact} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                          Nome Contatto *
                        </label>
                        <input
                          type="text"
                          required
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="es. Mario Rossi"
                          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                        />
                      </div>

                      {/* Cellulare */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                          Cellulare (WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          placeholder="es. +39 340 123 4567"
                          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                        />
                      </div>

                      {/* Skin Date */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                          Data Skin
                        </label>
                        <input
                          type="date"
                          value={newContactSkinDate}
                          onChange={(e) => setNewContactSkinDate(e.target.value)}
                          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                        />
                      </div>

                      {/* Checkboxes Group */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3.5">
                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Interesse
                        </span>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-750 flex items-center gap-2 cursor-pointer select-none">
                            <span>📊</span> Valutazione
                          </label>
                          <input
                            type="checkbox"
                            checked={newContactEvaluation}
                            onChange={(e) => setNewContactEvaluation(e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-750 flex items-center gap-2 cursor-pointer select-none">
                            <span>ℹ️</span> Info Attività
                          </label>
                          <input
                            type="checkbox"
                            checked={newContactActivityInfo}
                            onChange={(e) => setNewContactActivityInfo(e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-750 flex items-center gap-2 cursor-pointer select-none">
                            <span>🏃</span> Sport
                          </label>
                          <input
                            type="checkbox"
                            checked={newContactSport}
                            onChange={(e) => setNewContactSport(e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-750 flex items-center gap-2 cursor-pointer select-none">
                            <span>🎁</span> Tagliando Smartbox
                          </label>
                          <input
                            type="checkbox"
                            checked={newContactSmartboxTagliando}
                            onChange={(e) => setNewContactSmartboxTagliando(e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Products */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                          Prodotti Acquistati
                        </label>
                        <textarea
                          rows={2}
                          value={newContactProducts}
                          onChange={(e) => setNewContactProducts(e.target.value)}
                          placeholder="es. Formula 1, Aloe, Infuso"
                          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 resize-none"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                          Note / Dettagli
                        </label>
                        <textarea
                          rows={2}
                          value={newContactNotes}
                          onChange={(e) => setNewContactNotes(e.target.value)}
                          placeholder="es. Preferenze, prossimi appuntamenti..."
                          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 resize-none"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingContact}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {isSavingContact ? 'Salvataggio...' : (editingContactId ? 'Salva Modifiche' : 'Aggiungi Contatto')}
                        </button>
                        {editingContactId && (
                          <button
                            type="button"
                            onClick={handleCancelContactEdit}
                            className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Annulla
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Contacts Table List */}
                  <div className="lg:col-span-8 flex flex-col h-full space-y-4">
                    
                    {/* Search & Statistics Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <div className="relative w-full sm:max-w-xs text-left">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                        <input
                          type="text"
                          value={searchContactQuery}
                          onChange={(e) => setSearchContactQuery(e.target.value)}
                          placeholder="Cerca contatto o prodotti..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                        />
                      </div>
                      <div className="flex gap-4 text-xs font-bold text-slate-500">
                        <span>Contatti totali: <strong className="text-slate-800">{contacts.length}</strong></span>
                        <span>•</span>
                        <span>Trovati: <strong className="text-emerald-600">{filteredContacts.length}</strong></span>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-3xs flex-1 max-h-[50vh] lg:max-h-[55vh] overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 space-y-2">
                          <span className="text-3xl block">📁</span>
                          <p className="text-xs font-bold">Nessun contatto trovato nel database.</p>
                          <p className="text-[10px] text-slate-400">Inizia inserendo un contatto nel modulo a sinistra.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-slate-800 min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-3.5 pl-4">Nome Contatto</th>
                                <th className="p-3.5">Cellulare</th>
                                <th className="p-3.5">Data Skin</th>
                                <th className="p-3.5 text-center w-20">Valutazione</th>
                                <th className="p-3.5 text-center w-20">Info Attività</th>
                                <th className="p-3.5 text-center w-16">Sport</th>
                                <th className="p-3.5 text-center w-28">Smartbox</th>
                                <th className="p-3.5">Prodotti Acquistati</th>
                                <th className="p-3.5">Note</th>
                                <th className="p-3.5 text-right pr-4 w-24">Azioni</th>
                                <th className="p-3.5 text-center w-14 pr-4">WhatsApp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {filteredContacts.map((contact) => (
                                <tr 
                                  key={contact.id} 
                                  className={`hover:bg-slate-50/50 transition-colors ${editingContactId === contact.id ? 'bg-amber-50/40' : ''}`}
                                >
                                  <td className="p-3.5 pl-4 font-black text-slate-900">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedContactForDetail(contact)}
                                      className="hover:text-emerald-600 text-left transition-colors cursor-pointer outline-none focus:underline"
                                      title="Visualizza dettagli completi"
                                    >
                                      {contact.contactName}
                                    </button>
                                  </td>
                                  <td className="p-3.5 font-semibold text-slate-700 font-mono">
                                    {contact.phone || <span className="text-slate-300 italic">—</span>}
                                  </td>
                                  <td className="p-3.5 text-slate-600 font-mono font-medium">
                                    {contact.skinDate ? new Date(contact.skinDate).toLocaleDateString('it-IT') : '-'}
                                  </td>
                                  
                                  {/* Checkboxes Displays: only show checkmarks */}
                                  <td className="p-3.5 text-center">
                                    {contact.evaluation ? (
                                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {contact.activityInfo ? (
                                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {contact.sport ? (
                                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {contact.smartboxTagliando ? (
                                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </td>

                                  <td className="p-3.5 text-slate-600 max-w-[150px] truncate font-medium" title={contact.productsPurchased}>
                                    {contact.productsPurchased || <span className="text-slate-300 italic">nessuno</span>}
                                  </td>
                                  <td className="p-3.5 text-slate-600 max-w-[180px] truncate font-medium" title={contact.notes}>
                                    {contact.notes || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="p-3.5 text-right pr-4 space-x-2">
                                    <button
                                      onClick={() => handleEditContactClick(contact)}
                                      className="text-slate-400 hover:text-amber-600 font-bold transition-colors cursor-pointer text-[11px]"
                                      title="Modifica contatto"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContact(contact.id)}
                                      className="text-slate-400 hover:text-red-600 font-bold transition-colors cursor-pointer text-[11px]"
                                      title="Elimina contatto"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                  <td className="p-3.5 text-center pr-4">
                                    {contact.phone ? (() => {
                                      const cleaned = String(contact.phone).replace(/\D/g, '');
                                      const formatted = (cleaned.length === 10 && cleaned.startsWith('3')) ? '39' + cleaned : cleaned;
                                      return (
                                        <a
                                          href={`https://wa.me/${formatted}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                          title="Apri chat WhatsApp"
                                        >
                                          <svg className="w-4.5 h-4.5 fill-emerald-600" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.311 0 11.786 0c3.137.001 6.086 1.222 8.303 3.442 2.218 2.22 3.437 5.17 3.437 8.307-.005 6.486-5.253 11.732-11.73 11.732-2.008-.002-3.98-.517-5.732-1.496L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.316 0 9.64-4.32 9.643-9.637.002-2.578-1.002-5.001-2.825-6.825C16.467 2.328 14.048 1.326 11.47 1.326 6.155 1.326 1.83 5.645 1.828 10.963c0 1.701.447 3.361 1.295 4.837l-.953 3.477 3.564-.934zm11.332-6.52c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                          </svg>
                                        </a>
                                      );
                                    })() : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsContactsDbOpen(false);
                    handleCancelContactEdit();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Chiudi Archivio
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal: CONTACT DETAILS */}
      {selectedContactForDetail && (() => {
        const contact = selectedContactForDetail;
        const cleanedPhone = contact.phone ? String(contact.phone).replace(/\D/g, '') : '';
        const waPhone = (cleanedPhone.length === 10 && cleanedPhone.startsWith('3')) ? '39' + cleanedPhone : cleanedPhone;

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-150 overflow-hidden animate-scale-up text-slate-800">
              
              {/* Header */}
              <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <h3 className="font-display font-extrabold text-sm tracking-wide uppercase">Scheda Dettagliata Contatto</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContactForDetail(null)}
                  className="text-emerald-100 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 text-left">
                {/* Contact Name Header */}
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nome Contatto</span>
                  <h4 className="text-xl font-extrabold text-slate-900">{contact.contactName}</h4>
                </div>

                {/* Grid for Cellulare & Data Skin */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Cellulare</span>
                    {contact.phone ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-800 font-mono">{contact.phone}</span>
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all w-fit shadow-3xs"
                        >
                          <span>💬</span> Chat WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400 font-semibold">Non inserito</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Data Skin</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {contact.skinDate ? new Date(contact.skinDate).toLocaleDateString('it-IT') : '—'}
                    </span>
                  </div>
                </div>

                {/* Interesse Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2.5">Interesse</span>
                  <div className="flex flex-wrap gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${contact.evaluation ? 'bg-emerald-100/70 border-emerald-250 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}>
                      <span>📊</span> Valutazione {contact.evaluation ? '✓' : ''}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${contact.activityInfo ? 'bg-emerald-100/70 border-emerald-250 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}>
                      <span>ℹ️</span> Info Attività {contact.activityInfo ? '✓' : ''}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${contact.sport ? 'bg-emerald-100/70 border-emerald-250 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}>
                      <span>🏃</span> Sport {contact.sport ? '✓' : ''}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${contact.smartboxTagliando ? 'bg-emerald-100/70 border-emerald-250 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}>
                      <span>🎁</span> Tagliando Smartbox {contact.smartboxTagliando ? '✓' : ''}
                    </div>
                  </div>
                </div>

                {/* Prodotti Acquistati */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Prodotti Acquistati</span>
                  <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {contact.productsPurchased || <span className="italic text-slate-400 font-semibold">Nessun prodotto acquistato registrato.</span>}
                  </p>
                </div>

                {/* Note */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Note / Dettagli</span>
                  <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {contact.notes || <span className="italic text-slate-400 font-semibold">Nessuna nota aggiuntiva.</span>}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    handleEditContactClick(contact);
                    setSelectedContactForDetail(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>✏️</span> Modifica Contatto
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContactForDetail(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Chiudi Dettagli
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Drawer: NOTIFICATION CENTER */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Overlay backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsNotificationsOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            {/* Slide-over panel */}
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-slide-in text-left">
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase">
                      Centro Notifiche
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Hai {unreadCount} {unreadCount === 1 ? 'notifica non letta' : 'notifiche non lette'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {coachNotifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-lg">
                      📭
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Nessuna notifica</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                        Non ci sono ancora messaggi o comunicazioni per te.
                      </p>
                    </div>
                  </div>
                ) : (
                  [...coachNotifications]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(n => {
                      const isRead = !currentCoachId || (n.readBy && n.readBy.includes(currentCoachId));
                      return (
                        <div 
                          key={n.id}
                          onClick={() => {
                            if (!isRead && currentCoachId) {
                              handleMarkAsRead(n.id);
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                            isRead 
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                              : 'bg-emerald-50/40 border-emerald-200 text-slate-900 hover:bg-emerald-50/60 ring-1 ring-emerald-100'
                          }`}
                        >
                          {!isRead && (
                            <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white ring-1 ring-emerald-300" />
                          )}
                          <div className="pr-4 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                da {n.senderName}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(n.timestamp).toLocaleDateString('it-IT')} {new Date(n.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {n.recipientId === 'all' && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    Tutti i Coach
                                  </span>
                                </>
                              )}
                            </div>
                            <h4 className="text-xs font-bold font-sans tracking-tight leading-snug">
                              {n.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line pt-0.5">
                              {n.message}
                            </p>
                          </div>
                          
                          {/* Mark as read button if unread */}
                          {!isRead && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-100/60 flex justify-end">
                              <button
                                type="button"
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Segna come letto
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer text-center"
                >
                  Chiudi Centro Notifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: UTILITY CATEGORIZED DISPLAY */}
      {selectedUtilityCategory && (() => {
        const categoryLabels: Record<string, string> = {
          locandine: 'Locandine',
          startup: 'Start Up',
          listino: 'Listino prezzi aggiornato',
          regolamento: 'Regolamento del Club'
        };
        const categoryIcons: Record<string, string> = {
          locandine: '🖼️',
          startup: '🚀',
          listino: '💰',
          regolamento: '📄'
        };
        
        const filteredUtilities = utilities.filter(u => u.category === selectedUtilityCategory);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-scale-up">
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{categoryIcons[selectedUtilityCategory]}</span>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase">
                      {categoryLabels[selectedUtilityCategory]}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Risorse e utility condivise per gli operatori
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUtilityCategory(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedUtilityCategory === 'regolamento' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      📝 Testo del Regolamento Ufficiale
                    </h4>
                    {isEditingRegolamento ? (
                      <div className="space-y-3">
                        <textarea
                          rows={10}
                          value={editRegolamentoValue}
                          onChange={(e) => setEditRegolamentoValue(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-white text-slate-800"
                          placeholder="Scrivi qui le regole..."
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleSaveRegolamento(editRegolamentoValue)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            {actionLoading ? 'Salvataggio...' : 'Salva Regolamento'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingRegolamento(false);
                              setEditRegolamentoValue(regolamento);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-line font-medium bg-white p-4 rounded-xl border border-slate-150 shadow-3xs max-h-96 overflow-y-auto">
                          {regolamento || 'Nessun regolamento configurato.'}
                        </div>
                        {isAdminMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditRegolamentoValue(regolamento);
                              setIsEditingRegolamento(true);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            ✏️ Modifica Testo Regolamento
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Section title for attachments if in 'regolamento' category */}
                {selectedUtilityCategory === 'regolamento' && (
                  <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      📎 Documenti o Link Allegati al Regolamento
                    </h4>
                    {isAdminMode && (
                      <button
                        onClick={() => setIsAddUtilityModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Inserisci Allegato/Link
                      </button>
                    )}
                  </div>
                )}

                {/* Admin insert trigger for other categories */}
                {isAdminMode && selectedUtilityCategory !== 'regolamento' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsAddUtilityModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Inserisci {selectedUtilityCategory === 'listino' ? 'Listino' : selectedUtilityCategory === 'locandine' ? 'Locandina' : 'Risorsa'}
                    </button>
                  </div>
                )}

                {filteredUtilities.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nessuna risorsa presente in questa sezione.
                    {isAdminMode && (
                      <p className="text-[11px] text-slate-500 mt-2 not-italic font-bold">
                        Clicca su "Inserisci" in alto per aggiungere un documento, foto o link.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredUtilities.map(item => {
                      const isImage = item.type === 'file' && (item.url.startsWith('data:image/') || item.url.includes('.jpg') || item.url.includes('.png'));
                      return (
                        <div key={item.id} className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col justify-between gap-3 shadow-3xs hover:border-slate-300 hover:shadow-2xs transition-all relative">
                          {/* Title and Icon */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                                  {item.type === 'file' ? (
                                    isImage ? <Image className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Link className="w-4 h-4 text-amber-600" />
                                  )}
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {item.type === 'file' ? 'File' : 'Link'}
                                </span>
                              </div>

                              {/* Admin Delete */}
                              {isAdminMode && (
                                <button
                                  onClick={() => handleDeleteUtility(item.id)}
                                  className="text-slate-300 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                              {item.title}
                            </h4>

                            {/* Image Preview */}
                            {isImage && (
                              <div className="border border-slate-150 rounded-lg overflow-hidden bg-slate-50 h-28 flex items-center justify-center">
                                <img 
                                  src={item.url} 
                                  alt={item.title} 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {/* Document File Name info */}
                            {item.type === 'file' && !isImage && (
                              <div className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 font-mono truncate">
                                📁 {item.fileName || 'documento.pdf'}
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                              {new Date(item.uploadedAt).toLocaleDateString('it-IT')}
                            </span>
                            
                            {item.type === 'file' ? (
                              <a
                                href={item.url}
                                download={item.fileName || 'risorsa'}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Upload className="w-3 h-3 rotate-180" /> Scarica
                              </a>
                            ) : (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" /> Visita
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-2xl">
                <button
                  onClick={() => setSelectedUtilityCategory(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: ADD UTILITY */}
      {isAddUtilityModalOpen && selectedUtilityCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-sm uppercase text-slate-900 tracking-tight flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-emerald-600" /> Aggiungi Elemento
              </h3>
              <button 
                onClick={() => {
                  setIsAddUtilityModalOpen(false);
                  setNewUtilityTitle('');
                  setNewUtilityUrl('');
                  setNewUtilityFileName('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUtility} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Titolo / Nome Risorsa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Brochure Luglio 2026, Listino Aggiornato"
                  value={newUtilityTitle}
                  onChange={(e) => setNewUtilityTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tipo di Risorsa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewUtilityType('link');
                      setNewUtilityUrl('');
                      setNewUtilityFileName('');
                    }}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                      newUtilityType === 'link'
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    🔗 Link / URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUtilityType('file');
                      setNewUtilityUrl('');
                      setNewUtilityFileName('');
                    }}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                      newUtilityType === 'file'
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    📁 Carica File
                  </button>
                </div>
              </div>

              {newUtilityType === 'link' ? (
                <div className="space-y-1 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Incolla l'URL del Link (Google Drive, Dropbox, ecc.)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={newUtilityUrl}
                    onChange={(e) => setNewUtilityUrl(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-600"
                  />
                </div>
              ) : (
                <div className="space-y-1 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Seleziona File / Foto (Max 800KB)
                  </label>
                  <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/80 p-5 transition-all text-center relative cursor-pointer">
                    <input
                      type="file"
                      onChange={handleUtilityFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    {newUtilityFileName ? (
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-emerald-600 truncate max-w-[250px] mx-auto">
                          ✅ {newUtilityFileName}
                        </p>
                        <p className="text-[9px] text-slate-400">Clicca o trascina per sostituire</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-bold text-slate-600">Trascina o Clicca per caricare</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Foto, PDF, Word (Max 800KB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUtilityModalOpen(false);
                    setNewUtilityTitle('');
                    setNewUtilityUrl('');
                    setNewUtilityFileName('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingUtility}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/10"
                >
                  {isSavingUtility ? 'Salvataggio...' : 'Salva Elemento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: WHATSAPP NOTIFICATION FORWARDER PROMPT */}
      {justSentNotification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-slate-900 text-sm tracking-tight uppercase flex items-center gap-1.5">
                  <span>📱</span> Invia anche su WhatsApp
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Fai apparire la comunicazione come notifica push sul telefono dei Coach!
                </p>
              </div>
              <button 
                onClick={() => setJustSentNotification(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                Messaggio Inviato In-App:
              </span>
              <div className="mt-1">
                <h4 className="text-xs font-bold text-slate-800">{justSentNotification.title}</h4>
                <p className="text-[10.5px] text-slate-500 line-clamp-3 mt-1 leading-normal whitespace-pre-line">
                  {justSentNotification.message}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Group share button option */}
              <div className="pb-2 border-b border-slate-100">
                <a
                  href={getWhatsAppGroupLink(justSentNotification.title, justSentNotification.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  onClick={() => setJustSentNotification(null)}
                >
                  <span>👥</span> Invia sul gruppo
                </a>
              </div>

              <p className="text-xs font-bold text-slate-600 pt-1">
                Oppure invia ai singoli coach:
              </p>

              {justSentNotification.recipientId === 'all' ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {coaches.filter(c => !c.isAdmin).length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Nessun coach a cui inviare.</span>
                  ) : (
                    coaches.filter(c => !c.isAdmin).map(c => {
                      const waLink = c.phone ? getWhatsAppLink(c.phone, justSentNotification.title, justSentNotification.message) : '';
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-150 text-xs">
                          <span className="font-bold text-slate-700">{c.name}</span>
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-md transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>💬</span> WhatsApp
                            </a>
                          ) : (
                            <span className="text-[10px] text-red-500 italic">Nessun num.</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div>
                  {(() => {
                    const rc = coaches.find(c => c.id === justSentNotification.recipientId);
                    if (!rc) return <span className="text-xs text-slate-400">Coach destinatario non trovato.</span>;
                    if (!rc.phone) {
                      return (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700">
                          ⚠️ Il coach <strong>{rc.name}</strong> non ha configurato un numero di telefono. Non puoi inviare su WhatsApp.
                        </div>
                      );
                    }
                    return (
                      <a
                        href={getWhatsAppLink(rc.phone, justSentNotification.title, justSentNotification.message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={() => setJustSentNotification(null)}
                      >
                        <span>💬</span> Invia a {rc.name} su WhatsApp Ora
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setJustSentNotification(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Separate modular component to manage inline row states
interface PendingRegistrationRowProps {
  key?: any;
  reg: any;
  onApprove: (id: string, color: string, pin: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  actionLoading: boolean;
}

function PendingRegistrationRow({ reg, onApprove, onReject, actionLoading }: PendingRegistrationRowProps) {
  const [pin, setPin] = useState('');

  return (
    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="space-y-1.5 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800">{reg.name}</span>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-200">
            In Attesa
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
          <div><span className="font-semibold text-slate-400">Cellulare:</span> {reg.phone}</div>
          <div><span className="font-semibold text-slate-400">Email:</span> {reg.email}</div>
          <div className="sm:col-span-2"><span className="font-semibold text-slate-400">Sponsor:</span> {reg.sponsorName}</div>
          <div className="sm:col-span-2 text-[10px] text-slate-400 mt-0.5">
            Richiesta del: {new Date(reg.createdAt).toLocaleString('it-IT')}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 pt-3 md:pt-0 border-slate-150">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1 text-left">
              PIN (opzionale)
            </label>
            <input
              type="password"
              maxLength={4}
              placeholder="4 cifre"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-xs text-center border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-emerald-500 outline-none font-mono font-bold"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onReject(reg.id)}
            disabled={actionLoading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Rifiuta
          </button>
          <button
            onClick={() => onApprove(reg.id, 'emerald', pin)}
            disabled={actionLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" /> Approva
          </button>
        </div>
      </div>
    </div>
  );
}

interface MemberQuotaInputProps {
  member: Member;
  defaultQuota: number;
  onUpdate: (member: Member, amount: number | undefined) => void;
}

function MemberQuotaInput({ member, defaultQuota, onUpdate }: MemberQuotaInputProps) {
  const [localVal, setLocalVal] = useState<string>(
    member.quotaAmount !== undefined && member.quotaAmount !== null ? String(member.quotaAmount) : ''
  );

  // Sync state if member changes from outside
  useEffect(() => {
    setLocalVal(member.quotaAmount !== undefined && member.quotaAmount !== null ? String(member.quotaAmount) : '');
  }, [member.quotaAmount]);

  const handleBlurOrEnter = () => {
    const trimmed = localVal.trim();
    const parsed = trimmed === '' ? undefined : Number(trimmed);
    if (parsed !== member.quotaAmount) {
      onUpdate(member, parsed);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="1"
        placeholder={`${defaultQuota}`}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlurOrEnter}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className="w-16 text-xs bg-white border border-slate-200 rounded-lg p-1 text-center outline-none focus:ring-1 focus:ring-emerald-500 font-semibold font-mono text-slate-700"
      />
      <span className="text-[11px] text-slate-400 font-semibold">€</span>
    </div>
  );
}
