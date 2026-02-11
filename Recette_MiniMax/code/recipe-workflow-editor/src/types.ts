export type PhaseType = 'start' | 'parameter' | 'operator-prompt' | 'instrument' | 'wait' | 'profile' | 'condition' | 'cascade' | 'end';

export interface SetpointEntry {
  variable: string;
  value: string;
  unit: string;
  alarmHigh?: number;
  alarmLow?: number;
  valueMode?: 'value' | 'calculation' | 'reset';  // default 'value' for backward compat
  formula?: string;  // used when valueMode === 'calculation'
  formulaName?: string;  // name of the calculation (required in MFCS)
  formulaDescription?: string;  // description of the calculation
  resultLimitation?: boolean;  // enable min/max result clamping
  resultMin?: number;
  resultMax?: number;
}

export interface ParameterConfig {
  setpoints: SetpointEntry[];  // value accepts numbers or formulas
}

export interface InstrumentConfig {
  sequence: string;  // DCU sequence/phase name
  forceRestart: boolean;  // Force restart if already running
}

export interface WaitConfig {
  duration: number;
  unit: 's' | 'min' | 'h';
  condition?: string;
}

export interface ProfileConfig {
  points: { time: number; value: number }[];
  variable: string;
  unit: string;
}

export interface OperatorPromptConfig {
  message: string;
  options: string[];
}

export interface ConditionConfig {
  expression: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  useExpression?: boolean;
}

export interface CascadePoint {
  x: number;  // Out% (0-100)
  y: number;  // Valeur physique
}

export interface CascadeActuator {
  id: string;
  name: string;           // Ex: 'Agitation', 'Débit gaz', 'O2 enrichi'
  variable: string;       // Variable de sortie (STIRR, AIRSP, O2SP)
  unit: string;           // rpm, L/min, %
  points: CascadePoint[]; // Liste de points (x%, y value)
  visible: boolean;       // Afficher dans le graphique
  color: string;          // Couleur de la courbe
  // PID parameters
  min: number;            // Minimum % (ex: 10%)
  max: number;            // Maximum % (ex: 66.6%)
  xp: number;             // Gain proportionnel XP (%)
  ti: number;             // Temps intégral TI (s)
  td: number;             // Temps dérivé TD (s)
  hysteresis: string;     // Hystérésis (ex: "05:00")
  mode: 'on' | 'off';     // Mode actif
}

export interface CascadeConfig {
  masterVariable: string;  // Variable maître (pO2, pH...)
  setpoint: number;        // Consigne (ex: 30%)
  deadband: number;        // Bande morte (ex: 0.5%)
  actuators: CascadeActuator[];
}

export type BlockConfig = ParameterConfig | InstrumentConfig | WaitConfig | ProfileConfig | OperatorPromptConfig | ConditionConfig | CascadeConfig;

export interface Block {
  id: string;
  type: PhaseType;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  config?: BlockConfig;
}

export interface TransitionCondition {
  variable: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  formula?: string; // Optional complex formula
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  branch?: 'true' | 'false' | string; // Supports condition branches or prompt option names
  formula?: string; // Simple formula/expression
  condition?: TransitionCondition; // Full condition on transition
  parallelGroup?: string; // Group ID for parallel connections (share same condition)
  forkOffset?: number; // Offset for fork point position (default 50)
}

export interface Operation {
  id: string;
  number: number;
  name: string;
  blocks: Block[];
  connections: Connection[];
}

export interface CustomVariable {
  id: string;
  name: string;
  formula: string;
  targetVariable?: string;   // Variable cible (ex: O2_Totalizer.Value)
  description?: string;
  resultLimitation?: boolean;
  resultMin?: number;
  resultMax?: number;
}

export interface RecipeUnit {
  name: string;          // e.g., 'L-1', 'Feed-1', 'Balance-1'
  variables: string[];   // Variables available on this unit
}

