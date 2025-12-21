import { Shield, TrendingUp, FileOutput } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="mb-6">
      <div className="bg-gradient-to-r from-[#11143F] to-[#83152E] rounded-lg px-6 py-4 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Calculadora de Nómina</h2>
            <p className="text-slate-300 text-sm">
              Calcula horas, recargos y extras. Comparativa entre política interna y ley colombiana.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-white/10 rounded px-3 py-1.5">
              <Shield className="text-white w-3.5 h-3.5" />
              <span className="text-xs">Legal (CO)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/10 rounded px-3 py-1.5">
              <TrendingUp className="text-white w-3.5 h-3.5" />
              <span className="text-xs">Comparativa</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/10 rounded px-3 py-1.5">
              <FileOutput className="text-white w-3.5 h-3.5" />
              <span className="text-xs">Desprendible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
