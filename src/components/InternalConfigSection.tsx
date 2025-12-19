import { Building2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { InternalConfig } from '../lib/payrollEngine';

interface InternalConfigSectionProps {
  config: InternalConfig;
  onChange: (updates: Partial<InternalConfig>) => void;
  onReset: () => void;
}

export function InternalConfigSection({ config, onChange, onReset }: InternalConfigSectionProps) {
  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Building2 className="text-purple-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración Interna</h3>
              <p className="text-sm text-slate-500">Política de la empresa</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-all flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar valores
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="text-amber-600 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">Limitaciones de política interna</p>
              <p className="text-sm text-amber-700">
                La política interna no contempla recargos nocturnos ni dominicales. Si aparecen estos turnos en el registro, se marcarán como alertas en los resultados.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Horas base semanales</label>
            <div className="relative">
              <input
                type="number"
                value={config.baseWeeklyHours}
                onChange={(e) => onChange({ baseWeeklyHours: parseFloat(e.target.value) || 0 })}
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">horas</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Jornada ordinaria sin recargos</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Colchón hasta</label>
            <div className="relative">
              <input
                type="number"
                value={config.bufferLimit}
                onChange={(e) => onChange({ bufferLimit: parseFloat(e.target.value) || 0 })}
                step="0.5"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">horas</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Límite antes de extras</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Multiplicador horas extra</label>
            <div className="relative">
              <input
                type="number"
                value={config.extraMultiplier}
                onChange={(e) => onChange({ extraMultiplier: parseFloat(e.target.value) || 0 })}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">x</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Horas superiores al colchón</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Multiplicador festivos</label>
            <div className="relative">
              <input
                type="number"
                value={config.holidayMultiplier}
                onChange={(e) => onChange({ holidayMultiplier: parseFloat(e.target.value) || 0 })}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">x</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Trabajo en días festivos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
