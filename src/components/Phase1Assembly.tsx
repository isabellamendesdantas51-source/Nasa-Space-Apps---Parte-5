import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  Rocket,
  ShieldAlert,
} from 'lucide-react';
import { MissionAction } from '../state/missionReducer';
import { MissionState, SubsystemSlot } from '../types/mission';
import {
  formatCredits,
  SLOT_LABELS,
  SUBSYSTEM_CATALOG,
} from '../data/missionConfig';
import { getComponentCost, getSubsystemOption } from '../state/missionReducer';
import { OrionViewport3D } from './OrionViewport3D';
import { PhaseFinancialReportCard } from './PhaseFinancialReportCard';

interface Phase1AssemblyProps {
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
  onOpenTransfer: () => void;
}

const SLOTS: SubsystemSlot[] = ['engine', 'tank', 'shield', 'antenna', 'power'];

export const Phase1Assembly: React.FC<Phase1AssemblyProps> = ({
  state,
  dispatch,
  onOpenTransfer,
}) => {
  const [activeSlot, setActiveSlot] = useState<SubsystemSlot>('engine');
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [commsTestResult, setCommsTestResult] = useState<string | null>(null);
  const [launchingBanner, setLaunchingBanner] = useState(false);

  const p1Budget = state.phaseBudgets[1];
  const tliCost = state.adminConfig.operationCosts.tliPreparation;
  const canAffordTli = p1Budget.remaining >= tliCost && state.globalBudget.remaining >= tliCost;
  const isBudgetZero = p1Budget.remaining <= 0 || state.globalBudget.remaining <= 0;

  const currentAntenna = getSubsystemOption('antenna', state.selectedSubsystems.antenna);

  const handleTestComms = () => {
    const rate = currentAntenna.stats.commsRateGbPerSec ?? 22;
    const bonus = Math.round(((currentAntenna.stats.commsBonusMultiplier ?? 1) - 1) * 100);
    setCommsTestResult(
      `Link DSN verificado (${currentAntenna.code}): Taxa nominal ${rate} GB/s · Eficiência científica ${bonus >= 0 ? `+${bonus}%` : `${bonus}%`} · Custo: CR$ 0.`
    );
  };

  const handleExecuteTli = () => {
    if (!canAffordTli) {
      dispatch({ type: 'EXECUTE_TLI_AND_START_PHASE2' }); // triggers exact blocked alert
      return;
    }
    setLaunchingBanner(true);
    window.setTimeout(() => {
      dispatch({ type: 'EXECUTE_TLI_AND_START_PHASE2' });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* TLI Transition Banner */}
      {launchingBanner && (
        <div className="bg-[#0b1b30] border border-cyan-400 rounded-lg p-4 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-cyan-300 shrink-0" />
            <div>
              <div className="font-display text-sm font-bold text-cyan-200">
                CONFIGURAÇÃO APROVADA. SISTEMAS DA ORION VERIFICADOS. INICIANDO VIAGEM LUNAR.
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Ignição de Injeção Translunar (TLI) em curso · Transferindo telemetria e saldos para a Fase 2...
              </div>
            </div>
          </div>
          <span className="font-mono-tabular text-xs text-cyan-300 shrink-0">TLI ATIVA</span>
        </div>
      )}

      {/* Exhausted Budget Advisory */}
      {isBudgetZero && (
        <div className="bg-[#1b1014] border border-red-500/60 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-red-300">
                {state.globalBudget.remaining <= 0
                  ? 'Orçamento Global Esgotado'
                  : 'Limite Regional da Fase 1 Esgotado'}
              </div>
              <p className="text-slate-300 mt-0.5">
                Upgrades pagos estão bloqueados. Atividades disponíveis sem custos: trocar para módulos mais econômicos (liberando saldo), testar o sistema de comunicação (CR$ 0) ou validar a configuração atual.
              </p>
            </div>
          </div>
          {state.globalBudget.remaining > 0 && p1Budget.remaining < tliCost && (
            <button
              type="button"
              onClick={onOpenTransfer}
              className="px-3 py-1.5 text-xs font-medium text-cyan-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded cursor-pointer whitespace-nowrap"
            >
              Realocar Créditos para Fase 1
            </button>
          )}
        </div>
      )}

      {/* Main 3D Viewport + Modular Assembly Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* 3D Orion Interactive Viewport */}
        <div className="xl:col-span-7 bg-[#060b16] border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-[460px]">
          <div className="px-4 py-2.5 bg-[#090f1d] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Montagem Modular 3D · Nave Orion
              </h2>
              <p className="text-[11px] text-slate-400">
                Arraste para orbitar · Role para zoom · Inspecione os subsistemas selecionados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vista Explodida</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodedAmount}
                  onChange={(e) => setExplodedAmount(Number(e.target.value))}
                  className="aero-slider w-24"
                />
                <span className="font-mono-tabular text-[11px] text-cyan-300 w-9 text-right">
                  {Math.round(explodedAmount * 100)}%
                </span>
              </label>
            </div>
          </div>

          <div className="relative flex-1 min-h-[380px]">
            <OrionViewport3D
              phase={1}
              explodedAmount={explodedAmount}
              highlightedSlot={activeSlot}
              selectedSubsystems={state.selectedSubsystems}
            />
            {/* Minimal Corner Readout (no backdrop-blur over WebGL) */}
            <div className="absolute bottom-3 left-3 bg-[#090f1d]/92 border border-slate-800 rounded px-3 py-2 text-[11px] pointer-events-none">
              <div className="text-slate-400">Subsistema em Foco</div>
              <div className="font-semibold text-cyan-300">
                {SLOT_LABELS[activeSlot].title}:{' '}
                {getSubsystemOption(activeSlot, state.selectedSubsystems[activeSlot]).name}
              </div>
            </div>
          </div>
        </div>

        {/* Modular Configuration & TLI Launch Panel */}
        <div className="xl:col-span-5 bg-[#090f1d] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Seleção de Subsistemas e Componentes
                </h3>
              </div>
              <span className="font-mono-tabular text-xs text-slate-400">5 / 5 Módulos</span>
            </div>

            {/* Slot Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-[#060b16] p-1 rounded-md border border-slate-800">
              {SLOTS.map((slot, idx) => {
                const isSelected = activeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setActiveSlot(slot)}
                    className={`py-1.5 px-1 text-[11px] font-medium rounded transition-colors cursor-pointer truncate ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {idx + 1}. {slot === 'engine' ? 'Motor' : slot === 'tank' ? 'Tanque' : slot === 'shield' ? 'Escudo' : slot === 'antenna' ? 'Antena' : 'Energia'}
                  </button>
                );
              })}
            </div>

            {/* Active Slot Options */}
            <div>
              <div className="mb-2">
                <div className="text-xs font-semibold text-slate-200">
                  {SLOT_LABELS[activeSlot].title}
                </div>
                <div className="text-[11px] text-slate-400">
                  {SLOT_LABELS[activeSlot].subtitle}
                </div>
              </div>

              <div className="space-y-2">
                {SUBSYSTEM_CATALOG[activeSlot].map((option) => {
                  const isEquipped = state.selectedSubsystems[activeSlot] === option.id;
                  const currentEquippedCost = getComponentCost(
                    state.adminConfig,
                    state.selectedSubsystems[activeSlot]
                  );
                  const optionCost = getComponentCost(state.adminConfig, option.id);
                  const delta = optionCost - currentEquippedCost;
                  const affordable =
                    isEquipped ||
                    (delta <= p1Budget.remaining && delta <= state.globalBudget.remaining);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'SELECT_SUBSYSTEM',
                          slot: activeSlot,
                          optionId: option.id,
                        })
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isEquipped
                          ? 'bg-[#0e1f38] border-cyan-400/70'
                          : affordable
                            ? 'bg-[#070d19] border-slate-800 hover:border-slate-600'
                            : 'bg-[#0d0a10] border-red-900/50 opacity-75 hover:border-red-700/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                            {isEquipped && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            <span>{option.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono-tabular text-xs font-semibold text-cyan-300">
                            {formatCredits(optionCost)}
                          </div>
                          {!isEquipped && (
                            <div
                              className={`font-mono-tabular text-[11px] mt-0.5 ${
                                delta > 0
                                  ? affordable
                                    ? 'text-amber-300'
                                    : 'text-red-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {delta > 0 ? `+${formatCredits(delta)}` : formatCredits(delta)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comms Diagnostic Test (Free) */}
            <div className="bg-[#060b16] border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sistema de Comunicação e Transmissão</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestComms}
                  className="px-2.5 py-1 text-[11px] font-medium text-cyan-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer whitespace-nowrap"
                >
                  Testar Link (CR$ 0)
                </button>
              </div>
              {commsTestResult && (
                <p className="text-[11px] text-emerald-300 mt-2 font-mono-tabular">
                  {commsTestResult}
                </p>
              )}
            </div>
          </div>

          {/* Validation & TLI Preparation Footer */}
          <div className="border-t border-slate-800 pt-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Custo da Preparação e Ignição TLI:</span>
              <span
                className={`font-mono-tabular font-semibold ${
                  canAffordTli ? 'text-cyan-300' : 'text-red-400'
                }`}
              >
                {formatCredits(tliCost)}
              </span>
            </div>

            {!canAffordTli && (
              <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-950/30 border border-red-900/60 rounded p-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Saldo da Fase 1 insuficiente para TLI. Selecione um componente mais econômico ou realoque créditos da Fase 2/3.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'VALIDATE_PHASE1' })}
                className={`px-3 py-2.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  state.phase1Validated
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {state.phase1Validated ? 'Nave Validada' : 'Validar Configuração'}
              </button>

              <button
                type="button"
                disabled={launchingBanner}
                onClick={handleExecuteTli}
                className={`px-3 py-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  canAffordTli
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-red-800/60'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>Executar TLI (Fase 2)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 1 Financial Summary */}
      <PhaseFinancialReportCard phase={1} state={state} />
    </div>
  );
};
