import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { MissionState } from '../types/mission';
import { formatCredits } from '../data/missionConfig';

interface BudgetTransferModalProps {
  isOpen: boolean;
  state: MissionState;
  onClose: () => void;
  onTransfer: (fromPhase: 1 | 2 | 3, toPhase: 1 | 2 | 3, amount: number, reason: string) => void;
}

export const BudgetTransferModal: React.FC<BudgetTransferModalProps> = ({
  isOpen,
  state,
  onClose,
  onTransfer,
}) => {
  const defaultTo: 1 | 2 | 3 = state.phase === 4 ? 3 : (state.phase as 1 | 2 | 3);
  const defaultFrom: 1 | 2 | 3 = defaultTo === 1 ? 2 : 1;

  const [fromPhase, setFromPhase] = useState<1 | 2 | 3>(defaultFrom);
  const [toPhase, setToPhase] = useState<1 | 2 | 3>(defaultTo);
  const [amount, setAmount] = useState<number>(2000);
  const [reason, setReason] = useState<string>('Suplementação operacional entre fases');

  if (!isOpen) return null;

  const sourceRemaining = state.phaseBudgets[fromPhase].remaining;
  const targetRemaining = state.phaseBudgets[toPhase].remaining;
  const isValid = fromPhase !== toPhase && amount > 0 && amount <= sourceRemaining;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#090f1d] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-base font-semibold text-slate-100">
              Realocação de Orçamento entre Fases
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Saldos não utilizados permanecem no Orçamento Global, mas não aumentam automaticamente o limite das outras fases. Use esta realocação explícita para transferir créditos entre fases sem alterar o teto global.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {([1, 2, 3] as const).map((p) => (
              <div key={p} className="bg-[#0d1629] border border-slate-800 rounded p-2.5">
                <div className="text-[11px] text-slate-400">Fase {p} Saldo</div>
                <div className="font-mono-tabular text-sm font-semibold text-cyan-300">
                  {formatCredits(state.phaseBudgets[p].remaining)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Fase de Origem</label>
              <select
                value={fromPhase}
                onChange={(e) => setFromPhase(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={1}>Fase 1 · Montagem</option>
                <option value={2}>Fase 2 · Viagem Lunar</option>
                <option value={3}>Fase 3 · Retorno à Terra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Fase de Destino</label>
              <select
                value={toPhase}
                onChange={(e) => setToPhase(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={1}>Fase 1 · Montagem</option>
                <option value={2}>Fase 2 · Viagem Lunar</option>
                <option value={3}>Fase 3 · Retorno à Terra</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="text-slate-300">Valor da Transferência (CR$)</label>
              <span className="font-mono-tabular text-slate-400">
                Disponível na origem: {formatCredits(sourceRemaining)}
              </span>
            </div>
            <input
              type="number"
              min={100}
              max={Math.max(100, sourceRemaining)}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 font-mono-tabular text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Justificativa Operacional</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {fromPhase === toPhase && (
            <p className="text-xs text-amber-300">
              Selecione fases diferentes para realizar a transferência.
            </p>
          )}
          {amount > sourceRemaining && (
            <p className="text-xs text-red-400">
              Valor excede o saldo restante da Fase {fromPhase}.
            </p>
          )}

          {isValid && (
            <div className="bg-[#0d1629] border border-slate-800 rounded p-3 text-xs text-slate-300 flex items-center justify-between">
              <span>Novo saldo Fase {toPhase}:</span>
              <span className="font-mono-tabular font-semibold text-emerald-400">
                {formatCredits(targetRemaining + amount)}
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              onTransfer(fromPhase, toPhase, amount, reason);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400 rounded-md cursor-pointer"
          >
            Confirmar Realocação
          </button>
        </div>
      </div>
    </div>
  );
};
