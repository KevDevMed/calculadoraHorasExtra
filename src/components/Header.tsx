import { Calculator } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#11143F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Calculator className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-semibold text-slate-900 truncate">Calculadora de Nómina</h1>
              <p className="text-xs text-slate-500 hidden xs:block">Comparativa por ley | Harp Audit</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