export interface Recipe {
  id: string;
  name: string;
  operations: Operation[];
  customVariables?: CustomVariable[];
  orientation?: 'vertical' | 'horizontal';
  units?: RecipeUnit[];
}

export const PHASE_CONFIG: Record<PhaseType, { color: string; bgColor: string; icon: string; shape?: 'diamond' }> = {
  'start': { color: '#22c55e', bgColor: '#dcfce7', icon: 'Play' },
  'parameter': { color: '#3b82f6', bgColor: '#dbeafe', icon: 'Settings' },
  'operator-prompt': { color: '#f97316', bgColor: '#ffedd5', icon: 'MessageCircle' },
  'instrument': { color: '#8b5cf6', bgColor: '#ede9fe', icon: 'Cpu' },
  'wait': { color: '#6b7280', bgColor: '#f3f4f6', icon: 'Clock' },
  'profile': { color: '#ec4899', bgColor: '#fce7f3', icon: 'LineChart' },
  'condition': { color: '#eab308', bgColor: '#fef9c3', icon: 'GitBranch', shape: 'diamond' },
  'cascade': { color: '#06b6d4', bgColor: '#cffafe', icon: 'Layers' },
  'end': { color: '#ef4444', bgColor: '#fee2e2', icon: 'Square' },
};

export const VARIABLES = ['pH', 'DO%', 'Temperature', 'Agitation', 'ProcessTime', 'Pressure', 'Flow', 'Level', 'CO2', 'O2', 'Biomass', 'Glucose', 'Feed_Rate'];
export const DCU_SEQUENCES = [
  'pH Calibration',
  'DO Calibration',
  'CIP Cleaning Cycle',
  'SIP Sterilization',
  'Foam Control Sequence',
  'Feed Pump Prime',
  'Harvest Sequence',
  'Media Transfer',
  'Inoculation Prep'
];
export const FUNCTIONS = ['min', 'max', 'abs', 'sqrt', 'avg'];

// MFCS math functions for the FormulaEditor
export const MATH_FUNCTIONS = [
  'sin', 'cos', 'tan', 'power', 'exp', 'sqrt', 'ln', 'log10',
  'floor', 'ceil', 'abs', 'mean', 'getValue', 'calcCycle'
];

// MFCS process variables (Controller.Property format)
export const MFCS_VARIABLES = [
  'pH.Value', 'pH.Setpoint', 'pH.Output',
  'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
  'pO2.Value', 'pO2.Setpoint', 'pO2.Output',
  'STIRR_1.Value', 'STIRR_1.Setpoint', 'STIRR_1.Output',
  'AIRSP.Value', 'AIRSP.Setpoint', 'AIRSP.Output',
  'O2SP.Value', 'O2SP.Setpoint', 'O2SP.Output',
  'CO2.Value', 'CO2.Setpoint',
  'FEED.Value', 'FEED.Setpoint', 'FEED.Output',
  'LEVEL.Value', 'LEVEL.Setpoint',
  'PRESSURE.Value', 'PRESSURE.Setpoint',
  'GASFL_1.Value', 'GASFL_1.Setpoint', 'GASFL_1.Output',
  'ProcessTime', 'BatchTime', 'OperationTime'
];

// Default unit with all MFCS variables
export const DEFAULT_UNITS: RecipeUnit[] = [
  { name: 'L-1', variables: [...MFCS_VARIABLES] }
];

// Given a formula, find which units are compatible (have ALL referenced variables)
export function getCompatibleUnits(formula: string, units: RecipeUnit[]): string[] {
  if (!formula) return units.map(u => u.name);
  // Collect all MFCS variables present in the formula
  const allVars = new Set<string>();
  for (const u of units) for (const v of u.variables) allVars.add(v);
  const usedVars = Array.from(allVars).filter(v => formula.includes(v));
  if (usedVars.length === 0) return units.map(u => u.name);
  // A unit is compatible if it has ALL the used variables
  return units.filter(u => usedVars.every(v => u.variables.includes(v))).map(u => u.name);
}
