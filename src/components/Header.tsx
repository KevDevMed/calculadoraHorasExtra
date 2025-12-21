import { Calculator } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#11143F] rounded-lg flex items-center justify-center">
              <Calculator className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Calculadora de Nómina | Harp Audit</h1>
              <p className="text-xs text-slate-500">Comparativa por ley</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
