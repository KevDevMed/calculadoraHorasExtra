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
              'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
              activeTab === 'entradas'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Entradas
          </button>
          <button
            onClick={() => onTabChange('resultados')}
            className={cn(
              'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
              activeTab === 'resultados'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Resultados
          </button>
          <button
            onClick={() => onTabChange('notas')}
            className={cn(
              'flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center',
              activeTab === 'notas'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Scale className="w-4 h-4 mr-2" />
            Notas Legales
          </button>
        </div>
      </div>
    </section>
  );
}
