import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Building2, Scale, GitCompare, FileSpreadsheet, Copy, AlertTriangle, Info, Download, ChevronDown, ChevronUp } from 'lucide-react';
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

  const smmlv = 1423500; // SMMLV 2025
  const limiteAuxilioTransporte = smmlv * 2; // $2,847,000 - Límite para recibir auxilio
  const auxilioTransporteMensual = 200000; // 2025 value
  const auxilioTransporteQuincenal = 100000; // $100K por quincena (incluye días de descanso)

  // Check if a quincena period is in a prima payment month
  // Prima is paid ONLY in the FIRST quincena (1-15) of June and December
  const isPrimaPeriod = (periodEnd: string): { isPrima: boolean; semester: 1 | 2 } => {
    const date = new Date(periodEnd + 'T12:00:00');
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();
    // Prima is paid only in the first quincena (days 1-15) of June (month 5) and December (month 11)
    if (month === 5 && day <= 15) return { isPrima: true, semester: 1 }; // First quincena of June
    if (month === 11 && day <= 15) return { isPrima: true, semester: 2 }; // First quincena of December
    return { isPrima: false, semester: 1 };
  };

  // Calculate prima: (Salario base × Días trabajados en semestre) ÷ 360
  // Assuming full semester worked (180 days including weekends)
  const calculatePrima = (monthlySalary: number, auxTransporte: number): number => {
    // Prima includes auxilio de transporte in the base
    const baseForPrima = monthlySalary + (auxTransporte > 0 ? auxilioTransporteMensual : 0);
    // Full semester = 180 calendar days (Sat/Sun count)
    const diasSemestre = 180;
    return Math.round((baseForPrima * diasSemestre) / 360);
  };

  // Helper function to calculate payslip data for a given amount
  const calculatePayslipData = (
    totalAmount: number, 
    _normalHours: number, // kept for API compatibility (base is now salary/2)
    _hourlyRate: number,  // kept for API compatibility (used elsewhere for extras calc)
    _daysWorked: number,  // kept for API compatibility
    monthlySalary: number,
    periodEnd?: string,
    numQuincenas: number = 1, // number of quincenas for auxilio calculation
    primaCount: number = 0 // number of prima periods for consolidated view
  ) => {
    const gross = totalAmount;
    // Auxilio de transporte: only for employees earning ≤ 2 SMLMV ($2,847,000 en 2025)
    // Fixed at $100K per quincena (includes rest days - $200K monthly / 2)
    const qualifiesForAuxilio = monthlySalary <= limiteAuxilioTransporte;
    const auxTransporte = qualifiesForAuxilio ? auxilioTransporteQuincenal * numQuincenas : 0;
    
    // Prima calculation (only in June and December)
    // For consolidated view, use primaCount; for individual quincena, check periodEnd
    let primaInfo: { isPrima: boolean; semester: 1 | 2 };
    let prima: number;
    
    if (primaCount > 0) {
      // Consolidated view with prima periods included
      primaInfo = { isPrima: true, semester: 1 }; // Default semester label for consolidated
      prima = calculatePrima(monthlySalary, auxTransporte) * primaCount;
    } else {
      // Individual quincena - check if it's a prima period
      primaInfo = periodEnd ? isPrimaPeriod(periodEnd) : { isPrima: false, semester: 1 as const };
      prima = primaInfo.isPrima ? calculatePrima(monthlySalary, auxTransporte) : 0;
    }
    
    // Health and pension calculated on gross (without auxilio, without prima)
    const health = Math.round(gross * 0.04);
    const pension = Math.round(gross * 0.04);
    const totalDeductions = health + pension;
    
    // Net includes auxilio de transporte and prima
    const net = Math.max(0, gross - totalDeductions + auxTransporte + prima);
    // Base pay is half of monthly salary per quincena (not hours * rate)
    const basePay = Math.max(0, (monthlySalary / 2) * numQuincenas);
    // Extras are everything above the base pay (calculated using hourly rate)
    const extrasPay = Math.max(0, gross - basePay);
    
    return { 
      gross, health, pension, totalDeductions, net, basePay, extrasPay, 
      auxTransporte, qualifiesForAuxilio, prima, isPrima: primaInfo.isPrima, primaSemester: primaInfo.semester,
      primaCount
    };
  };

  // Count worked days (entries with start/end times)
  const totalDaysWorked = internalResult.dayBreakdowns.length;

  // Helper to get quincena (biweekly period) for a date
  const getQuincena = (dateStr: string): { key: string; label: string; start: string; end: string } => {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (day <= 15) {
      const startDate = new Date(year, month, 1);
      return {
        key: `${year}-${month}-1`,
        label: `1 - 15 ${startDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        end: `${year}-${String(month + 1).padStart(2, '0')}-15`,
      };
    } else {
      const startDate = new Date(year, month, 16);
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        key: `${year}-${month}-2`,
        label: `16 - ${lastDay} ${startDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
        start: `${year}-${String(month + 1).padStart(2, '0')}-16`,
        end: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
      };
    }
  };

  // Group day breakdowns by quincena
  const groupByQuincena = (dayBreakdowns: typeof legalResult.dayBreakdowns) => {
    const groups = new Map<string, { 
      label: string; 
      start: string; 
      end: string; 
      days: typeof dayBreakdowns;
      totalHours: number;
      totalAmount: number;
    }>();
    
    dayBreakdowns.forEach(day => {
      const q = getQuincena(day.date);
      if (!groups.has(q.key)) {
        groups.set(q.key, { 
          label: q.label, 
          start: q.start, 
          end: q.end, 
          days: [], 
          totalHours: 0, 
          totalAmount: 0 
        });
      }
      const group = groups.get(q.key)!;
      group.days.push(day);
      group.totalHours += day.totalHours;
      group.totalAmount += day.amount;
    });
    
    return Array.from(groups.entries()).sort((a, b) => a[1].start.localeCompare(b[1].start));
  };

  // State for which payslip view to show
  const [payslipView, setPayslipView] = useState<'total' | string>('total');

  // Get quincena groups for the selector
  const internalQuincenaGroups = groupByQuincena(internalResult.dayBreakdowns);
  const legalQuincenaGroups = groupByQuincena(legalResult.dayBreakdowns);

  // Calculate period-specific values based on payslipView selection
  const getSelectedPeriodData = () => {
    if (payslipView === 'total') {
      // For total view, use the last date as period end
      const allDates = internalResult.dayBreakdowns.map(d => d.date).sort();
      const firstDate = allDates[0] || '';
      const lastDate = allDates[allDates.length - 1] || '';
      // Count unique quincenas for auxilio calculation
      const numQuincenas = internalQuincenaGroups.length;
      
      // Check if any quincena falls in a prima period and sum up primas
      const primaQuincenas = internalQuincenaGroups.filter(([, group]) => {
        const primaCheck = isPrimaPeriod(group.end);
        return primaCheck.isPrima;
      });
      
      return {
        intAmount: internalResult.totalAmount,
        intNormalHours: internalResult.normalHours,
        intDays: totalDaysWorked,
        legalAmount: legalResult.totalAmount,
        legalNormalHours: legalResult.normalHours,
        legalDays: totalDaysWorked,
        periodLabel: 'Consolidado',
        periodStart: firstDate,
        periodEnd: lastDate,
        numQuincenas,
        primaCount: primaQuincenas.length,
        // Include full data for total view
        intDayBreakdowns: internalResult.dayBreakdowns,
        legalDayBreakdowns: legalResult.dayBreakdowns,
        intCategories: internalResult.categories,
        legalCategories: legalResult.categories,
        filteredAlerts: comparison.alerts,
        difference: comparison.difference,
        differencePercentage: comparison.differencePercentage,
      };
    }
    
    // Find the selected quincena in both internal and legal groups
    const intQuincena = internalQuincenaGroups.find(([key]) => key === payslipView);
    const legalQuincena = legalQuincenaGroups.find(([key]) => key === payslipView);
    
    if (intQuincena && legalQuincena) {
      const intGroup = intQuincena[1];
      const legalGroup = legalQuincena[1];
      
      // Calculate normal hours from the period's days
      const intNormalHours = intGroup.days.reduce((sum, day) => {
        return sum + Math.min(8, day.totalHours);
      }, 0);
      const legalNormalHours = legalGroup.days.reduce((sum, day) => {
        return sum + Math.min(8, day.totalHours);
      }, 0);
      
      // Filter alerts for this period
      const periodDates = new Set(intGroup.days.map(d => d.date));
      const filteredAlerts = comparison.alerts.filter(alert => {
        if (!alert.affectedDays || alert.affectedDays.length === 0) return false;
        return alert.affectedDays.some(date => periodDates.has(date));
      });
      
      // Calculate period-specific categories from day breakdowns
      // Internal categories
      const intHourlyRate = internalResult.hourlyRate;
      const intHolidayDays = intGroup.days.filter(d => d.tags.some(t => t.includes('FESTIVO')));
      const intHolidayHours = intHolidayDays.reduce((sum, d) => sum + d.totalHours, 0);
      const intTotalHours = intGroup.days.reduce((sum, d) => sum + d.totalHours, 0);
      // Buffer and extras need weekly context - estimate from total minus normal and holiday
      const intRemainingHours = Math.max(0, intTotalHours - intNormalHours - intHolidayHours);
      const intBufferHours = Math.min(intRemainingHours, 2.5 * 2); // Max ~5h buffer per quincena (2 weeks)
      const intExtraHours = Math.max(0, intRemainingHours - intBufferHours);
      
      const intPeriodCategories = [
        { category: 'Horas colchón', hours: intBufferHours, subtotal: intBufferHours * intHourlyRate, rate: intHourlyRate, multiplier: 1.0, percentage: 0 },
        { category: 'Horas extra', hours: intExtraHours, subtotal: intExtraHours * intHourlyRate * 1.5, rate: intHourlyRate * 1.5, multiplier: 1.5, percentage: 0 },
        { category: 'Festivos', hours: intHolidayHours, subtotal: intHolidayHours * intHourlyRate * 2.0, rate: intHourlyRate * 2.0, multiplier: 2.0, percentage: 0 },
      ];
      
      // Legal categories
      const legalHourlyRate = legalResult.hourlyRate;
      const legalHolidayDays = legalGroup.days.filter(d => d.tags.some(t => t.includes('DOMINICAL') || t.includes('FESTIVO')));
      const legalHolidayHours = legalHolidayDays.reduce((sum, d) => sum + d.totalHours, 0);
      const legalNightDays = legalGroup.days.filter(d => d.tags.some(t => t.includes('NOCTURNO')));
      const legalNightHours = legalNightDays.reduce((sum, d) => sum + d.totalHours, 0);
      const legalTotalHours = legalGroup.days.reduce((sum, d) => sum + d.totalHours, 0);
      const legalExtraHours = Math.max(0, legalTotalHours - legalNormalHours - legalHolidayHours);
      
      const legalPeriodCategories = [
        { category: 'Extra diurna', hours: legalExtraHours, subtotal: legalExtraHours * legalHourlyRate * 1.25, rate: legalHourlyRate * 1.25, multiplier: 1.25, percentage: 0 },
        { category: 'Recargo nocturno', hours: legalNightHours, subtotal: legalNightHours * legalHourlyRate * 1.35, rate: legalHourlyRate * 1.35, multiplier: 1.35, percentage: 0 },
        { category: 'Dominical/Festivo diurno', hours: legalHolidayHours, subtotal: legalHolidayHours * legalHourlyRate * 1.75, rate: legalHourlyRate * 1.75, multiplier: 1.75, percentage: 0 },
      ];
      
      // Calculate difference for this period
      const periodDifference = intGroup.totalAmount - legalGroup.totalAmount;
      const periodDiffPercentage = legalGroup.totalAmount > 0 
        ? Math.round((periodDifference / legalGroup.totalAmount) * 100 * 10) / 10 
        : 0;
      
      return {
        intAmount: intGroup.totalAmount,
        intNormalHours,
        intDays: intGroup.days.length,
        legalAmount: legalGroup.totalAmount,
        legalNormalHours,
        legalDays: legalGroup.days.length,
        periodLabel: intGroup.label,
        periodStart: intGroup.start,
        periodEnd: intGroup.end,
        numQuincenas: 1,
        primaCount: 0,
        // Filtered data for selected period
        intDayBreakdowns: intGroup.days,
        legalDayBreakdowns: legalGroup.days,
        intCategories: intPeriodCategories,
        legalCategories: legalPeriodCategories,
        filteredAlerts,
        difference: periodDifference,
        differencePercentage: periodDiffPercentage,
      };
    }
    
    // Fallback to total if selection not found
    const allDates = internalResult.dayBreakdowns.map(d => d.date).sort();
    const primaQuincenasFallback = internalQuincenaGroups.filter(([, group]) => {
      const primaCheck = isPrimaPeriod(group.end);
      return primaCheck.isPrima;
    });
    
    return {
      intAmount: internalResult.totalAmount,
      intNormalHours: internalResult.normalHours,
      intDays: totalDaysWorked,
      legalAmount: legalResult.totalAmount,
      legalNormalHours: legalResult.normalHours,
      legalDays: totalDaysWorked,
      periodLabel: 'Consolidado',
      periodStart: allDates[0] || '',
      periodEnd: allDates[allDates.length - 1] || '',
      numQuincenas: internalQuincenaGroups.length,
      primaCount: primaQuincenasFallback.length,
      intDayBreakdowns: internalResult.dayBreakdowns,
      legalDayBreakdowns: legalResult.dayBreakdowns,
      intCategories: internalResult.categories,
      legalCategories: legalResult.categories,
      filteredAlerts: comparison.alerts,
      difference: comparison.difference,
      differencePercentage: comparison.differencePercentage,
    };
  };

  const selectedPeriod = getSelectedPeriodData();

  // Internal payslip calculations (using selected period)
  const intData = calculatePayslipData(
    selectedPeriod.intAmount,
    selectedPeriod.intNormalHours,
    internalResult.hourlyRate,
    selectedPeriod.intDays,
    payment.salaryAmount,
    selectedPeriod.periodEnd,
    selectedPeriod.numQuincenas,
    selectedPeriod.primaCount
  );
  const intHealth = intData.health;
  const intPension = intData.pension;
  const intTotalDeductions = intData.totalDeductions;
  const intNet = intData.net;
  const intBasePay = intData.basePay;
  const intExtrasPay = intData.extrasPay;
  const intAuxTransporte = intData.auxTransporte;
  const intQualifiesForAuxilio = intData.qualifiesForAuxilio;
  const intPrima = intData.prima;
  const intIsPrima = intData.isPrima;
  const intPrimaSemester = intData.primaSemester;

  // Legal payslip calculations (using selected period)
  const legalData = calculatePayslipData(
    selectedPeriod.legalAmount,
    selectedPeriod.legalNormalHours,
    legalResult.hourlyRate,
    selectedPeriod.legalDays,
    payment.salaryAmount,
    selectedPeriod.periodEnd,
    selectedPeriod.numQuincenas,
    selectedPeriod.primaCount
  );
  const legalHealth = legalData.health;
  const legalPension = legalData.pension;
  const legalTotalDeductions = legalData.totalDeductions;
  const legalNet = legalData.net;
  const legalBasePay = legalData.basePay;
  const legalExtrasPay = legalData.extrasPay;
  const legalAuxTransporte = legalData.auxTransporte;
  const legalQualifiesForAuxilio = legalData.qualifiesForAuxilio;
  const legalPrima = legalData.prima;
  const legalIsPrima = legalData.isPrima;
  const legalPrimaSemester = legalData.primaSemester;


  // Use NET amounts for comparison (what the worker actually receives)
  // If netDifference > 0: interno > legal = pagando de más (bien para el trabajador)
  // If netDifference < 0: interno < legal = debe al trabajador (mal)
  const netDifference = intNet - legalNet;
  const isOverpaid = netDifference > 0; // interno > legal
  const owesWorker = netDifference < 0; // interno < legal
  const differenceBadgeLabel = isOverpaid ? 'Pagado de más' : owesWorker ? 'Debe al trabajador' : 'Igual';
  const differenceGradientClass = isOverpaid
    ? 'bg-gradient-to-br from-emerald-600 to-[#11143F]'
    : 'bg-gradient-to-br from-[#83152E] to-[#11143F]';

  const salaryLabel = payment.salaryType === 'monthly' ? 'Salario (mensual)' : 'Tarifa (por hora)';

  const internalSlipRef = useRef<HTMLDivElement | null>(null);
  const legalSlipRef = useRef<HTMLDivElement | null>(null);

  // Use period dates from selected period
  const periodStart = selectedPeriod.periodStart;
  const periodEnd = selectedPeriod.periodEnd;

  // State for expandable quincena sections
  const [expandedQuincenas, setExpandedQuincenas] = useState<Set<string>>(new Set());

  const toggleQuincena = (key: string) => {
    setExpandedQuincenas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Use filtered day breakdowns based on selected period
  const filteredDayBreakdowns = resultsTab === 'internal' 
    ? selectedPeriod.intDayBreakdowns 
    : selectedPeriod.legalDayBreakdowns;
  const quincenaGroups = groupByQuincena(filteredDayBreakdowns);

  // Prepare chart data from filtered breakdowns
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
      <section className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-[#11143F] to-[#83152E] rounded-xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium bg-white/20 px-2 sm:px-3 py-1 rounded-full">Interno</span>
            </div>
            <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 opacity-90">Neto Política Interna</h4>
            <p className="text-2xl sm:text-3xl font-bold mb-1">{formatCurrency(intNet)}</p>
            <p className="text-xs sm:text-sm opacity-80">Después de deducciones</p>
          </div>

          <div className="bg-gradient-to-br from-[#83152E] to-[#11143F] rounded-xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium bg-white/20 px-2 sm:px-3 py-1 rounded-full">Legal</span>
            </div>
            <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 opacity-90">Neto Ley Colombiana</h4>
            <p className="text-2xl sm:text-3xl font-bold mb-1">{formatCurrency(legalNet)}</p>
            <p className="text-xs sm:text-sm opacity-80">Después de deducciones</p>
          </div>

          <div className={cn(differenceGradientClass, 'rounded-xl p-4 sm:p-6 text-white sm:col-span-2 lg:col-span-1')}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <GitCompare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className={cn(
                "text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full",
                isOverpaid ? 'bg-white/15' : 'bg-white/15'
              )}>
                {differenceBadgeLabel}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 opacity-90">Diferencia Neto</h4>
            <p className="text-2xl sm:text-3xl font-bold mb-1">{formatCurrency(Math.abs(intNet - legalNet))}</p>
            <p className="text-xs sm:text-sm opacity-80">
              {intNet > legalNet ? '+' : ''}{legalNet !== 0 ? (((intNet - legalNet) / legalNet) * 100).toFixed(1) : '0'}% vs ley
            </p>
          </div>
        </div>
      </section>

      {/* Two Payslips: Internal and Legal */}
      <section className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Desprendibles de nómina</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-slate-600">Período:</span>
              <select
                value={payslipView}
                onChange={(e) => setPayslipView(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="total">Consolidado</option>
                {internalQuincenaGroups.map(([key, group]) => (
                  <option key={key} value={key}>{group.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Internal Payslip */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-slate-700">Desprendible Oficial</p>
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
                  <span className="font-medium tabular-nums">{formatCurrency(internalResult.hourlyRate)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Base ({selectedPeriod.intNormalHours.toFixed(1)}h normales)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(intBasePay)}</span>
                </div>
                
                {/* Extras/Holidays section - different display for Total vs Individual quincena */}
                {(intExtrasPay > 0 || internalResult.sundayHolidayHours > 0) && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                    {payslipView === 'total' ? (
                      // Total Consolidado: just show totals without "diferidos" label
                      <>
                        {(() => {
                          const bufferCategory = internalResult.categories.find(c => c.category === 'Horas colchón');
                          const bufferPay = bufferCategory ? bufferCategory.subtotal : 0;
                          const bufferHours = bufferCategory ? bufferCategory.hours : 0;
                          const extraCategory = internalResult.categories.find(c => c.category === 'Horas extra');
                          const extraPay = extraCategory ? extraCategory.subtotal : 0;
                          const extraHours = extraCategory ? extraCategory.hours : 0;
                          const holidayCategory = internalResult.categories.find(c => c.category === 'Festivos');
                          const holidayPay = holidayCategory ? holidayCategory.subtotal : 0;
                          const holidayHours = holidayCategory ? holidayCategory.hours : 0;
                          return (
                            <>
                              {bufferPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Horas colchón ({bufferHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(bufferPay)}</span>
                                </div>
                              )}
                              {extraPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Horas extra ({extraHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(extraPay)}</span>
                                </div>
                              )}
                              {holidayPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Festivos trabajados ({holidayHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(holidayPay)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      // Individual quincena: show extras/festivos from THIS period only
                      <>
                        <p className="text-xs text-amber-600 mb-2">📅 Extras/festivos de esta quincena:</p>
                        {(() => {
                          // Get from filtered categories for this period
                          const bufferCategory = selectedPeriod.intCategories.find(c => c.category === 'Horas colchón');
                          const bufferPay = bufferCategory ? bufferCategory.subtotal : 0;
                          const bufferHours = bufferCategory ? bufferCategory.hours : 0;
                          const extraCategory = selectedPeriod.intCategories.find(c => c.category === 'Horas extra');
                          const extraPay = extraCategory ? extraCategory.subtotal : 0;
                          const extraHours = extraCategory ? extraCategory.hours : 0;
                          const holidayCategory = selectedPeriod.intCategories.find(c => c.category === 'Festivos');
                          const holidayPay = holidayCategory ? holidayCategory.subtotal : 0;
                          const holidayHours = holidayCategory ? holidayCategory.hours : 0;
                          
                          return (
                            <>
                              {bufferPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Horas colchón ({bufferHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(bufferPay)}</span>
                                </div>
                              )}
                              {extraPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Horas extra ({extraHours.toFixed(1)}h @ 1.5x)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(extraPay)}</span>
                                </div>
                              )}
                              {holidayPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Festivos ({holidayHours.toFixed(1)}h @ 2x)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(holidayPay)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
                {intQualifiesForAuxilio && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Auxilio transporte ({selectedPeriod.numQuincenas > 1 ? `${selectedPeriod.numQuincenas} quincenas` : 'quincenal'})</span>
                    <span className="font-medium tabular-nums text-emerald-600">+{formatCurrency(intAuxTransporte)}</span>
                  </div>
                )}
                {intIsPrima && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {intData.primaCount > 1 
                        ? `Prima semestral (${intData.primaCount} periodos)` 
                        : `Prima semestral (${intPrimaSemester === 1 ? '1er' : '2do'} sem.)`}
                    </span>
                    <span className="font-medium tabular-nums text-emerald-600">+{formatCurrency(intPrima)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <span>Total devengado</span>
                  <span className="tabular-nums">{formatCurrency(intBasePay + intExtrasPay + intAuxTransporte + intPrima)}</span>
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
              <p className="text-sm font-medium text-slate-700">Desprendible Normal</p>
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
                  <span className="font-medium tabular-nums">{formatCurrency(legalResult.hourlyRate)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Base ({selectedPeriod.legalNormalHours.toFixed(1)}h normales)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(legalBasePay)}</span>
                </div>
                
                {/* Extras/Holidays section - different display for Total vs Individual quincena */}
                {(legalExtrasPay > 0 || legalResult.sundayHolidayHours > 0) && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                    {payslipView === 'total' ? (
                      // Total Consolidado: just show totals without "diferidos" label
                      <>
                        {(() => {
                          const holidayCategories = legalResult.categories.filter(c => 
                            c.category.includes('Dominical/Festivo') || c.category.includes('dominical/festivo')
                          );
                          const holidayPay = holidayCategories.reduce((sum, c) => sum + c.subtotal, 0);
                          const extraCategories = legalResult.categories.filter(c => 
                            c.category.includes('Extra') && !c.category.includes('Dominical') && !c.category.includes('dominical')
                          );
                          const pureExtrasPay = extraCategories.reduce((sum, c) => sum + c.subtotal, 0);
                          const nightCategory = legalResult.categories.find(c => c.category === 'Recargo nocturno');
                          const nightPay = nightCategory ? nightCategory.subtotal - (nightCategory.hours * legalResult.hourlyRate) : 0;
                          const extraHours = extraCategories.reduce((sum, c) => sum + c.hours, 0);
                          const holidayHours = holidayCategories.reduce((sum, c) => sum + c.hours, 0);
                          const nightHours = nightCategory ? nightCategory.hours : 0;
                          return (
                            <>
                              {pureExtrasPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Horas extra ({extraHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(pureExtrasPay)}</span>
                                </div>
                              )}
                              {nightPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Recargo nocturno ({nightHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(nightPay)}</span>
                                </div>
                              )}
                              {holidayPay > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Dominicales/Festivos ({holidayHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(holidayPay)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      // Individual quincena: show extras/festivos from THIS period only
                      <>
                        <p className="text-xs text-amber-600 mb-2">📅 Extras/festivos de esta quincena:</p>
                        {(() => {
                          // Get from filtered categories for this period
                          const extraCategories = selectedPeriod.legalCategories.filter(c => 
                            c.category.includes('Extra') && !c.category.includes('Dominical') && !c.category.includes('dominical')
                          );
                          const pureExtrasPay = extraCategories.reduce((sum, c) => sum + c.subtotal, 0);
                          const extraHours = extraCategories.reduce((sum, c) => sum + c.hours, 0);
                          
                          const nightCategory = selectedPeriod.legalCategories.find(c => c.category === 'Recargo nocturno');
                          const nightPay = nightCategory ? nightCategory.subtotal - (nightCategory.hours * legalResult.hourlyRate) : 0;
                          const nightHours = nightCategory ? nightCategory.hours : 0;
                          
                          const holidayCategories = selectedPeriod.legalCategories.filter(c => 
                            c.category.includes('Dominical/Festivo') || c.category.includes('dominical/festivo')
                          );
                          const holidayPay = holidayCategories.reduce((sum, c) => sum + c.subtotal, 0);
                          const holidayHours = holidayCategories.reduce((sum, c) => sum + c.hours, 0);
                          
                          return (
                            <>
                              {pureExtrasPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Horas extra ({extraHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(pureExtrasPay)}</span>
                                </div>
                              )}
                              {nightPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Recargo nocturno ({nightHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(nightPay)}</span>
                                </div>
                              )}
                              {holidayPay > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Dominicales/Festivos ({holidayHours.toFixed(1)}h)</span>
                                  <span className="font-medium tabular-nums">{formatCurrency(holidayPay)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
                {legalQualifiesForAuxilio && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Auxilio transporte ({selectedPeriod.numQuincenas > 1 ? `${selectedPeriod.numQuincenas} quincenas` : 'quincenal'})</span>
                    <span className="font-medium tabular-nums text-emerald-600">+{formatCurrency(legalAuxTransporte)}</span>
                  </div>
                )}
                {legalIsPrima && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {legalData.primaCount > 1 
                        ? `Prima semestral (${legalData.primaCount} periodos)` 
                        : `Prima semestral (${legalPrimaSemester === 1 ? '1er' : '2do'} sem.)`}
                    </span>
                    <span className="font-medium tabular-nums text-emerald-600">+{formatCurrency(legalPrima)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <span>Total devengado</span>
                  <span className="tabular-nums">{formatCurrency(legalBasePay + legalExtrasPay + legalAuxTransporte + legalPrima)}</span>
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
                'flex-1 px-2 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm',
                resultsTab === 'internal'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Building2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Interno</span>
            </button>
            <button
              onClick={() => onTabChange('legal')}
              className={cn(
                'flex-1 px-2 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm',
                resultsTab === 'legal'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Scale className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Legal</span>
            </button>
            <button
              onClick={() => onTabChange('comparison')}
              className={cn(
                'flex-1 px-2 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm',
                resultsTab === 'comparison'
                  ? 'bg-[#11143F] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <GitCompare className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Comparación</span>
            </button>
          </div>
        </div>
      </section>

      {/* Breakdown Section */}
      {resultsTab !== 'comparison' ? (
        <section className="mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Desglose - {resultLabel}</h3>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={exportToCSV}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Exportar</span> CSV
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Copiar
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 sm:mb-6">
              <div className="h-[200px] sm:h-[300px] w-full p-2 sm:p-4">
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

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Categoría</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Horas</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700 hidden sm:table-cell">Tarifa</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Subtotal</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeResult.categories.map((cat, idx) => {
                      const colors = ['bg-slate-400', 'bg-blue-400', 'bg-orange-400', 'bg-purple-400', 'bg-green-400', 'bg-indigo-400'];
                      return (
                        <tr key={cat.category} className="hover:bg-slate-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center">
                              <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors[idx % colors.length]} rounded-full mr-2 sm:mr-3 flex-shrink-0`}></span>
                              <span className="font-medium text-slate-900 text-xs sm:text-sm">{cat.category}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-700 text-xs sm:text-sm">{cat.hours.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-700 text-xs sm:text-sm hidden sm:table-cell">{formatCurrency(cat.rate)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-900 text-xs sm:text-sm">{formatCurrency(cat.subtotal)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-700 text-xs sm:text-sm">{cat.percentage}%</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-900 text-xs sm:text-sm">Total</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm">{activeResult.totalHours.toFixed(1)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm hidden sm:table-cell">-</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm">{formatCurrency(activeResult.totalAmount)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Day Breakdown by Quincena */}
            <div className="border-t border-slate-200 pt-4 sm:pt-6">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 sm:mb-4">Detalle por Quincena</h4>
              <div className="space-y-4">
                {quincenaGroups.map(([key, group]) => {
                  const isExpanded = expandedQuincenas.has(key);
                  // Calculate holiday hours for this quincena
                  const holidayDays = group.days.filter(d => d.tags.some(t => t.includes('FESTIVO') || t.includes('DOMINICAL')));
                  const holidayHours = holidayDays.reduce((sum, d) => sum + d.totalHours, 0);
                  return (
                    <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Quincena Header - Clickable */}
                      <button
                        onClick={() => toggleQuincena(key)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                          )}
                          <div className="text-left">
                            <p className="font-semibold text-slate-900">Quincena: {group.label}</p>
                            <p className="text-sm text-slate-500">
                              {group.days.length} días trabajados
                              {holidayHours > 0 && <span className="text-amber-600 ml-2">• {holidayHours.toFixed(1)}h festivos</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(group.totalAmount)}</p>
                          <p className="text-sm text-slate-500">{group.totalHours.toFixed(1)} horas</p>
                        </div>
                      </button>
                      
                      {/* Quincena Days - Expandable */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 bg-white">
                          {group.days.map((day) => {
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Comparación Detallada</h3>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={exportComparisonToCSV}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  CSV
                </button>
                <button
                  onClick={copyComparisonToClipboard}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center"
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Copiar
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">Período: {selectedPeriod.periodLabel}</p>
              <table className="w-full min-w-[400px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Concepto</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Interno</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Legal</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Dif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    // Calculate period-specific hours from filtered day breakdowns
                    const intTotalHours = selectedPeriod.intDayBreakdowns.reduce((sum, d) => sum + d.totalHours, 0);
                    const legalTotalHours = selectedPeriod.legalDayBreakdowns.reduce((sum, d) => sum + d.totalHours, 0);
                    const intNormalHrs = selectedPeriod.intNormalHours;
                    const legalNormalHrs = selectedPeriod.legalNormalHours;
                    const intExtraHrs = Math.max(0, intTotalHours - intNormalHrs);
                    const legalExtraHrs = Math.max(0, legalTotalHours - legalNormalHrs);
                    // For night/holiday hours, filter from day breakdowns tags
                    const intNightHrs = selectedPeriod.intDayBreakdowns.filter(d => d.tags.some(t => t.includes('NOCTURNO'))).reduce((sum, d) => sum + d.totalHours, 0);
                    const legalNightHrs = selectedPeriod.legalDayBreakdowns.filter(d => d.tags.some(t => t.includes('NOCTURNO'))).reduce((sum, d) => sum + d.totalHours, 0);
                    const intHolidayHrs = selectedPeriod.intDayBreakdowns.filter(d => d.tags.some(t => t.includes('FESTIVO') || t.includes('DOMINICAL'))).reduce((sum, d) => sum + d.totalHours, 0);
                    const legalHolidayHrs = selectedPeriod.legalDayBreakdowns.filter(d => d.tags.some(t => t.includes('FESTIVO') || t.includes('DOMINICAL'))).reduce((sum, d) => sum + d.totalHours, 0);
                    
                    return (
                      <>
                        <tr>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">Total Horas</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{intTotalHours.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{legalTotalHours.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">-</td>
                        </tr>
                        <tr>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">Normales</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{intNormalHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{legalNormalHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{(legalNormalHrs - intNormalHrs).toFixed(1)}</td>
                        </tr>
                        <tr>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">Extra</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{intExtraHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{legalExtraHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{(legalExtraHrs - intExtraHrs).toFixed(1)}</td>
                        </tr>
                        <tr>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">Nocturnas</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{intNightHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{legalNightHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-amber-600 font-medium text-xs sm:text-sm">
                            {(legalNightHrs - intNightHrs) >= 0 ? '+' : ''}{(legalNightHrs - intNightHrs).toFixed(1)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 text-xs sm:text-sm">Festivos</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{intHolidayHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">{legalHolidayHrs.toFixed(1)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">
                            {(legalHolidayHrs - intHolidayHrs) >= 0 ? '+' : ''}{(legalHolidayHrs - intHolidayHrs).toFixed(1)}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-900 text-xs sm:text-sm">Total</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm">{formatCurrency(selectedPeriod.intAmount)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-900 text-xs sm:text-sm">{formatCurrency(selectedPeriod.legalAmount)}</td>
                    <td className={cn(
                      "px-3 sm:px-6 py-3 sm:py-4 text-right font-bold text-xs sm:text-sm",
                      isOverpaid ? 'text-emerald-600' : 'text-[#83152E]'
                    )}>
                      {isOverpaid ? '+' : '-'}{formatCurrency(Math.abs(selectedPeriod.difference))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Alerts Section - filtered by selected period */}
      {selectedPeriod.filteredAlerts.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <div className="space-y-3 sm:space-y-4">
            {selectedPeriod.filteredAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={cn(
                  'border rounded-xl p-4 sm:p-6',
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="text-amber-600 w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Info className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h4 className={cn(
                      'text-sm sm:text-lg font-semibold mb-1 sm:mb-2',
                      alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                    )}>
                      {alert.title}
                    </h4>
                    <p className={cn('text-xs sm:text-base', alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800')}>
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
