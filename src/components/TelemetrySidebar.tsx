import React from 'react';
import {
  BatteryCharging,
  Database,
  Flame,
  Radio,
  Shield,
  Sun,
  Wrench,
  Activity,
} from 'lucide-react';
import { MissionState } from '../types/mission';

interface TelemetrySidebarProps {
  state: MissionState;
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({ state }) => {
  const { telemetry } = state;

  const commsColor =
    telemetry.commsStatus === 'COMUNICAÇÃO INTERROMPIDA' ||
    telemetry.commsStatus === 'BLACKOUT ATMOSFÉRICO'
      ? 'text-red-400'
      : telemetry.commsStatus === 'COMUNICAÇÃO RESTABELECIDA' ||
          telemetry.commsStatus === 'LINK DE RECUPERAÇÃO'
        ? 'text-emerald-400'
        : 'text-cyan-300';

  const bufferPct =
    telemetry.scienceCapacity > 0
      ? Math.min(100, (telemetry.scienceStored / telemetry.scienceCapacity) * 100)
      : 0;

  return (
    <aside className="bg-[#090f1d] border border-slate-800/90 rounded-lg p-4 flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display text-sm font-semibold tracking-wide text-slate-100">
            Telemetria Operacional
          </h2>
        </div>
        <span className="font-mono-tabular text-[11px] text-slate-400">
          ORION MPCV
        </span>
      </div>

      {/* Mission Status */}
      <div className="bg-[#0d1629] border border-slate-800 rounded-md p-2.5">
        <div className="text-[11px] text-slate-400 mb-0.5">Estado da Missão</div>
        <div className="font-mono-tabular text-xs font-semibold text-cyan-300 leading-snug">
          {telemetry.missionStatusLabel}
        </div>
      </div>

      {/* Primary Bars */}
      <div className="grid grid-cols-1 gap-3">
        {/* Battery */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
              Energia da Bateria
            </span>
            <span className="font-mono-tabular font-semibold text-slate-100">
              {telemetry.battery.toFixed(0)}% · {telemetry.batteryKwh}/{telemetry.maxBatteryKwh} kWh
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.battery < 25
                  ? 'bg-red-500'
                  : telemetry.battery < 45
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.battery)}%` }}
            />
          </div>
        </div>

        {/* Fuel */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Combustível Disponível
            </span>
            <span className="font-mono-tabular font-semibold text-slate-100">
              {telemetry.fuel.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.fuel < 20
                  ? 'bg-red-500'
                  : telemetry.fuel < 40
                    ? 'bg-orange-400'
                    : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.fuel)}%` }}
            />
          </div>
        </div>

        {/* Solar Generation */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              Geração Solar
            </span>
            <span
              className={`font-mono-tabular font-semibold ${
                telemetry.solarGeneration === 0 ? 'text-amber-400' : 'text-slate-100'
              }`}
            >
              {telemetry.solarGeneration}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-300 transition-all duration-300"
              style={{ width: `${Math.min(100, telemetry.solarGeneration)}%` }}
            />
          </div>
        </div>

        {/* System Integrity */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Wrench className="w-3.5 h-3.5 text-slate-300" />
              Integridade dos Sistemas
            </span>
            <span
              className={`font-mono-tabular font-semibold ${
                telemetry.systemIntegrity < 65
                  ? 'text-red-400'
                  : telemetry.systemIntegrity < 85
                    ? 'text-amber-300'
                    : 'text-emerald-400'
              }`}
            >
              {telemetry.systemIntegrity}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.systemIntegrity < 65
                  ? 'bg-red-500'
                  : telemetry.systemIntegrity < 85
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.systemIntegrity)}%` }}
            />
          </div>
        </div>

        {/* Crew Protection */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Proteção da Tripulação
            </span>
            <span
              className={`font-mono-tabular font-semibold ${
                telemetry.crewProtection < 60
                  ? 'text-red-400'
                  : telemetry.crewProtection < 80
                    ? 'text-amber-300'
                    : 'text-cyan-300'
              }`}
            >
              {telemetry.crewProtection}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.crewProtection < 60
                  ? 'bg-red-500'
                  : telemetry.crewProtection < 80
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.crewProtection)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Comms & Science Buffer */}
      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Comunicação
          </span>
          <span className={`font-mono-tabular font-semibold text-[11px] ${commsColor}`}>
            {telemetry.commsStatus}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Buffer Científico
            </span>
            <span className="font-mono-tabular text-slate-200">
              {telemetry.scienceStored.toFixed(1)} / {telemetry.scienceCapacity} GB
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                telemetry.bufferSaturated ? 'bg-amber-400' : 'bg-sky-400'
              }`}
              style={{ width: `${bufferPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#0d1629] border border-slate-800 rounded p-2">
            <div className="text-[11px] text-slate-400">Transmitidos</div>
            <div className="font-mono-tabular text-sm font-semibold text-slate-100">
              {telemetry.scienceTransmitted.toFixed(1)} GB
            </div>
          </div>
          <div className="bg-[#0d1629] border border-slate-800 rounded p-2">
            <div className="text-[11px] text-slate-400">Pontos Ciência</div>
            <div className="font-mono-tabular text-sm font-semibold text-cyan-300">
              {telemetry.scienceScore} pts
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
