import { Shield, TrendingUp, FileOutput } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="mb-8">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold mb-3">Calculadora de Horas Extra y Recargos</h2>
          <p className="text-slate-300 text-lg mb-6">
            Compara tu política interna vs. ley colombiana, sin inventar horas. Calcula de forma precisa recargos nocturnos, horas extras, dominicales y festivos.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Shield className="text-blue-400 w-4 h-4" />
              <span className="text-sm">Conforme a ley colombiana 2025</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <TrendingUp className="text-green-400 w-4 h-4" />
              <span className="text-sm">Comparativa detallada</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <FileOutput className="text-purple-400 w-4 h-4" />
              <span className="text-sm">Exporta resultados</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
