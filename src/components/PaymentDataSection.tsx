import { DollarSign, Calendar, Clock, Eye, Info } from 'lucide-react';
import type { PaymentConfig } from '../lib/payrollEngine';
import { cn } from '../lib/utils';

interface PaymentDataSectionProps {
  payment: PaymentConfig;
  onChange: (updates: Partial<PaymentConfig>) => void;
}

export function PaymentDataSection({ payment, onChange }: PaymentDataSectionProps) {
  const formatSalary = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const parseSalary = (str: string) => {
    return parseInt(str.replace(/\D/g, ''), 10) || 0;
  };

  return (
    <section className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#11143F]/10 rounded-lg flex items-center justify-center">
              <DollarSign className="text-[#11143F] w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Datos de Pago</h3>
              <p className="text-sm text-slate-500">Configure la información salarial base</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Tipo de salario</label>
            <div className="flex space-x-3">
              <button
                onClick={() => onChange({ salaryType: 'monthly' })}
                className={cn(
                  'flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all flex items-center justify-center',
                  payment.salaryType === 'monthly'
                    ? 'border-[#11143F] bg-[#11143F] text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Mensual
              </button>
              <button
                onClick={() => onChange({ salaryType: 'hourly' })}
                className={cn(
                  'flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all flex items-center justify-center',
                  payment.salaryType === 'hourly'
                    ? 'border-[#11143F] bg-[#11143F] text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                <Clock className="w-4 h-4 mr-2" />
                Por hora
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Valor del salario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
              <input
                type="text"
                value={formatSalary(payment.salaryAmount)}
                onChange={(e) => onChange({ salaryAmount: parseSalary(e.target.value) })}
                placeholder="2.500.000"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Días trabajados por semana</label>
            <div className="relative">
              <select
                value={payment.workDaysPerWeek}
                onChange={(e) => onChange({ workDaysPerWeek: parseInt(e.target.value) as 5 | 6 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white"
              >
                <option value={5}>5 días (Lunes a Viernes)</option>
                <option value={6}>6 días (Lunes a Sábado)</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Visualización de resultados</label>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="text-slate-600 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Mostrar valor total</p>
                  <p className="text-xs text-slate-500">vs. solo adicional</p>
                </div>
              </div>
              <button
                onClick={() => onChange({ showTotalValue: !payment.showTotalValue })}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  payment.showTotalValue ? 'bg-[#11143F]' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    payment.showTotalValue ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
