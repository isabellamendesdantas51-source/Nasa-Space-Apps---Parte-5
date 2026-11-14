import React, { useState } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { BudgetAdminConfig, SubsystemSlot } from '../types/mission';
import {
  createDefaultAdminConfig,
  formatCredits,
  SLOT_LABELS,
  SUBSYSTEM_CATALOG,
} from '../data/missionConfig';

interface BudgetAdminModalProps {
  isOpen: boolean;
  config: BudgetAdminConfig;
  onClose: () => void;
  onSave: (nextConfig: BudgetAdminConfig) => void;
}

const OPERATION_LABELS: { key: keyof BudgetAdminConfig['operationCosts']; label: string }[] = [
  { key: 'tliPreparation', label: 'Fase 1 · Preparação e Ignição TLI' },
  { key: 'phase2EnergyCalibration', label: 'Fase 2 · Otimização Energética' },
  { key: 'phase2SystemMaintenance', label: 'Fase 2 · Manutenção Preventiva' },
  { key: 'phase2DeepSpaceRelay', label: 'Fase 2 · Telemetria Científica DSN' },
  { key: 'phase2RadiationShelter', label: 'Fase 2 · Ativação Abrigo de Radiação' },
  { key: 'phase2StormRecovery', label: 'Fase 2 · Recuperação Pós-Tempestade' },
  { key: 'phase3TcmBurn', label: 'Fase 3 · Queima de Correção (TCM)' },
  { key: 'phase3ReentryPrep', label: 'Fase 3 · Separação e Escudo Térmico' },
  { key: 'phase3OceanRecovery', label: 'Fase 3 · Equipe de Recuperação Oceânica' },
];

export const BudgetAdminModal: React.FC<BudgetAdminModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<BudgetAdminConfig>(() => JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'phases' | 'operations' | 'components'>('phases');

  if (!isOpen) return null;

  const globalSum = draft.phase1Initial + draft.phase2Initial + draft.phase3Initial;

  const handlePhaseBudgetChange = (key: 'phase1Initial' | 'phase2Initial' | 'phase3Initial', val: string) => {
    const num = Math.max(0, Number(val) || 0);
    setDraft((prev) => ({ ...prev, [key]: num }));
  };

  const handleOpCostChange = (key: keyof BudgetAdminConfig['operationCosts'], val: string) => {
    const num = Math.max(0, Number(val) || 0);
    setDraft((prev) => ({
      ...prev,
      operationCosts: { ...prev.operationCosts, [key]: num },
    }));
  };

  const handleCompCostChange = (id: string, val: string) => {
    const num = Math.max(0, Number(val) || 0);
    setDraft((prev) => ({
      ...prev,
      componentCosts: { ...prev.componentCosts, [id]: num },
    }));
  };

  const handleRestoreDefaults = () => {
    setDraft(createDefaultAdminConfig());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#090f1d] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Painel Administrativo de Orçamentos e Custos
              </h2>
              <p className="text-xs text-slate-400">
                Valores fictícios configuráveis em Créditos de Simulação (CR$) para uso educativo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 cursor-pointer"
            aria-label="Fechar painel administrativo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('phases')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'phases'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Orçamento Global e por Fase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custos das Operações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'components'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custos dos Componentes (Fase 1)
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <div className="bg-[#0d1629] border border-cyan-500/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">
                    Orçamento Global Inicial (Soma automática das 3 fases)
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-cyan-300 mt-0.5">
                    {formatCredits(globalSum)}
                  </div>
                </div>
                <div className="text-xs text-slate-400 max-w-xs text-right">
                  Regra do simulador: o orçamento global sempre equivale à soma exata das alocações iniciais das Fases 1, 2 e 3.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0d1629] border border-slate-800 rounded-lg p-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Fase 1 · Planejamento e Montagem
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={draft.phase1Initial}
                    onChange={(e) => handlePhaseBudgetChange('phase1Initial', e.target.value)}
                    className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 font-mono-tabular text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {globalSum > 0 ? ((draft.phase1Initial / globalSum) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>

                <div className="bg-[#0d1629] border border-slate-800 rounded-lg p-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Fase 2 · Viagem Lunar
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={draft.phase2Initial}
                    onChange={(e) => handlePhaseBudgetChange('phase2Initial', e.target.value)}
                    className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 font-mono-tabular text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {globalSum > 0 ? ((draft.phase2Initial / globalSum) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>

                <div className="bg-[#0d1629] border border-slate-800 rounded-lg p-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Fase 3 · Retorno à Terra
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={draft.phase3Initial}
                    onChange={(e) => handlePhaseBudgetChange('phase3Initial', e.target.value)}
                    className="w-full bg-[#060b16] border border-slate-700 rounded px-3 py-2 font-mono-tabular text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {globalSum > 0 ? ((draft.phase3Initial / globalSum) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPERATION_LABELS.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#0d1629] border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-slate-200">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={250}
                    value={draft.operationCosts[item.key]}
                    onChange={(e) => handleOpCostChange(item.key, e.target.value)}
                    className="w-28 bg-[#060b16] border border-slate-700 rounded px-2.5 py-1.5 font-mono-tabular text-xs text-right text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-4">
              {(Object.keys(SUBSYSTEM_CATALOG) as SubsystemSlot[]).map((slot) => (
                <div key={slot} className="bg-[#0d1629] border border-slate-800 rounded-lg p-3.5">
                  <h4 className="font-display text-xs font-semibold text-cyan-300 mb-2">
                    {SLOT_LABELS[slot].title}
                  </h4>
                  <div className="space-y-2">
                    {SUBSYSTEM_CATALOG[slot].map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-200">{opt.name}</span>
                        <input
                          type="number"
                          min={0}
                          step={250}
                          value={draft.componentCosts[opt.id] ?? opt.defaultCost}
                          onChange={(e) => handleCompCostChange(opt.id, e.target.value)}
                          className="w-28 bg-[#060b16] border border-slate-700 rounded px-2.5 py-1.5 font-mono-tabular text-xs text-right text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-md cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md cursor-pointer"
            >
              Aplicar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
