import React from 'react';
import { AlertCircle, CheckCircle2, Flame, Minus, Plus } from 'lucide-react';
import { formatCredits } from '../data/missionConfig';

interface TcmGaugeMinigameProps {
  angle: number; // -2.0 to 14.0
  fuelAvailable: number;
  fuelCost: number;
  budgetRemaining: number;
  globalRemaining: number;
  burnCost: number;
  tcmCompleted: boolean;
  attemptsCount: number;
  lastFeedback?: string;
  onChangeAngle: (next: number) => void;
  onExecuteBurn: () => void;
  onOpenTransfer: () => void;
}

const MIN_ANGLE = -2.0;
const MAX_ANGLE = 14.0;
const SAFE_MIN = 5.5;
const SAFE_MAX = 7.0;

function angleToSvgDeg(angle: number): number {
  const ratio = (angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
  return -180 + ratio * 180; // -180 (left) to 0 (right)
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const TcmGaugeMinigame: React.FC<TcmGaugeMinigameProps> = ({
  angle,
  fuelAvailable,
  fuelCost,
  budgetRemaining,
  globalRemaining,
  burnCost,
  tcmCompleted,
  attemptsCount,
  lastFeedback,
  onChangeAngle,
  onExecuteBurn,
  onOpenTransfer,
}) => {
  const cx = 160;
  const cy = 148;
  const radius = 112;

  const greenStart = angleToSvgDeg(SAFE_MIN);
  const greenEnd = angleToSvgDeg(SAFE_MAX);
  const needleDeg = angleToSvgDeg(angle);
  const needleTip = polarToCartesian(cx, cy, radius - 10, needleDeg);

  const inSafeZone = angle >= SAFE_MIN && angle <= SAFE_MAX;
  const hasFuel = fuelAvailable >= fuelCost;
  const hasPhaseBudget = budgetRemaining >= burnCost;
  const hasGlobalBudget = globalRemaining >= burnCost;
  const canBurn = !tcmCompleted && hasFuel && hasPhaseBudget && hasGlobalBudget;

  return (
    <div className="bg-[#090f1d] border border-slate-800 rounded-lg p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Correção de Trajetória (TCM) · Corredor de Reentrada
          </h3>
          <p className="text-[11px] text-slate-400">
            Alinhe o ponteiro na zona verde (5,5° – 7,0°). Parâmetros educativos simplificados.
          </p>
        </div>
        <span
          className={`font-mono-tabular text-xs font-semibold ${
            tcmCompleted
              ? 'text-emerald-400'
              : inSafeZone
                ? 'text-emerald-300'
                : 'text-red-400'
          }`}
        >
          {tcmCompleted ? 'TRAJETÓRIA ALINHADA' : inSafeZone ? 'Na Zona Segura' : 'Fora do Corredor'}
        </span>
      </div>

      {/* Semicircular Instrument Gauge */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 320 172"
          className="w-full max-w-[330px] overflow-visible"
          role="img"
          aria-label="Medidor semicircular de ângulo de reentrada"
        >
          {/* Red Zone Left (-2.0 to 5.5) */}
          <path
            d={describeArc(cx, cy, radius, -180, greenStart)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="butt"
            opacity="0.78"
          />
          {/* Green Safe Zone (5.5 to 7.0) */}
          <path
            d={describeArc(cx, cy, radius, greenStart, greenEnd)}
            fill="none"
            stroke="#10b981"
            strokeWidth="18"
            strokeLinecap="butt"
          />
          {/* Red Zone Right (7.0 to 14.0) */}
          <path
            d={describeArc(cx, cy, radius, greenEnd, 0)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="butt"
            opacity="0.78"
          />

          {/* Inner Scale Ring */}
          <path
            d={describeArc(cx, cy, radius - 22, -180, 0)}
            fill="none"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Labels */}
          <text x="26" y="156" fill="#94a3b8" fontSize="10" fontFamily="IBM Plex Mono">
            -2,0°
          </text>
          <text x="155" y="24" fill="#34d399" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle">
            5,5° – 7,0°
          </text>
          <text x="272" y="156" fill="#94a3b8" fontSize="10" fontFamily="IBM Plex Mono">
            14,0°
          </text>

          {/* Movable Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={inSafeZone ? '#34d399' : '#38bdf8'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
        </svg>

        {/* Numeric Angle Readout */}
        <div className="text-center -mt-2">
          <div className="text-[11px] text-slate-400">Ângulo de Reentrada Selecionado</div>
          <div
            className={`font-mono-tabular text-2xl font-bold ${
              inSafeZone ? 'text-emerald-400' : 'text-cyan-300'
            }`}
          >
            {angle.toFixed(1).replace('.', ',')}°
          </div>
        </div>
      </div>

      {/* Slider & Stepper Buttons */}
      <div className="space-y-2.5">
        <input
          type="range"
          min={MIN_ANGLE}
          max={MAX_ANGLE}
          step={0.1}
          disabled={tcmCompleted}
          value={angle}
          onChange={(e) => onChangeAngle(Number(e.target.value))}
          className="aero-slider w-full"
        />

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            disabled={tcmCompleted}
            onClick={() => onChangeAngle(angle - 0.5)}
            className="py-1.5 text-xs font-mono-tabular bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Minus className="w-3 h-3" /> 0,5°
          </button>
          <button
            type="button"
            disabled={tcmCompleted}
            onClick={() => onChangeAngle(angle - 0.1)}
            className="py-1.5 text-xs font-mono-tabular bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Minus className="w-3 h-3" /> 0,1°
          </button>
          <button
            type="button"
            disabled={tcmCompleted}
            onClick={() => onChangeAngle(angle + 0.1)}
            className="py-1.5 text-xs font-mono-tabular bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> 0,1°
          </button>
          <button
            type="button"
            disabled={tcmCompleted}
            onClick={() => onChangeAngle(angle + 0.5)}
            className="py-1.5 text-xs font-mono-tabular bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> 0,5°
          </button>
        </div>
      </div>

      {/* Resource & Cost Indicators */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
          <div className="text-[11px] text-slate-400">Consumo por Queima</div>
          <div
            className={`font-mono-tabular font-semibold ${
              hasFuel ? 'text-orange-300' : 'text-red-400'
            }`}
          >
            -{fuelCost}% (Disp: {fuelAvailable}%)
          </div>
        </div>
        <div className="bg-[#070d19] border border-slate-800 rounded p-2.5">
          <div className="text-[11px] text-slate-400">Custo da Manobra</div>
          <div
            className={`font-mono-tabular font-semibold ${
              hasPhaseBudget && hasGlobalBudget ? 'text-cyan-300' : 'text-red-400'
            }`}
          >
            {formatCredits(burnCost)}
          </div>
        </div>
      </div>

      {/* Resource Blocking Alert */}
      {!tcmCompleted && (!hasFuel || !hasPhaseBudget || !hasGlobalBudget) && (
        <div className="bg-red-950/40 border border-red-700/60 rounded p-2.5 text-xs text-red-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Execução da Queima Impedida:</span>
          </div>
          <p className="text-[11px]">
            {!hasFuel
              ? `Combustível insuficiente (${fuelAvailable}% disponível, requer ${fuelCost}%).`
              : !hasPhaseBudget
                ? `Saldo da Fase 3 insuficiente (${formatCredits(budgetRemaining)} disponível, requer ${formatCredits(burnCost)}).`
                : `Orçamento Global esgotado (${formatCredits(globalRemaining)}).`}
          </p>
          {hasFuel && !hasPhaseBudget && globalRemaining >= burnCost && (
            <button
              type="button"
              onClick={onOpenTransfer}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-200 rounded border border-slate-600 cursor-pointer"
            >
              Realocar Orçamento para Fase 3
            </button>
          )}
        </div>
      )}

      {/* Attempt Feedback */}
      {lastFeedback && (
        <div
          className={`rounded p-2.5 text-xs border flex items-center gap-2 ${
            tcmCompleted
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
          }`}
        >
          {tcmCompleted ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{lastFeedback}</span>
        </div>
      )}

      {/* Execute Burn CTA */}
      <button
        type="button"
        disabled={!canBurn}
        onClick={onExecuteBurn}
        className={`w-full py-2.5 px-4 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer ${
          tcmCompleted
            ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-600/60 cursor-default'
            : canBurn
              ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
        }`}
      >
        <Flame className="w-4 h-4" />
        {tcmCompleted
          ? `TRAJETÓRIA ALINHADA (${attemptsCount} tentativa${attemptsCount > 1 ? 's' : ''})`
          : 'Executar Queima de Correção (TCM)'}
      </button>
    </div>
  );
};
