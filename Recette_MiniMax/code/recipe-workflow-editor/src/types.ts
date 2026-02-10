export type PhaseType = 'start' | 'parameter' | 'operator-prompt' | 'instrument' | 'wait' | 'profile' | 'condition' | 'cascade' | 'end';

export interface ParameterConfig {
  setpoints: { variable: string; value: string; unit: string; alarmHigh?: number; alarmLow?: number }[];  // value accepts numbers or formulas
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
}

export interface Recipe {
  id: string;
  name: string;
  operations: Operation[];
  customVariables?: CustomVariable[];
  orientation?: 'vertical' | 'horizontal';
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
