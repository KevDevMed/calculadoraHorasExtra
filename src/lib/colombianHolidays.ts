// Colombian holidays for 2024-2026
// Fixed holidays + "Ley Emiliani" movable holidays

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'fixed' | 'movable';
}

// Generate Colombian holidays for a given year
export function getColombianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Fixed holidays
  holidays.push({ date: `${year}-01-01`, name: 'Año Nuevo', type: 'fixed' });
  holidays.push({ date: `${year}-05-01`, name: 'Día del Trabajo', type: 'fixed' });
  holidays.push({ date: `${year}-07-20`, name: 'Día de la Independencia', type: 'fixed' });
  holidays.push({ date: `${year}-08-07`, name: 'Batalla de Boyacá', type: 'fixed' });
  holidays.push({ date: `${year}-12-08`, name: 'Inmaculada Concepción', type: 'fixed' });
  holidays.push({ date: `${year}-12-25`, name: 'Navidad', type: 'fixed' });

  // Movable holidays (Ley Emiliani - moved to next Monday)
  holidays.push({ date: moveToNextMonday(year, 1, 6), name: 'Reyes Magos', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 3, 19), name: 'San José', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 6, 29), name: 'San Pedro y San Pablo', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 8, 15), name: 'Asunción de la Virgen', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 10, 12), name: 'Día de la Raza', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 11, 1), name: 'Todos los Santos', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, 11, 11), name: 'Independencia de Cartagena', type: 'movable' });

  // Easter-based holidays
  const easter = calculateEaster(year);
  holidays.push({ date: addDays(easter, -3), name: 'Jueves Santo', type: 'fixed' });
  holidays.push({ date: addDays(easter, -2), name: 'Viernes Santo', type: 'fixed' });
  holidays.push({ date: moveToNextMonday(year, getMonth(addDays(easter, 43)), getDay(addDays(easter, 43))), name: 'Ascensión del Señor', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, getMonth(addDays(easter, 64)), getDay(addDays(easter, 64))), name: 'Corpus Christi', type: 'movable' });
  holidays.push({ date: moveToNextMonday(year, getMonth(addDays(easter, 71)), getDay(addDays(easter, 71))), name: 'Sagrado Corazón de Jesús', type: 'movable' });

  return holidays;
}

function moveToNextMonday(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 1) {
    return formatDate(date);
  }
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  date.setDate(date.getDate() + daysUntilMonday);
  return formatDate(date);
}

function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return formatDate(result);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonth(dateStr: string): number {
  return parseInt(dateStr.split('-')[1], 10);
}

function getDay(dateStr: string): number {
  return parseInt(dateStr.split('-')[2], 10);
}

export function isHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getColombianHolidays(year);
  return holidays.some(h => h.date === dateStr);
}

export function isSunday(dateStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay() === 0;
}

export function isSundayOrHoliday(dateStr: string): boolean {
  return isSunday(dateStr) || isHoliday(dateStr);
}

export function getHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getColombianHolidays(year);
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
}
