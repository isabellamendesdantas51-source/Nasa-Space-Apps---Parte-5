import { BudgetAdminConfig, SubsystemOption, SubsystemSlot } from '../types/mission';

export const CINEMATIC_IMAGES = {
  lunarFlyby: '/src/assets/images/orion_lunar_flyby_1794677501748.jpg',
  earthHorizon: '/src/assets/images/earth_reentry_horizon_1794677501632.jpg',
  pacificSplashdown: '/src/assets/images/pacific_splashdown_orion_1794677502117.jpg',
};

export const SUBSYSTEM_CATALOG: Record<SubsystemSlot, SubsystemOption[]> = {
  engine: [
    {
      id: 'eng_aj10_std',
      slot: 'engine',
      name: 'Motor Principal AJ10-190 Padrão',
      code: 'ESM-AJ10',
      description: 'Propulsor hipergólico equilibrado para injeção translunar e correções orbitais.',
      defaultCost: 8500,
      stats: { fuelEfficiencyMultiplier: 1.0 },
    },
    {
      id: 'eng_rlx_high',
      slot: 'engine',
      name: 'Propulsor Criogênico RL-X Avançado',
      code: 'ESM-RLX',
      description: 'Impulso específico superior. Reduz em 30% o consumo de combustível nas manobras TCM.',
      defaultCost: 13500,
      stats: { fuelEfficiencyMultiplier: 0.7 },
    },
    {
      id: 'eng_compact_eco',
      slot: 'engine',
      name: 'Propulsor Auxiliar Compacto',
      code: 'ESM-AUX',
      description: 'Unidade econômica com menor massa seca, porém consome 25% mais combustível por queima.',
      defaultCost: 5500,
      stats: { fuelEfficiencyMultiplier: 1.25 },
    },
  ],
  tank: [
    {
      id: 'tank_std_120',
      slot: 'tank',
      name: 'Tanques Padrão + Buffer 120 GB',
      code: 'TNK-120',
      description: 'Reserva nominal de propelente (82%) e memória científica de estado sólido de 120 GB.',
      defaultCost: 6500,
      stats: { fuelCapacityPct: 82, scienceBufferGb: 120 },
    },
    {
      id: 'tank_ext_240',
      slot: 'tank',
      name: 'Tanques Estendidos + Buffer 240 GB',
      code: 'TNK-240',
      description: 'Capacidade máxima de combustível (100%) e buffer científico de alta densidade para o lado oculto.',
      defaultCost: 11000,
      stats: { fuelCapacityPct: 100, scienceBufferGb: 240 },
    },
    {
      id: 'tank_eco_75',
      slot: 'tank',
      name: 'Tanques Compactos + Buffer 75 GB',
      code: 'TNK-075',
      description: 'Capacidade reduzida (65% combustível, 75 GB buffer). Exige rigoroso controle de manobras.',
      defaultCost: 4000,
      stats: { fuelCapacityPct: 65, scienceBufferGb: 75 },
    },
  ],
  shield: [
    {
      id: 'shd_avcoat_std',
      slot: 'shield',
      name: 'Escudo Térmico Avcoat Padrão',
      code: 'TPS-STD',
      description: 'Proteção ablativa nominal para reentrada a 11 km/s e blindagem básica de radiação.',
      defaultCost: 7500,
      stats: { heatResistancePct: 88, radiationProtectionPct: 76 },
    },
    {
      id: 'shd_avcoat_pro',
      slot: 'shield',
      name: 'Avcoat Reforçado Multi-Camada',
      code: 'TPS-PRO',
      description: 'Proteção térmica e anti-radiação de alto desempenho contra tempestades solares.',
      defaultCost: 12000,
      stats: { heatResistancePct: 98, radiationProtectionPct: 90 },
    },
    {
      id: 'shd_light_eco',
      slot: 'shield',
      name: 'Escudo Leve Econômico',
      code: 'TPS-ECO',
      description: 'Menor margem térmica e blindagem básica (64% proteção inicial). Requer abrigo ativo em crises.',
      defaultCost: 4500,
      stats: { heatResistancePct: 76, radiationProtectionPct: 64 },
    },
  ],
  antenna: [
    {
      id: 'ant_sx_std',
      slot: 'antenna',
      name: 'Antena Banda S/X Padrão',
      code: 'COM-SX',
      description: 'Link de telemetria profundo confiável com taxa padrão de download lunar.',
      defaultCost: 5500,
      stats: { commsBonusMultiplier: 1.0, commsRateGbPerSec: 22 },
    },
    {
      id: 'ant_ka_high',
      slot: 'antenna',
      name: 'Matriz Ka-Band Alto Ganho',
      code: 'COM-KA',
      description: 'Transmissão ultra-rápida pós-blecaute com +35% de pontuação científica por pacote.',
      defaultCost: 9500,
      stats: { commsBonusMultiplier: 1.35, commsRateGbPerSec: 38 },
    },
    {
      id: 'ant_basic_low',
      slot: 'antenna',
      name: 'Transceptor Básico Omni',
      code: 'COM-OMNI',
      description: 'Baixo custo operacional, porém taxa reduzida e 15% menos eficiência científica.',
      defaultCost: 3500,
      stats: { commsBonusMultiplier: 0.85, commsRateGbPerSec: 14 },
    },
  ],
  power: [
    {
      id: 'pwr_std_100',
      slot: 'power',
      name: '4 Asas Solares + Banco 100 kWh',
      code: 'PWR-100',
      description: 'Configuração padrão da Orion com geração solar estável e reserva segura para eclipses.',
      defaultCost: 7000,
      stats: { batteryCapacityPct: 88, solarEfficiencyPct: 100 },
    },
    {
      id: 'pwr_ultra_140',
      slot: 'power',
      name: 'Arranjo Solar Ultra + 140 kWh',
      code: 'PWR-140',
      description: 'Bateria de 100% de carga máxima (140 kWh) e recarga 35% mais rápida ao sair do eclipse.',
      defaultCost: 11000,
      stats: { batteryCapacityPct: 100, solarEfficiencyPct: 135 },
    },
    {
      id: 'pwr_eco_75',
      slot: 'power',
      name: 'Células Compactas + 75 kWh',
      code: 'PWR-075',
      description: 'Reserva energética limitada (72%). Eclipses prolongados exigem cuidado extra.',
      defaultCost: 4500,
      stats: { batteryCapacityPct: 72, solarEfficiencyPct: 85 },
    },
  ],
};

