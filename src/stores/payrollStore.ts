import { useState, useCallback } from 'react';
import type {
  WorkEntry,
  InternalConfig,
  LegalConfig,
  PaymentConfig,
  PayrollConfig,
  CalcResult,
  ComparisonResult,
} from '../lib/payrollEngine';
import {
  calcInternal,
  calcColombia,
  compareResults,
  generateId,
} from '../lib/payrollEngine';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getMondayOfCurrentWeek(baseDate: Date = new Date()): Date {
  const d = new Date(baseDate);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const daysSinceMonday = (day + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

function getCurrentWeekWorkDates(workDays: 5 | 6): string[] {
  const monday = getMondayOfCurrentWeek();
  const count = workDays === 6 ? 6 : 5;
  return Array.from({ length: count }, (_, idx) => formatLocalDate(addDays(monday, idx)));
}

function getWeekDatesFromMonday(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, idx) => formatLocalDate(addDays(monday, idx)));
}

export interface SimpleData {
  totalHours: number;
  holidayHours: number;
  sundayHours: number;
  nightHours: number;
}

export interface PayrollState {
  // Payment configuration
  payment: PaymentConfig;
  // Internal policy configuration
  internal: InternalConfig;
  // Legal configuration
  legal: LegalConfig;
  // Payroll cycle configuration
  payroll: PayrollConfig;
  // Work entries (detailed mode)
  entries: WorkEntry[];
  // Week navigation
  weekStarts: string[];
  activeWeekStart: string;
  // Simple mode data
  simpleData: SimpleData;
  // Calculation results
  internalResult: CalcResult | null;
  legalResult: CalcResult | null;
  comparison: ComparisonResult | null;
  // UI state
  activeTab: 'entradas' | 'resultados' | 'notas';
  resultsTab: 'internal' | 'legal' | 'comparison';
  entryMode: 'simple' | 'detailed';
}

const defaultSimpleData: SimpleData = {
  totalHours: 37.5,
  holidayHours: 0,
  sundayHours: 0,
  nightHours: 0,
};

const defaultPayment: PaymentConfig = {
  salaryType: 'monthly',
  salaryAmount: 2500000,
  workDaysPerWeek: 5,
  showTotalValue: true,
};

const defaultInternal: InternalConfig = {
  baseWeeklyHours: 37.5,
  bufferLimit: 40,
  extraMultiplier: 1.5,
  holidayMultiplier: 2.0,
};

const defaultLegal: LegalConfig = {
  weeklyLimit: 44,
  nightStart: '21:00',
  nightEnd: '06:00',
  nightSurcharge: 35,
  extraDaySurcharge: 25,
  extraNightSurcharge: 75,
  sundayHolidaySurcharge: 75,
};

const defaultPayroll: PayrollConfig = {
  paymentFrequency: 'monthly',
  cutoffDate: new Date().toISOString().split('T')[0],
  paymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  paymentDelay: 15,
};

function createDefaultEntries(workDaysPerWeek: 5 | 6): WorkEntry[] {
  const monday = getMondayOfCurrentWeek();
  const dates = getWeekDatesFromMonday(monday);
  return dates.map((date, idx) => {
    const dayIndex = idx + 1;
    const isWorkDay = workDaysPerWeek === 6 ? dayIndex <= 6 : dayIndex <= 5;
    return {
      id: generateId(),
      date,
      startTime: isWorkDay ? '08:30' : '',
      endTime: isWorkDay ? '17:00' : '',
      breakMinutes: isWorkDay ? 60 : 0,
      isHoliday: false,
      notes: '',
    };
  });
}

function createWeekEntries(weekStart: string, workDaysPerWeek: 5 | 6): WorkEntry[] {
  const monday = new Date(weekStart + 'T12:00:00');
  const dates = getWeekDatesFromMonday(monday);
  return dates.map((date, idx) => {
    const dayIndex = idx + 1;
    const isWorkDay = workDaysPerWeek === 6 ? dayIndex <= 6 : dayIndex <= 5;
    return {
      id: generateId(),
      date,
      startTime: isWorkDay ? '08:30' : '',
      endTime: isWorkDay ? '17:00' : '',
      breakMinutes: isWorkDay ? 60 : 0,
      isHoliday: false,
      notes: '',
    };
  });
}

