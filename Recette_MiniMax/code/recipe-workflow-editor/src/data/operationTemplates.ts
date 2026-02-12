import type { PhaseType, BlockConfig } from '../types';

export interface TemplateBlock {
  placeholderId: string;
  type: PhaseType;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  config?: BlockConfig;
}

export interface TemplateConnection {
  fromPlaceholder: string;
  toPlaceholder: string;
  branch?: string;
}

export type TemplateCategory = 'Preparation' | 'Production' | 'Cleaning' | 'Utility';

export interface OperationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon: string;
  blocks: TemplateBlock[];
  connections: TemplateConnection[];
}

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string; color: string }[] = [
  { key: 'Preparation', label: 'Preparation', color: '#22c55e' },
  { key: 'Production', label: 'Production', color: '#3b82f6' },
  { key: 'Cleaning', label: 'Cleaning', color: '#8b5cf6' },
  { key: 'Utility', label: 'Utility', color: '#6b7280' },
];

export const OPERATION_TEMPLATES: OperationTemplate[] = [
  // ─── Preparation ───
  {
    id: 'tpl-prep-cho',
    name: 'Preparation CHO',
    category: 'Preparation',
    description: 'Init parametres + calibrations + verification operateur',
    icon: 'Beaker',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut Preparation', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'parameter', label: 'Init Parametres', subtitle: 'pH=7.0, T=37C, pO2=30%', x: 280, y: 110, config: { setpoints: [{ variable: 'pH', value: '7.0', unit: '' }, { variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'pO2', value: '30', unit: '%' }] } },
      { placeholderId: 'b3', type: 'instrument', label: 'Calibration pH', subtitle: 'pH Calibration', x: 280, y: 200, config: { sequence: 'pH Calibration', forceRestart: false } },
      { placeholderId: 'b4', type: 'instrument', label: 'Calibration DO', subtitle: 'DO Calibration', x: 280, y: 290, config: { sequence: 'DO Calibration', forceRestart: false } },
      { placeholderId: 'b5', type: 'operator-prompt', label: 'Verification', x: 280, y: 380, config: { message: 'Calibrations OK ? Pret a continuer ?', options: ['Confirmer', 'Recalibrer'] } },
      { placeholderId: 'b6', type: 'end', label: 'Fin Preparation', x: 280, y: 470 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
      { fromPlaceholder: 'b5', toPlaceholder: 'b6', branch: 'Confirmer' },
      { fromPlaceholder: 'b5', toPlaceholder: 'b3', branch: 'Recalibrer' },
    ],
  },
  {
    id: 'tpl-inoculation',
    name: 'Inoculation',
    category: 'Preparation',
    description: 'Transfert inoculum + attente stabilisation',
    icon: 'Droplets',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut Inoculation', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'instrument', label: 'Transfert Inoculum', subtitle: 'Inoculation Prep', x: 280, y: 110, config: { sequence: 'Inoculation Prep', forceRestart: true } },
      { placeholderId: 'b3', type: 'wait', label: 'Stabilisation', subtitle: '15 min', x: 280, y: 200, config: { duration: 15, unit: 'min' } },
      { placeholderId: 'b4', type: 'operator-prompt', label: 'Confirmer Inoculation', x: 280, y: 290, config: { message: 'Inoculation reussie ? Verifier absence de contamination.', options: ['OK', 'Probleme'] } },
      { placeholderId: 'b5', type: 'end', label: 'Fin Inoculation', x: 280, y: 380 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5', branch: 'OK' },
    ],
  },

  // ─── Production ───
  {
    id: 'tpl-fedbatch-start',
    name: 'Fed-Batch Start',
    category: 'Production',
    description: 'Demarrage alimentation + condition glucose + profil feed',
    icon: 'TrendingUp',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut Fed-Batch', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'condition', label: 'Glucose bas ?', x: 280, y: 120, config: { expression: 'Glucose', operator: '<', value: 1, useExpression: false } },
      { placeholderId: 'b3', type: 'instrument', label: 'Amorce Pompe Feed', subtitle: 'Feed Pump Prime', x: 280, y: 230, config: { sequence: 'Feed Pump Prime', forceRestart: false } },
      { placeholderId: 'b4', type: 'profile', label: 'Profil Feed', subtitle: 'Rampe 0-5 mL/min', x: 280, y: 320, config: { points: [{ time: 0, value: 0 }, { time: 30, value: 2 }, { time: 60, value: 5 }], variable: 'Feed_Rate', unit: 'mL/min' } },
      { placeholderId: 'b5', type: 'end', label: 'Fin Demarrage', x: 280, y: 410 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3', branch: 'true' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
    ],
  },
  {
    id: 'tpl-fermentation-batch',
    name: 'Fermentation Batch',
    category: 'Production',
    description: 'Phase batch classique avec controle pO2 en cascade',
    icon: 'Activity',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut Batch', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'parameter', label: 'Consignes Batch', subtitle: 'pH=7, T=37C, pO2=30%', x: 280, y: 110, config: { setpoints: [{ variable: 'pH', value: '7.0', unit: '' }, { variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'pO2', value: '30', unit: '%' }, { variable: 'Agitation', value: '200', unit: 'rpm' }] } },
      { placeholderId: 'b3', type: 'cascade', label: 'Cascade pO2', subtitle: 'Agitation + Air', x: 280, y: 210, config: { masterVariable: 'pO2', setpoint: 30, deadband: 0.5, actuators: [{ id: 'act1', name: 'Agitation', variable: 'STIRR_1', unit: 'rpm', points: [{ x: 0, y: 200 }, { x: 100, y: 800 }], visible: true, color: '#3b82f6', min: 0, max: 100, xp: 100, ti: 300, td: 0, hysteresis: '00:00', mode: 'on' }, { id: 'act2', name: 'Debit Air', variable: 'AIRSP', unit: 'L/min', points: [{ x: 0, y: 0.5 }, { x: 100, y: 5 }], visible: true, color: '#22c55e', min: 0, max: 100, xp: 100, ti: 300, td: 0, hysteresis: '00:00', mode: 'on' }] } },
      { placeholderId: 'b4', type: 'wait', label: 'Phase Batch', subtitle: '24h', x: 280, y: 310, config: { duration: 24, unit: 'h' } },
      { placeholderId: 'b5', type: 'end', label: 'Fin Batch', x: 280, y: 400 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
    ],
  },

  // ─── Cleaning ───
  {
    id: 'tpl-cip',
    name: 'CIP',
    category: 'Cleaning',
    description: 'Cycle CIP complet : rinse + NaOH + rinse + verification',
    icon: 'Droplet',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut CIP', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'instrument', label: 'Pre-Rincage', subtitle: 'Media Transfer', x: 280, y: 110, config: { sequence: 'Media Transfer', forceRestart: true } },
      { placeholderId: 'b3', type: 'instrument', label: 'Cycle CIP', subtitle: 'CIP Cleaning Cycle', x: 280, y: 200, config: { sequence: 'CIP Cleaning Cycle', forceRestart: true } },
      { placeholderId: 'b4', type: 'wait', label: 'Trempage NaOH', subtitle: '30 min', x: 280, y: 290, config: { duration: 30, unit: 'min' } },
      { placeholderId: 'b5', type: 'instrument', label: 'Rincage Final', subtitle: 'Media Transfer', x: 280, y: 380, config: { sequence: 'Media Transfer', forceRestart: true } },
      { placeholderId: 'b6', type: 'operator-prompt', label: 'Verification CIP', x: 280, y: 470, config: { message: 'CIP termine. Conductivite rincage OK ?', options: ['Valide', 'Re-rincer'] } },
      { placeholderId: 'b7', type: 'end', label: 'Fin CIP', x: 280, y: 560 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
      { fromPlaceholder: 'b5', toPlaceholder: 'b6' },
      { fromPlaceholder: 'b6', toPlaceholder: 'b7', branch: 'Valide' },
      { fromPlaceholder: 'b6', toPlaceholder: 'b5', branch: 'Re-rincer' },
    ],
  },
  {
    id: 'tpl-sip',
    name: 'SIP',
    category: 'Cleaning',
    description: 'Sterilisation en place : montee en temperature + maintien + refroidissement',
    icon: 'Flame',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut SIP', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'instrument', label: 'Sequence SIP', subtitle: 'SIP Sterilization', x: 280, y: 110, config: { sequence: 'SIP Sterilization', forceRestart: true } },
      { placeholderId: 'b3', type: 'profile', label: 'Rampe Temperature', subtitle: '25-121C', x: 280, y: 200, config: { points: [{ time: 0, value: 25 }, { time: 20, value: 121 }], variable: 'Temperature', unit: 'C' } },
      { placeholderId: 'b4', type: 'wait', label: 'Maintien 121C', subtitle: '20 min', x: 280, y: 290, config: { duration: 20, unit: 'min' } },
      { placeholderId: 'b5', type: 'profile', label: 'Refroidissement', subtitle: '121-37C', x: 280, y: 380, config: { points: [{ time: 0, value: 121 }, { time: 30, value: 37 }], variable: 'Temperature', unit: 'C' } },
      { placeholderId: 'b6', type: 'end', label: 'Fin SIP', x: 280, y: 470 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
      { fromPlaceholder: 'b5', toPlaceholder: 'b6' },
    ],
  },

  // ─── Utility ───
  {
    id: 'tpl-shutdown',
    name: 'Shutdown',
    category: 'Utility',
    description: 'Arret controle : refroidissement + vidange + mise en securite',
    icon: 'Power',
    blocks: [
      { placeholderId: 'b1', type: 'start', label: 'Debut Shutdown', x: 280, y: 20 },
      { placeholderId: 'b2', type: 'parameter', label: 'Arret Regulations', subtitle: 'Consignes a 0', x: 280, y: 110, config: { setpoints: [{ variable: 'Agitation', value: '0', unit: 'rpm' }, { variable: 'pO2', value: '0', unit: '%', valueMode: 'reset' }] } },
      { placeholderId: 'b3', type: 'profile', label: 'Refroidissement', subtitle: '37-20C', x: 280, y: 200, config: { points: [{ time: 0, value: 37 }, { time: 30, value: 20 }], variable: 'Temperature', unit: 'C' } },
      { placeholderId: 'b4', type: 'instrument', label: 'Vidange', subtitle: 'Harvest Sequence', x: 280, y: 290, config: { sequence: 'Harvest Sequence', forceRestart: true } },
      { placeholderId: 'b5', type: 'operator-prompt', label: 'Confirmation Arret', x: 280, y: 380, config: { message: 'Reacteur vide et refroidi. Confirmer mise en securite ?', options: ['Confirmer'] } },
      { placeholderId: 'b6', type: 'end', label: 'Fin Shutdown', x: 280, y: 470 },
    ],
    connections: [
      { fromPlaceholder: 'b1', toPlaceholder: 'b2' },
      { fromPlaceholder: 'b2', toPlaceholder: 'b3' },
      { fromPlaceholder: 'b3', toPlaceholder: 'b4' },
      { fromPlaceholder: 'b4', toPlaceholder: 'b5' },
      { fromPlaceholder: 'b5', toPlaceholder: 'b6', branch: 'Confirmer' },
    ],
  },
];
