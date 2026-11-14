import React, { useReducer, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Rocket, RotateCcw, X } from 'lucide-react';
import { createInitialMissionState, missionReducer } from './state/missionReducer';
import { CINEMATIC_IMAGES, formatCredits } from './data/missionConfig';
import { BudgetStatusBar } from './components/BudgetStatusBar';
import { TelemetrySidebar } from './components/TelemetrySidebar';
import { Phase1Assembly } from './components/Phase1Assembly';
import { Phase2LunarFlight } from './components/Phase2LunarFlight';
import { Phase3EarthReturn } from './components/Phase3EarthReturn';
import { Phase4MissionSummary } from './components/Phase4MissionSummary';
import { BudgetAdminModal } from './components/BudgetAdminModal';
import { BudgetTransferModal } from './components/BudgetTransferModal';
import { FinancialLedgerModal } from './components/FinancialLedgerModal';
import { ShaderCodeModal } from './components/ShaderCodeModal';

export default function App() {
  const [state, dispatch] = useReducer(missionReducer, undefined, () =>
    createInitialMissionState(undefined, false)
  );

  const [adminOpen, setAdminOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [shaderCodeOpen, setShaderCodeOpen] = useState(false);

  const latestAlert = state.alerts[0];

  const phaseStepLabels: { num: 1 | 2 | 3 | 4; label: string }[] = [
    { num: 1, label: 'Fase 1 · Montagem' },
    { num: 2, label: 'Fase 2 · Viagem Lunar' },
    { num: 3, label: 'Fase 3 · Retorno' },
    { num: 4, label: 'Relatório Final' },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col">
      {/* Top 3-Zone Header Bar */}
      <header className="bg-[#070c18] border-b border-slate-800 px-4 py-3">
        <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-6">
          <div className="font-display text-base md:text-lg font-bold tracking-wider text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            <span>ARTEMIS II: LUNAR ODYSSEY</span>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
            {phaseStepLabels.map((step) => {
              const isCurrent = state.phase === step.num;
              const isDone = state.phase > step.num;
              return (
                <span
                  key={step.num}
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    isCurrent
                      ? 'text-cyan-300 font-semibold border-b-2 border-cyan-400 pb-0.5'
                      : isDone
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_MISSION', keepAdminConfig: true })}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Nova Missão
          </button>
        </div>
      </header>

      {/* Persistent Global & Phase Budget Ribbon */}
      <BudgetStatusBar
        state={state}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenTransfer={() => setTransferOpen(true)}
        onOpenLedger={() => setLedgerOpen(true)}
        onOpenShaderCode={() => setShaderCodeOpen(true)}
      />

      {/* Intro Mission Briefing Screen */}
      {state.showIntroBriefing ? (
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-5xl w-full bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
            <div className="lg:col-span-6 relative min-h-[280px]">
              <img
                src={CINEMATIC_IMAGES.lunarFlyby}
                alt="Nave Orion sobrevoando a superfície lunar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090f1d] via-[#090f1d]/30 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-xs text-slate-300">
                Simulador Educativo Integrado · Fases 1, 2 e 3
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono-tabular text-cyan-400 mb-1">
                    SIMULADOR ESPACIAL INTEGRADO
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-50 leading-tight">
                    ARTEMIS II: LUNAR ODYSSEY
                  </h1>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Assuma o comando completo da missão Artemis II: configure e monte a nave Orion em 3D, administre o orçamento global e regional por fase, enfrente blecautes e tempestades solares ao redor da Lua e execute a correção de trajetória e reentrada atmosférica até o pouso no oceano.
                </p>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
                    <div className="text-[11px] text-slate-400">Fase 1</div>
                    <div className="font-mono-tabular font-semibold text-cyan-300">
                      {formatCredits(state.phaseBudgets[1].initialAllocated)}
                    </div>
                  </div>
                  <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
                    <div className="text-[11px] text-slate-400">Fase 2</div>
                    <div className="font-mono-tabular font-semibold text-cyan-300">
                      {formatCredits(state.phaseBudgets[2].initialAllocated)}
                    </div>
                  </div>
                  <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
                    <div className="text-[11px] text-slate-400">Fase 3</div>
                    <div className="font-mono-tabular font-semibold text-cyan-300">
                      {formatCredits(state.phaseBudgets[3].initialAllocated)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'DISMISS_BRIEFING' })}
                  className="px-5 py-2.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-md cursor-pointer"
                >
                  Iniciar Planejamento (Fase 1)
                </button>
                <button
                  type="button"
                  onClick={() => setAdminOpen(true)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md cursor-pointer"
                >
                  Configurar Orçamentos
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-[1520px] w-full mx-auto p-4 space-y-4">
          {/* Active Notification Alert */}
          {latestAlert && (
            <div
              className={`rounded-lg px-4 py-2.5 border flex items-center justify-between gap-3 text-xs ${
                latestAlert.severity === 'danger'
                  ? 'bg-red-950/50 border-red-600/70 text-red-200'
                  : latestAlert.severity === 'warning'
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-200'
                    : latestAlert.severity === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200'
                      : 'bg-sky-950/50 border-sky-500/70 text-sky-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {latestAlert.severity === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : latestAlert.severity === 'info' ? (
                  <Info className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-semibold">{latestAlert.title}: </span>
                  <span>{latestAlert.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DISMISS_ALERT', id: latestAlert.id })}
                className="p-1 hover:bg-black/20 rounded cursor-pointer shrink-0"
                aria-label="Dispensar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Phase Workspace Layout */}
          {state.phase === 4 ? (
            <Phase4MissionSummary
              state={state}
              dispatch={dispatch}
              onOpenFullReport={() => setLedgerOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Shared Operational Telemetry Sidebar */}
              <div className="lg:col-span-3 lg:sticky lg:top-4">
                <TelemetrySidebar state={state} />
              </div>

              {/* Active Phase Stage */}
              <div className="lg:col-span-9 min-w-0">
                {state.phase === 1 && (
                  <Phase1Assembly
                    state={state}
                    dispatch={dispatch}
                    onOpenTransfer={() => setTransferOpen(true)}
                  />
                )}
                {state.phase === 2 && (
                  <Phase2LunarFlight
                    state={state}
                    dispatch={dispatch}
                    onOpenTransfer={() => setTransferOpen(true)}
                  />
                )}
                {state.phase === 3 && (
                  <Phase3EarthReturn
                    state={state}
                    dispatch={dispatch}
                    onOpenTransfer={() => setTransferOpen(true)}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Financial & Admin Modals */}
      <BudgetAdminModal
        isOpen={adminOpen}
        config={state.adminConfig}
        onClose={() => setAdminOpen(false)}
        onSave={(cfg) => dispatch({ type: 'UPDATE_ADMIN_CONFIG', config: cfg })}
      />

      <BudgetTransferModal
        isOpen={transferOpen}
        state={state}
        onClose={() => setTransferOpen(false)}
        onTransfer={(fromPhase, toPhase, amount, reason) =>
          dispatch({ type: 'TRANSFER_BUDGET', fromPhase, toPhase, amount, reason })
        }
      />

      <FinancialLedgerModal
        isOpen={ledgerOpen}
        state={state}
        onClose={() => setLedgerOpen(false)}
      />

      <ShaderCodeModal
        isOpen={shaderCodeOpen}
        onClose={() => setShaderCodeOpen(false)}
      />
    </div>
  );
}
