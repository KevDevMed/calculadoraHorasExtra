import { isSunday, isHoliday } from './colombianHolidays';
import { roundTo } from './utils';

// ==================== TYPES ====================

export interface WorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  isHoliday: boolean;
  notes: string;
}

export interface SplitSegment {
  entryId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  isDaytime: boolean;
  isNighttime: boolean;
  isSunday: boolean;
  isHoliday: boolean;
  isExtra: boolean;
}

export interface InternalConfig {
  baseWeeklyHours: number; // 37.5
  bufferLimit: number; // 40
  extraMultiplier: number; // 1.5
  holidayMultiplier: number; // 2.0
}

export interface LegalConfig {
  weeklyLimit: number; // 44 or 42
  nightStart: string; // "21:00"
  nightEnd: string; // "06:00"
  nightSurcharge: number; // 35%
  extraDaySurcharge: number; // 25%
  extraNightSurcharge: number; // 75%
  sundayHolidaySurcharge: number; // 75%
}

export interface PaymentConfig {
  salaryType: 'monthly' | 'hourly';
  salaryAmount: number;
  workDaysPerWeek: 5 | 6;
  showTotalValue: boolean;
}

export interface PayrollConfig {
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  cutoffDate: string;
  paymentDate: string;
  paymentDelay: number; // days
}

export interface CategoryBreakdown {
  category: string;
  hours: number;
  rate: number;
  multiplier: number;
  subtotal: number;
  percentage: number;
}

export interface DayBreakdown {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  amount: number;
  tags: string[];
  segments: SplitSegment[];
}

export interface CalcResult {
  totalHours: number;
  normalHours: number;
  bufferHours: number;
  extraHours: number;
  nightHours: number;
  sundayHolidayHours: number;
  totalAmount: number;
  hourlyRate: number;
  categories: CategoryBreakdown[];
  dayBreakdowns: DayBreakdown[];
  alerts: Alert[];
}

export interface Alert {
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  affectedDays?: string[];
  difference?: number;
}

export interface ComparisonResult {
  internalResult: CalcResult;
  legalResult: CalcResult;
  difference: number;
  differencePercentage: number;
  alerts: Alert[];
  favorEmployee: boolean;
}

// ==================== UTILITY FUNCTIONS ====================

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(dateStr: string): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const date = new Date(dateStr + 'T12:00:00');
  return days[date.getDay()];
}

 function formatLocalDate(date: Date): string {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
 }

 function getWeekKey(dateStr: string): string {
   const date = new Date(dateStr + 'T12:00:00');
   const dayOfWeek = date.getDay();
   const daysSinceMonday = (dayOfWeek + 6) % 7;
   date.setDate(date.getDate() - daysSinceMonday);
   return formatLocalDate(date);
 }

// ==================== SEGMENT SPLITTING ====================