export function usePayrollStore() {
  const initialWeekStart = formatLocalDate(getMondayOfCurrentWeek());

  const [state, setState] = useState<PayrollState>({
    payment: defaultPayment,
    internal: defaultInternal,
    legal: defaultLegal,
    payroll: defaultPayroll,
    entries: createDefaultEntries(defaultPayment.workDaysPerWeek),
    weekStarts: [initialWeekStart],
    activeWeekStart: initialWeekStart,
    simpleData: defaultSimpleData,
    internalResult: null,
    legalResult: null,
    comparison: null,
    activeTab: 'entradas',
    resultsTab: 'internal',
    entryMode: 'detailed',
  });

  const setActiveWeekStart = useCallback((weekStart: string) => {
    setState(prev => ({ ...prev, activeWeekStart: weekStart }));
  }, []);

  const addWeek = useCallback(() => {
    const lastWeekStart = state.weekStarts[state.weekStarts.length - 1] || initialWeekStart;
    const nextWeekStart = formatLocalDate(addDays(new Date(lastWeekStart + 'T12:00:00'), 7));

    if (state.weekStarts.includes(nextWeekStart)) {
      setState(prev => ({ ...prev, activeWeekStart: nextWeekStart }));
      return;
    }

    const newEntries = createWeekEntries(nextWeekStart, state.payment.workDaysPerWeek);
    setState(prev => ({
      ...prev,
      weekStarts: [...prev.weekStarts, nextWeekStart],
      activeWeekStart: nextWeekStart,
      entries: [...prev.entries, ...newEntries],
    }));
  }, [initialWeekStart, state.payment.workDaysPerWeek, state.weekStarts]);

  const setSimpleData = useCallback((data: Partial<SimpleData>) => {
    setState(prev => ({ ...prev, simpleData: { ...prev.simpleData, ...data } }));
  }, []);

  const setPayment = useCallback((payment: Partial<PaymentConfig>) => {
    setState(prev => ({ ...prev, payment: { ...prev.payment, ...payment } }));
  }, []);

  const setInternal = useCallback((internal: Partial<InternalConfig>) => {
    setState(prev => ({ ...prev, internal: { ...prev.internal, ...internal } }));
  }, []);

  const setLegal = useCallback((legal: Partial<LegalConfig>) => {
    setState(prev => ({ ...prev, legal: { ...prev.legal, ...legal } }));
  }, []);

  const setPayroll = useCallback((payroll: Partial<PayrollConfig>) => {
    setState(prev => ({ ...prev, payroll: { ...prev.payroll, ...payroll } }));
  }, []);

  const addEntry = useCallback(() => {
    const lastEntry = state.entries[state.entries.length - 1];
    let nextDate = lastEntry
      ? formatLocalDate(addDays(new Date(lastEntry.date + 'T12:00:00'), 1))
      : formatLocalDate(new Date());

    while (true) {
      const dow = new Date(nextDate + 'T12:00:00').getDay();
      if (state.payment.workDaysPerWeek === 6) {
        if (dow !== 0) break;
      } else {
        if (dow !== 0 && dow !== 6) break;
      }
      nextDate = formatLocalDate(addDays(new Date(nextDate + 'T12:00:00'), 1));
    }
    
    const newEntry: WorkEntry = {
      id: generateId(),
      date: nextDate,
      startTime: '08:30',
      endTime: '17:00',
      breakMinutes: 60,
      isHoliday: false,
      notes: '',
    };
    setState(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
  }, [state.entries, state.payment.workDaysPerWeek]);

  const updateEntry = useCallback((id: string, updates: Partial<WorkEntry>) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id),
    }));
  }, []);

  const setActiveTab = useCallback((tab: 'entradas' | 'resultados' | 'notas') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setResultsTab = useCallback((tab: 'internal' | 'legal' | 'comparison') => {
    setState(prev => ({ ...prev, resultsTab: tab }));
  }, []);

  const setEntryMode = useCallback((mode: 'simple' | 'detailed') => {
    setState(prev => ({ ...prev, entryMode: mode }));
  }, []);

  const resetInternal = useCallback(() => {
    setState(prev => ({ ...prev, internal: defaultInternal }));
  }, []);

  const resetLegal = useCallback(() => {
    setState(prev => ({ ...prev, legal: defaultLegal }));
  }, []);

  const calculate = useCallback(() => {
    let entriesToCalc = state.entries;

    if (state.entryMode === 'simple') {
      // Generate synthetic entries from simple data
      entriesToCalc = [];
      const { totalHours, holidayHours, sundayHours, nightHours } = state.simpleData;
      let remainingTotal = totalHours;
      let remainingNight = nightHours;
      
      // 1. Holiday hours (assume daytime unless specified otherwise, but simple mode doesn't specify holiday-night)
      // We'll treat holiday hours as separate from total hours in input? Or part of it?
      // Usually "Total hours" includes everything. Let's assume input means "Total hours worked" and breakdowns are subsets.
      // BUT for simplicity in this UI, let's assume they are additives or we prioritized specific types.
      // Let's assume the inputs are mutually exclusive for simplicity or standard accounting?
      // Actually, standard is: Total includes everything.
      // But let's look at the UI: "Horas trabajadas totales", "Horas en festivos", "Horas en domingos", "Horas nocturnas".
      
      // Strategy: Create specific entries for special types first, then fill rest with normal.
      
      const monday = getMondayOfCurrentWeek();
      const currentWeekWorkDays = getCurrentWeekWorkDates(state.payment.workDaysPerWeek);
      const sundayDate = formatLocalDate(addDays(monday, 6));
      
      // 1. Holidays (Use a known holiday date if possible, or just mark isHoliday=true)
      if (holidayHours > 0) {
        entriesToCalc.push({
          id: generateId(),
          date: currentWeekWorkDays[0] || formatLocalDate(monday),
          startTime: '08:30',
          endTime: timeFromDuration('08:30', holidayHours),
          breakMinutes: 0,
          isHoliday: true,
          notes: 'Generado: Festivo',
        });
        remainingTotal -= holidayHours;
      }

      // 2. Sundays
      if (sundayHours > 0) {
        entriesToCalc.push({
          id: generateId(),
          date: sundayDate,
          startTime: '08:30',
          endTime: timeFromDuration('08:30', sundayHours),
          breakMinutes: 0,
          isHoliday: false,
          notes: 'Generado: Domingo',
        });
        remainingTotal -= sundayHours;
      }

      // 3. Night hours (Weekday)
      if (remainingNight > 0) {
        // Start at 22:00
        entriesToCalc.push({
          id: generateId(),
          date: currentWeekWorkDays[0] || formatLocalDate(monday),
          startTime: '22:00',
          endTime: timeFromDuration('22:00', remainingNight),
          breakMinutes: 0,
          isHoliday: false,
          notes: 'Generado: Nocturno',
        });
        remainingTotal -= remainingNight;
      }

      // 4. Remaining as Normal Day hours (Weekday)
      if (remainingTotal > 0) {
        // Distribute 8h per day for remaining
        const workDays = currentWeekWorkDays.length > 0 ? currentWeekWorkDays : [formatLocalDate(monday)];
        let dayIdx = 0;
        
        while (remainingTotal > 0) {
          const hoursToday = Math.min(remainingTotal, 8);
          entriesToCalc.push({
            id: generateId(),
            date: workDays[dayIdx % workDays.length],
            startTime: '08:30',
            endTime: timeFromDuration('08:30', hoursToday),
            breakMinutes: 0,
            isHoliday: false,
            notes: 'Generado: Normal',
          });
          remainingTotal -= hoursToday;
          dayIdx++;
        }
      }
    }

    const internalResult = calcInternal(entriesToCalc, state.internal, state.payment);
    const legalResult = calcColombia(entriesToCalc, state.legal, state.payment);
    const comparison = compareResults(internalResult, legalResult);
    
    setState(prev => ({
      ...prev,
      internalResult,
      legalResult,
      comparison,
      activeTab: 'resultados',
    }));
  }, [state.entries, state.simpleData, state.entryMode, state.internal, state.legal, state.payment]);

  return {
    state,
    setPayment,
    setInternal,
    setLegal,
    setPayroll,
    setSimpleData,
    addEntry,
    addWeek,
    updateEntry,
    removeEntry,
    setActiveWeekStart,
    setActiveTab,
    setResultsTab,
    setEntryMode,
    resetInternal,
    resetLegal,
    calculate,
  };
}

function timeFromDuration(startTime: string, hoursDuration: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + hoursDuration * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = Math.floor(totalMinutes % 60);
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
