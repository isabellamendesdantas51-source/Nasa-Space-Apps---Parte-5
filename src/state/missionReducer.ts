import {
  BudgetAdminConfig,
  BudgetTransaction,
  BudgetTransferRecord,
  MissionAlert,
  MissionState,
  PhaseBudgetState,
  SubsystemOption,
  SubsystemSlot,
} from '../types/mission';
import {
  createDefaultAdminConfig,
  DEFAULT_SELECTED_SUBSYSTEMS,
  formatCredits,
  SUBSYSTEM_CATALOG,
} from '../data/missionConfig';

function nowTimestamp(): string {
  const d = new Date();
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getSubsystemOption(slot: SubsystemSlot, id: string): SubsystemOption {
  const found = SUBSYSTEM_CATALOG[slot].find((o) => o.id === id);
  return found ?? SUBSYSTEM_CATALOG[slot][0];
}

export function getComponentCost(config: BudgetAdminConfig, optionId: string): number {
  if (typeof config.componentCosts[optionId] === 'number') {
    return Math.max(0, config.componentCosts[optionId]);
  }
  for (const slot of Object.keys(SUBSYSTEM_CATALOG) as SubsystemSlot[]) {
    const found = SUBSYSTEM_CATALOG[slot].find((o) => o.id === optionId);
    if (found) return found.defaultCost;
  }
  return 0;
}

export function computeInitialPhase1Transactions(
  config: BudgetAdminConfig,
  selected: Record<SubsystemSlot, string>
): { transactions: BudgetTransaction[]; totalSpent: number } {
  const slots: SubsystemSlot[] = ['engine', 'tank', 'shield', 'antenna', 'power'];
  const transactions: BudgetTransaction[] = [];
  let totalSpent = 0;

  slots.forEach((slot) => {
    const opt = getSubsystemOption(slot, selected[slot]);
    const cost = getComponentCost(config, opt.id);
    totalSpent += cost;
    transactions.push({
      id: uid('tx_init'),
      operationKey: `component_${slot}`,
      phase: 1,
      type: 'component',
      title: opt.name,
      description: `Subsistema ${opt.code} instalado na configuração inicial da Orion`,
      amount: cost,
      timestamp: nowTimestamp(),
    });
  });

  return { transactions, totalSpent };
}

export function computeTelemetryFromSubsystems(
  selected: Record<SubsystemSlot, string>
): MissionState['telemetry'] {
  const tank = getSubsystemOption('tank', selected.tank);
  const shield = getSubsystemOption('shield', selected.shield);
  const power = getSubsystemOption('power', selected.power);

  const fuel = tank.stats.fuelCapacityPct ?? 82;
  const scienceCapacity = tank.stats.scienceBufferGb ?? 120;
  const battery = power.stats.batteryCapacityPct ?? 88;
  const maxBatteryKwh = power.id === 'pwr_ultra_140' ? 140 : power.id === 'pwr_eco_75' ? 75 : 100;
  const batteryKwh = Math.round((battery / 100) * maxBatteryKwh);
  const crewProtection = shield.stats.radiationProtectionPct ?? 76;

  return {
    battery,
    maxBattery: 100,
    batteryKwh,
    maxBatteryKwh,
    fuel,
    initialFuel: fuel,
    commsStatus: 'NOMINAL',
    solarGeneration: 100,
    scienceStored: 0,
    scienceCapacity,
    scienceTransmitted: 0,
    scienceScore: 0,
    systemIntegrity: 100,
    crewProtection,
    missionStatusLabel: 'FASE 1 · MONTAGEM E VERIFICAÇÃO DA ORION',
    bufferSaturated: false,
  };
}

export function createInitialMissionState(
  customAdminConfig?: BudgetAdminConfig,
  skipBriefing = false
): MissionState {
  const adminConfig = customAdminConfig ?? createDefaultAdminConfig();
  const selected = { ...DEFAULT_SELECTED_SUBSYSTEMS };

  // Ensure initial default components fit within phase1Initial if user lowered phase1Initial in Admin
  const { transactions, totalSpent } = computeInitialPhase1Transactions(adminConfig, selected);
  const globalInitial =
    adminConfig.phase1Initial + adminConfig.phase2Initial + adminConfig.phase3Initial;

  const p1Remaining = Math.max(0, adminConfig.phase1Initial - totalSpent);
  const globalRemaining = Math.max(0, globalInitial - totalSpent);

  const phaseBudgets: Record<1 | 2 | 3, PhaseBudgetState> = {
    1: {
      phase: 1,
      label: 'Fase 1 · Planejamento e Montagem',
      initialAllocated: adminConfig.phase1Initial,
      reallocatedNet: 0,
      effectiveLimit: adminConfig.phase1Initial,
      spent: totalSpent,
      remaining: p1Remaining,
    },
    2: {
      phase: 2,
      label: 'Fase 2 · Viagem Lunar',
      initialAllocated: adminConfig.phase2Initial,
      reallocatedNet: 0,
      effectiveLimit: adminConfig.phase2Initial,
      spent: 0,
      remaining: adminConfig.phase2Initial,
    },
    3: {
      phase: 3,
      label: 'Fase 3 · Retorno à Terra',
      initialAllocated: adminConfig.phase3Initial,
      reallocatedNet: 0,
      effectiveLimit: adminConfig.phase3Initial,
      spent: 0,
      remaining: adminConfig.phase3Initial,
    },
  };

  return {
    phase: 1,
    showIntroBriefing: !skipBriefing,
    adminConfig,
    selectedSubsystems: selected,
    phase1Validated: false,
    tliExecuted: false,
    globalBudget: {
      initialTotal: globalInitial,
      spentTotal: totalSpent,
      remaining: globalRemaining,
    },
    phaseBudgets,
    transactions,
    budgetTransfers: [],
    chargedOperationKeys: [],
    telemetry: computeTelemetryFromSubsystems(selected),
    phase2: {
      progress: 0,
      isPlaying: false,
      speedMultiplier: 1,
      enteredFarSide: false,
      exitedFarSide: false,
      transmissionProgress: 0,
      transmissionDone: false,
      enteredEclipse: false,
      exitedEclipse: false,
      eclipseBatteryUsedPct: 0,
      eclipseReportDismissed: false,
      solarStormTriggered: false,
      solarStormPopupOpen: false,
      solarStormChoice: 'NONE',
      solarStormDamageAmount: 0,
      stormRecoveryExecuted: false,
      energyOptimizationExecuted: false,
      maintenanceExecuted: false,
      scienceRelayBoostExecuted: false,
      phase2Completed: false,
    },
    phase3: {
      reentryAngle: 2.8, // Starts outside green zone so player genuinely aligns trajectory
      tcmAttempts: [],
      tcmCompleted: false,
      engineBurnSequenceActive: false,
      engineBurnSequenceCompleted: false,
      reentryPrepExecuted: false,
      oceanRecoveryExecuted: false,
      reentryMoment: 'IDLE',
      reentryProgress: 0,
      reentryPlaying: false,
      capsuleTemperatureC: 120,
      gForce: 0.1,
      altitudeKm: 12500,
      velocityKmS: 10.9,
    },
    decisions: [],
    alerts: [],
    lastBlockedReason: null,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function makeAlert(
  severity: MissionAlert['severity'],
  title: string,
  message: string
): MissionAlert {
  return {
    id: uid('alert'),
    severity,
    title,
    message,
    timestamp: nowTimestamp(),
  };
}

/**
 * Helper to execute simultaneous deduction from Phase Budget and Global Budget.
 * Enforces:
 * - No negative balances
 * - No exceeding phase effective limit
 * - No exceeding global remaining budget
 * - Anti-double-charge via operationKey
 */
function applyBudgetSpend(
  state: MissionState,
  phase: 1 | 2 | 3,
  cost: number,
  tx: Omit<BudgetTransaction, 'id' | 'timestamp' | 'amount' | 'phase'>,
  operationKey?: string
): { nextState: MissionState; ok: boolean; reason?: string } {
  if (operationKey && state.chargedOperationKeys.includes(operationKey)) {
    return { nextState: state, ok: true };
  }

  const phaseBudget = state.phaseBudgets[phase];
  const safeCost = Math.max(0, Math.round(cost));

  if (safeCost > phaseBudget.remaining) {
    const reason = `Orçamento da Fase ${phase} insuficiente: necessário ${formatCredits(safeCost)}, disponível ${formatCredits(phaseBudget.remaining)}.`;
    return {
      ok: false,
      reason,
      nextState: {
        ...state,
        lastBlockedReason: reason,
        alerts: [
          makeAlert('danger', `Limite da Fase ${phase} Insuficiente`, reason),
          ...state.alerts,
        ].slice(0, 8),
      },
    };
  }

  if (safeCost > state.globalBudget.remaining) {
    const reason = `Orçamento Global insuficiente: necessário ${formatCredits(safeCost)}, saldo global ${formatCredits(state.globalBudget.remaining)}.`;
    return {
      ok: false,
      reason,
      nextState: {
        ...state,
        lastBlockedReason: reason,
        alerts: [
          makeAlert('danger', 'Orçamento Global Esgotado', reason),
          ...state.alerts,
        ].slice(0, 8),
      },
    };
  }

  const newPhaseSpent = phaseBudget.spent + safeCost;
  const newPhaseRemaining = Math.max(0, phaseBudget.remaining - safeCost);
  const newGlobalSpent = state.globalBudget.spentTotal + safeCost;
  const newGlobalRemaining = Math.max(0, state.globalBudget.remaining - safeCost);

  const newAlerts = [...state.alerts];
  const globalPctLeft =
    state.globalBudget.initialTotal > 0
      ? (newGlobalRemaining / state.globalBudget.initialTotal) * 100
      : 0;
  const phasePctLeft =
    phaseBudget.effectiveLimit > 0
      ? (newPhaseRemaining / phaseBudget.effectiveLimit) * 100
      : 0;

  if (newGlobalRemaining === 0 && safeCost > 0) {
    newAlerts.unshift(
      makeAlert(
        'danger',
        'Orçamento Global Esgotado',
        'Saldo global zerado. Operações com custo estão bloqueadas; apenas procedimentos gratuitos permanecem ativos.'
      )
    );
  } else if (globalPctLeft < 30 && state.globalBudget.remaining / state.globalBudget.initialTotal >= 0.3) {
    newAlerts.unshift(
      makeAlert(
        'warning',
        'Alerta Financeiro Global (< 30%)',
        `Saldo global caiu para ${formatCredits(newGlobalRemaining)} (${globalPctLeft.toFixed(1)}%).`
      )
    );
  }

  if (newPhaseRemaining === 0 && safeCost > 0) {
    newAlerts.unshift(
      makeAlert(
        'danger',
        `Limite da Fase ${phase} Atingido`,
        'Saldo regional desta fase esgotado. Realoque créditos de outra fase ou utilize ações sem custo.'
      )
    );
  } else if (phasePctLeft < 20 && phaseBudget.remaining / Math.max(1, phaseBudget.effectiveLimit) >= 0.2) {
    newAlerts.unshift(
      makeAlert(
        'warning',
        `Orçamento da Fase ${phase} Abaixo de 20%`,
        `Restam apenas ${formatCredits(newPhaseRemaining)} para as operações desta fase.`
      )
    );
  }

  const newTransaction: BudgetTransaction = {
    id: uid('tx'),
    operationKey,
    phase,
    amount: safeCost,
    timestamp: nowTimestamp(),
    ...tx,
  };

  return {
    ok: true,
    nextState: {
      ...state,
      lastBlockedReason: null,
      chargedOperationKeys: operationKey
        ? [...state.chargedOperationKeys, operationKey]
        : state.chargedOperationKeys,
      phaseBudgets: {
        ...state.phaseBudgets,
        [phase]: {
          ...phaseBudget,
          spent: newPhaseSpent,
          remaining: newPhaseRemaining,
        },
      },
      globalBudget: {
        ...state.globalBudget,
        spentTotal: newGlobalSpent,
        remaining: newGlobalRemaining,
      },
      transactions: [newTransaction, ...state.transactions],
      alerts: newAlerts.slice(0, 8),
    },
  };
}

export type MissionAction =
  | { type: 'DISMISS_BRIEFING' }
  | { type: 'RETURN_TO_START' }
  | { type: 'RESET_MISSION'; keepAdminConfig?: boolean }
  | { type: 'CLEAR_BLOCKED_REASON' }
  | { type: 'DISMISS_ALERT'; id: string }
  | { type: 'UPDATE_ADMIN_CONFIG'; config: BudgetAdminConfig }
  | { type: 'SELECT_SUBSYSTEM'; slot: SubsystemSlot; optionId: string }
  | { type: 'VALIDATE_PHASE1' }
  | { type: 'EXECUTE_TLI_AND_START_PHASE2' }
  | {
      type: 'TRANSFER_BUDGET';
      fromPhase: 1 | 2 | 3;
      toPhase: 1 | 2 | 3;
      amount: number;
      reason: string;
    }
  | { type: 'SET_PHASE2_PLAYING'; playing: boolean }
  | { type: 'SET_PHASE2_SPEED'; speed: 1 | 2 }
  | { type: 'TICK_PHASE2'; deltaSec: number }
  | { type: 'DISMISS_ECLIPSE_REPORT' }
  | { type: 'CHOOSE_SOLAR_STORM'; choice: 'SHELTER' | 'MAX_POWER' }
  | { type: 'EXECUTE_PHASE2_OPERATION'; op: 'ENERGY_OPT' | 'MAINTENANCE' | 'SCIENCE_RELAY' | 'STORM_RECOVERY' }
  | { type: 'ADVANCE_TO_PHASE3' }
  | { type: 'SET_REENTRY_ANGLE'; angle: number }
  | { type: 'EXECUTE_TCM_BURN' }
  | { type: 'FINISH_ENGINE_BURN_SEQUENCE' }
  | { type: 'EXECUTE_PHASE3_OPERATION'; op: 'REENTRY_PREP' | 'OCEAN_RECOVERY' | 'FREE_EMERGENCY_SEPARATION' }
  | { type: 'START_REENTRY_SEQUENCE' }
  | { type: 'TICK_REENTRY'; deltaSec: number }
  | { type: 'COMPLETE_MISSION_TO_SUMMARY' };

export function missionReducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case 'DISMISS_BRIEFING':
      return { ...state, showIntroBriefing: false };

    case 'RETURN_TO_START':
      return createInitialMissionState(state.adminConfig, false);

    case 'RESET_MISSION':
      return createInitialMissionState(
        action.keepAdminConfig ? state.adminConfig : undefined,
        true
      );

    case 'CLEAR_BLOCKED_REASON':
      return { ...state, lastBlockedReason: null };

    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.id),
      };

    case 'UPDATE_ADMIN_CONFIG': {
      const cfg = action.config;
      const newGlobalInitial = cfg.phase1Initial + cfg.phase2Initial + cfg.phase3Initial;

      // If still in Phase 1 before TLI, recalculate Phase 1 spent based on new component costs
      if (state.phase === 1 && !state.tliExecuted) {
        const { transactions: p1Txs, totalSpent } = computeInitialPhase1Transactions(
          cfg,
          state.selectedSubsystems
        );
        const nonComponentTxs = state.transactions.filter((t) => t.type !== 'component');
        const otherP1Spent = nonComponentTxs
          .filter((t) => t.phase === 1)
          .reduce((acc, t) => acc + t.amount, 0);
        const p1TotalSpent = totalSpent + otherP1Spent;

        const p1Limit = cfg.phase1Initial + state.phaseBudgets[1].reallocatedNet;
        const p2Limit = cfg.phase2Initial + state.phaseBudgets[2].reallocatedNet;
        const p3Limit = cfg.phase3Initial + state.phaseBudgets[3].reallocatedNet;

        const totalSpentAll =
          p1TotalSpent + state.phaseBudgets[2].spent + state.phaseBudgets[3].spent;

        return {
          ...state,
          adminConfig: cfg,
          transactions: [...p1Txs, ...nonComponentTxs],
          globalBudget: {
            initialTotal: newGlobalInitial,
            spentTotal: totalSpentAll,
            remaining: Math.max(0, newGlobalInitial - totalSpentAll),
          },
          phaseBudgets: {
            1: {
              ...state.phaseBudgets[1],
              initialAllocated: cfg.phase1Initial,
              effectiveLimit: p1Limit,
              spent: p1TotalSpent,
              remaining: Math.max(0, p1Limit - p1TotalSpent),
            },
            2: {
              ...state.phaseBudgets[2],
              initialAllocated: cfg.phase2Initial,
              effectiveLimit: p2Limit,
              remaining: Math.max(0, p2Limit - state.phaseBudgets[2].spent),
            },
            3: {
              ...state.phaseBudgets[3],
              initialAllocated: cfg.phase3Initial,
              effectiveLimit: p3Limit,
              remaining: Math.max(0, p3Limit - state.phaseBudgets[3].spent),
            },
          },
          alerts: [
            makeAlert(
              'info',
              'Parâmetros Financeiros Atualizados',
              `Orçamento global recalibrado para ${formatCredits(newGlobalInitial)}.`
            ),
            ...state.alerts,
          ].slice(0, 8),
        };
      }

      // Mid-mission update: adjust limits & remaining cleanly while preserving spent
      const p1Limit = cfg.phase1Initial + state.phaseBudgets[1].reallocatedNet;
      const p2Limit = cfg.phase2Initial + state.phaseBudgets[2].reallocatedNet;
      const p3Limit = cfg.phase3Initial + state.phaseBudgets[3].reallocatedNet;
      const totalSpent = state.globalBudget.spentTotal;

      return {
        ...state,
        adminConfig: cfg,
        globalBudget: {
          initialTotal: newGlobalInitial,
          spentTotal: totalSpent,
          remaining: Math.max(0, newGlobalInitial - totalSpent),
        },
        phaseBudgets: {
          1: {
            ...state.phaseBudgets[1],
            initialAllocated: cfg.phase1Initial,
            effectiveLimit: p1Limit,
            remaining: Math.max(0, p1Limit - state.phaseBudgets[1].spent),
          },
          2: {
            ...state.phaseBudgets[2],
            initialAllocated: cfg.phase2Initial,
            effectiveLimit: p2Limit,
            remaining: Math.max(0, p2Limit - state.phaseBudgets[2].spent),
          },
          3: {
            ...state.phaseBudgets[3],
            initialAllocated: cfg.phase3Initial,
            effectiveLimit: p3Limit,
            remaining: Math.max(0, p3Limit - state.phaseBudgets[3].spent),
          },
        },
      };
    }

    case 'SELECT_SUBSYSTEM': {
      if (state.phase !== 1 || state.tliExecuted) return state;
      const currentOptionId = state.selectedSubsystems[action.slot];
      if (currentOptionId === action.optionId) return state;

      const prevCost = getComponentCost(state.adminConfig, currentOptionId);
      const nextOpt = getSubsystemOption(action.slot, action.optionId);
      const nextCost = getComponentCost(state.adminConfig, nextOpt.id);
      const deltaCost = nextCost - prevCost;

      const p1Budget = state.phaseBudgets[1];
      if (deltaCost > p1Budget.remaining) {
        const reason = `Orçamento da Fase 1 insuficiente para atualizar para ${nextOpt.name}. Diferença: ${formatCredits(deltaCost)}, disponível na Fase 1: ${formatCredits(p1Budget.remaining)}.`;
        return {
          ...state,
          lastBlockedReason: reason,
          alerts: [
            makeAlert('danger', 'Orçamento da Fase 1 Insuficiente', reason),
            ...state.alerts,
          ].slice(0, 8),
        };
      }
      if (deltaCost > state.globalBudget.remaining) {
        const reason = `Orçamento Global insuficiente para atualizar para ${nextOpt.name}.`;
        return {
          ...state,
          lastBlockedReason: reason,
          alerts: [
            makeAlert('danger', 'Orçamento Global Insuficiente', reason),
            ...state.alerts,
          ].slice(0, 8),
        };
      }

      const newSelected = {
        ...state.selectedSubsystems,
        [action.slot]: nextOpt.id,
      };

      const newP1Spent = Math.max(0, p1Budget.spent + deltaCost);
      const newP1Remaining = Math.max(0, p1Budget.effectiveLimit - newP1Spent);
      const newGlobalSpent = Math.max(0, state.globalBudget.spentTotal + deltaCost);
      const newGlobalRemaining = Math.max(0, state.globalBudget.initialTotal - newGlobalSpent);

      // Update component transaction record for this slot so ledger matches real final configuration
      const filteredTxs = state.transactions.filter(
        (t) => t.operationKey !== `component_${action.slot}`
      );
      const slotTx: BudgetTransaction = {
        id: uid('tx_comp'),
        operationKey: `component_${action.slot}`,
        phase: 1,
        type: 'component',
        title: nextOpt.name,
        description: `Subsistema ${nextOpt.code} selecionado na montagem da Orion`,
        amount: nextCost,
        timestamp: nowTimestamp(),
      };

      return {
        ...state,
        selectedSubsystems: newSelected,
        phase1Validated: false,
        lastBlockedReason: null,
        telemetry: computeTelemetryFromSubsystems(newSelected),
        phaseBudgets: {
          ...state.phaseBudgets,
          1: {
            ...p1Budget,
            spent: newP1Spent,
            remaining: newP1Remaining,
          },
        },
        globalBudget: {
          ...state.globalBudget,
          spentTotal: newGlobalSpent,
          remaining: newGlobalRemaining,
        },
        transactions: [slotTx, ...filteredTxs],
      };
    }

    case 'VALIDATE_PHASE1': {
      return {
        ...state,
        phase1Validated: true,
        alerts: [
          makeAlert(
            'success',
            'Configuração da Orion Validada',
            'Todos os 5 subsistemas críticos foram verificados. Pronta para Injeção Translunar (TLI).'
          ),
          ...state.alerts,
        ].slice(0, 8),
      };
    }

    case 'EXECUTE_TLI_AND_START_PHASE2': {
      if (state.tliExecuted) return state;
      const tliCost = state.adminConfig.operationCosts.tliPreparation;
      const canAffordTli =
        state.phaseBudgets[1].remaining >= tliCost && state.globalBudget.remaining >= tliCost;

      let workingState = state;
      if (canAffordTli) {
        const res = applyBudgetSpend(
          state,
          1,
          tliCost,
          {
            type: 'operation',
            title: 'Preparação e Ignição TLI',
            description: 'Verificação de pré-lançamento e queima de injeção translunar',
          },
          'tli-launch'
        );
        if (!res.ok) return res.nextState;
        workingState = res.nextState;
      } else {
        // Check if user wants free emergency launch or needs alert — prompt specifies:
        // "Se o orçamento chegar a zero: Bloqueie novas operações que exijam gastos. Informe quais atividades ainda podem ser realizadas sem custos."
        return applyBudgetSpend(
          state,
          1,
          tliCost,
          {
            type: 'operation',
            title: 'Preparação e Ignição TLI',
            description: 'Verificação de pré-lançamento e queima de injeção translunar',
          },
          'tli-launch'
        ).nextState;
      }

      // Consume small TLI propellant (6% * engine efficiency)
      const engineOpt = getSubsystemOption('engine', workingState.selectedSubsystems.engine);
      const eff = engineOpt.stats.fuelEfficiencyMultiplier ?? 1.0;
      const fuelAfterTli = clamp(workingState.telemetry.fuel - Math.round(5 * eff), 0, 100);

      return {
        ...workingState,
        phase: 2,
        tliExecuted: true,
        phase1Validated: true,
        telemetry: {
          ...workingState.telemetry,
          fuel: fuelAfterTli,
          missionStatusLabel: 'FASE 2 · EM TRÂNSITO LUNAR (TLI CONCLUÍDA)',
        },
        phase2: {
          ...workingState.phase2,
          isPlaying: true,
        },
        decisions: [
          {
            id: uid('dec'),
            phase: 1,
            title: 'Configuração Aprovada e Ignição TLI',
            outcome: 'Nave Orion lançada em trajetória translunar',
            impact: `Combustível pós-TLI: ${fuelAfterTli}% · Custo TLI: ${formatCredits(tliCost)}`,
            timestamp: nowTimestamp(),
          },
          ...workingState.decisions,
        ],
        alerts: [
          makeAlert(
            'success',
            'CONFIGURAÇÃO APROVADA',
            'CONFIGURAÇÃO APROVADA. SISTEMAS DA ORION VERIFICADOS. INICIANDO VIAGEM LUNAR.'
          ),
          ...workingState.alerts,
        ].slice(0, 8),
      };
    }

    case 'TRANSFER_BUDGET': {
      const { fromPhase, toPhase, amount, reason } = action;
      if (fromPhase === toPhase) return state;
      const safeAmount = Math.max(0, Math.round(amount));
      if (safeAmount <= 0) return state;

      const source = state.phaseBudgets[fromPhase];
      const target = state.phaseBudgets[toPhase];
      if (safeAmount > source.remaining) {
        const msg = `Transferência bloqueada: Fase ${fromPhase} possui apenas ${formatCredits(source.remaining)} disponíveis.`;
        return {
          ...state,
          lastBlockedReason: msg,
          alerts: [makeAlert('danger', 'Transferência Inválida', msg), ...state.alerts].slice(0, 8),
        };
      }

      const transfer: BudgetTransferRecord = {
        id: uid('trf'),
        fromPhase,
        toPhase,
        amount: safeAmount,
        reason: reason || `Realocação estratégica da Fase ${fromPhase} para a Fase ${toPhase}`,
        timestamp: nowTimestamp(),
      };

      const txLog: BudgetTransaction = {
        id: uid('tx_trf'),
        phase: toPhase,
        type: 'transfer',
        title: `Realocação: Fase ${fromPhase} → Fase ${toPhase}`,
        description: transfer.reason,
        amount: 0, // Does not consume global budget!
        timestamp: nowTimestamp(),
      };

      return {
        ...state,
        lastBlockedReason: null,
        phaseBudgets: {
          ...state.phaseBudgets,
          [fromPhase]: {
            ...source,
            reallocatedNet: source.reallocatedNet - safeAmount,
            effectiveLimit: source.effectiveLimit - safeAmount,
            remaining: source.remaining - safeAmount,
          },
          [toPhase]: {
            ...target,
            reallocatedNet: target.reallocatedNet + safeAmount,
            effectiveLimit: target.effectiveLimit + safeAmount,
            remaining: target.remaining + safeAmount,
          },
        },
        budgetTransfers: [transfer, ...state.budgetTransfers],
        transactions: [txLog, ...state.transactions],
        alerts: [
          makeAlert(
            'info',
            'Orçamento Realocado',
            `${formatCredits(safeAmount)} transferidos da Fase ${fromPhase} para a Fase ${toPhase}. Orçamento global preservado.`
          ),
          ...state.alerts,
        ].slice(0, 8),
      };
    }

    case 'SET_PHASE2_PLAYING':
      if (state.phase2.solarStormPopupOpen) return state;
      return {
        ...state,
        phase2: { ...state.phase2, isPlaying: action.playing },
      };

    case 'SET_PHASE2_SPEED':
      return {
        ...state,
        phase2: { ...state.phase2, speedMultiplier: action.speed },
      };

    case 'DISMISS_ECLIPSE_REPORT':
      return {
        ...state,
        phase2: { ...state.phase2, eclipseReportDismissed: true },
      };

    case 'TICK_PHASE2': {
      if (state.phase !== 2 || !state.phase2.isPlaying || state.phase2.solarStormPopupOpen) {
        return state;
      }

      const dt = action.deltaSec * state.phase2.speedMultiplier;
      // Full Phase 2 journey takes ~32 seconds at 1x speed
      const prevProg = state.phase2.progress;
      const nextProg = clamp(prevProg + dt * 3.1, 0, 100);

      let telemetry = { ...state.telemetry };
      let p2 = { ...state.phase2, progress: nextProg };
      const alerts = [...state.alerts];
      const decisions = [...state.decisions];

      const antenna = getSubsystemOption('antenna', state.selectedSubsystems.antenna);
      const power = getSubsystemOption('power', state.selectedSubsystems.power);
      const solarFactor = (power.stats.solarEfficiencyPct ?? 100) / 100;
      const commsRate = antenna.stats.commsRateGbPerSec ?? 22;
      const commsBonus = antenna.stats.commsBonusMultiplier ?? 1.0;

      // 1. Far side blackout region: 22% to 52%
      const inFarSide = nextProg >= 22 && nextProg < 52;
      if (inFarSide && !p2.enteredFarSide) {
        p2.enteredFarSide = true;
        telemetry.commsStatus = 'COMUNICAÇÃO INTERROMPIDA';
        telemetry.missionStatusLabel = 'SINAL PERDIDO — GRAVANDO NO BUFFER';
        alerts.unshift(
          makeAlert(
            'warning',
            'BLECAUTE NO LADO OCULTO DA LUA',
            'SINAL PERDIDO — GRAVANDO NO BUFFER. Sistemas internos operacionais.'
          )
        );
      }

      // Collect science data continuously before and during far side (up to buffer capacity)
      if (nextProg >= 5 && nextProg < 52) {
        const collectRate = inFarSide ? 11.5 : 5.5; // GB/sec simulated
        const added = dt * collectRate;
        const nextStored = telemetry.scienceStored + added;
        if (nextStored >= telemetry.scienceCapacity) {
          telemetry.scienceStored = telemetry.scienceCapacity;
          if (!telemetry.bufferSaturated) {
            telemetry.bufferSaturated = true;
            alerts.unshift(
              makeAlert(
                'warning',
                'Buffer Científico no Limite',
                `Capacidade de ${telemetry.scienceCapacity} GB atingida durante o blecaute lunar.`
              )
            );
          }
        } else {
          telemetry.scienceStored = Number(nextStored.toFixed(1));
        }
      }

      // Exit far side at >= 52%
      if (nextProg >= 52 && !p2.exitedFarSide) {
        p2.exitedFarSide = true;
        telemetry.commsStatus = 'COMUNICAÇÃO RESTABELECIDA';
        telemetry.missionStatusLabel = 'COMUNICAÇÃO RESTABELECIDA · TRANSMITINDO BUFFER';
        alerts.unshift(
          makeAlert(
            'success',
            'COMUNICAÇÃO RESTABELECIDA',
            'Sinal com a Terra recuperado. Iniciando transmissão automática dos dados armazenados no buffer.'
          )
        );
      }

      // Automatic buffer transmission once exited far side
      if (p2.exitedFarSide && !p2.transmissionDone) {
        if (telemetry.scienceStored > 0) {
          const txGb = Math.min(telemetry.scienceStored, dt * commsRate);
          telemetry.scienceStored = Number(Math.max(0, telemetry.scienceStored - txGb).toFixed(1));
          telemetry.scienceTransmitted = Number((telemetry.scienceTransmitted + txGb).toFixed(1));
          telemetry.scienceScore = Math.round(
            telemetry.scienceTransmitted * 10 * commsBonus +
              (p2.scienceRelayBoostExecuted ? 280 : 0)
          );
          const totalTarget = telemetry.scienceStored + telemetry.scienceTransmitted;
          p2.transmissionProgress =
            totalTarget > 0
              ? Math.min(100, Math.round((telemetry.scienceTransmitted / totalTarget) * 100))
              : 100;
        } else {
          p2.transmissionProgress = 100;
          p2.transmissionDone = true;
          decisions.unshift({
            id: uid('dec'),
            phase: 2,
            title: 'Transmissão Pós-Blecaute Concluída',
            outcome: `${telemetry.scienceTransmitted.toFixed(1)} GB transmitidos com sucesso`,
            impact: `Pontuação científica atual: ${telemetry.scienceScore} pts`,
            timestamp: nowTimestamp(),
          });
        }
      }

      // 2. Solar Eclipse region: 38% to 64%
      const inEclipse = nextProg >= 38 && nextProg < 64;
      if (inEclipse && !p2.enteredEclipse) {
        p2.enteredEclipse = true;
        telemetry.solarGeneration = 0;
        alerts.unshift(
          makeAlert(
            'warning',
            'ECLIPSE SOLAR DETECTADO',
            'Geração solar em 0%. Sistemas internos operando exclusivamente via banco de baterias.'
          )
        );
      }

      if (inEclipse) {
        telemetry.solarGeneration = 0;
        const drain = dt * 2.45; // Drains ~20% across eclipse
        const actualDrain = Math.min(telemetry.battery, drain);
        telemetry.battery = Number(Math.max(5, telemetry.battery - drain).toFixed(1));
        telemetry.batteryKwh = Math.round((telemetry.battery / 100) * telemetry.maxBatteryKwh);
        p2.eclipseBatteryUsedPct = Number((p2.eclipseBatteryUsedPct + actualDrain).toFixed(1));
      } else if (p2.enteredEclipse && !p2.exitedEclipse && nextProg >= 64) {
        p2.exitedEclipse = true;
        telemetry.solarGeneration = Math.round(100 * (telemetry.systemIntegrity / 100));
        alerts.unshift(
          makeAlert(
            'info',
            'Fim do Eclipse Solar',
            `Geração solar restabelecida. Consumo durante sombra: ${p2.eclipseBatteryUsedPct.toFixed(1)}% da bateria.`
          )
        );
        decisions.unshift({
          id: uid('dec'),
          phase: 2,
          title: 'Travessia do Eclipse Solar',
          outcome: 'Sistemas mantidos via bateria durante 0% de geração solar',
          impact: `Consumo líquido: -${p2.eclipseBatteryUsedPct.toFixed(1)}% de carga`,
          timestamp: nowTimestamp(),
        });
      } else if (!inEclipse && nextProg >= 64) {
        // Gentle solar recharge when in sunlight
        telemetry.solarGeneration = Math.round(100 * (telemetry.systemIntegrity / 100));
        telemetry.battery = Number(
          Math.min(100, telemetry.battery + dt * 0.9 * solarFactor).toFixed(1)
        );
        telemetry.batteryKwh = Math.round((telemetry.battery / 100) * telemetry.maxBatteryKwh);
      }

      // 3. Solar Storm mandatory crisis at 74%
      if (nextProg >= 74 && !p2.solarStormTriggered) {
        p2.progress = 74;
        p2.solarStormTriggered = true;
        p2.solarStormPopupOpen = true;
        p2.isPlaying = false;
        telemetry.missionStatusLabel = 'ALERTA CRÍTICO · TEMPESTADE SOLAR DETECTADA';
        alerts.unshift(
          makeAlert(
            'danger',
            'TEMPESTADE SOLAR DETECTADA',
            'TEMPESTADE SOLAR DETECTADA — PROTEÇÃO DA TRIPULAÇÃO NECESSÁRIA.'
          )
        );
      }

      // 4. Phase 2 completion at 100%
      if (nextProg >= 100 && !p2.phase2Completed) {
        p2.phase2Completed = true;
        p2.isPlaying = false;
        telemetry.missionStatusLabel = 'FASE 2 CONCLUÍDA · PRONTA PARA RETORNO À TERRA';
      }

      return {
        ...state,
        telemetry,
        phase2: p2,
        alerts: alerts.slice(0, 8),
        decisions,
      };
    }

    case 'CHOOSE_SOLAR_STORM': {
      if (!state.phase2.solarStormPopupOpen) return state;

      if (action.choice === 'SHELTER') {
        const cost = state.adminConfig.operationCosts.phase2RadiationShelter;
        const batteryCost = 18;
        if (state.telemetry.battery < batteryCost + 4) {
          const msg = `Energia da bateria insuficiente (${state.telemetry.battery.toFixed(1)}%) para ativar o Abrigo de Radiação (exige ${batteryCost}%).`;
          return {
            ...state,
            lastBlockedReason: msg,
            alerts: [makeAlert('danger', 'Energia Insuficiente', msg), ...state.alerts].slice(0, 8),
          };
        }

        const res = applyBudgetSpend(
          state,
          2,
          cost,
          {
            type: 'operation',
            title: 'Ativação do Abrigo de Radiação',
            description: 'Blindagem ativa da cabine Orion durante tempestade de prótons solares',
          },
          'phase2-radiation-shelter'
        );
        if (!res.ok) return res.nextState;

        const nextBattery = clamp(Number((res.nextState.telemetry.battery - batteryCost).toFixed(1)), 5, 100);
        const nextProtection = clamp(res.nextState.telemetry.crewProtection + 16, 0, 100);

        return {
          ...res.nextState,
          telemetry: {
            ...res.nextState.telemetry,
            battery: nextBattery,
            batteryKwh: Math.round((nextBattery / 100) * res.nextState.telemetry.maxBatteryKwh),
            crewProtection: nextProtection,
            missionStatusLabel: 'ABRIGO DE RADIAÇÃO ATIVADO · TRIPULAÇÃO PROTEGIDA',
          },
          phase2: {
            ...res.nextState.phase2,
            solarStormPopupOpen: false,
            solarStormChoice: 'SHELTER',
            solarStormDamageAmount: 0,
          },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Tempestade Solar · Opção A (Abrigo de Radiação)',
              outcome: 'Abrigo ativado com sucesso; exposição da tripulação contida',
              impact: `-${batteryCost}% bateria · Proteção: ${nextProtection}% · Custo: ${formatCredits(cost)}`,
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
          alerts: [
            makeAlert(
              'success',
              'Abrigo de Radiação Ativado',
              `Tripulação protegida (${nextProtection}%). Bateria consumida: ${batteryCost}%.`
            ),
            ...res.nextState.alerts,
          ].slice(0, 8),
        };
      } else {
        // OPTION B — MAX_POWER (0 initial cost, preserves battery, causes radiation & system damage)
        const shield = getSubsystemOption('shield', state.selectedSubsystems.shield);
        const heatRes = shield.stats.heatResistancePct ?? 88;
        const damage = heatRes >= 95 ? 16 : heatRes >= 85 ? 24 : 32;
        const nextIntegrity = clamp(state.telemetry.systemIntegrity - damage, 20, 100);
        const nextProtection = clamp(state.telemetry.crewProtection - 22, 15, 100);

        return {
          ...state,
          lastBlockedReason: null,
          telemetry: {
            ...state.telemetry,
            systemIntegrity: nextIntegrity,
            crewProtection: nextProtection,
            missionStatusLabel: 'POTÊNCIA MÁXIMA MANTIDA · DANOS POR RADIAÇÃO REGISTRADOS',
          },
          phase2: {
            ...state.phase2,
            solarStormPopupOpen: false,
            solarStormChoice: 'MAX_POWER',
            solarStormDamageAmount: damage,
          },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Tempestade Solar · Opção B (Potência Máxima)',
              outcome: `Bateria preservada, porém tempestade causou -${damage}% de integridade`,
              impact: `Integridade: ${nextIntegrity}% · Proteção tripulação: ${nextProtection}%`,
              timestamp: nowTimestamp(),
            },
            ...state.decisions,
          ],
          alerts: [
            makeAlert(
              'warning',
              'Danos por Tempestade Solar',
              `Sistemas sofreram -${damage}% de integridade e proteção caiu para ${nextProtection}%. Considere executar recuperação pós-tempestade.`
            ),
            ...state.alerts,
          ].slice(0, 8),
        };
      }
    }

    case 'EXECUTE_PHASE2_OPERATION': {
      const ops = state.adminConfig.operationCosts;
      if (action.op === 'ENERGY_OPT') {
        if (state.phase2.energyOptimizationExecuted) return state;
        const res = applyBudgetSpend(
          state,
          2,
          ops.phase2EnergyCalibration,
          {
            type: 'operation',
            title: 'Otimização e Calibração Energética',
            description: 'Rebalanceamento das asas fotovoltaicas e células Li-Ion',
          },
          'phase2-energy-opt'
        );
        if (!res.ok) return res.nextState;
        const nextBat = clamp(Number((res.nextState.telemetry.battery + 15).toFixed(1)), 0, 100);
        return {
          ...res.nextState,
          telemetry: {
            ...res.nextState.telemetry,
            battery: nextBat,
            batteryKwh: Math.round((nextBat / 100) * res.nextState.telemetry.maxBatteryKwh),
          },
          phase2: { ...res.nextState.phase2, energyOptimizationExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Otimização Energética',
              outcome: 'Barramento de energia recalibrado',
              impact: '+15% carga na bateria',
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      if (action.op === 'MAINTENANCE') {
        if (state.phase2.maintenanceExecuted) return state;
        const res = applyBudgetSpend(
          state,
          2,
          ops.phase2SystemMaintenance,
          {
            type: 'operation',
            title: 'Manutenção Preventiva de Sistemas',
            description: 'Diagnóstico de aviônica e estabilização térmica do módulo de serviço',
          },
          'phase2-maintenance'
        );
        if (!res.ok) return res.nextState;
        const nextIntegrity = clamp(res.nextState.telemetry.systemIntegrity + 10, 0, 100);
        return {
          ...res.nextState,
          telemetry: {
            ...res.nextState.telemetry,
            systemIntegrity: nextIntegrity,
          },
          phase2: { ...res.nextState.phase2, maintenanceExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Manutenção Preventiva',
              outcome: 'Diagnóstico concluído com sucesso',
              impact: `Integridade elevada para ${nextIntegrity}%`,
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      if (action.op === 'SCIENCE_RELAY') {
        if (state.phase2.scienceRelayBoostExecuted) return state;
        const res = applyBudgetSpend(
          state,
          2,
          ops.phase2DeepSpaceRelay,
          {
            type: 'operation',
            title: 'Pacote de Telemetria Científica Avançada',
            description: 'Alocação da Rede de Espaço Profundo (DSN) para espectrometria lunar',
          },
          'phase2-science-relay'
        );
        if (!res.ok) return res.nextState;
        const nextScore = res.nextState.telemetry.scienceScore + 280;
        const nextTransmitted = Number((res.nextState.telemetry.scienceTransmitted + 24).toFixed(1));
        return {
          ...res.nextState,
          telemetry: {
            ...res.nextState.telemetry,
            scienceTransmitted: nextTransmitted,
            scienceScore: nextScore,
          },
          phase2: { ...res.nextState.phase2, scienceRelayBoostExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Telemetria Científica Avançada',
              outcome: 'Dados de alta resolução enviados via DSN',
              impact: '+280 pontos científicos · +24 GB transmitidos',
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      if (action.op === 'STORM_RECOVERY') {
        if (state.phase2.stormRecoveryExecuted || state.phase2.solarStormDamageAmount === 0) {
          return state;
        }
        const res = applyBudgetSpend(
          state,
          2,
          ops.phase2StormRecovery,
          {
            type: 'recovery',
            title: 'Recuperação de Sistemas Pós-Tempestade',
            description: 'Reinicialização redundante e reparo de barramento após tempestade solar',
          },
          'phase2-storm-recovery'
        );
        if (!res.ok) return res.nextState;
        const restored = Math.round(res.nextState.phase2.solarStormDamageAmount * 0.85);
        const nextIntegrity = clamp(res.nextState.telemetry.systemIntegrity + restored, 0, 100);
        return {
          ...res.nextState,
          telemetry: {
            ...res.nextState.telemetry,
            systemIntegrity: nextIntegrity,
          },
          phase2: { ...res.nextState.phase2, stormRecoveryExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 2,
              title: 'Recuperação Pós-Tempestade Solar',
              outcome: 'Sistemas avariados restaurados via redundância',
              impact: `+${restored}% integridade · Custo: ${formatCredits(ops.phase2StormRecovery)}`,
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      return state;
    }

    case 'ADVANCE_TO_PHASE3': {
      if (!state.phase2.phase2Completed) return state;
      return {
        ...state,
        phase: 3,
        lastBlockedReason: null,
        telemetry: {
          ...state.telemetry,
          missionStatusLabel: 'FASE 3 · RETORNO À TERRA E CORREÇÃO DE TRAJETÓRIA',
        },
        alerts: [
          makeAlert(
            'info',
            'RETORNO À TERRA INICIADO',
            'INICIANDO RETORNO À TERRA. PREPARE-SE PARA AS MANOBRAS DE CORREÇÃO DE TRAJETÓRIA.'
          ),
          ...state.alerts,
        ].slice(0, 8),
      };
    }

    case 'SET_REENTRY_ANGLE': {
      if (state.phase !== 3 || state.phase3.tcmCompleted) return state;
      return {
        ...state,
        phase3: {
          ...state.phase3,
          reentryAngle: clamp(Number(action.angle.toFixed(2)), -2.0, 14.0),
        },
      };
    }

    case 'EXECUTE_TCM_BURN': {
      if (state.phase !== 3 || state.phase3.tcmCompleted) return state;
      const engine = getSubsystemOption('engine', state.selectedSubsystems.engine);
      const eff = engine.stats.fuelEfficiencyMultiplier ?? 1.0;
      const fuelCost = Math.round(14 * eff);
      const budgetCost = state.adminConfig.operationCosts.phase3TcmBurn;

      if (state.telemetry.fuel < fuelCost) {
        const msg = `Combustível insuficiente para a queima TCM: necessário ${fuelCost}%, disponível ${state.telemetry.fuel}%.`;
        return {
          ...state,
          lastBlockedReason: msg,
          alerts: [makeAlert('danger', 'Combustível Insuficiente', msg), ...state.alerts].slice(0, 8),
        };
      }

      const attemptNum = state.phase3.tcmAttempts.length + 1;
      const res = applyBudgetSpend(
        state,
        3,
        budgetCost,
        {
          type: 'operation',
          title: `Queima de Correção TCM #${attemptNum}`,
          description: `Ajuste de corredor de reentrada em ${state.phase3.reentryAngle.toFixed(1)}°`,
        },
        `phase3-tcm-attempt-${attemptNum}`
      );
      if (!res.ok) return res.nextState;

      const angle = state.phase3.reentryAngle;
      const isSuccess = angle >= 5.5 && angle <= 7.0;
      const nextFuel = clamp(res.nextState.telemetry.fuel - fuelCost, 0, 100);

      const feedback = isSuccess
        ? 'TRAJETÓRIA ALINHADA! Corredor nominal de reentrada (5,5° – 7,0°) confirmado.'
        : angle < 5.5
          ? `Ângulo muito raso (${angle.toFixed(1)}°): risco de ricochete atmosférico. Ajuste para 5,5° – 7,0°.`
          : `Ângulo muito íngreme (${angle.toFixed(1)}°): sobrecarga térmica severa. Ajuste para 5,5° – 7,0°.`;

      const attemptRecord = {
        attempt: attemptNum,
        angle,
        fuelUsed: fuelCost,
        cost: budgetCost,
        success: isSuccess,
        feedback,
      };

      const decisions = [...res.nextState.decisions];
      if (isSuccess) {
        decisions.unshift({
          id: uid('dec'),
          phase: 3,
          title: 'Correção de Trajetória (TCM) Concluída',
          outcome: `TRAJETÓRIA ALINHADA em ${angle.toFixed(1)}° (Tentativa #${attemptNum})`,
          impact: `Combustível usado: ${fuelCost}% · Restante: ${nextFuel}%`,
          timestamp: nowTimestamp(),
        });
      }

      return {
        ...res.nextState,
        telemetry: {
          ...res.nextState.telemetry,
          fuel: nextFuel,
          missionStatusLabel: isSuccess
            ? 'TRAJETÓRIA ALINHADA · SEQUÊNCIA DE MOTORES ATIVA'
            : 'TCM FORA DA ZONA SEGURA · NOVO AJUSTE NECESSÁRIO',
        },
        phase3: {
          ...res.nextState.phase3,
          tcmAttempts: [...res.nextState.phase3.tcmAttempts, attemptRecord],
          tcmCompleted: isSuccess,
          engineBurnSequenceActive: isSuccess,
        },
        decisions,
        alerts: [
          makeAlert(
            isSuccess ? 'success' : 'warning',
            isSuccess ? 'TRAJETÓRIA ALINHADA' : 'Ajuste de Trajetória Fora da Zona Verde',
            feedback
          ),
          ...res.nextState.alerts,
        ].slice(0, 8),
      };
    }

    case 'FINISH_ENGINE_BURN_SEQUENCE': {
      return {
        ...state,
        phase3: {
          ...state.phase3,
          engineBurnSequenceActive: false,
          engineBurnSequenceCompleted: true,
        },
      };
    }

    case 'EXECUTE_PHASE3_OPERATION': {
      const ops = state.adminConfig.operationCosts;
      if (action.op === 'REENTRY_PREP') {
        if (state.phase3.reentryPrepExecuted) return state;
        const res = applyBudgetSpend(
          state,
          3,
          ops.phase3ReentryPrep,
          {
            type: 'operation',
            title: 'Procedimento de Separação e Escudo Térmico',
            description: 'Desacoplamento do Módulo de Serviço Europeu e orientação do escudo Avcoat',
          },
          'phase3-reentry-prep'
        );
        if (!res.ok) return res.nextState;
        return {
          ...res.nextState,
          phase3: { ...res.nextState.phase3, reentryPrepExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 3,
              title: 'Preparação de Reentrada Atmosférica',
              outcome: 'Módulo de Serviço separado; escudo térmico alinhado',
              impact: `Custo operacional: ${formatCredits(ops.phase3ReentryPrep)}`,
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      if (action.op === 'FREE_EMERGENCY_SEPARATION') {
        if (state.phase3.reentryPrepExecuted) return state;
        return {
          ...state,
          lastBlockedReason: null,
          phase3: { ...state.phase3, reentryPrepExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 3,
              title: 'Separação Manual de Contingência (Sem Custo)',
              outcome: 'Procedimento emergencial gratuito executado por falta de saldo',
              impact: 'Custo: CR$ 0 · Margem térmica reduzida em 6%',
              timestamp: nowTimestamp(),
            },
            ...state.decisions,
          ],
          telemetry: {
            ...state.telemetry,
            systemIntegrity: clamp(state.telemetry.systemIntegrity - 6, 15, 100),
          },
        };
      }

      if (action.op === 'OCEAN_RECOVERY') {
        if (state.phase3.oceanRecoveryExecuted) return state;
        const res = applyBudgetSpend(
          state,
          3,
          ops.phase3OceanRecovery,
          {
            type: 'operation',
            title: 'Operação Naval de Recuperação no Pacífico',
            description: 'Mobilização de embarcações de resgate e equipe de extração da cápsula Orion',
          },
          'phase3-ocean-recovery'
        );
        if (!res.ok) return res.nextState;
        return {
          ...res.nextState,
          phase3: { ...res.nextState.phase3, oceanRecoveryExecuted: true },
          decisions: [
            {
              id: uid('dec'),
              phase: 3,
              title: 'Equipe de Recuperação Oceânica Mobilizada',
              outcome: 'Resgate no Oceano Pacífico posicionado na zona de pouso',
              impact: `Custo: ${formatCredits(ops.phase3OceanRecovery)}`,
              timestamp: nowTimestamp(),
            },
            ...res.nextState.decisions,
          ],
        };
      }

      return state;
    }

    case 'START_REENTRY_SEQUENCE': {
      if (!state.phase3.tcmCompleted) return state;
      return {
        ...state,
        telemetry: {
          ...state.telemetry,
          missionStatusLabel: 'REENTRADA ATMOSFÉRICA · MOMENTO A: APROXIMAÇÃO',
        },
        phase3: {
          ...state.phase3,
          reentryPrepExecuted: true,
          reentryMoment: 'APPROACH',
          reentryProgress: 2,
          reentryPlaying: true,
        },
      };
    }

    case 'TICK_REENTRY': {
      if (state.phase !== 3 || !state.phase3.reentryPlaying) return state;
      // Total reentry sequence ~20 seconds
      const nextProg = clamp(state.phase3.reentryProgress + action.deltaSec * 5.0, 0, 100);
      let moment = state.phase3.reentryMoment;
      let commsStatus = state.telemetry.commsStatus;
      let statusLabel = state.telemetry.missionStatusLabel;
      let temp = 180;
      let gForce = 0.2;
      let alt = 12000;
      let vel = 10.9;
      const alerts = [...state.alerts];

      if (nextProg < 25) {
        moment = 'APPROACH';
        const p = nextProg / 25;
        alt = Math.round(12000 - p * 11880); // 12,000km -> 120km
        vel = Number((10.9 + p * 0.2).toFixed(2));
        temp = Math.round(180 + p * 320);
        gForce = Number((0.1 + p * 0.4).toFixed(1));
        statusLabel = 'MOMENTO A · APROXIMAÇÃO À TERRA';
      } else if (nextProg < 58) {
        if (moment !== 'PLASMA') {
          alerts.unshift(
            makeAlert(
              'warning',
              'ENTRADA ATMOSFÉRICA · PLASMA',
              'Pico térmico de plasma detectado no escudo Avcoat. Blackout temporário de rádio.'
            )
          );
        }
        moment = 'PLASMA';
        commsStatus = 'BLACKOUT ATMOSFÉRICO';
        const p = (nextProg - 25) / 33;
        alt = Math.round(120 - p * 90); // 120km -> 30km
        vel = Number((11.1 - p * 9.8).toFixed(2));
        temp = Math.round(1650 + Math.sin(p * Math.PI) * 1100);
        gForce = Number((1.2 + Math.sin(p * Math.PI) * 3.1).toFixed(1));
        statusLabel = 'MOMENTO B · ENTRADA ATMOSFÉRICA (PLASMA)';
      } else if (nextProg < 84) {
        if (moment !== 'PARACHUTES') {
          alerts.unshift(
            makeAlert(
              'success',
              'SISTEMA DE PARAQUEDAS ACIONADO',
              'SISTEMA DE PARAQUEDAS ACIONADO. Desaceleração controlada sobre o Oceano Pacífico.'
            )
          );
        }
        moment = 'PARACHUTES';
        commsStatus = 'LINK DE RECUPERAÇÃO';
        const p = (nextProg - 58) / 26;
        alt = Math.round(30 - p * 29.8);
        vel = Number((1.3 - p * 1.27).toFixed(2));
        temp = Math.round(900 - p * 840);
        gForce = Number((1.8 - p * 0.8).toFixed(1));
        statusLabel = 'SISTEMA DE PARAQUEDAS ACIONADO';
      } else {
        if (moment !== 'SPLASHDOWN') {
          alerts.unshift(
            makeAlert(
              'success',
              'POUSO NO OCEANO CONFIRMADO',
              'POUSO NO OCEANO CONFIRMADO. Cápsula Orion estabilizada na superfície do mar.'
            )
          );
        }
        moment = 'SPLASHDOWN';
        commsStatus = 'LINK DE RECUPERAÇÃO';
        alt = 0;
        vel = 0;
        temp = 38;
        gForce = 1.0;
        statusLabel = 'POUSO NO OCEANO CONFIRMADO';
      }

      const finished = nextProg >= 100;

      return {
        ...state,
        telemetry: {
          ...state.telemetry,
          commsStatus,
          missionStatusLabel: statusLabel,
        },
        phase3: {
          ...state.phase3,
          reentryProgress: nextProg,
          reentryMoment: moment,
          reentryPlaying: !finished,
          capsuleTemperatureC: temp,
          gForce,
          altitudeKm: alt,
          velocityKmS: vel,
        },
        alerts: alerts.slice(0, 8),
      };
    }

    case 'COMPLETE_MISSION_TO_SUMMARY': {
      return {
        ...state,
        phase: 4,
        telemetry: {
          ...state.telemetry,
          missionStatusLabel: 'MISSÃO CONCLUÍDA!',
        },
      };
    }

    default:
      return state;
  }
}