export const SLOT_LABELS: Record<SubsystemSlot, { title: string; subtitle: string }> = {
  engine: { title: 'Propulsão Principal', subtitle: 'Motor do Módulo de Serviço Europeu' },
  tank: { title: 'Tanques e Buffer Científico', subtitle: 'Reserva de propelente e memória de voo' },
  shield: { title: 'Escudo Térmico e Blindagem', subtitle: 'Proteção de reentrada e radiação' },
  antenna: { title: 'Comunicação Espacial', subtitle: 'Antenas de alto ganho e telemetria' },
  power: { title: 'Energia Solar e Baterias', subtitle: 'Asas fotovoltaicas e células Li-Ion' },
};

export function createDefaultAdminConfig(): BudgetAdminConfig {
  const componentCosts: Record<string, number> = {};
  (Object.keys(SUBSYSTEM_CATALOG) as SubsystemSlot[]).forEach((slot) => {
    SUBSYSTEM_CATALOG[slot].forEach((opt) => {
      componentCosts[opt.id] = opt.defaultCost;
    });
  });

  return {
    phase1Initial: 45000,
    phase2Initial: 30000,
    phase3Initial: 25000,
    componentCosts,
    operationCosts: {
      tliPreparation: 4500,
      phase2EnergyCalibration: 3500,
      phase2SystemMaintenance: 4000,
      phase2DeepSpaceRelay: 4500,
      phase2RadiationShelter: 6500,
      phase2StormRecovery: 8000,
      phase3TcmBurn: 6000,
      phase3ReentryPrep: 5000,
      phase3OceanRecovery: 4500,
    },
  };
}

export const DEFAULT_SELECTED_SUBSYSTEMS: Record<SubsystemSlot, string> = {
  engine: 'eng_aj10_std',
  tank: 'tank_std_120',
  shield: 'shd_avcoat_std',
  antenna: 'ant_sx_std',
  power: 'pwr_std_100',
};

export function formatCredits(value: number): string {
  return `CR$ ${Math.round(value).toLocaleString('pt-BR')}`;
}
