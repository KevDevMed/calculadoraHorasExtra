import { CalendarCheck, Lightbulb } from 'lucide-react';
import type { PayrollConfig } from '../lib/payrollEngine';

interface PayrollConfigSectionProps {
  config: PayrollConfig;
  onChange: (updates: Partial<PayrollConfig>) => void;
}

export function PayrollConfigSection({ config, onChange }: PayrollConfigSectionProps) {
  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#83152E]/10 rounded-lg flex items-center justify-center">
              <CalendarCheck className="text-[#83152E] w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Pago Atrasado</h3>
              <p className="text-sm text-slate-500">Configure el ciclo de nómina y desfases</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Frecuencia de nómina</label>
            <div className="relative">
              <select
                value={config.paymentFrequency}
                onChange={(e) => onChange({ paymentFrequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white"
              >
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de corte</label>
            <input
              type="date"
              value={config.cutoffDate}
              onChange={(e) => onChange({ cutoffDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha estimada de pago</label>
            <input
              type="date"
              value={config.paymentDate}
              onChange={(e) => onChange({ paymentDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Desfase de pago (días)</label>
            <div className="relative">
              <input
                type="number"
                value={config.paymentDelay}
                onChange={(e) => onChange({ paymentDelay: parseInt(e.target.value) || 0 })}
                step="1"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">días</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Lightbulb className="text-blue-600 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Etiquetado automático</p>
              <p className="text-sm text-blue-700">
                Cada turno se etiquetará automáticamente con el período de nómina donde se pagará, considerando el desfase configurado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
