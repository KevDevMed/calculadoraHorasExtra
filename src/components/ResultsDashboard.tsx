import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Building2, Scale, GitCompare, FileSpreadsheet, Copy, AlertTriangle, Info, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CalcResult, ComparisonResult, PaymentConfig } from '../lib/payrollEngine';
import { formatCurrency, cn } from '../lib/utils';

interface ResultsDashboardProps {
  payment: PaymentConfig;
  internalResult: CalcResult | null;
  legalResult: CalcResult | null;
  comparison: ComparisonResult | null;
  resultsTab: 'internal' | 'legal' | 'comparison';
  onTabChange: (tab: 'internal' | 'legal' | 'comparison') => void;
}

export function ResultsDashboard({
  payment,
  internalResult,
  legalResult,
  comparison,
  resultsTab,
  onTabChange,
}: ResultsDashboardProps) {
  if (!internalResult || !legalResult || !comparison) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Sin resultados</h3>
        <p className="text-slate-500">Complete los datos de entrada y haga clic en "Calcular Comparativa" para ver los resultados.</p>
      </div>
    );
  }

  const activeResult = resultsTab === 'internal' ? internalResult : legalResult;
  const resultLabel = resultsTab === 'internal' ? 'Política Interna' : 'Ley Colombiana';

  const smmlv = 1300000;

  // Internal payslip calculations
  const intGross = internalResult.totalAmount;
  const intHealth = Math.round(intGross * 0.04);
  const intPension = Math.round(intGross * 0.04);
  const intSolidarity = intGross >= smmlv * 4 ? Math.round(intGross * 0.01) : 0;
  const intTotalDeductions = intHealth + intPension + intSolidarity;
  const intNet = Math.max(0, intGross - intTotalDeductions);
  const intBasePay = Math.max(0, internalResult.normalHours * internalResult.hourlyRate);
  const intExtrasPay = Math.max(0, intGross - intBasePay);

  // Legal payslip calculations
  const legalGross = legalResult.totalAmount;
  const legalHealth = Math.round(legalGross * 0.04);
  const legalPension = Math.round(legalGross * 0.04);
  const legalSolidarity = legalGross >= smmlv * 4 ? Math.round(legalGross * 0.01) : 0;
  const legalTotalDeductions = legalHealth + legalPension + legalSolidarity;
  const legalNet = Math.max(0, legalGross - legalTotalDeductions);
  const legalBasePay = Math.max(0, legalResult.normalHours * legalResult.hourlyRate);
  const legalExtrasPay = Math.max(0, legalGross - legalBasePay);

  const isOverpaid = comparison.difference < 0;
  const differenceBadgeLabel = isOverpaid ? 'Pagado de más' : 'Pagado de menos';
  const differenceGradientClass = isOverpaid
    ? 'bg-gradient-to-br from-emerald-600 to-[#11143F]'
    : 'bg-gradient-to-br from-[#83152E] to-[#11143F]';

  const salaryLabel = payment.salaryType === 'monthly' ? 'Salario (mensual)' : 'Tarifa (por hora)';

  const internalSlipRef = useRef<HTMLDivElement | null>(null);
  const legalSlipRef = useRef<HTMLDivElement | null>(null);

  const allDates = legalResult.dayBreakdowns.map(d => d.date).sort();
  const periodStart = allDates[0];
  const periodEnd = allDates[allDates.length - 1];

  // Prepare chart data
  const CHART_COLORS = ['#94a3b8', '#60a5fa', '#fb923c', '#a78bfa', '#4ade80', '#818cf8'];
  const chartData = activeResult.categories
    .filter(cat => cat.hours > 0)
    .map(cat => ({
      name: cat.category,
      value: cat.hours,
    }));

  const exportToCSV = () => {
    const result = activeResult;
    const headers = ['Categoría', 'Horas', 'Tarifa/Hora', 'Multiplicador', 'Subtotal', '% Total'];
    const rows = result.categories.map(cat => [
      cat.category,
      cat.hours.toString(),
      formatCurrency(cat.rate),
      `${cat.multiplier}x`,
      formatCurrency(cat.subtotal),
      `${cat.percentage}%`
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calculo_nomina_${resultsTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportComparisonToCSV = () => {
    const headers = ['Concepto', 'Política Interna', 'Ley Colombiana', 'Diferencia'];
    const rows = [
      ['Total Horas', internalResult.totalHours.toFixed(1), legalResult.totalHours.toFixed(1), '-'],
      ['Horas Normales', internalResult.normalHours.toFixed(1), legalResult.normalHours.toFixed(1), (legalResult.normalHours - internalResult.normalHours).toFixed(1)],
      ['Horas Extra', internalResult.extraHours.toFixed(1), legalResult.extraHours.toFixed(1), (legalResult.extraHours - internalResult.extraHours).toFixed(1)],
      ['Horas Nocturnas', internalResult.nightHours.toFixed(1), legalResult.nightHours.toFixed(1), (legalResult.nightHours - internalResult.nightHours).toFixed(1)],
      ['Total a Pagar', formatCurrency(internalResult.totalAmount), formatCurrency(legalResult.totalAmount), formatCurrency(comparison.difference)],
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacion_nomina_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const copyToClipboard = () => {
    const result = activeResult;
    const summary = `
Resumen de Cálculo - ${resultLabel}
================================
Total Horas: ${result.totalHours}
Total a Pagar: ${formatCurrency(result.totalAmount)}
Valor Hora Base: ${formatCurrency(result.hourlyRate)}

Desglose por Categoría:
${result.categories.map(cat => `- ${cat.category}: ${cat.hours}h @ ${formatCurrency(cat.rate)} = ${formatCurrency(cat.subtotal)}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(summary);
  };

  const downloadInternalSlipAsPng = async () => {
    if (!internalSlipRef.current) return;
    const dataUrl = await toPng(internalSlipRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `desprendible_interno_${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadLegalSlipAsPng = async () => {
    if (!legalSlipRef.current) return;
    const dataUrl = await toPng(legalSlipRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `desprendible_legal_${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copyComparisonToClipboard = () => {
    const badgeLabel = comparison.favorEmployee ? 'Sin pagar al empleado' : 'Pagado extra al empleado';
    const summary = `
Comparación - Política Interna vs Ley Colombiana
===============================================
Resultado: ${badgeLabel}
Diferencia: ${formatCurrency(comparison.difference)} (${comparison.differencePercentage > 0 ? '+' : ''}${comparison.differencePercentage}%)

Totales:
- Política Interna: ${formatCurrency(internalResult.totalAmount)}
- Ley Colombiana: ${formatCurrency(legalResult.totalAmount)}

Horas:
- Total horas: ${internalResult.totalHours.toFixed(1)} vs ${legalResult.totalHours.toFixed(1)}
- Horas normales: ${internalResult.normalHours.toFixed(1)} vs ${legalResult.normalHours.toFixed(1)}
- Horas extra: ${internalResult.extraHours.toFixed(1)} vs ${legalResult.extraHours.toFixed(1)}
- Horas nocturnas: ${internalResult.nightHours.toFixed(1)} vs ${legalResult.nightHours.toFixed(1)}
    `.trim();

    navigator.clipboard.writeText(summary);
  };

  return (
    <div>
      {/* KPI Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#11143F] to-[#83152E] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Interno</span>
            </div>
            <h4 className="text-sm font-medium mb-2 opacity-90">Total Política Interna</h4>
            <p className="text-3xl font-bold mb-1">{formatCurrency(internalResult.totalAmount)}</p>
            <p className="text-sm opacity-80">Base + extras + festivos</p>
          </div>

          <div className="bg-gradient-to-br from-[#83152E] to-[#11143F] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Legal</span>
            </div>
            <h4 className="text-sm font-medium mb-2 opacity-90">Total Ley Colombiana</h4>
            <p className="text-3xl font-bold mb-1">{formatCurrency(legalResult.totalAmount)}</p>
            <p className="text-sm opacity-80">Incluye recargos nocturnos</p>
          </div>

          <div className={cn(differenceGradientClass, 'rounded-xl p-6 text-white')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <GitCompare className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-sm font-medium px-3 py-1 rounded-full",
                isOverpaid ? 'bg-white/15' : 'bg-white/15'
              )}>
                {differenceBadgeLabel}
              </span>
            </div>
            <h4 className="text-sm font-medium mb-2 opacity-90">Diferencia</h4>
            <p className="text-3xl font-bold mb-1">{formatCurrency(Math.abs(comparison.difference))}</p>
            <p className="text-sm opacity-80">
              {isOverpaid ? '+' : ''}{isOverpaid ? Math.abs(comparison.differencePercentage) : -Math.abs(comparison.differencePercentage)}% sobre política interna
            </p>
          </div>
        </div>
      </section>

      {/* Two Payslips: Internal and Legal */}
      <section className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Desprendibles de nómina (prototipos)</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Internal Payslip */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-slate-700">Desprendible Normal</p>
              <button
                onClick={downloadInternalSlipAsPng}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
              >
                <Download className="w-3 h-3 mr-1.5" />
                PNG
              </button>
            </div>
            <div ref={internalSlipRef} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Desprendible Normal</p>
                  <p className="text-xs text-slate-500">Política de la empresa</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900">Harp Audit</p>
                  {periodStart && periodEnd && (
                    <p className="text-xs text-slate-500">
                      {new Date(periodStart + 'T12:00:00').toLocaleDateString('es-CO')} – {new Date(periodEnd + 'T12:00:00').toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{salaryLabel}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(payment.salaryAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor hora</span>
                  <span className="font-medium tabular-nums">{formatCurrency(internalResult.hourlyRate)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Base (horas normales)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(intBasePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Extras y festivos</span>
                  <span className="font-medium tabular-nums">{formatCurrency(intExtrasPay)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <span>Total devengado</span>
                  <span className="tabular-nums">{formatCurrency(intGross)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Salud (4%)</span>
                  <span className="tabular-nums">{formatCurrency(intHealth)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pensión (4%)</span>
                  <span className="tabular-nums">{formatCurrency(intPension)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fondo solidaridad (1%)</span>
                  <span className="tabular-nums">{formatCurrency(intSolidarity)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Total deducciones</span>
                  <span className="tabular-nums">{formatCurrency(intTotalDeductions)}</span>
                </div>
              </div>

              <div className="mt-3 bg-[#11143F]/5 border border-[#11143F]/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900">Neto a pagar</span>
                <span className="text-lg font-bold text-[#11143F] tabular-nums">{formatCurrency(intNet)}</span>
              </div>
            </div>
          </div>

          {/* Legal Payslip */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-slate-700">Desprendible Oficial</p>
              <button
                onClick={downloadLegalSlipAsPng}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
              >
                <Download className="w-3 h-3 mr-1.5" />
                PNG
              </button>
            </div>
            <div ref={legalSlipRef} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Desprendible Oficial</p>
                  <p className="text-xs text-slate-500">Según normativa colombiana</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900">Harp Audit</p>
                  {periodStart && periodEnd && (
                    <p className="text-xs text-slate-500">
                      {new Date(periodStart + 'T12:00:00').toLocaleDateString('es-CO')} – {new Date(periodEnd + 'T12:00:00').toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{salaryLabel}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(payment.salaryAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor hora</span>
                  <span className="font-medium tabular-nums">{formatCurrency(legalResult.hourlyRate)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Base (horas normales)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(legalBasePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Recargos y extras</span>
                  <span className="font-medium tabular-nums">{formatCurrency(legalExtrasPay)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <span>Total devengado</span>
                  <span className="tabular-nums">{formatCurrency(legalGross)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Salud (4%)</span>
                  <span className="tabular-nums">{formatCurrency(legalHealth)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pensión (4%)</span>
                  <span className="tabular-nums">{formatCurrency(legalPension)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fondo solidaridad (1%)</span>
                  <span className="tabular-nums">{formatCurrency(legalSolidarity)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Total deducciones</span>
                  <span className="tabular-nums">{formatCurrency(legalTotalDeductions)}</span>
                </div>
              </div>

              <div className="mt-3 bg-[#83152E]/5 border border-[#83152E]/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900">Neto a pagar</span>
                <span className="text-lg font-bold text-[#83152E] tabular-nums">{formatCurrency(legalNet)}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Results Tabs */}
      <section className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-1.5">
          <div className="flex space-x-1">
            <button
              onClick={() => onTabChange('internal')}
              className={cn(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
                resultsTab === 'internal'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Política Interna
            </button>
            <button
              onClick={() => onTabChange('legal')}
              className={cn(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
                resultsTab === 'legal'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Scale className="w-4 h-4 mr-2" />
              Ley Colombiana
            </button>
            <button
              onClick={() => onTabChange('comparison')}
              className={cn(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
                resultsTab === 'comparison'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Comparación
            </button>
          </div>
        </div>
      </section>

      {/* Breakdown Section */}
      {resultsTab !== 'comparison' ? (
        <section className="mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Desglose por Categoría - {resultLabel}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar CSV
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar resumen
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <div className="h-[300px] w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number | string | Array<number | string> | undefined) => [
                        `${Number(value || 0).toFixed(1)}h`, 
                        'Horas'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Categoría</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Horas</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Tarifa/Hora</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Subtotal</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">% Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeResult.categories.map((cat, idx) => {
                    const colors = ['bg-slate-400', 'bg-blue-400', 'bg-orange-400', 'bg-purple-400', 'bg-green-400', 'bg-indigo-400'];
                    return (
                      <tr key={cat.category} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`w-3 h-3 ${colors[idx % colors.length]} rounded-full mr-3`}></span>
                            <span className="font-medium text-slate-900">{cat.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-700">{cat.hours.toFixed(1)}</td>
                        <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(cat.rate)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(cat.subtotal)}</td>
                        <td className="px-6 py-4 text-right text-slate-700">{cat.percentage}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-6 py-4 text-slate-900">Total</td>
                    <td className="px-6 py-4 text-right text-slate-900">{activeResult.totalHours.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-slate-900">-</td>
                    <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(activeResult.totalAmount)}</td>
                    <td className="px-6 py-4 text-right text-slate-900">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Day Breakdown */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-base font-semibold text-slate-900 mb-4">Detalle por Día</h4>
              <div className="space-y-3">
                {activeResult.dayBreakdowns.map((day) => {
                  const hasWarning = day.tags.some(t => t.includes('⚠') || t.includes('NOCTURNO'));
                  return (
                    <div
                      key={day.date}
                      className={cn(
                        'border rounded-lg p-4',
                        hasWarning ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {day.dayName}, {new Date(day.date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-slate-500">
                            {day.startTime} - {day.endTime} (Break: {day.breakMinutes} min)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(day.amount)}</p>
                          <p className="text-sm text-slate-500">{day.totalHours.toFixed(1)} horas</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {day.tags.map((tag) => {
                          let colorClass = 'bg-slate-100 text-slate-700';
                          if (tag.includes('EXTRA')) colorClass = 'bg-orange-100 text-orange-700';
                          if (tag.includes('NOCTURNO')) colorClass = 'bg-indigo-100 text-indigo-700';
                          if (tag.includes('FESTIVO') || tag.includes('DOMINICAL')) colorClass = 'bg-purple-100 text-purple-700';
                          if (tag.includes('COLCHÓN')) colorClass = 'bg-blue-100 text-blue-700';
                          if (tag.includes('⚠')) colorClass = 'bg-amber-100 text-amber-700';
                          
                          return (
                            <span key={tag} className={`px-3 py-1 ${colorClass} text-xs font-medium rounded-full`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Comparación Detallada</h3>
              <div className="flex space-x-3">
                <button
                  onClick={exportComparisonToCSV}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar CSV
                </button>
                <button
                  onClick={copyComparisonToClipboard}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar resumen
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Concepto</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Política Interna</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Ley Colombiana</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Total Horas</td>
                    <td className="px-6 py-4 text-right">{(internalResult.totalHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{(legalResult.totalHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">-</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Horas Normales</td>
                    <td className="px-6 py-4 text-right">{(internalResult.normalHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{(legalResult.normalHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{((legalResult.normalHours || 0) - (internalResult.normalHours || 0)).toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Horas Extra</td>
                    <td className="px-6 py-4 text-right">{(internalResult.extraHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{(legalResult.extraHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{((legalResult.extraHours || 0) - (internalResult.extraHours || 0)).toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Horas Nocturnas</td>
                    <td className="px-6 py-4 text-right">{(internalResult.nightHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{(legalResult.nightHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-medium">
                      {((legalResult.nightHours || 0) - (internalResult.nightHours || 0)) >= 0 ? '+' : ''}{((legalResult.nightHours || 0) - (internalResult.nightHours || 0)).toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Horas Festivas/Dominicales</td>
                    <td className="px-6 py-4 text-right">{(internalResult.sundayHolidayHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">{(legalResult.sundayHolidayHours || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-right">
                      {((legalResult.sundayHolidayHours || 0) - (internalResult.sundayHolidayHours || 0)) >= 0 ? '+' : ''}{((legalResult.sundayHolidayHours || 0) - (internalResult.sundayHolidayHours || 0)).toFixed(1)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-6 py-4 text-slate-900">Total a Pagar</td>
                    <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(internalResult.totalAmount)}</td>
                    <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(legalResult.totalAmount)}</td>
                    <td className={cn(
                      "px-6 py-4 text-right font-bold",
                      isOverpaid ? 'text-emerald-600' : 'text-[#83152E]'
                    )}>
                      {isOverpaid ? '+' : '-'}{formatCurrency(Math.abs(comparison.difference))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Alerts Section */}
      {comparison.alerts.length > 0 && (
        <section className="mb-8">
          <div className="space-y-4">
            {comparison.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={cn(
                  'border rounded-xl p-6',
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="text-amber-600 w-6 h-6" />
                    ) : (
                      <Info className="text-blue-600 w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className={cn(
                      'text-lg font-semibold mb-2',
                      alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                    )}>
                      {alert.title}
                    </h4>
                    <p className={alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'}>
                      {alert.message}
                    </p>
                    {alert.affectedDays && alert.affectedDays.length > 0 && (
                      <div className="mt-3 bg-white rounded-lg p-4 border border-amber-200">
                        <p className="text-sm font-medium text-slate-900 mb-2">Turnos afectados:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {alert.affectedDays.map(day => (
                            <li key={day}>• {new Date(day + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
