import { useState } from 'react';
import { BookOpen, Moon, Clock, Calendar, Briefcase, Calculator, ChevronDown, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface AccordionItemProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ icon, title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="px-6 py-5 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
}

export function LegalNotesSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['nocturna']));

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Notas Legales y Conceptos</h3>
            <p className="text-sm text-slate-500">Información sobre la legislación laboral colombiana</p>
          </div>
        </div>

        <div className="space-y-3">
          <AccordionItem
            icon={<Moon className="text-[#11143F] w-5 h-5" />}
            title="¿Qué es hora nocturna?"
            isOpen={openItems.has('nocturna')}
            onToggle={() => toggleItem('nocturna')}
          >
            <p className="text-slate-700 mb-4">
              El trabajo nocturno se define como aquel realizado entre las 21:00 horas (9:00 PM) y las 06:00 horas (6:00 AM) del día siguiente.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Fórmula de cálculo:</p>
              <code className="text-sm text-slate-700 bg-white px-2 py-1 rounded">Valor hora nocturna = Valor hora ordinaria × 1.35</code>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Ejemplo práctico:</p>
              <p className="text-sm text-blue-800">Si tu salario base es $2,500,000 mensuales y trabajas 8 horas en horario nocturno (22:00 a 06:00), el cálculo sería:</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Valor hora ordinaria: $15,625</li>
                <li>• Recargo nocturno 35%: $5,469</li>
                <li>• Valor hora nocturna: $21,094</li>
                <li>• Total por 8 horas: $168,750</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            icon={<Clock className="text-[#83152E] w-5 h-5" />}
            title="Recargo nocturno vs. Hora extra nocturna"
            isOpen={openItems.has('extra-nocturna')}
            onToggle={() => toggleItem('extra-nocturna')}
          >
            <p className="text-slate-700 mb-4">
              Es importante distinguir entre el recargo nocturno (trabajo en horario nocturno dentro de la jornada ordinaria) y la hora extra nocturna (trabajo nocturno que excede la jornada legal).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-indigo-900 mb-2">Recargo nocturno (35%)</p>
                <p className="text-sm text-indigo-800">Trabajo nocturno dentro de las 44 horas semanales legales.</p>
                <code className="text-xs text-indigo-700 bg-white px-2 py-1 rounded mt-2 inline-block">Valor hora × 1.35</code>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-900 mb-2">Extra nocturna (75%)</p>
                <p className="text-sm text-purple-800">Trabajo nocturno que excede la jornada legal semanal.</p>
                <code className="text-xs text-purple-700 bg-white px-2 py-1 rounded mt-2 inline-block">Valor hora × 1.75</code>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">Ejemplo comparativo:</p>
              <p className="text-sm text-amber-800 mb-2">Trabajador con valor hora de $15,625:</p>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• Hora ordinaria diurna: $15,625</li>
                <li>• Hora nocturna (recargo 35%): $21,094</li>
                <li>• Hora extra nocturna (75%): $27,344</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            icon={<Calendar className="text-[#11143F] w-5 h-5" />}
            title="Dominical y festivo"
            isOpen={openItems.has('dominical')}
            onToggle={() => toggleItem('dominical')}
          >
            <p className="text-slate-700 mb-4">
              El trabajo en domingo o día festivo tiene un recargo del 75% sobre el valor de la hora ordinaria, además de otorgar derecho a un día compensatorio remunerado.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Fórmula de cálculo:</p>
              <code className="text-sm text-slate-700 bg-white px-2 py-1 rounded">Valor hora dominical/festiva = Valor hora ordinaria × 1.75</code>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-900 mb-2">Derechos adicionales:</p>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Recargo del 75% sobre el valor de la hora</li>
                <li>• Día compensatorio remunerado</li>
                <li>• Si el festivo coincide con domingo, aplica el mismo recargo</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Ejemplo práctico:</p>
              <p className="text-sm text-blue-800">Trabajador con salario de $2,500,000 que labora 8 horas un domingo:</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Valor hora ordinaria: $15,625</li>
                <li>• Recargo dominical 75%: $11,719</li>
                <li>• Valor hora dominical: $27,344</li>
                <li>• Total por 8 horas: $218,750</li>
                <li>• + 1 día compensatorio remunerado</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            icon={<Briefcase className="text-[#83152E] w-5 h-5" />}
            title="Jornada semanal legal 2025 y reducción gradual"
            isOpen={openItems.has('jornada')}
            onToggle={() => toggleItem('jornada')}
          >
            <p className="text-slate-700 mb-4">
              La Ley 2101 de 2021 establece una reducción gradual de la jornada laboral máxima legal en Colombia, sin que esto implique una disminución en el salario de los trabajadores.
            </p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-purple-900 mb-3">Cronograma de reducción:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm text-slate-700">Hasta 14 de julio 2023</span>
                  <span className="font-semibold text-slate-900">48 horas</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm text-slate-700">15 julio 2023 - 14 julio 2024</span>
                  <span className="font-semibold text-slate-900">47 horas</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm text-slate-700">15 julio 2024 - 14 julio 2025</span>
                  <span className="font-semibold text-slate-900">46 horas</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-100 rounded">
                  <span className="text-sm font-semibold text-purple-900">Desde 15 julio 2025</span>
                  <span className="font-bold text-purple-900">44 horas</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm text-slate-700">Desde 15 julio 2026</span>
                  <span className="font-semibold text-slate-900">42 horas</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">⚠️ Protección salarial:</p>
              <p className="text-sm text-amber-800">
                El valor de la hora de trabajo NO puede disminuir como consecuencia de la reducción de la jornada. Si un trabajador ganaba cierto valor por hora con jornada de 48 horas, ese valor debe mantenerse o aumentar con la nueva jornada reducida.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Ejemplo de protección salarial:</p>
              <p className="text-sm text-blue-800 mb-2">Trabajador con salario mensual de $2,500,000:</p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Con jornada 48h/semana: Valor hora = $13,021</li>
                <li>• Con jornada 44h/semana: Valor hora = $14,205 (mínimo)</li>
                <li>• El salario mensual debe mantenerse en $2,500,000 o superior</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            icon={<Calculator className="text-[#11143F] w-5 h-5" />}
            title="Cálculo del valor de la hora"
            isOpen={openItems.has('calculo')}
            onToggle={() => toggleItem('calculo')}
          >
            <p className="text-slate-700 mb-4">
              El valor de la hora ordinaria se calcula dividiendo el salario mensual entre el número de horas trabajadas en el mes, considerando la jornada legal vigente.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Fórmula básica (jornada 44h desde julio 2025):</p>
              <code className="text-sm text-slate-700 bg-white px-2 py-1 rounded block mb-2">Valor hora = Salario mensual / (44 horas × 4.33 semanas)</code>
              <code className="text-sm text-slate-700 bg-white px-2 py-1 rounded block">Valor hora = Salario mensual / 190.52 horas</code>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-teal-900 mb-2">Ejemplo detallado:</p>
              <p className="text-sm text-teal-800 mb-2">Salario mensual: $2,500,000</p>
              <ul className="space-y-1 text-sm text-teal-800">
                <li>• Horas mensuales: 44 × 4.33 = 190.52 horas</li>
                <li>• Valor hora ordinaria: $2,500,000 / 190.52 = $13,119</li>
                <li>• Hora extra diurna (125%): $16,399</li>
                <li>• Hora nocturna (135%): $17,711</li>
                <li>• Hora extra nocturna (175%): $22,958</li>
                <li>• Hora dominical/festiva (175%): $22,958</li>
              </ul>
            </div>
          </AccordionItem>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="text-red-600 w-6 h-6" />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-red-900 mb-2">Disclaimer Legal</h4>
              <p className="text-red-800 mb-3">
                Esta calculadora es una herramienta informativa y educativa. Los cálculos presentados se basan en la legislación laboral colombiana vigente, pero pueden no contemplar todas las situaciones particulares o cambios normativos recientes.
              </p>
              <p className="text-red-800 font-medium">
                Se recomienda validar todos los cálculos con su departamento de nómina, contador o asesor legal antes de tomar decisiones basadas en esta información.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
