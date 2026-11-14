import React from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Code2,
  SlidersHorizontal,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { MissionPhase, MissionState } from '../types/mission';
import { formatCredits } from '../data/missionConfig';

interface BudgetStatusBarProps {
  state: MissionState;
  onOpenAdmin: () => void;
  onOpenTransfer: () => void;
  onOpenLedger: () => void;
  onOpenShaderCode: () => void;
}

export const BudgetStatusBar: React.FC<BudgetStatusBarProps> = ({
  state,
  onOpenAdmin,
  onOpenTransfer,
  onOpenLedger,
  onOpenShaderCode,
}) => {
  const { globalBudget, phaseBudgets, phase } = state;
  const activePhaseNum: 1 | 2 | 3 = phase === 4 ? 3 : (phase as 1 | 2 | 3);
  const currentPhaseBudget = phaseBudgets[activePhaseNum];

  const globalPctUsed =
    globalBudget.initialTotal > 0
      ? Math.min(100, (globalBudget.spentTotal / globalBudget.initialTotal) * 100)
      : 0;
  const globalPctLeft = 100 - globalPctUsed;

  const phasePctUsed =
    currentPhaseBudget.effectiveLimit > 0
      ? Math.min(100, (currentPhaseBudget.spent / currentPhaseBudget.effectiveLimit) * 100)
      : 0;
  const phasePctLeft = 100 - phasePctUsed;

  const isGlobalExhausted = globalBudget.remaining <= 0;
  const isGlobalLow = !isGlobalExhausted && globalPctLeft < 30;
  const isPhaseExhausted = currentPhaseBudget.remaining <= 0;
  const isPhaseLow = !isPhaseExhausted && phasePctLeft < 20;

  const phaseNames: Record<MissionPhase, string> = {
    1: 'Fase 1 · Montagem',
    2: 'Fase 2 · Viagem Lunar',
    3: 'Fase 3 · Retorno',
    4: 'Missão Concluída',
  };

  return (
    <div className="bg-[#090f1d] border-b border-slate-800/90 px-4 py-2.5">
      <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Global Budget Indicator */}
        <div className="flex items-center gap-4 min-w-[280px] flex-1">
          <div className="flex items-center gap-2 text-cyan-400 shrink-0">
            <Wallet className="w-4 h-4" />
            <span className="font-display text-xs font-semibold tracking-wider uppercase text-slate-300">
              Orçamento Global
            </span>
          </div>
          <div className="flex-1 max-w-md">
            <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
              <span className="font-mono-tabular font-semibold text-slate-100">
                Saldo: {formatCredits(globalBudget.remaining)}
              </span>
              <span className="font-mono-tabular text-slate-400">
                Gasto: {formatCredits(globalBudget.spentTotal)} / {formatCredits(globalBudget.initialTotal)} ({globalPctUsed.toFixed(0)}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isGlobalExhausted
                    ? 'bg-red-500'
                    : isGlobalLow
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                }`}
                style={{ width: `${globalPctUsed}%` }}
              />
            </div>
          </div>
          {(isGlobalExhausted || isGlobalLow) && (
            <span
              className={`text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                isGlobalExhausted ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isGlobalExhausted ? 'Esgotado' : '< 30%'}
            </span>
          )}
        </div>

        {/* Regional Phase Budget Indicator */}
        <div className="flex items-center gap-4 min-w-[280px] flex-1 border-slate-800 lg:border-l lg:pl-4">
          <div className="shrink-0">
            <span className="font-display text-xs font-semibold tracking-wider uppercase text-slate-300">
              {phaseNames[phase]}
            </span>
          </div>
          <div className="flex-1 max-w-md">
            <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
              <span className="font-mono-tabular font-semibold text-cyan-300">
                Fase: {formatCredits(currentPhaseBudget.remaining)}
              </span>
              <span className="font-mono-tabular text-slate-400">
                Limite: {formatCredits(currentPhaseBudget.effectiveLimit)} ({phasePctUsed.toFixed(0)}% usado)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isPhaseExhausted
                    ? 'bg-red-500'
                    : isPhaseLow
                      ? 'bg-orange-400'
                      : 'bg-sky-400'
                }`}
                style={{ width: `${phasePctUsed}%` }}
              />
            </div>
          </div>
          {(isPhaseExhausted || isPhaseLow) && (
            <span
              className={`text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                isPhaseExhausted ? 'text-red-400' : 'text-orange-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isPhaseExhausted ? 'Limite Atingido' : '< 20%'}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenTransfer}
            className="px-3 py-1.5 text-xs font-medium text-cyan-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            Realocar Orçamento
          </button>
          <button
            type="button"
            onClick={onOpenLedger}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ReceiptText className="w-3.5 h-3.5 text-slate-300" />
            Extrato
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Configurar Custos
          </button>
          <button
            type="button"
            onClick={onOpenShaderCode}
            className="px-3 py-1.5 text-xs font-medium text-cyan-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            Código 3D (GLSL)
          </button>
        </div>
      </div>
    </div>
  );
};