export function splitEntryIntoSegments(
  entry: WorkEntry,
  nightStart: string = '21:00',
  nightEnd: string = '06:00'
): SplitSegment[] {
  const segments: SplitSegment[] = [];

  if (!/^\d{2}:\d{2}$/.test(entry.startTime) || !/^\d{2}:\d{2}$/.test(entry.endTime)) {
    return segments;
  }
  
  const startMinutes = timeToMinutes(entry.startTime);
  let endMinutes = timeToMinutes(entry.endTime);
  const nightStartMinutes = timeToMinutes(nightStart);
  const nightEndMinutes = timeToMinutes(nightEnd);
  
  // Handle midnight crossing
  const crossesMidnight = endMinutes <= startMinutes;
  if (crossesMidnight) {
    endMinutes += 24 * 60;
  }
  
  // Calculate total work minutes minus break
  const totalWorkMinutes = endMinutes - startMinutes - entry.breakMinutes;
  if (totalWorkMinutes <= 0) return segments;

  // Split into daytime/nighttime segments
  let currentMinute = startMinutes;
  let remainingBreak = entry.breakMinutes;

  while (currentMinute < endMinutes) {
    // Determine if current time is nighttime
    let isNight: boolean;
    const normalizedMinute = currentMinute % (24 * 60);
    if (nightStartMinutes > nightEndMinutes) {
      // Night crosses midnight (e.g., 21:00 - 06:00)
      isNight = normalizedMinute >= nightStartMinutes || normalizedMinute < nightEndMinutes;
    } else {
      isNight = normalizedMinute >= nightStartMinutes && normalizedMinute < nightEndMinutes;
    }

    // Find the next boundary
    let nextBoundary = endMinutes;
    
    if (isNight) {
      // Find when daytime starts
      if (nightStartMinutes > nightEndMinutes) {
        // Night crosses midnight
        if (normalizedMinute >= nightStartMinutes) {
          nextBoundary = Math.min(nextBoundary, currentMinute - normalizedMinute + 24 * 60 + nightEndMinutes);
        } else {
          nextBoundary = Math.min(nextBoundary, currentMinute - normalizedMinute + nightEndMinutes);
        }
      } else {
        nextBoundary = Math.min(nextBoundary, currentMinute - normalizedMinute + nightEndMinutes);
      }
    } else {
      // Find when nighttime starts
      if (nightStartMinutes > nightEndMinutes) {
        if (normalizedMinute < nightStartMinutes) {
          nextBoundary = Math.min(nextBoundary, currentMinute - normalizedMinute + nightStartMinutes);
        }
      } else {
        nextBoundary = Math.min(nextBoundary, currentMinute - normalizedMinute + nightStartMinutes);
      }
    }

    // Handle midnight boundary
    const midnightMinutes = currentMinute < 24 * 60 ? 24 * 60 : 48 * 60;
    if (currentMinute < midnightMinutes && nextBoundary > midnightMinutes) {
      nextBoundary = Math.min(nextBoundary, midnightMinutes);
    }

    let segmentMinutes = nextBoundary - currentMinute;
    
    // Apply break to this segment if any remains
    if (remainingBreak > 0) {
      const breakToApply = Math.min(remainingBreak, segmentMinutes);
      segmentMinutes -= breakToApply;
      remainingBreak -= breakToApply;
    }

    if (segmentMinutes > 0) {
      const segmentHours = roundTo(segmentMinutes / 60, 2);
      const segmentDate = currentMinute >= 24 * 60 ? addDay(entry.date) : entry.date;
      
      segments.push({
        entryId: entry.id,
        date: segmentDate,
        startTime: minutesToTime(currentMinute % (24 * 60)),
        endTime: minutesToTime(nextBoundary % (24 * 60)),
        hours: segmentHours,
        isDaytime: !isNight,
        isNighttime: isNight,
        isSunday: isSunday(segmentDate),
        isHoliday: entry.isHoliday || isHoliday(segmentDate),
        isExtra: false, // Will be determined in classification
      });
    }

    currentMinute = nextBoundary;
  }

  return segments;
}

// ==================== CLASSIFICATION ====================

export function classifySegments(
  segments: SplitSegment[],
  weeklyHoursWorked: number,
  weeklyLimit: number
): SplitSegment[] {
  let accumulatedHours = weeklyHoursWorked;
  
  return segments.map(segment => {
    const newAccumulated = accumulatedHours + segment.hours;
    // Calculate how many hours are extra
    let extraHours = 0;
    if (accumulatedHours >= weeklyLimit) {
      extraHours = segment.hours;
    } else if (newAccumulated > weeklyLimit) {
      extraHours = newAccumulated - weeklyLimit;
    }
    
    accumulatedHours = newAccumulated;
    
    return {
      ...segment,
      isExtra: extraHours > 0,
    };
  });
}

// ==================== INTERNAL CALCULATION ====================

