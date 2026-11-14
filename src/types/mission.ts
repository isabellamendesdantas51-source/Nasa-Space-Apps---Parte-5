export type MissionPhase = 1 | 2 | 3 | 4; // 4 = Missão Concluída (Tela Final)

export type SubsystemSlot = 'engine' | 'tank' | 'shield' | 'antenna' | 'power';

export type CommsStatus =
  | 'NOMINAL'
  | 'COMUNICAÇÃO INTERROMPIDA'
  | 'COMUNICAÇÃO RESTABELECIDA'
  | 'BLACKOUT ATMOSFÉRICO'
  | 'LINK DE RECUPERAÇÃO';

export type SolarStormChoice = 'NONE' | 'SHELTER' | 'MAX_POWER';

export type ReentryMoment = 'IDLE' | 'APPROACH' | 'PLASMA' | 'PARACHUTES' | 'SPLASHDOWN';

export interface SubsystemOption {
  id: string;
  slot: SubsystemSlot;
  name: string;
  code: string;
  description: string;
  defaultCost: number;
  stats: {
    fuelCapacityPct?: number; // For tank
    fuelEfficiencyMultiplier?: number; // For engine (lower = saves fuel)
    scienceBufferGb?: number; // For tank
    commsBonusMultiplier?: number; // For antenna
    commsRateGbPerSec?: number; // For antenna
    heatResistancePct?: number; // For shield
    radiationProtectionPct?: number; // For shield
    batteryCapacityPct?: number; // For power
    solarEfficiencyPct?: number; // For power
  };
}

export interface OperationCostConfig {
  tliPreparation: number;
  phase2EnergyCalibration: number;
  phase2SystemMaintenance: number;
  phase2DeepSpaceRelay: number;
  phase2RadiationShelter: number;
  phase2StormRecovery: number;
  phase3TcmBurn: number;
  phase3ReentryPrep: number;
  phase3OceanRecovery: number;
}

export interface BudgetAdminConfig {
  phase1Initial: number;
  phase2Initial: number;
  phase3Initial: number;
  componentCosts: Record<string, number>;
  operationCosts: OperationCostConfig;
}

export interface PhaseBudgetState {
  phase: 1 | 2 | 3;
  label: string;
  initialAllocated: number;
  reallocatedNet: number; // + received, - sent
  effectiveLimit: number; // initialAllocated + reallocatedNet
  spent: number;
  remaining: number;
}

export interface GlobalBudgetState {
  initialTotal: number;
  spentTotal: number;
  remaining: number;
}

export interface BudgetTransaction {
  id: string;
  operationKey?: string;
  phase: 1 | 2 | 3;
  type: 'component' | 'operation' | 'recovery' | 'transfer';
  title: string;
  description: string;
  amount: number; // positive = cost deducted; 0 = free action
  timestamp: string;
}

export interface BudgetTransferRecord {
  id: string;
  fromPhase: 1 | 2 | 3;
  toPhase: 1 | 2 | 3;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface TelemetryState {
  battery: number; // 0 - 100%
  maxBattery: number; // e.g. 100 or 120% equivalent scaled to 0-100% display, or kWh
  batteryKwh: number;
  maxBatteryKwh: number;
  fuel: number; // 0 - 100%
  initialFuel: number;
  commsStatus: CommsStatus;
  solarGeneration: number; // 0 - 100%
  scienceStored: number; // GB in buffer
  scienceCapacity: number; // max GB in buffer
  scienceTransmitted: number; // total GB transmitted
  scienceScore: number; // points
  systemIntegrity: number; // 0 - 100%
  crewProtection: number; // 0 - 100%
  missionStatusLabel: string;
  bufferSaturated: boolean;
}

export interface Phase2ProgressState {
  progress: number; // 0 to 100
  isPlaying: boolean;
  speedMultiplier: 1 | 2;
  enteredFarSide: boolean;
  exitedFarSide: boolean;
  transmissionProgress: number; // 0 - 100%
  transmissionDone: boolean;
  enteredEclipse: boolean;
  exitedEclipse: boolean;
  eclipseBatteryUsedPct: number;
  eclipseReportDismissed: boolean;
  solarStormTriggered: boolean;
  solarStormPopupOpen: boolean;
  solarStormChoice: SolarStormChoice;
  solarStormDamageAmount: number;
  stormRecoveryExecuted: boolean;
  energyOptimizationExecuted: boolean;
  maintenanceExecuted: boolean;
  scienceRelayBoostExecuted: boolean;
  phase2Completed: boolean;
}

export interface TcmAttemptRecord {
  attempt: number;
  angle: number;
  fuelUsed: number;
  cost: number;
  success: boolean;
  feedback: string;
}

export interface Phase3ProgressState {
  reentryAngle: number; // -2.0 to 14.0 (green 5.5 - 7.0)
  tcmAttempts: TcmAttemptRecord[];
  tcmCompleted: boolean;
  engineBurnSequenceActive: boolean;
  engineBurnSequenceCompleted: boolean;
  reentryPrepExecuted: boolean;
  oceanRecoveryExecuted: boolean;
  reentryMoment: ReentryMoment;
  reentryProgress: number; // 0 - 100 across the 4 moments
  reentryPlaying: boolean;
  capsuleTemperatureC: number;
  gForce: number;
  altitudeKm: number;
  velocityKmS: number;
}

export interface DecisionLogItem {
  id: string;
  phase: 1 | 2 | 3;
  title: string;
  outcome: string;
  impact: string;
  timestamp: string;
}

export interface MissionAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

export interface MissionState {
  phase: MissionPhase;
  showIntroBriefing: boolean;
  adminConfig: BudgetAdminConfig;
  selectedSubsystems: Record<SubsystemSlot, string>;
  phase1Validated: boolean;
  tliExecuted: boolean;
  globalBudget: GlobalBudgetState;
  phaseBudgets: Record<1 | 2 | 3, PhaseBudgetState>;
  transactions: BudgetTransaction[];
  budgetTransfers: BudgetTransferRecord[];
  chargedOperationKeys: string[];
  telemetry: TelemetryState;
  phase2: Phase2ProgressState;
  phase3: Phase3ProgressState;
  decisions: DecisionLogItem[];
  alerts: MissionAlert[];
  lastBlockedReason: string | null;
}
