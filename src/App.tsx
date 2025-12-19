import { Calculator } from 'lucide-react';
import { usePayrollStore } from './stores/payrollStore';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TabsNavigation } from './components/TabsNavigation';
import { PaymentDataSection } from './components/PaymentDataSection';
import { InternalConfigSection } from './components/InternalConfigSection';
import { LegalConfigSection } from './components/LegalConfigSection';
import { TimeEntrySection } from './components/TimeEntrySection';
import { PayrollConfigSection } from './components/PayrollConfigSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LegalNotesSection } from './components/LegalNotesSection';
import { Footer } from './components/Footer';

function App() {
  const {
    state,
    setPayment,
    setInternal,
    setLegal,
    setPayroll,
    addEntry,
    updateEntry,
    removeEntry,
    setActiveTab,
    setResultsTab,
    setEntryMode,
    resetInternal,
    resetLegal,
    calculate,
  } = usePayrollStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <HeroSection />
        
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
            />
            
            <LegalConfigSection 
              config={state.legal} 
              onChange={setLegal}
              onReset={resetLegal}
            />
            
            <TimeEntrySection
              entries={state.entries}
              entryMode={state.entryMode}
              onModeChange={setEntryMode}
              onAddEntry={addEntry}
              onUpdateEntry={updateEntry}
              onRemoveEntry={removeEntry}
            />
            
            <PayrollConfigSection 
              config={state.payroll} 
              onChange={setPayroll} 
            />

            <section className="mb-8">
              <div className="flex justify-center">
                <button
                  onClick={calculate}
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
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
    </div>
  );
}

export default App
