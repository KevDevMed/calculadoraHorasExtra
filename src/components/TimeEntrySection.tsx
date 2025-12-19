import { Clock, Plus, Trash2, Moon } from 'lucide-react';
import type { WorkEntry } from '../lib/payrollEngine';
import { cn } from '../lib/utils';
import { isHoliday, getHolidayName } from '../lib/colombianHolidays';

interface TimeEntrySectionProps {
  entries: WorkEntry[];
  entryMode: 'simple' | 'detailed';
  onModeChange: (mode: 'simple' | 'detailed') => void;
  onAddEntry: () => void;
  onUpdateEntry: (id: string, updates: Partial<WorkEntry>) => void;
  onRemoveEntry: (id: string) => void;
}

export function TimeEntrySection({
  entries,
  entryMode,
  onModeChange,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
}: TimeEntrySectionProps) {
  const getWeekday = (dateStr: string) => {
    const weekday = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getEntryTotalHours = (entry: WorkEntry) => {
    const startMinutes = timeToMinutes(entry.startTime);
    let endMinutes = timeToMinutes(entry.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const workedMinutes = endMinutes - startMinutes - entry.breakMinutes;
    const hours = Math.max(0, workedMinutes / 60);
    return Math.round(hours * 100) / 100;
  };

  const hasMidnightCrossing = (entry: WorkEntry) => {
    const start = parseInt(entry.startTime.replace(':', ''), 10);
    const end = parseInt(entry.endTime.replace(':', ''), 10);
    return end <= start;
  };

  const hasNightHours = (entry: WorkEntry) => {
    const startHour = parseInt(entry.startTime.split(':')[0], 10);
    const endHour = parseInt(entry.endTime.split(':')[0], 10);
    return startHour >= 21 || endHour <= 6 || hasMidnightCrossing(entry);
  };

  const midnightCrossingEntries = entries.filter(hasMidnightCrossing);

  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Clock className="text-indigo-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Registro de Tiempo</h3>
              <p className="text-sm text-slate-500">Ingrese las horas trabajadas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={cn("text-sm", entryMode === 'simple' ? 'font-medium text-slate-900' : 'text-slate-600')}>
              Modo simple
            </span>
            <button
              onClick={() => onModeChange(entryMode === 'simple' ? 'detailed' : 'simple')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                entryMode === 'detailed' ? 'bg-slate-900' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  entryMode === 'detailed' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn("text-sm", entryMode === 'detailed' ? 'font-medium text-slate-900' : 'text-slate-600')}>
              Modo detallado
            </span>
          </div>
        </div>

        {entryMode === 'detailed' ? (
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">Registre cada turno trabajado con sus detalles específicos</p>
                <button
                  onClick={onAddEntry}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar turno
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Día</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Inicio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Break (min)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Horas</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Festivo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Notas</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {entries.map((entry) => {
                      const isNight = hasNightHours(entry);
                      const holidayName = getHolidayName(entry.date);
                      const autoHoliday = isHoliday(entry.date);
                      
                      return (
                        <tr
                          key={entry.id}
                          className={cn(
                            'hover:bg-slate-50',
                            isNight && 'bg-amber-50'
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={entry.date}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                const updates: Partial<WorkEntry> = { date: newDate };
                                if (isHoliday(newDate)) {
                                  updates.isHoliday = true;
                                }
                                onUpdateEntry(entry.id, updates);
                              }}
                              className={cn(
                                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                                isNight
                                  ? 'border-amber-300 focus:ring-amber-500'
                                  : 'border-slate-300 focus:ring-slate-900'
                              )}
                            />
                            {holidayName && (
                              <p className="text-xs text-green-600 mt-1">{holidayName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {getWeekday(entry.date)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={entry.startTime}
                              onChange={(e) => onUpdateEntry(entry.id, { startTime: e.target.value })}
                              className={cn(
                                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                                isNight
                                  ? 'border-amber-300 focus:ring-amber-500'
                                  : 'border-slate-300 focus:ring-slate-900'
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={entry.endTime}
                              onChange={(e) => onUpdateEntry(entry.id, { endTime: e.target.value })}
                              className={cn(
                                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                                isNight
                                  ? 'border-amber-300 focus:ring-amber-500'
                                  : 'border-slate-300 focus:ring-slate-900'
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={entry.breakMinutes}
                              onChange={(e) => onUpdateEntry(entry.id, { breakMinutes: parseInt(e.target.value) || 0 })}
                              className={cn(
                                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                                isNight
                                  ? 'border-amber-300 focus:ring-amber-500'
                                  : 'border-slate-300 focus:ring-slate-900'
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
                            {getEntryTotalHours(entry).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={entry.isHoliday || autoHoliday}
                              onChange={(e) => onUpdateEntry(entry.id, { isHoliday: e.target.checked })}
                              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={entry.notes}
                              onChange={(e) => onUpdateEntry(entry.id, { notes: e.target.value })}
                              placeholder="Opcional"
                              className={cn(
                                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                                isNight
                                  ? 'border-amber-300 focus:ring-amber-500'
                                  : 'border-slate-300 focus:ring-slate-900'
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onRemoveEntry(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {midnightCrossingEntries.length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
                <Moon className="text-amber-600 w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Turno cruza medianoche:</span> Se detectaron turnos que inician en un día y terminan al siguiente. Se calculará automáticamente el recargo nocturno correspondiente.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horas trabajadas totales (semana)</label>
              <input
                type="number"
                placeholder="40"
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horas en festivos</label>
              <input
                type="number"
                placeholder="0"
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horas en domingos</label>
              <input
                type="number"
                placeholder="0"
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horas nocturnas</label>
              <input
                type="number"
                placeholder="0"
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
