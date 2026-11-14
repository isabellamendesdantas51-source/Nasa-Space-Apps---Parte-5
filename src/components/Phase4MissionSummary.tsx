import React from 'react';
import {
  Award,
  CheckCircle2,
  FileText,
  Home,
  RotateCcw,
  Shield,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { getSubsystemOption, MissionAction } from '../state/missionReducer';
import { MissionState, SubsystemSlot } from '../types/mission';
import { CINEMATIC_IMAGES, formatCredits, SLOT_LABELS } from '../data/missionConfig';

interface Phase4MissionSummaryProps {
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
  onOpenFullReport: () => void;
}

function computeMissionGrade(state: MissionState) {
  const { telemetry, globalBudget, phase2, phase3 } = state;

  // 1. Completion (20 pts)
  const completionPts = phase3.reentryMoment === 'SPLASHDOWN' ? 20 : 10;

  // 2. Crew Safety & System Integrity (25 pts)
  const safetyPts = Math.round(
    (telemetry.crewProtection * 0.15) + (telemetry.systemIntegrity * 0.10)
  );

  // 3. Science Output (20 pts)
  const sciencePts = Math.min(20, Math.round((telemetry.scienceScore / 1800) * 20));

  // 4. Resource Preservation (15 pts)
  const fuelRatio = telemetry.initialFuel > 0 ? telemetry.fuel / telemetry.initialFuel : 0;
  const resourcePts = Math.min(15, Math.round(fuelRatio * 10 + (telemetry.battery / 100) * 5));

  // 5. Budget Management & Decision Efficiency (20 pts)
  const spentRatio =
    globalBudget.initialTotal > 0 ? globalBudget.spentTotal / globalBudget.initialTotal : 1;
  // Optimal strategic range: 50% to 92% used with zero overdraft and healthy surplus
  const budgetDiscipline =
    globalBudget.remaining > 0
      ? spentRatio <= 0.85
        ? 14
        : 10
      : 4;
  const decisionBonus =
    (phase2.solarStormChoice === 'SHELTER' ? 3 : phase2.stormRecoveryExecuted ? 2 : 0) +
    (phase3.tcmAttempts.length === 1 ? 3 : 1);
  const managementPts = Math.min(20, budgetDiscipline + decisionBonus);

  const totalScore = Math.min(
    100,
    completionPts + safetyPts + sciencePts + resourcePts + managementPts
  );

  let tier = 'C';
  let label = 'Missão Concluída com Ressalvas';
  if (totalScore >= 90) {
    tier = 'S';
    label = 'Excelência Aeroespacial';
  } else if (totalScore >= 78) {
    tier = 'A';
    label = 'Alto Desempenho Operacional';
  } else if (totalScore >= 64) {
    tier = 'B';
    label = 'Missão Bem-Sucedida';
  }

  return {
    totalScore,
    tier,
    label,
    breakdown: [
      { name: 'Conclusão da Missão', pts: completionPts, max: 20 },
      { name: 'Segurança da Tripulação e Integridade', pts: safetyPts, max: 25 },
      { name: 'Pontuação Científica', pts: sciencePts, max: 20 },
      { name: 'Preservação de Recursos', pts: resourcePts, max: 15 },
      { name: 'Administração Financeira e Decisões', pts: managementPts, max: 20 },
    ],
  };
}

export const Phase4MissionSummary: React.FC<Phase4MissionSummaryProps> = ({
  state,
  dispatch,
  onOpenFullReport,
}) => {
  const { globalBudget, phaseBudgets, telemetry, phase2, phase3, transactions, budgetTransfers } =
    state;
  const grade = computeMissionGrade(state);

  const globalPctUsed =
    globalBudget.initialTotal > 0
      ? (globalBudget.spentTotal / globalBudget.initialTotal) * 100
      : 0;

  const paidTxs = transactions.filter((t) => t.amount > 0);
  const topExpenses = [...paidTxs].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const highestExpense = topExpenses[0];

  const highestPhase = ([1, 2, 3] as const).reduce((best, curr) =>
    phaseBudgets[curr].spent > phaseBudgets[best].spent ? curr : best
  , 1 as 1 | 2 | 3);

  const finalAngle =
    phase3.tcmAttempts.length > 0
      ? phase3.tcmAttempts[phase3.tcmAttempts.length - 1].angle
      : phase3.reentryAngle;

  const financialStatus =
    globalBudget.remaining === 0
      ? 'Orçamento Esgotado ao Término'
      : globalPctUsed < 70
        ? 'Superávit Elevado e Controle Rigoroso'
        : 'Equilíbrio Financeiro Saudável';

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Completion Banner */}
      <div className="bg-[#090f1d] border border-emerald-500/50 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs font-mono-tabular text-emerald-400 mb-1">
              ARTEMIS II: LUNAR ODYSSEY · REGISTRO OFICIAL
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-50">
              MISSÃO CONCLUÍDA!
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-xl">
              A jornada lunar chegou ao fim. A tripulação retornou à Terra e os resultados da missão foram registrados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenFullReport}
              className="px-4 py-2.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              VER RELATÓRIO COMPLETO
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET_MISSION', keepAdminConfig: true })}
              className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              JOGAR NOVAMENTE
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'RETURN_TO_START' })}
              className="px-4 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              VOLTAR AO INÍCIO
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[220px]">
          <img
            src={CINEMATIC_IMAGES.pacificSplashdown}
            alt="Cápsula Orion após pouso no Oceano Pacífico"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090f1d] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
            <span className="font-mono-tabular text-emerald-300 font-semibold">
              POUSO NO OCEANO CONFIRMADO
            </span>
            <span className="font-mono-tabular text-slate-200">
              Oceano Pacífico
            </span>
          </div>
        </div>
      </div>

      {/* Classification + Technical Report Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Multi-Factor Mission Classification */}
        <div className="lg:col-span-5 bg-[#090f1d] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <h3 className="font-display text-base font-semibold text-slate-100">
                Classificação Final da Missão
              </h3>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-cyan-300">
                Grau {grade.tier}
              </span>
              <span className="font-mono-tabular text-xs text-slate-400 ml-2">
                ({grade.totalScore}/100)
              </span>
            </div>
          </div>

          <div className="text-xs font-medium text-emerald-300">{grade.label}</div>

          <div className="space-y-2.5">
            {grade.breakdown.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="font-mono-tabular text-slate-100">
                    {item.pts} / {item.max}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${(item.pts / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Report */}
        <div className="lg:col-span-7 bg-[#090f1d] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-base font-semibold text-slate-100">
              Relatório Técnico da Missão
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Combustível Inicial / Restante</div>
              <div className="font-mono-tabular font-semibold text-slate-100 mt-0.5">
                {telemetry.initialFuel}% → {telemetry.fuel}%
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Dados Transmitidos</div>
              <div className="font-mono-tabular font-semibold text-cyan-300 mt-0.5">
                {telemetry.scienceTransmitted.toFixed(1)} GB
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Pontuação Científica</div>
              <div className="font-mono-tabular font-semibold text-emerald-400 mt-0.5">
                {telemetry.scienceScore} pts
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Tempestade Solar</div>
              <div className="font-semibold text-slate-100 mt-0.5">
                {phase2.solarStormChoice === 'SHELTER'
                  ? 'Abrigo Ativado'
                  : 'Potência Máxima'}
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Resultado TCM</div>
              <div className="font-mono-tabular font-semibold text-emerald-400 mt-0.5">
                {finalAngle.toFixed(1)}° ({phase3.tcmAttempts.length} tent.)
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
              <div className="text-[11px] text-slate-400">Tripulação / Sistemas</div>
              <div className="font-mono-tabular font-semibold text-cyan-300 mt-0.5">
                {telemetry.crewProtection}% / {telemetry.systemIntegrity}%
              </div>
            </div>
          </div>

          {/* Initial Ship Configuration */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Configuração Inicial da Nave Orion
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(['engine', 'tank', 'shield', 'antenna', 'power'] as SubsystemSlot[]).map((slot) => {
                const opt = getSubsystemOption(slot, state.selectedSubsystems[slot]);
                return (
                  <div
                    key={slot}
                    className="bg-[#070d19] border border-slate-800 rounded px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-400 truncate">{SLOT_LABELS[slot].title}</span>
                    <span className="text-slate-200 font-medium truncate">{opt.code}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-300 pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Reentrada Atmosférica Nominal
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Pouso no Oceano Confirmado
            </span>
          </div>
        </div>
      </div>

      {/* Relatório Financeiro Final */}
      <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-base font-semibold text-slate-100">
              Relatório Financeiro Final
            </h3>
          </div>
          <span className="text-xs font-medium text-cyan-300">{financialStatus}</span>
        </div>

        {/* Global Budget Summary */}
        <div>
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Orçamento Global
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#070d19] border border-slate-800 rounded p-3">
              <div className="text-[11px] text-slate-400">Valor Inicial</div>
              <div className="font-mono-tabular text-base font-bold text-slate-100">
                {formatCredits(globalBudget.initialTotal)}
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-3">
              <div className="text-[11px] text-slate-400">Total Gasto</div>
              <div className="font-mono-tabular text-base font-bold text-amber-300">
                {formatCredits(globalBudget.spentTotal)}
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-3">
              <div className="text-[11px] text-slate-400">Saldo Final</div>
              <div className="font-mono-tabular text-base font-bold text-emerald-400">
                {formatCredits(globalBudget.remaining)}
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-3">
              <div className="text-[11px] text-slate-400">Percentual Utilizado</div>
              <div className="font-mono-tabular text-base font-bold text-cyan-300">
                {globalPctUsed.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Per Phase Budget Breakdown */}
        <div>
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Orçamento por Fase
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([1, 2, 3] as const).map((p) => {
              const b = phaseBudgets[p];
              return (
                <div key={p} className="bg-[#070d19] border border-slate-800 rounded p-3.5 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-100">{b.label}</div>
                  <div className="flex justify-between text-slate-400">
                    <span>Orçamento Efetivo:</span>
                    <span className="font-mono-tabular text-slate-200">{formatCredits(b.effectiveLimit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Gasto:</span>
                    <span className="font-mono-tabular text-amber-300">{formatCredits(b.spent)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Saldo Restante:</span>
                    <span className="font-mono-tabular text-emerald-400">{formatCredits(b.remaining)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Expenses & Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#070d19] border border-slate-800 rounded p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Principais Despesas e Operações Mais Caras
            </div>
            <ul className="divide-y divide-slate-800/80 text-xs">
              {topExpenses.map((tx) => (
                <li key={tx.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-300 truncate">
                    F{tx.phase} · {tx.title}
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-100 shrink-0">
                    {formatCredits(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#070d19] border border-slate-800 rounded p-3.5 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">Análise Financeira da Missão</div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fase com maior consumo:</span>
              <span className="font-semibold text-cyan-300">
                Fase {highestPhase} ({formatCredits(phaseBudgets[highestPhase].spent)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Operação mais cara:</span>
              <span className="font-semibold text-amber-300">
                {highestExpense
                  ? `${highestExpense.title} (${formatCredits(highestExpense.amount)})`
                  : 'Nenhuma'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transferências entre fases:</span>
              <span className="font-mono-tabular text-slate-200">
                {budgetTransfers.length} registrada(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Situação financeira final:</span>
              <span className="font-semibold text-emerald-400">{financialStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
