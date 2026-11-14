import React, { useEffect } from 'react';
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  Flame,
  Gauge,
  ShieldCheck,
  Thermometer,
  Waves,
} from 'lucide-react';
import { getSubsystemOption, MissionAction } from '../state/missionReducer';
import { MissionState } from '../types/mission';
import { CINEMATIC_IMAGES, formatCredits } from '../data/missionConfig';
import { OrionViewport3D } from './OrionViewport3D';
import { PhaseFinancialReportCard } from './PhaseFinancialReportCard';
import { TcmGaugeMinigame } from './TcmGaugeMinigame';

interface Phase3EarthReturnProps {
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
  onOpenTransfer: () => void;
}

export const Phase3EarthReturn: React.FC<Phase3EarthReturnProps> = ({
  state,
  dispatch,
  onOpenTransfer,
}) => {
  const { phase3, telemetry, phaseBudgets, globalBudget, adminConfig } = state;
  const p3Budget = phaseBudgets[3];
  const ops = adminConfig.operationCosts;

  const engine = getSubsystemOption('engine', state.selectedSubsystems.engine);
  const eff = engine.stats.fuelEfficiencyMultiplier ?? 1.0;
  const tcmFuelCost = Math.round(14 * eff);

  // Engine Burn Cinematic Sequence timer (3.5s)
  useEffect(() => {
    if (!phase3.engineBurnSequenceActive) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'FINISH_ENGINE_BURN_SEQUENCE' });
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [phase3.engineBurnSequenceActive, dispatch]);

  // 4-Moment Atmospheric Reentry ticker
  useEffect(() => {
    if (!phase3.reentryPlaying) return;
    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      dispatch({ type: 'TICK_REENTRY', deltaSec: dt });
    }, 100);
    return () => window.clearInterval(interval);
  }, [phase3.reentryPlaying, dispatch]);

  const lastAttempt = phase3.tcmAttempts[phase3.tcmAttempts.length - 1];
  const reentryFinished = phase3.reentryMoment === 'SPLASHDOWN' && !phase3.reentryPlaying;

  const canAffordReentryPrep =
    p3Budget.remaining >= ops.phase3ReentryPrep &&
    globalBudget.remaining >= ops.phase3ReentryPrep;
  const canAffordRecovery =
    p3Budget.remaining >= ops.phase3OceanRecovery &&
    globalBudget.remaining >= ops.phase3OceanRecovery;

  const momentTitle: Record<typeof phase3.reentryMoment, string> = {
    IDLE: 'Órbita de Aproximação Terrestre',
    APPROACH: 'MOMENTO A — APROXIMAÇÃO À TERRA',
    PLASMA: 'MOMENTO B — ENTRADA ATMOSFÉRICA (PLASMA INTENSO)',
    PARACHUTES: 'MOMENTO C — SISTEMA DE PARAQUEDAS ACIONADO',
    SPLASHDOWN: 'MOMENTO D — POUSO NO OCEANO CONFIRMADO',
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={CINEMATIC_IMAGES.earthHorizon}
            alt="Horizonte terrestre durante aproximação de retorno"
            referrerPolicy="no-referrer"
            className="w-16 h-10 object-cover rounded border border-slate-700 shrink-0"
          />
          <div>
            <div className="font-display text-sm font-semibold text-cyan-200">
              FASE 3 · RETORNO À TERRA E REENTRADA ATMOSFÉRICA
            </div>
            <div className="text-xs text-slate-300">
              INICIANDO RETORNO À TERRA. PREPARE-SE PARA AS MANOBRAS DE CORREÇÃO DE TRAJETÓRIA.
            </div>
          </div>
        </div>
        <div className="font-mono-tabular text-xs text-slate-300">
          {momentTitle[phase3.reentryMoment]}
        </div>
      </div>

      {/* Engine Burn Sequence Active Banner */}
      {phase3.engineBurnSequenceActive && (
        <div className="bg-[#1b1106] border border-orange-500 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <div className="font-display text-xs font-bold text-orange-300">
                IGNIÇÃO DO MOTOR PRINCIPAL DA ORION · QUEIMA TCM EM EXECUÇÃO
              </div>
              <div className="text-xs text-slate-300">
                Propulsores ativos ajustando corredor de reentrada · Combustível restante: {telemetry.fuel}%
              </div>
            </div>
          </div>
          <span className="font-mono-tabular text-xs text-cyan-300">EMPÚXO ATIVO</span>
        </div>
      )}

      {/* Reentry Moment Highlight Banner */}
      {phase3.reentryMoment === 'PARACHUTES' && (
        <div className="bg-[#071923] border border-cyan-400 rounded-lg p-3.5 text-center">
          <div className="font-display text-sm font-bold text-cyan-200">
            SISTEMA DE PARAQUEDAS ACIONADO
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            Desaceleração aerodinâmica controlada · Paraquedas principais abertos sobre o Pacífico.
          </div>
        </div>
      )}

      {phase3.reentryMoment === 'SPLASHDOWN' && (
        <div className="bg-[#06201a] border border-emerald-400 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Waves className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-display text-sm font-bold text-emerald-300">
                POUSO NO OCEANO CONFIRMADO
              </div>
              <div className="text-xs text-slate-200">
                Cápsula Orion estabilizada na superfície oceânica com colar de flutuação acionado.
              </div>
            </div>
          </div>
          {reentryFinished && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'COMPLETE_MISSION_TO_SUMMARY' })}
              className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Tela Final e Relatórios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Split: 3D Earth Return / Reentry Viewport + Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* 3D Viewport */}
        <div className="xl:col-span-7 bg-[#060b16] border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-4 py-2.5 bg-[#090f1d] border-b border-slate-800 flex items-center justify-between">
            <span className="font-display text-xs font-semibold text-slate-200">
              Visualização 3D · {momentTitle[phase3.reentryMoment]}
            </span>
            <span className="font-mono-tabular text-xs text-cyan-300">
              Alt: {phase3.altitudeKm.toLocaleString('pt-BR')} km · Vel: {phase3.velocityKmS.toFixed(2)} km/s
            </span>
          </div>

          <div className="relative flex-1 min-h-[340px]">
            <OrionViewport3D
              phase={3}
              explodedAmount={0}
              selectedSubsystems={state.selectedSubsystems}
              engineBurnActive={phase3.engineBurnSequenceActive}
              reentryMoment={phase3.reentryMoment}
              reentryProgress={phase3.reentryProgress}
              reentryAngle={phase3.reentryAngle}
            />
          </div>

          {/* Live Reentry Telemetry Strip */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-[#090f1d] border-t border-slate-800 text-xs">
            <div className="bg-[#070d19] border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-orange-400" />
                Temp. Escudo
              </div>
              <div
                className={`font-mono-tabular font-semibold ${
                  phase3.capsuleTemperatureC > 1200 ? 'text-orange-400' : 'text-slate-100'
                }`}
              >
                {phase3.capsuleTemperatureC} °C
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" />
                Desaceleração
              </div>
              <div className="font-mono-tabular font-semibold text-slate-100">
                {phase3.gForce.toFixed(1)} G
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Altitude</div>
              <div className="font-mono-tabular font-semibold text-cyan-300">
                {phase3.altitudeKm.toLocaleString('pt-BR')} km
              </div>
            </div>
            <div className="bg-[#070d19] border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Progresso Reentrada</div>
              <div className="font-mono-tabular font-semibold text-emerald-400">
                {phase3.reentryProgress.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls: TCM Minigame + Reentry Procedures */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <TcmGaugeMinigame
            angle={phase3.reentryAngle}
            fuelAvailable={telemetry.fuel}
            fuelCost={tcmFuelCost}
            budgetRemaining={p3Budget.remaining}
            globalRemaining={globalBudget.remaining}
            burnCost={ops.phase3TcmBurn}
            tcmCompleted={phase3.tcmCompleted}
            attemptsCount={phase3.tcmAttempts.length}
            lastFeedback={lastAttempt?.feedback}
            onChangeAngle={(next) => dispatch({ type: 'SET_REENTRY_ANGLE', angle: next })}
            onExecuteBurn={() => dispatch({ type: 'EXECUTE_TCM_BURN' })}
            onOpenTransfer={onOpenTransfer}
          />

          {/* Reentry & Recovery Operations */}
          <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Procedimentos de Retorno e Recuperação
              </h3>
              <p className="text-[11px] text-slate-400">
                Liberado após a conclusão da manobra TCM e sequência dos motores.
              </p>
            </div>

            {/* Separation & Heat Shield Prep */}
            <div className="bg-[#070d19] border border-slate-800 rounded p-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Separação do Módulo e Escudo Térmico
                </div>
                <div className="text-[11px] text-slate-400">
                  Prepara o escudo Avcoat para a entrada atmosférica.
                </div>
              </div>
              {phase3.reentryPrepExecuted ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
                </span>
              ) : canAffordReentryPrep ? (
                <button
                  type="button"
                  disabled={!phase3.engineBurnSequenceCompleted}
                  onClick={() =>
                    dispatch({ type: 'EXECUTE_PHASE3_OPERATION', op: 'REENTRY_PREP' })
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 border border-slate-700 rounded cursor-pointer shrink-0"
                >
                  {formatCredits(ops.phase3ReentryPrep)}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!phase3.engineBurnSequenceCompleted}
                  onClick={() =>
                    dispatch({ type: 'EXECUTE_PHASE3_OPERATION', op: 'FREE_EMERGENCY_SEPARATION' })
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/60 disabled:opacity-40 text-amber-300 border border-amber-700/60 rounded cursor-pointer shrink-0"
                >
                  Manual (CR$ 0)
                </button>
              )}
            </div>

            {/* Naval Ocean Recovery */}
            <div className="bg-[#070d19] border border-slate-800 rounded p-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-sky-400" />
                  Equipe Naval de Recuperação no Pacífico
                </div>
                <div className="text-[11px] text-slate-400">
                  Mobiliza navio de resgate e equipe médica no ponto de pouso.
                </div>
              </div>
              {phase3.oceanRecoveryExecuted ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mobilizada
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!phase3.engineBurnSequenceCompleted || !canAffordRecovery}
                  onClick={() =>
                    dispatch({ type: 'EXECUTE_PHASE3_OPERATION', op: 'OCEAN_RECOVERY' })
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 border border-slate-700 rounded cursor-pointer shrink-0"
                >
                  {formatCredits(ops.phase3OceanRecovery)}
                </button>
              )}
            </div>

            {/* Start 4-Moment Reentry */}
            <button
              type="button"
              disabled={
                !phase3.engineBurnSequenceCompleted ||
                phase3.reentryPlaying ||
                reentryFinished
              }
              onClick={() => dispatch({ type: 'START_REENTRY_SEQUENCE' })}
              className="w-full py-2.5 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-md cursor-pointer transition-colors"
            >
              {phase3.reentryPlaying
                ? 'Reentrada Atmosférica em Curso...'
                : reentryFinished
                  ? 'Reentrada e Pouso Concluídos'
                  : 'Iniciar Reentrada Atmosférica (4 Momentos)'}
            </button>
          </div>
        </div>
      </div>

      {/* Phase 3 Financial Report */}
      <PhaseFinancialReportCard phase={3} state={state} />
    </div>
  );
};