export function calcInternal(
  entries: WorkEntry[],
  config: InternalConfig,
  payment: PaymentConfig
): CalcResult {
  const hourlyRate = calculateHourlyRate(payment);
  
  let totalNormalHours = 0;
  let totalBufferHours = 0;
  let totalExtraHours = 0;
  let totalHolidayHours = 0;
  let weeklyAccumulated = 0;
  let currentWeekKey: string | null = null;
  
  const dayBreakdowns: DayBreakdown[] = [];
  const alerts: Alert[] = [];
  const nightShiftDays: string[] = [];
  const warnedSundayDates = new Set<string>();

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  for (const entry of sortedEntries) {
    const segments = splitEntryIntoSegments(entry);
    const entryHours = segments.reduce((sum, s) => sum + s.hours, 0);
    
    const tags: string[] = [];
    let dayAmount = 0;
    
    // Check for night hours (internal policy doesn't pay for night, but we track it)
    const hasNightHours = segments.some(s => s.isNighttime);
    if (hasNightHours) {
      nightShiftDays.push(entry.date);
      tags.push('NOCTURNO');
    }

    for (const segment of segments) {
      const weekKey = getWeekKey(segment.date);
      if (currentWeekKey !== weekKey) {
        currentWeekKey = weekKey;
        weeklyAccumulated = 0;
      }

      if (segment.isHoliday) {
        totalHolidayHours += segment.hours;
        dayAmount += segment.hours * hourlyRate * config.holidayMultiplier;
        if (!tags.includes('FESTIVO')) tags.push('FESTIVO');
        weeklyAccumulated += segment.hours;
        continue;
      }

      if (segment.isSunday) {
        if (!tags.includes('DOMINGO')) tags.push('DOMINGO');
        if (!warnedSundayDates.has(segment.date)) {
          warnedSundayDates.add(segment.date);
          alerts.push({
            type: 'warning',
            title: 'Trabajo en domingo detectado',
            message: `Se registró trabajo en domingo (${segment.date}). La política interna indica no trabajar domingos.`,
            affectedDays: [segment.date],
          });
        }
      }

      if (segment.isDaytime && !tags.includes('DIURNO')) tags.push('DIURNO');

      const newAccumulated = weeklyAccumulated + segment.hours;

      if (weeklyAccumulated < config.baseWeeklyHours) {
        const normalHours = Math.min(segment.hours, config.baseWeeklyHours - weeklyAccumulated);
        totalNormalHours += normalHours;
        dayAmount += normalHours * hourlyRate;

        const remaining = segment.hours - normalHours;
        if (remaining > 0) {
          if (weeklyAccumulated + normalHours < config.bufferLimit) {
            const bufferHours = Math.min(remaining, config.bufferLimit - (weeklyAccumulated + normalHours));
            totalBufferHours += bufferHours;
            dayAmount += bufferHours * hourlyRate;
            if (!tags.includes('COLCHÓN')) tags.push('COLCHÓN');

            const extraHours = remaining - bufferHours;
            if (extraHours > 0) {
              totalExtraHours += extraHours;
              dayAmount += extraHours * hourlyRate * config.extraMultiplier;
              if (!tags.includes('EXTRA')) tags.push('EXTRA');
            }
          } else {
            totalExtraHours += remaining;
            dayAmount += remaining * hourlyRate * config.extraMultiplier;
            if (!tags.includes('EXTRA')) tags.push('EXTRA');
          }
        }
      } else if (weeklyAccumulated < config.bufferLimit) {
        const bufferHours = Math.min(segment.hours, config.bufferLimit - weeklyAccumulated);
        totalBufferHours += bufferHours;
        dayAmount += bufferHours * hourlyRate;
        if (!tags.includes('COLCHÓN')) tags.push('COLCHÓN');

        const extraHours = segment.hours - bufferHours;
        if (extraHours > 0) {
          totalExtraHours += extraHours;
          dayAmount += extraHours * hourlyRate * config.extraMultiplier;
          if (!tags.includes('EXTRA')) tags.push('EXTRA');
        }
      } else {
        totalExtraHours += segment.hours;
        dayAmount += segment.hours * hourlyRate * config.extraMultiplier;
        if (!tags.includes('EXTRA')) tags.push('EXTRA');
      }

      weeklyAccumulated = newAccumulated;
    }

    if (hasNightHours && !tags.includes('⚠ NO PAGO NOCTURNO')) {
      tags.push('⚠ NO PAGO NOCTURNO');
    }

    dayBreakdowns.push({
      date: entry.date,
      dayName: getDayName(entry.date),
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      totalHours: entryHours,
      amount: roundTo(dayAmount, 0),
      tags: [...new Set(tags)],
      segments,
    });
  }

  // Add night hours alert if any
  if (nightShiftDays.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Horas nocturnas detectadas',
      message: 'La política interna no contempla pago de recargo nocturno. Sin embargo, la ley colombiana exige un recargo del 35% para trabajo entre las 21:00 y 06:00.',
      affectedDays: nightShiftDays,
    });
  }

  const totalHours = totalNormalHours + totalBufferHours + totalExtraHours + totalHolidayHours;
  const totalAmount = roundTo(
    totalNormalHours * hourlyRate +
    totalBufferHours * hourlyRate +
    totalExtraHours * hourlyRate * config.extraMultiplier +
    totalHolidayHours * hourlyRate * config.holidayMultiplier,
    0
  );

  const categories: CategoryBreakdown[] = [
    {
      category: 'Horas normales',
      hours: roundTo(totalNormalHours, 2),
      rate: roundTo(hourlyRate, 0),
      multiplier: 1.0,
      subtotal: roundTo(totalNormalHours * hourlyRate, 0),
      percentage: totalHours > 0 ? roundTo((totalNormalHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Horas colchón',
      hours: roundTo(totalBufferHours, 2),
      rate: roundTo(hourlyRate, 0),
      multiplier: 1.0,
      subtotal: roundTo(totalBufferHours * hourlyRate, 0),
      percentage: totalHours > 0 ? roundTo((totalBufferHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Horas extra',
      hours: roundTo(totalExtraHours, 2),
      rate: roundTo(hourlyRate * config.extraMultiplier, 0),
      multiplier: config.extraMultiplier,
      subtotal: roundTo(totalExtraHours * hourlyRate * config.extraMultiplier, 0),
      percentage: totalHours > 0 ? roundTo((totalExtraHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Festivos',
      hours: roundTo(totalHolidayHours, 2),
      rate: roundTo(hourlyRate * config.holidayMultiplier, 0),
      multiplier: config.holidayMultiplier,
      subtotal: roundTo(totalHolidayHours * hourlyRate * config.holidayMultiplier, 0),
      percentage: totalHours > 0 ? roundTo((totalHolidayHours / totalHours) * 100, 1) : 0,
    },
  ];

  return {
    totalHours: roundTo(totalHours, 2),
    normalHours: roundTo(totalNormalHours, 2),
    bufferHours: roundTo(totalBufferHours, 2),
    extraHours: roundTo(totalExtraHours, 2),
    nightHours: 0, // Internal doesn't pay night hours
    sundayHolidayHours: roundTo(totalHolidayHours, 2),
    totalAmount,
    hourlyRate: roundTo(hourlyRate, 0),
    categories,
    dayBreakdowns,
    alerts,
  };
}

// ==================== COLOMBIAN LAW CALCULATION ====================

export function calcColombia(
  entries: WorkEntry[],
  config: LegalConfig,
  payment: PaymentConfig
): CalcResult {
  const hourlyRate = calculateHourlyRate(payment);
  
  let totalNormalHours = 0;
  let totalNightHours = 0;
  let totalExtraDayHours = 0;
  let totalExtraNightHours = 0;
  let totalSundayHolidayDayHours = 0;
  let totalSundayHolidayNightHours = 0;
  let totalExtraSundayDayHours = 0;
  let totalExtraSundayNightHours = 0;
  let weeklyAccumulated = 0;
  let currentWeekKey: string | null = null;
  
  const dayBreakdowns: DayBreakdown[] = [];
  const alerts: Alert[] = [];

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  for (const entry of sortedEntries) {
    const segments = splitEntryIntoSegments(entry, config.nightStart, config.nightEnd);
    const entryHours = segments.reduce((sum, s) => sum + s.hours, 0);
    
    const tags: string[] = [];
    let dayAmount = 0;

    for (const segment of segments) {
      const weekKey = getWeekKey(segment.date);
      if (currentWeekKey !== weekKey) {
        currentWeekKey = weekKey;
        weeklyAccumulated = 0;
      }

      const isSundayOrHoliday = segment.isSunday || segment.isHoliday;
      const remainingNormal = Math.max(0, config.weeklyLimit - weeklyAccumulated);
      const normalPart = Math.min(segment.hours, remainingNormal);
      const extraPart = segment.hours - normalPart;

      if (isSundayOrHoliday) {
        if (!tags.includes('DOMINICAL/FESTIVO')) tags.push('DOMINICAL/FESTIVO');
      }

      if (normalPart > 0) {
        let multiplier = 1.0;

        if (isSundayOrHoliday) {
          if (segment.isNighttime) {
            multiplier = 1 + (config.nightSurcharge / 100) + (config.sundayHolidaySurcharge / 100);
            totalSundayHolidayNightHours += normalPart;
          } else {
            multiplier = 1 + (config.sundayHolidaySurcharge / 100);
            totalSundayHolidayDayHours += normalPart;
          }
        } else {
          if (segment.isNighttime) {
            multiplier = 1 + (config.nightSurcharge / 100);
            totalNightHours += normalPart;
            if (!tags.includes('NOCTURNO')) tags.push('NOCTURNO');
          } else {
            multiplier = 1.0;
            totalNormalHours += normalPart;
            if (!tags.includes('DIURNO')) tags.push('DIURNO');
          }
        }

        dayAmount += normalPart * hourlyRate * multiplier;
      }

      if (extraPart > 0) {
        let multiplier = 1.0;

        if (isSundayOrHoliday) {
          if (segment.isNighttime) {
            multiplier = 1 + (config.extraNightSurcharge / 100) + (config.sundayHolidaySurcharge / 100);
            totalExtraSundayNightHours += extraPart;
          } else {
            multiplier = 1 + (config.extraDaySurcharge / 100) + (config.sundayHolidaySurcharge / 100);
            totalExtraSundayDayHours += extraPart;
          }
        } else {
          if (segment.isNighttime) {
            multiplier = 1 + (config.extraNightSurcharge / 100);
            totalExtraNightHours += extraPart;
            if (!tags.includes('EXTRA NOCTURNA')) tags.push('EXTRA NOCTURNA');
          } else {
            multiplier = 1 + (config.extraDaySurcharge / 100);
            totalExtraDayHours += extraPart;
            if (!tags.includes('EXTRA')) tags.push('EXTRA');
          }
        }

        dayAmount += extraPart * hourlyRate * multiplier;
      }

      weeklyAccumulated += segment.hours;
    }

    dayBreakdowns.push({
      date: entry.date,
      dayName: getDayName(entry.date),
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      totalHours: entryHours,
      amount: roundTo(dayAmount, 0),
      tags: [...new Set(tags)],
      segments,
    });
  }

  const totalHours = totalNormalHours + totalNightHours + totalExtraDayHours + 
    totalExtraNightHours + totalSundayHolidayDayHours + totalSundayHolidayNightHours +
    totalExtraSundayDayHours + totalExtraSundayNightHours;

  const totalAmount = roundTo(
    totalNormalHours * hourlyRate +
    totalNightHours * hourlyRate * (1 + config.nightSurcharge / 100) +
    totalExtraDayHours * hourlyRate * (1 + config.extraDaySurcharge / 100) +
    totalExtraNightHours * hourlyRate * (1 + config.extraNightSurcharge / 100) +
    totalSundayHolidayDayHours * hourlyRate * (1 + config.sundayHolidaySurcharge / 100) +
    totalSundayHolidayNightHours * hourlyRate * (1 + config.nightSurcharge / 100 + config.sundayHolidaySurcharge / 100) +
    totalExtraSundayDayHours * hourlyRate * (1 + config.extraDaySurcharge / 100 + config.sundayHolidaySurcharge / 100) +
    totalExtraSundayNightHours * hourlyRate * (1 + config.extraNightSurcharge / 100 + config.sundayHolidaySurcharge / 100),
    0
  );

  const categories: CategoryBreakdown[] = [
    {
      category: 'Horas normales',
      hours: roundTo(totalNormalHours, 2),
      rate: roundTo(hourlyRate, 0),
      multiplier: 1.0,
      subtotal: roundTo(totalNormalHours * hourlyRate, 0),
      percentage: totalHours > 0 ? roundTo((totalNormalHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Recargo nocturno',
      hours: roundTo(totalNightHours, 2),
      rate: roundTo(hourlyRate * (1 + config.nightSurcharge / 100), 0),
      multiplier: 1 + config.nightSurcharge / 100,
      subtotal: roundTo(totalNightHours * hourlyRate * (1 + config.nightSurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalNightHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Extra diurna',
      hours: roundTo(totalExtraDayHours, 2),
      rate: roundTo(hourlyRate * (1 + config.extraDaySurcharge / 100), 0),
      multiplier: 1 + config.extraDaySurcharge / 100,
      subtotal: roundTo(totalExtraDayHours * hourlyRate * (1 + config.extraDaySurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalExtraDayHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Extra nocturna',
      hours: roundTo(totalExtraNightHours, 2),
      rate: roundTo(hourlyRate * (1 + config.extraNightSurcharge / 100), 0),
      multiplier: 1 + config.extraNightSurcharge / 100,
      subtotal: roundTo(totalExtraNightHours * hourlyRate * (1 + config.extraNightSurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalExtraNightHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Dominical/Festivo diurno',
      hours: roundTo(totalSundayHolidayDayHours, 2),
      rate: roundTo(hourlyRate * (1 + config.sundayHolidaySurcharge / 100), 0),
      multiplier: 1 + config.sundayHolidaySurcharge / 100,
      subtotal: roundTo(totalSundayHolidayDayHours * hourlyRate * (1 + config.sundayHolidaySurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalSundayHolidayDayHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Dominical/Festivo nocturno',
      hours: roundTo(totalSundayHolidayNightHours, 2),
      rate: roundTo(hourlyRate * (1 + config.nightSurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      multiplier: 1 + config.nightSurcharge / 100 + config.sundayHolidaySurcharge / 100,
      subtotal: roundTo(totalSundayHolidayNightHours * hourlyRate * (1 + config.nightSurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalSundayHolidayNightHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Extra dominical/festivo diurna',
      hours: roundTo(totalExtraSundayDayHours, 2),
      rate: roundTo(hourlyRate * (1 + config.extraDaySurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      multiplier: 1 + config.extraDaySurcharge / 100 + config.sundayHolidaySurcharge / 100,
      subtotal: roundTo(totalExtraSundayDayHours * hourlyRate * (1 + config.extraDaySurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalExtraSundayDayHours / totalHours) * 100, 1) : 0,
    },
    {
      category: 'Extra dominical/festivo nocturna',
      hours: roundTo(totalExtraSundayNightHours, 2),
      rate: roundTo(hourlyRate * (1 + config.extraNightSurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      multiplier: 1 + config.extraNightSurcharge / 100 + config.sundayHolidaySurcharge / 100,
      subtotal: roundTo(totalExtraSundayNightHours * hourlyRate * (1 + config.extraNightSurcharge / 100 + config.sundayHolidaySurcharge / 100), 0),
      percentage: totalHours > 0 ? roundTo((totalExtraSundayNightHours / totalHours) * 100, 1) : 0,
    },
  ];

  return {
    totalHours: roundTo(totalHours, 2),
    normalHours: roundTo(totalNormalHours, 2),
    bufferHours: 0,
    extraHours: roundTo(totalExtraDayHours + totalExtraNightHours + totalExtraSundayDayHours + totalExtraSundayNightHours, 2),
    nightHours: roundTo(totalNightHours + totalSundayHolidayNightHours + totalExtraNightHours + totalExtraSundayNightHours, 2),
    sundayHolidayHours: roundTo(totalSundayHolidayDayHours + totalSundayHolidayNightHours + totalExtraSundayDayHours + totalExtraSundayNightHours, 2),
    totalAmount,
    hourlyRate: roundTo(hourlyRate, 0),
    categories: categories.filter(c => c.hours > 0),
    dayBreakdowns,
    alerts,
  };
}

// ==================== COMPARISON ====================

export function compareResults(
  internalResult: CalcResult,
  legalResult: CalcResult
): ComparisonResult {
  const difference = legalResult.totalAmount - internalResult.totalAmount;
  const differencePercentage = internalResult.totalAmount > 0 
    ? roundTo((difference / internalResult.totalAmount) * 100, 1) 
    : 0;
  
  const alerts: Alert[] = [...internalResult.alerts];

  // Check for night hours not paid internally
  if (legalResult.nightHours > 0 && internalResult.nightHours === 0) {
    const nightDiff = legalResult.categories
      .filter(c => c.category.toLowerCase().includes('noct'))
      .reduce((sum, c) => sum + c.subtotal, 0) -
      legalResult.categories
        .filter(c => c.category.toLowerCase().includes('noct'))
        .reduce((sum, c) => sum + (c.hours * legalResult.hourlyRate), 0);
    
    alerts.push({
      type: 'warning',
      title: 'Diferencia en recargos nocturnos',
      message: `La política interna no paga recargo nocturno. La ley colombiana exige +35% para estas horas.`,
      difference: nightDiff,
    });
  }

  // Check if internal pays more for holidays
  const internalHolidayPay = internalResult.categories.find(c => c.category === 'Festivos');
  const legalHolidayPay = legalResult.categories.find(c => c.category.includes('Dominical/Festivo'));
  
  if (internalHolidayPay && legalHolidayPay && internalHolidayPay.multiplier > legalHolidayPay.multiplier) {
    alerts.push({
      type: 'info',
      title: 'Pago de festivos por encima de ley',
      message: `La política interna paga festivos a ${internalHolidayPay.multiplier}x vs ${legalHolidayPay.multiplier}x de la ley. Estás pagando por encima del mínimo legal.`,
    });
  }

  return {
    internalResult,
    legalResult,
    difference,
    differencePercentage,
    alerts,
    favorEmployee: difference > 0,
  };
}

// ==================== HELPERS ====================

function calculateHourlyRate(payment: PaymentConfig): number {
  if (payment.salaryType === 'hourly') {
    return payment.salaryAmount;
  }
  
  // Monthly salary to hourly
  // Using 4.33 weeks per month average and assuming legal weekly hours
  const weeksPerMonth = 4.33;
  const hoursPerWeek = payment.workDaysPerWeek === 5 ? 40 : 48;
  const monthlyHours = hoursPerWeek * weeksPerMonth;
  
  return payment.salaryAmount / monthlyHours;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
