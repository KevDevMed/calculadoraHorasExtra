import { Keyboard, BarChart3, Scale } from 'lucide-react';
import { cn } from '../lib/utils';

interface TabsNavigationProps {
  activeTab: 'entradas' | 'resultados' | 'notas';
  onTabChange: (tab: 'entradas' | 'resultados' | 'notas') => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-1.5">
        <div className="flex space-x-1">
          <button
            onClick={() => onTabChange('entradas')}
            className={cn(
              'flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm sm:text-base',
              activeTab === 'entradas'
                ? 'bg-[#11143F] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Keyboard className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Entradas</span>
          </button>
          <button
            onClick={() => onTabChange('resultados')}
            className={cn(
              'flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm sm:text-base',
              activeTab === 'resultados'
                ? 'bg-[#11143F] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <BarChart3 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Resultados</span>
          </button>
          <button
            onClick={() => onTabChange('notas')}
            className={cn(
              'flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm sm:text-base',
              activeTab === 'notas'
                ? 'bg-[#11143F] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Scale className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Notas Legales</span>
          </button>
        </div>
      </div>
    </section>
  );
}
