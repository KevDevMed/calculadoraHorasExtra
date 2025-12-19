import { Calculator } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-8">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Calculator className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">Calculadora Nómina</span>
            <span className="text-slate-400">|</span>
            <span className="text-sm text-slate-600">HARP AUDIT</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500">© 2025 Calculadora de Nómina. Todos los derechos reservados.</p>
            <p className="text-sm text-slate-600 mt-1">
              Autor: <span className="font-medium">Kevin Medina</span> · 
              <a href="mailto:kevin.medina@harpaudit.com" className="text-blue-600 hover:text-blue-700 ml-1">
                kevin.medina@harpaudit.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
