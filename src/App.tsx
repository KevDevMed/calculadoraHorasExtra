import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { usePayrollStore } from './stores/payrollStore';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TabsNavigation } from './components/TabsNavigation';
import { PaymentDataSection } from './components/PaymentDataSection';
import { InternalConfigSection } from './components/InternalConfigSection';
import { LegalConfigSection } from './components/LegalConfigSection';
import { TimeEntrySection } from './components/TimeEntrySection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LegalNotesSection } from './components/LegalNotesSection';
import { Footer } from './components/Footer';

function App() {
  const [isCalculating, setIsCalculating] = useState(false);
  
  const {
    state,
    setPayment,
    setInternal,
    setLegal,
    setPayroll,
    addWeek,
    updateEntry,
    removeEntry,
    setActiveWeekStart,
    setActiveTab,
    setResultsTab,
    setEntryMode,
    resetInternal,
    resetLegal,
    calculate,
  } = usePayrollStore();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <HeroSection />

        <div className="my-8 border-t border-slate-200" />
        
        <TabsNavigation 
          activeTab={state.activeTab} 
          onTabChange={setActiveTab} 
        />

        {state.activeTab === 'entradas' && (
          <div>
            <PaymentDataSection 
              payment={state.payment} 
              onChange={setPayment} 
            />
            
            <InternalConfigSection 
              config={state.internal} 
              onChange={setInternal}
              onReset={resetInternal}
              payroll={state.payroll}
              onPayrollChange={setPayroll}
            />
            
            <LegalConfigSection 
              config={state.legal} 
              onChange={setLegal}
              onReset={resetLegal}
            />
            
            <TimeEntrySection
              entries={state.entries}
              weekStarts={state.weekStarts}
              activeWeekStart={state.activeWeekStart}
              entryMode={state.entryMode}
              onModeChange={setEntryMode}
              onAddWeek={addWeek}
              onUpdateEntry={updateEntry}
              onRemoveEntry={removeEntry}
              onWeekChange={setActiveWeekStart}
            />

            <section className="mb-8">
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setIsCalculating(true);
                    // Simulate processing time for UX feedback
                    setTimeout(() => {
                      calculate();
                      setIsCalculating(false);
                      setActiveTab('resultados');
                    }, 1500);
                  }}
                  disabled={isCalculating}
                  className="px-8 py-4 bg-gradient-to-r from-[#11143F] to-[#83152E] text-white rounded-xl font-semibold text-lg hover:opacity-95 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-5 h-5 mr-3" />
                  Calcular Comparativa
                </button>
              </div>
            </section>
          </div>
        )}

        {state.activeTab === 'resultados' && (
          <ResultsDashboard
            payment={state.payment}
            internalResult={state.internalResult}
            legalResult={state.legalResult}
            comparison={state.comparison}
            resultsTab={state.resultsTab}
            onTabChange={setResultsTab}
          />
        )}

        {state.activeTab === 'notas' && (
          <LegalNotesSection />
        )}
      </main>

      <Footer />

      {/* Loading Modal */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-sm mx-4">
            <Loader2 className="w-12 h-12 text-[#11143F] animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Calculando...</h3>
            <p className="text-sm text-slate-500 text-center">
              Analizando horas trabajadas, recargos y comparando políticas internas con la ley colombiana.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
