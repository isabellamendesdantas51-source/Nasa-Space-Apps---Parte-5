import React from 'react';
import { MissionState } from '../types/mission';
import { formatCredits } from '../data/missionConfig';

interface PhaseFinancialReportCardProps {
  phase: 1 | 2 | 3;
  state: MissionState;
}

export const PhaseFinancialReportCard: React.FC<PhaseFinancialReportCardProps> = ({
  phase,
  state,
}) => {
  const budget = state.phaseBudgets[phase];
  const phaseTxs = state.transactions.filter((t) => t.phase === phase && t.amount > 0);
  const pctUsed =
    budget.effectiveLimit > 0 ? Math.min(100, (budget.spent / budget.effectiveLimit) * 100) : 0;

  return (
    <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <h3 className="font-display text-sm font-semibold text-slate-100">
          Relatório Financeiro · {budget.label}
        </h3>
        <span className="font-mono-tabular text-xs text-cyan-300">
          Consumido: {pctUsed.toFixed(1)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-[#070d1a] border border-slate-800/80 rounded p-2.5">
          <div className="text-[11px] text-slate-400">Orçamento da Fase</div>
          <div className="font-mono-tabular text-sm font-semibold text-slate-100">
            {formatCredits(budget.effectiveLimit)}
          </div>
        </div>
        <div className="bg-[#070d1a] border border-slate-800/80 rounded p-2.5">
          <div className="text-[11px] text-slate-400">Total Gasto</div>
          <div className="font-mono-tabular text-sm font-semibold text-amber-300">
            {formatCredits(budget.spent)}
          </div>
        </div>
        <div className="bg-[#070d1a] border border-slate-800/80 rounded p-2.5">
          <div className="text-[11px] text-slate-400">Saldo Restante</div>
          <div className="font-mono-tabular text-sm font-semibold text-emerald-400">
            {formatCredits(budget.remaining)}
          </div>
        </div>
      </div>

      <div className="text-xs font-medium text-slate-300 mb-1.5">
        Principais operações realizadas ({phaseTxs.length})
      </div>
      {phaseTxs.length === 0 ? (
        <p className="text-xs text-slate-500">Nenhuma despesa registrada nesta fase.</p>
      ) : (
        <ul className="divide-y divide-slate-800/70 max-h-40 overflow-y-auto pr-1">
          {phaseTxs.map((tx) => (
            <li key={tx.id} className="py-1.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="text-slate-200 truncate">{tx.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{tx.description}</div>
              </div>
              <span className="font-mono-tabular font-medium text-slate-200 shrink-0">
                {formatCredits(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
