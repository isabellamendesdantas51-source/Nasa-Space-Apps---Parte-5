import React, { useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Database,
  FastForward,
  Pause,
  Play,
  Radio,
  Shield,
  Sparkles,
  Sun,
  Wrench,
  Zap,
} from 'lucide-react';
import { MissionAction } from '../state/missionReducer';
import { MissionState } from '../types/mission';
import { CINEMATIC_IMAGES, formatCredits } from '../data/missionConfig';
import { OrionViewport3D } from './OrionViewport3D';
import { PhaseFinancialReportCard } from './PhaseFinancialReportCard';

interface Phase2LunarFlightProps {
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
  onOpenTransfer: () => void;
}

export const Phase2LunarFlight: React.FC<Phase2LunarFlightProps> = ({
  state,
  dispatch,
  onOpenTransfer,
}) => {
  const { phase2, telemetry, phaseBudgets, globalBudget, adminConfig } = state;
  const p2Budget = phaseBudgets[2];
  const ops = adminConfig.operationCosts;

  // Automatic progression ticker
  useEffect(() => {
    if (!phase2.isPlaying || phase2.solarStormPopupOpen || phase2.phase2Completed) return;
    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      dispatch({ type: 'TICK_PHASE2', deltaSec: dt });
    }, 100);
    return () => window.clearInterval(interval);
  }, [phase2.isPlaying, phase2.solarStormPopupOpen, phase2.phase2Completed, dispatch]);

  const inFarSide = phase2.progress >= 22 && phase2.progress < 52;
  const inEclipse = phase2.progress >= 38 && phase2.progress < 64;

  const canAffordShelter =
    p2Budget.remaining >= ops.phase2RadiationShelter &&
    globalBudget.remaining >= ops.phase2RadiationShelter &&
    telemetry.battery >= 22;

  const shelterMissingReason =
    telemetry.battery < 22
      ? `Bateria insuficiente (${telemetry.battery.toFixed(0)}%, exige 22%)`
      : p2Budget.remaining < ops.phase2RadiationShelter
        ? `Orçamento da Fase 2 insuficiente (${formatCredits(p2Budget.remaining)} / ${formatCredits(ops.phase2RadiationShelter)})`
        : globalBudget.remaining < ops.phase2RadiationShelter
          ? 'Orçamento Global insuficiente'
          : null;

  return (
    <div className="space-y-4">
      {/* Phase 2 Header Banner */}
      <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={CINEMATIC_IMAGES.lunarFlyby}
            alt="Nave Orion em órbita lunar"
            referrerPolicy="no-referrer"
            className="w-16 h-10 object-cover rounded border border-slate-700 shrink-0"
          />
          <div>
            <div className="font-display text-sm font-semibold text-cyan-200">
              FASE 2 · VIAGEM LUNAR E GERENCIAMENTO DE CRISES
            </div>
            <div className="text-xs text-slate-400">
              CONFIGURAÇÃO APROVADA. SISTEMAS DA ORION VERIFICADOS. INICIANDO VIAGEM LUNAR.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={phase2.solarStormPopupOpen || phase2.phase2Completed}
            onClick={() => dispatch({ type: 'SET_PHASE2_PLAYING', playing: !phase2.isPlaying })}
            className="px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded flex items-center gap-1.5 cursor-pointer"
          >
            {phase2.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {phase2.isPlaying ? 'Pausar Voo' : phase2.phase2Completed ? 'Concluída' : 'Continuar Voo'}
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'SET_PHASE2_SPEED',
                speed: phase2.speedMultiplier === 1 ? 2 : 1,
              })
            }
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            {phase2.speedMultiplier}x
          </button>
        </div>
      </div>

      {/* Dynamic Event Alerts Strip */}
      {inFarSide && (
        <div className="bg-[#1b1207] border border-amber-500/70 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-display text-xs font-bold text-amber-300">
                SINAL PERDIDO — GRAVANDO NO BUFFER
              </div>
              <div className="text-xs text-slate-300">
                Orion no lado oculto da Lua. Comunicação interrompida; dados científicos armazenados localmente ({telemetry.scienceStored.toFixed(1)} / {telemetry.scienceCapacity} GB).
              </div>
            </div>
          </div>
          <span className="font-mono-tabular text-xs font-semibold text-red-400 shrink-0">
            COMUNICAÇÃO INTERROMPIDA
          </span>
        </div>
      )}

      {phase2.exitedFarSide && !phase2.transmissionDone && (
        <div className="bg-[#071923] border border-cyan-500/70 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-semibold text-cyan-300">
              COMUNICAÇÃO RESTABELECIDA · TRANSMITINDO DADOS DO BUFFER
            </span>
            <span className="font-mono-tabular text-cyan-200">{phase2.transmissionProgress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${phase2.transmissionProgress}%` }}
            />
          </div>
        </div>
      )}

      {inEclipse && (
        <div className="bg-[#161428] border border-amber-400/60 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200 font-medium">
              ECLIPSE SOLAR EM CURSO · Geração solar em 0%. Bateria alimentando sistemas vitais da Orion.
            </span>
          </div>
          <span className="font-mono-tabular text-amber-300 shrink-0">
            Consumo: -{phase2.eclipseBatteryUsedPct.toFixed(1)}%
          </span>
        </div>
      )}

      {phase2.exitedEclipse && !phase2.eclipseReportDismissed && (
        <div className="bg-[#091527] border border-sky-500/50 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-display font-semibold text-sky-300">
              Relatório de Consumo Energético — Eclipse Solar Superado
            </div>
            <p className="text-slate-300 mt-0.5">
              Geração solar restabelecida. Consumo líquido durante a sombra lunar:{' '}
              <span className="font-mono-tabular font-semibold text-amber-300">
                -{phase2.eclipseBatteryUsedPct.toFixed(1)}%
              </span>{' '}
              da bateria · Carga atual:{' '}
              <span className="font-mono-tabular font-semibold text-cyan-300">
                {telemetry.battery.toFixed(0)}% ({telemetry.batteryKwh} kWh)
              </span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'DISMISS_ECLIPSE_REPORT' })}
            className="px-3 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
          >
            Confirmar Leitura
          </button>
        </div>
      )}

      {/* Main Split: 3D Lunar Trajectory + Phase 2 Tactical Operations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-7 bg-[#060b16] border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-[430px]">
          <div className="px-4 py-2.5 bg-[#090f1d] border-b border-slate-800 flex items-center justify-between">
            <span className="font-display text-xs font-semibold text-slate-200">
              Visualização Orbital 3D · Sobrevoo Lunar
            </span>
            <span className="font-mono-tabular text-xs text-cyan-300">
              Progresso do Trânsito: {phase2.progress.toFixed(0)}%
            </span>
          </div>

          <div className="relative flex-1 min-h-[340px]">
            <OrionViewport3D
              phase={2}
              explodedAmount={0}
              selectedSubsystems={state.selectedSubsystems}
              phase2Progress={phase2.progress}
              inEclipse={inEclipse}
              inFarSide={inFarSide}
              shelterActive={phase2.solarStormChoice === 'SHELTER'}
            />
          </div>

          {/* Lunar Mission Timeline Bar */}
          <div className="p-3.5 bg-[#090f1d] border-t border-slate-800 space-y-2">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${phase2.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div className={phase2.enteredFarSide ? 'text-cyan-300' : 'text-slate-500'}>
                1. Lado Oculto (22%)
              </div>
              <div className={phase2.enteredEclipse ? 'text-amber-300' : 'text-slate-500'}>
                2. Eclipse Solar (38%)
              </div>
              <div className={phase2.exitedFarSide ? 'text-emerald-300' : 'text-slate-500'}>
                3. Transmissão (52%)
              </div>
              <div className={phase2.solarStormChoice !== 'NONE' ? 'text-orange-300' : 'text-slate-500'}>
                4. Tempestade Solar (74%)
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2 Operational Actions & Consequence Panel */}
        <div className="xl:col-span-5 bg-[#090f1d] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Operações Táticas da Fase 2
              </h3>
              <p className="text-[11px] text-slate-400">
                Ações executadas consomem simultaneamente o orçamento da Fase 2 e o Orçamento Global.
              </p>
            </div>

            {/* Energy Optimization */}
            <div className="bg-[#070d19] border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                  Otimização Energética (+15% Bateria)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Recalibra painéis solares e células Li-Ion para reservas de eclipse.
                </div>
              </div>
              <button
                type="button"
                disabled={phase2.energyOptimizationExecuted}
                onClick={() => dispatch({ type: 'EXECUTE_PHASE2_OPERATION', op: 'ENERGY_OPT' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded shrink-0 cursor-pointer ${
                  phase2.energyOptimizationExecuted
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50 cursor-default'
                    : p2Budget.remaining >= ops.phase2EnergyCalibration &&
                        globalBudget.remaining >= ops.phase2EnergyCalibration
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                      : 'bg-slate-900 text-red-400 border border-red-900/50'
                }`}
              >
                {phase2.energyOptimizationExecuted
                  ? 'Executada'
                  : formatCredits(ops.phase2EnergyCalibration)}
              </button>
            </div>

            {/* Preventive Maintenance */}
            <div className="bg-[#070d19] border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  Manutenção Preventiva (+10% Integridade)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Diagnóstico e balanceamento térmico dos sistemas de bordo.
                </div>
              </div>
              <button
                type="button"
                disabled={phase2.maintenanceExecuted}
                onClick={() => dispatch({ type: 'EXECUTE_PHASE2_OPERATION', op: 'MAINTENANCE' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded shrink-0 cursor-pointer ${
                  phase2.maintenanceExecuted
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50 cursor-default'
                    : p2Budget.remaining >= ops.phase2SystemMaintenance &&
                        globalBudget.remaining >= ops.phase2SystemMaintenance
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                      : 'bg-slate-900 text-red-400 border border-red-900/50'
                }`}
              >
                {phase2.maintenanceExecuted
                  ? 'Executada'
                  : formatCredits(ops.phase2SystemMaintenance)}
              </button>
            </div>

            {/* Science DSN Relay */}
            <div className="bg-[#070d19] border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  Telemetria Científica DSN (+280 pts)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pacote extra de espectrometria lunar de alta resolução.
                </div>
              </div>
              <button
                type="button"
                disabled={phase2.scienceRelayBoostExecuted}
                onClick={() => dispatch({ type: 'EXECUTE_PHASE2_OPERATION', op: 'SCIENCE_RELAY' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded shrink-0 cursor-pointer ${
                  phase2.scienceRelayBoostExecuted
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50 cursor-default'
                    : p2Budget.remaining >= ops.phase2DeepSpaceRelay &&
                        globalBudget.remaining >= ops.phase2DeepSpaceRelay
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                      : 'bg-slate-900 text-red-400 border border-red-900/50'
                }`}
              >
                {phase2.scienceRelayBoostExecuted
                  ? 'Enviado'
                  : formatCredits(ops.phase2DeepSpaceRelay)}
              </button>
            </div>

            {/* Solar Storm Consequence & Optional Recovery */}
            {phase2.solarStormChoice !== 'NONE' && (
              <div
                className={`rounded-lg p-3.5 border ${
                  phase2.solarStormChoice === 'SHELTER'
                    ? 'bg-[#081b29] border-cyan-500/50'
                    : 'bg-[#1c1012] border-orange-500/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    {phase2.solarStormChoice === 'SHELTER' ? (
                      <Shield className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                    )}
                    Relatório da Tempestade Solar
                  </span>
                </div>

                {phase2.solarStormChoice === 'SHELTER' ? (
                  <p className="text-xs text-slate-300">
                    Opção A executada: Abrigo de Radiação ativado. Proteção da tripulação elevada para{' '}
                    <span className="font-mono-tabular text-cyan-300 font-semibold">
                      {telemetry.crewProtection}%
                    </span>
                    . Sistemas mantidos intactos.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-300">
                      Opção B executada: Potência máxima mantida. Tempestade causou{' '}
                      <span className="font-mono-tabular text-red-400 font-semibold">
                        -{phase2.solarStormDamageAmount}%
                      </span>{' '}
                      de integridade nos sistemas.
                    </p>
                    {!phase2.stormRecoveryExecuted ? (
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: 'EXECUTE_PHASE2_OPERATION', op: 'STORM_RECOVERY' })
                        }
                        className="w-full px-3 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-slate-950 rounded cursor-pointer flex items-center justify-between"
                      >
                        <span>Executar Recuperação de Sistemas</span>
                        <span className="font-mono-tabular">
                          {formatCredits(ops.phase2StormRecovery)}
                        </span>
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sistemas parcialmente restaurados via redundância.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Proceed to Phase 3 */}
          <div className="border-t border-slate-800 pt-3">
            {phase2.phase2Completed ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'ADVANCE_TO_PHASE3' })}
                className="w-full px-4 py-2.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar Retorno à Terra (Fase 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-slate-400 text-center py-1">
                Conclua o trânsito lunar e os eventos dinâmicos (100%) para iniciar o retorno à Terra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 2 Financial Report */}
      {phase2.phase2Completed && <PhaseFinancialReportCard phase={2} state={state} />}

      {/* Dramatic Solar Storm Modal */}
      {phase2.solarStormPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-[#0c111f] border-2 border-orange-500 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-orange-950/60 border-b border-orange-500/40 px-5 py-4 flex items-center gap-3">
              <AlertOctagon className="w-7 h-7 text-orange-400 shrink-0" />
              <div>
                <h2 className="font-display text-base font-bold text-orange-200">
                  TEMPESTADE SOLAR DETECTADA — PROTEÇÃO DA TRIPULAÇÃO NECESSÁRIA
                </h2>
                <p className="text-xs text-orange-100/80 mt-0.5">
                  Ejeção de massa coronal detectada em rota de interceptação. A progressão da missão foi pausada.
                </p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OPTION A: RADIATION SHELTER */}
              <div className="bg-[#081726] border border-cyan-500/40 rounded-lg p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-display text-sm font-bold mb-1.5">
                    <Shield className="w-4 h-4" />
                    OPÇÃO A — ATIVAR ABRIGO DE RADIAÇÃO
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>Consome <span className="font-mono-tabular text-amber-300">18%</span> da energia da bateria.</li>
                    <li>
                      Custo na Fase 2:{' '}
                      <span className="font-mono-tabular text-cyan-300">
                        {formatCredits(ops.phase2RadiationShelter)}
                      </span>
                    </li>
                    <li>Eleva a proteção simulada da tripulação (+16%).</li>
                    <li>Preserva integridade total dos sistemas de bordo.</li>
                  </ul>
                  {shelterMissingReason && (
                    <div className="mt-3 text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 rounded p-2">
                      Bloqueado: {shelterMissingReason}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={!canAffordShelter}
                    onClick={() => {
                      dispatch({ type: 'CHOOSE_SOLAR_STORM', choice: 'SHELTER' });
                      dispatch({ type: 'SET_PHASE2_PLAYING', playing: true });
                    }}
                    className="w-full py-2.5 px-3 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ativar Abrigo de Radiação
                  </button>
                  {!canAffordShelter &&
                    p2Budget.remaining < ops.phase2RadiationShelter &&
                    globalBudget.remaining >= ops.phase2RadiationShelter && (
                      <button
                        type="button"
                        onClick={onOpenTransfer}
                        className="w-full py-1.5 px-3 text-[11px] font-medium text-cyan-200 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                      >
                        Realocar Orçamento para Fase 2
                      </button>
                    )}
                </div>
              </div>

              {/* OPTION B: MAX POWER */}
              <div className="bg-[#180e14] border border-orange-500/40 rounded-lg p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-orange-300 font-display text-sm font-bold mb-1.5">
                    <Zap className="w-4 h-4" />
                    OPÇÃO B — MANTER POTÊNCIA MÁXIMA
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>
                      Custo imediato: <span className="font-mono-tabular text-emerald-400">CR$ 0</span>
                    </li>
                    <li>Preserva integralmente a carga atual da bateria.</li>
                    <li>Aumenta exposição à radiação (-22% proteção tripulação).</li>
                    <li>Pode causar danos aos sistemas, exigindo recuperação paga pós-evento.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'CHOOSE_SOLAR_STORM', choice: 'MAX_POWER' });
                    dispatch({ type: 'SET_PHASE2_PLAYING', playing: true });
                  }}
                  className="w-full py-2.5 px-3 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-md cursor-pointer"
                >
                  Manter Potência Máxima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
