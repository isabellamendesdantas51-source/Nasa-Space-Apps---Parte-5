import React from 'react';
import { ReceiptText, X } from 'lucide-react';
import { MissionState } from '../types/mission';
import { formatCredits } from '../data/missionConfig';

interface FinancialLedgerModalProps {
  isOpen: boolean;
  state: MissionState;
  onClose: () => void;
}

export const FinancialLedgerModal: React.FC<FinancialLedgerModalProps> = ({
  isOpen,
  state,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#090f1d] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[86vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Extrato Financeiro e Registro de Decisões
              </h2>
              <p className="text-xs text-slate-400">
                Auditoria completa de gastos simultâneos (Global e Regional) e realocações.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Phase summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([1, 2, 3] as const).map((p) => {
              const b = state.phaseBudgets[p];
              return (
                <div key={p} className="bg-[#0d1629] border border-slate-800 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-200 mb-1">{b.label}</div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Limite:</span>
                    <span className="font-mono-tabular text-slate-200">{formatCredits(b.effectiveLimit)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Gasto:</span>
                    <span className="font-mono-tabular text-amber-300">{formatCredits(b.spent)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800 mt-1.5 pt-1.5">
                    <span>Saldo:</span>
                    <span className="font-mono-tabular font-semibold text-emerald-400">
                      {formatCredits(b.remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transfers */}
          {state.budgetTransfers.length > 0 && (
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Transferências de Orçamento ({state.budgetTransfers.length})
              </h3>
              <div className="bg-[#0d1629] border border-slate-800 rounded-lg divide-y divide-slate-800">
                {state.budgetTransfers.map((tr) => (
                  <div key={tr.id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-200 font-medium">
                        Fase {tr.fromPhase} → Fase {tr.toPhase}
                      </div>
                      <div className="text-[11px] text-slate-400">{tr.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-tabular font-semibold text-cyan-300">
                        {formatCredits(tr.amount)}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-500">{tr.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Histórico de Despesas ({state.transactions.length})
            </h3>
            <div className="bg-[#0d1629] border border-slate-800 rounded-lg divide-y divide-slate-800">
              {state.transactions.map((tx) => (
                <div key={tx.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-slate-200 font-medium">
                      <span className="font-mono-tabular text-cyan-400">F{tx.phase}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{tx.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{tx.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-tabular font-semibold text-slate-100">
                      {tx.amount > 0 ? `-${formatCredits(tx.amount)}` : 'CR$ 0'}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-500">{tx.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer"
          >
            Fechar Extrato
          </button>
        </div>
      </div>
    </div>
  );
};
