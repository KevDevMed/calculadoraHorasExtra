import { Scale, RotateCcw, Info, HelpCircle } from 'lucide-react';
import type { LegalConfig } from '../lib/payrollEngine';

interface LegalConfigSectionProps {
  config: LegalConfig;
  onChange: (updates: Partial<LegalConfig>) => void;
  onReset: () => void;
}

export function LegalConfigSection({ config, onChange, onReset }: LegalConfigSectionProps) {
  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#83152E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Scale className="text-[#83152E] w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Ley Colombiana</h3>
              <p className="text-xs sm:text-sm text-slate-500">Parámetros legales 2025</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-all flex items-center self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Restaurar
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <Info className="text-blue-600 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Actualización jornada legal 2025</p>
              <p className="text-sm text-blue-700">
                A partir del 15 de julio de 2025, la jornada semanal legal se reduce a 44 horas. El valor de la hora no puede disminuir con esta reducción.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Límite semanal legal</label>
            <div className="relative">
              <select
                value={config.weeklyLimit}
                onChange={(e) => onChange({ weeklyLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white"
              >
                <option value={44}>44 horas (desde 15-jul-2025)</option>
                <option value={42}>42 horas (futura reducción)</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Horario nocturno</label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="time"
                  value={config.nightStart}
                  onChange={(e) => onChange({ nightStart: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1.5">Inicio</p>
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={config.nightEnd}
                  onChange={(e) => onChange({ nightEnd: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1.5">Fin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 sm:pt-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3 sm:mb-4">Recargos y multiplicadores legales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recargo nocturno
                <button className="ml-1.5 text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-3 h-3 inline" />
                </button>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.nightSurcharge}
                  onChange={(e) => onChange({ nightSurcharge: parseInt(e.target.value) || 0 })}
                  step="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Trabajo entre 21:00 y 06:00</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Extra diurna
                <button className="ml-1.5 text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-3 h-3 inline" />
                </button>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.extraDaySurcharge}
                  onChange={(e) => onChange({ extraDaySurcharge: parseInt(e.target.value) || 0 })}
                  step="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Exceso jornada, horario diurno</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Extra nocturna
                <button className="ml-1.5 text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-3 h-3 inline" />
                </button>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.extraNightSurcharge}
                  onChange={(e) => onChange({ extraNightSurcharge: parseInt(e.target.value) || 0 })}
                  step="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Exceso jornada + nocturno</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dominical / Festivo
                <button className="ml-1.5 text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-3 h-3 inline" />
                </button>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.sundayHolidaySurcharge}
                  onChange={(e) => onChange({ sundayHolidaySurcharge: parseInt(e.target.value) || 0 })}
                  step="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Trabajo en domingo o festivo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
