/**
 * Seeds the app with rich demo data: multiple recipes, versions, and branches.
 * Only runs once (when no versioning data exists).
 */
import { Recipe } from '../types';
import { RecipeCommit, RecipeBranch, BRANCH_COLORS } from './types';

const id = () => Math.random().toString(36).substr(2, 9);

// Offsets for realistic timestamps (hours ago)
const hoursAgo = (h: number) => Date.now() - h * 3600_000;

// ========================================
// Recipe 1: CHO-Fed-Batch (rich, 5 versions, 2 branches)
// ========================================
const choV1: Recipe = {
  id: 'cho-fb', name: 'CHO-Fed-Batch',
  orientation: 'vertical',
  operations: [
    {
      id: 'cho-op1', number: 1, name: 'Preparation Milieu',
      blocks: [
        { id: 'cho-b1', type: 'start', label: 'Debut Prep', x: 300, y: 20 },
        { id: 'cho-b2', type: 'parameter', label: 'Consignes initiales', subtitle: 'pH=7.2, T=37C, DO=50%', x: 280, y: 110, config: { setpoints: [{ variable: 'pH', value: '7.2', unit: '' }, { variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'DO%', value: '50', unit: '%' }] } },
        { id: 'cho-b3', type: 'instrument', label: 'Calibration pH', subtitle: 'pH Calibration', x: 280, y: 210, config: { sequence: 'pH Calibration', forceRestart: false } },
        { id: 'cho-b4', type: 'end', label: 'Fin Prep', x: 300, y: 310 },
      ],
      connections: [
        { id: 'cho-c1', from: 'cho-b1', to: 'cho-b2' },
        { id: 'cho-c2', from: 'cho-b2', to: 'cho-b3' },
        { id: 'cho-c3', from: 'cho-b3', to: 'cho-b4', condition: { variable: 'ProcessTime', operator: '>=', value: 10 } },
      ],
    },
    {
      id: 'cho-op2', number: 2, name: 'Inoculation',
      blocks: [
        { id: 'cho-b5', type: 'start', label: 'Debut Inoc', x: 300, y: 20 },
        { id: 'cho-b6', type: 'operator-prompt', label: 'Confirmer inoculation', x: 280, y: 110, config: { message: 'Inoculer le bioréacteur maintenant?', options: ['Inoculer', 'Reporter'] } },
        { id: 'cho-b7', type: 'wait', label: 'Stabilisation 2h', subtitle: '2 heures', x: 280, y: 210, config: { duration: 2, unit: 'h' } },
        { id: 'cho-b8', type: 'end', label: 'Fin Inoc', x: 300, y: 310 },
      ],
      connections: [
        { id: 'cho-c4', from: 'cho-b5', to: 'cho-b6' },
        { id: 'cho-c5', from: 'cho-b6', to: 'cho-b7', branch: 'Inoculer' },
        { id: 'cho-c6', from: 'cho-b7', to: 'cho-b8' },
      ],
    },
    {
      id: 'cho-op3', number: 3, name: 'Phase Batch',
      blocks: [
        { id: 'cho-b9', type: 'start', label: 'Debut Batch', x: 300, y: 20 },
        { id: 'cho-b10', type: 'cascade', label: 'Regulation DO', subtitle: 'DO cascade', x: 250, y: 120, config: { masterVariable: 'DO%', setpoint: 50, deadband: 0.5, actuators: [{ id: 'a1', name: 'STIRR_1', variable: 'Agitation', unit: 'rpm', points: [{ x: 5, y: 200 }, { x: 50, y: 600 }], visible: true, color: '#3b82f6', min: 5, max: 50, xp: 150, ti: 100, td: 0, hysteresis: '05:00', mode: 'on' }, { id: 'a2', name: 'AIRFL_1', variable: 'Flow', unit: 'L/min', points: [{ x: 10, y: 0.5 }, { x: 66, y: 5 }], visible: true, color: '#22c55e', min: 10, max: 66, xp: 90, ti: 50, td: 0, hysteresis: '05:00', mode: 'on' }] } },
        { id: 'cho-b11', type: 'condition', label: 'Glucose < 2?', x: 290, y: 260, config: { expression: 'Glucose', operator: '<', value: 2, useExpression: false } },
        { id: 'cho-b12', type: 'end', label: 'Fin Batch', x: 300, y: 370 },
      ],
      connections: [
        { id: 'cho-c7', from: 'cho-b9', to: 'cho-b10' },
        { id: 'cho-c8', from: 'cho-b10', to: 'cho-b11', condition: { variable: 'ProcessTime', operator: '>', value: 48 } },
        { id: 'cho-c9', from: 'cho-b11', to: 'cho-b12', branch: 'true' },
      ],
    },
  ],
  customVariables: [{ id: 'cv-cho1', name: 'GrowthRate', formula: 'Biomass / ProcessTime' }],
};

// V2: changed pH setpoint and added alarm
const choV2: Recipe = JSON.parse(JSON.stringify(choV1));
(choV2.operations[0].blocks[1].config as any).setpoints[0].value = '7.0';
(choV2.operations[0].blocks[1].config as any).setpoints[0].alarmHigh = 7.5;
(choV2.operations[0].blocks[1].config as any).setpoints[0].alarmLow = 6.5;
choV2.operations[0].blocks[1].subtitle = 'pH=7.0, T=37C, DO=50%';

// V3: changed wait time, added a block
const choV3: Recipe = JSON.parse(JSON.stringify(choV2));
(choV3.operations[1].blocks[2].config as any).duration = 4;
choV3.operations[1].blocks[2].subtitle = '4 heures';
choV3.operations[1].blocks[2].label = 'Stabilisation 4h';

// V4: modified cascade actuator
const choV4: Recipe = JSON.parse(JSON.stringify(choV3));
(choV4.operations[2].blocks[1].config as any).actuators[0].points = [{ x: 5, y: 200 }, { x: 30, y: 400 }, { x: 50, y: 800 }];
(choV4.operations[2].blocks[1].config as any).setpoint = 40;

// V5: added new operation "Fed-Batch"
const choV5: Recipe = JSON.parse(JSON.stringify(choV4));
choV5.operations.push({
  id: 'cho-op4', number: 4, name: 'Phase Fed-Batch',
  blocks: [
    { id: 'cho-b20', type: 'start', label: 'Debut Feed', x: 300, y: 20 },
    { id: 'cho-b21', type: 'parameter', label: 'Demarrer Feed', subtitle: 'Feed_Rate=2mL/h', x: 280, y: 120, config: { setpoints: [{ variable: 'Feed_Rate', value: '2', unit: 'mL/h' }] } },
    { id: 'cho-b22', type: 'profile', label: 'Rampe Feed', subtitle: '2-10 mL/h sur 24h', x: 280, y: 230, config: { points: [{ time: 0, value: 2 }, { time: 12, value: 5 }, { time: 24, value: 10 }], variable: 'Feed_Rate', unit: 'mL/h' } },
    { id: 'cho-b23', type: 'end', label: 'Fin Feed', x: 300, y: 340 },
  ],
  connections: [
    { id: 'cho-c20', from: 'cho-b20', to: 'cho-b21' },
    { id: 'cho-c21', from: 'cho-b21', to: 'cho-b22' },
    { id: 'cho-c22', from: 'cho-b22', to: 'cho-b23', condition: { variable: 'ProcessTime', operator: '>=', value: 72 } },
  ],
});

// Branch "Haute densite": fork from V3, different cascade settings
const choHD: Recipe = JSON.parse(JSON.stringify(choV3));
choHD.name = 'CHO-Fed-Batch';
(choHD.operations[2].blocks[1].config as any).actuators[0].points = [{ x: 5, y: 300 }, { x: 50, y: 1200 }];
(choHD.operations[2].blocks[1].config as any).setpoint = 60;
(choHD.operations[2].blocks[1].config as any).actuators.push({
  id: 'a3', name: 'O2EN_1', variable: 'O2', unit: '%',
  points: [{ x: 50, y: 0 }, { x: 100, y: 100 }],
  visible: true, color: '#f97316', min: 50, max: 100, xp: 5, ti: 300, td: 0, hysteresis: '05:00', mode: 'on'
});

// Branch "pH bas" on CHO: different pH
const choPHBas: Recipe = JSON.parse(JSON.stringify(choV3));
choPHBas.name = 'CHO-Fed-Batch';
(choPHBas.operations[0].blocks[1].config as any).setpoints[0].value = '6.8';
choPHBas.operations[0].blocks[1].subtitle = 'pH=6.8, T=37C, DO=50%';

// ========================================
// Recipe 2: E.coli-Expression (3 versions)
// ========================================
const ecoliV1: Recipe = {
  id: 'ecoli-exp', name: 'E.coli-Expression',
  orientation: 'vertical',
  operations: [
    {
      id: 'ec-op1', number: 1, name: 'Pre-culture',
      blocks: [
        { id: 'ec-b1', type: 'start', label: 'Debut', x: 300, y: 20 },
        { id: 'ec-b2', type: 'parameter', label: 'Parametres LB', subtitle: 'T=37C, pH=7, agit=250rpm', x: 280, y: 110, config: { setpoints: [{ variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'pH', value: '7', unit: '' }, { variable: 'Agitation', value: '250', unit: 'rpm' }] } },
        { id: 'ec-b3', type: 'wait', label: 'Croissance overnight', subtitle: '16 heures', x: 280, y: 210, config: { duration: 16, unit: 'h' } },
        { id: 'ec-b4', type: 'end', label: 'Fin', x: 300, y: 310 },
      ],
      connections: [
        { id: 'ec-c1', from: 'ec-b1', to: 'ec-b2' },
        { id: 'ec-c2', from: 'ec-b2', to: 'ec-b3' },
        { id: 'ec-c3', from: 'ec-b3', to: 'ec-b4' },
      ],
    },
    {
      id: 'ec-op2', number: 2, name: 'Induction IPTG',
      blocks: [
        { id: 'ec-b5', type: 'start', label: 'Debut Induction', x: 300, y: 20 },
        { id: 'ec-b6', type: 'condition', label: 'OD600 > 0.6?', x: 290, y: 120, config: { expression: 'Biomass', operator: '>', value: 0.6, useExpression: false } },
        { id: 'ec-b7', type: 'parameter', label: 'Ajout IPTG', subtitle: 'IPTG=1mM', x: 280, y: 250, config: { setpoints: [{ variable: 'Feed_Rate', value: '1', unit: 'mM' }] } },
        { id: 'ec-b8', type: 'parameter', label: 'Baisser Temperature', subtitle: 'T=18C', x: 280, y: 350, config: { setpoints: [{ variable: 'Temperature', value: '18', unit: 'C' }] } },
        { id: 'ec-b9', type: 'wait', label: 'Expression 20h', subtitle: '20 heures', x: 280, y: 450, config: { duration: 20, unit: 'h' } },
        { id: 'ec-b10', type: 'end', label: 'Fin Induction', x: 300, y: 550 },
      ],
      connections: [
        { id: 'ec-c4', from: 'ec-b5', to: 'ec-b6' },
        { id: 'ec-c5', from: 'ec-b6', to: 'ec-b7', branch: 'true' },
        { id: 'ec-c6', from: 'ec-b7', to: 'ec-b8' },
        { id: 'ec-c7', from: 'ec-b8', to: 'ec-b9' },
        { id: 'ec-c8', from: 'ec-b9', to: 'ec-b10' },
      ],
    },
  ],
};

// V2: changed induction temp to 25C and wait to 6h
const ecoliV2: Recipe = JSON.parse(JSON.stringify(ecoliV1));
(ecoliV2.operations[1].blocks[3].config as any).setpoints[0].value = '25';
ecoliV2.operations[1].blocks[3].subtitle = 'T=25C';
(ecoliV2.operations[1].blocks[4].config as any).duration = 6;
ecoliV2.operations[1].blocks[4].subtitle = '6 heures';
ecoliV2.operations[1].blocks[4].label = 'Expression 6h';

// V3: added harvest operation
const ecoliV3: Recipe = JSON.parse(JSON.stringify(ecoliV2));
ecoliV3.operations.push({
  id: 'ec-op3', number: 3, name: 'Recolte',
  blocks: [
    { id: 'ec-b20', type: 'start', label: 'Debut Recolte', x: 300, y: 20 },
    { id: 'ec-b21', type: 'instrument', label: 'Centrifugation', subtitle: 'Harvest Sequence', x: 280, y: 120, config: { sequence: 'Harvest Sequence', forceRestart: true } },
    { id: 'ec-b22', type: 'parameter', label: 'Resuspension', subtitle: 'Buffer PBS', x: 280, y: 230, config: { setpoints: [{ variable: 'Flow', value: '5', unit: 'mL/min' }] } },
    { id: 'ec-b23', type: 'end', label: 'Fin', x: 300, y: 330 },
  ],
  connections: [
    { id: 'ec-c20', from: 'ec-b20', to: 'ec-b21' },
    { id: 'ec-c21', from: 'ec-b21', to: 'ec-b22' },
    { id: 'ec-c22', from: 'ec-b22', to: 'ec-b23' },
  ],
});

// ========================================
// Recipe 3: Levure-Pichia (2 versions, 1 branch)
// ========================================
const pichiaV1: Recipe = {
  id: 'pichia', name: 'Pichia-Secretion',
  orientation: 'vertical',
  operations: [
    {
      id: 'pi-op1', number: 1, name: 'Glycerol Batch',
      blocks: [
        { id: 'pi-b1', type: 'start', label: 'Debut', x: 300, y: 20 },
        { id: 'pi-b2', type: 'parameter', label: 'Milieu glycerol', subtitle: 'T=30C, pH=5, DO=30%', x: 280, y: 110, config: { setpoints: [{ variable: 'Temperature', value: '30', unit: 'C' }, { variable: 'pH', value: '5', unit: '' }, { variable: 'DO%', value: '30', unit: '%' }] } },
        { id: 'pi-b3', type: 'wait', label: 'Batch 24h', subtitle: '24 heures', x: 280, y: 210, config: { duration: 24, unit: 'h' } },
        { id: 'pi-b4', type: 'end', label: 'Fin Batch', x: 300, y: 310 },
      ],
      connections: [
        { id: 'pi-c1', from: 'pi-b1', to: 'pi-b2' },
        { id: 'pi-c2', from: 'pi-b2', to: 'pi-b3' },
        { id: 'pi-c3', from: 'pi-b3', to: 'pi-b4' },
      ],
    },
    {
      id: 'pi-op2', number: 2, name: 'Induction Methanol',
      blocks: [
        { id: 'pi-b5', type: 'start', label: 'Debut Induction', x: 300, y: 20 },
        { id: 'pi-b6', type: 'profile', label: 'Rampe Methanol', subtitle: '0-10 mL/h sur 6h', x: 280, y: 120, config: { points: [{ time: 0, value: 0 }, { time: 3, value: 5 }, { time: 6, value: 10 }], variable: 'Feed_Rate', unit: 'mL/h' } },
        { id: 'pi-b7', type: 'wait', label: 'Induction 72h', subtitle: '72 heures', x: 280, y: 240, config: { duration: 72, unit: 'h' } },
        { id: 'pi-b8', type: 'end', label: 'Fin', x: 300, y: 340 },
      ],
      connections: [
        { id: 'pi-c4', from: 'pi-b5', to: 'pi-b6' },
        { id: 'pi-c5', from: 'pi-b6', to: 'pi-b7' },
        { id: 'pi-c6', from: 'pi-b7', to: 'pi-b8', condition: { variable: 'ProcessTime', operator: '>=', value: 96 } },
      ],
    },
  ],
};

// V2: changed pH to 6 and methanol ramp
const pichiaV2: Recipe = JSON.parse(JSON.stringify(pichiaV1));
(pichiaV2.operations[0].blocks[1].config as any).setpoints[1].value = '6';
pichiaV2.operations[0].blocks[1].subtitle = 'T=30C, pH=6, DO=30%';
(pichiaV2.operations[1].blocks[1].config as any).points = [{ time: 0, value: 0 }, { time: 2, value: 3 }, { time: 6, value: 8 }, { time: 12, value: 12 }];
pichiaV2.operations[1].blocks[1].subtitle = '0-12 mL/h sur 12h';

// Branch "Methanol pulse" - different feed strategy
const pichiaPulse: Recipe = JSON.parse(JSON.stringify(pichiaV1));
(pichiaPulse.operations[1].blocks[1].config as any).points = [{ time: 0, value: 10 }, { time: 1, value: 0 }, { time: 2, value: 10 }, { time: 3, value: 0 }];
pichiaPulse.operations[1].blocks[1].label = 'Pulse Methanol';
pichiaPulse.operations[1].blocks[1].subtitle = 'Pulse 10mL toutes les 2h';

// ========================================
// Recipe 4: CIP-SIP (simple, 2 versions)
// ========================================
const cipV1: Recipe = {
  id: 'cip-sip', name: 'CIP-SIP-Standard',
  orientation: 'vertical',
  operations: [
    {
      id: 'cip-op1', number: 1, name: 'CIP - Nettoyage',
      blocks: [
        { id: 'cip-b1', type: 'start', label: 'Debut CIP', x: 300, y: 20 },
        { id: 'cip-b2', type: 'instrument', label: 'Cycle NaOH', subtitle: 'CIP Cleaning Cycle', x: 280, y: 120, config: { sequence: 'CIP Cleaning Cycle', forceRestart: true } },
        { id: 'cip-b3', type: 'wait', label: 'Rincage 30min', subtitle: '30 minutes', x: 280, y: 220, config: { duration: 30, unit: 'min' } },
        { id: 'cip-b4', type: 'end', label: 'Fin CIP', x: 300, y: 320 },
      ],
      connections: [
        { id: 'cip-c1', from: 'cip-b1', to: 'cip-b2' },
        { id: 'cip-c2', from: 'cip-b2', to: 'cip-b3' },
        { id: 'cip-c3', from: 'cip-b3', to: 'cip-b4' },
      ],
    },
    {
      id: 'cip-op2', number: 2, name: 'SIP - Sterilisation',
      blocks: [
        { id: 'cip-b5', type: 'start', label: 'Debut SIP', x: 300, y: 20 },
        { id: 'cip-b6', type: 'instrument', label: 'Sterilisation', subtitle: 'SIP Sterilization', x: 280, y: 120, config: { sequence: 'SIP Sterilization', forceRestart: true } },
        { id: 'cip-b7', type: 'parameter', label: 'Maintien 121C', subtitle: 'T=121C, P=1bar', x: 280, y: 220, config: { setpoints: [{ variable: 'Temperature', value: '121', unit: 'C' }, { variable: 'Pressure', value: '1', unit: 'bar' }] } },
        { id: 'cip-b8', type: 'wait', label: 'Maintien 20min', subtitle: '20 minutes', x: 280, y: 320, config: { duration: 20, unit: 'min' } },
        { id: 'cip-b9', type: 'end', label: 'Fin SIP', x: 300, y: 420 },
      ],
      connections: [
        { id: 'cip-c4', from: 'cip-b5', to: 'cip-b6' },
        { id: 'cip-c5', from: 'cip-b6', to: 'cip-b7' },
        { id: 'cip-c6', from: 'cip-b7', to: 'cip-b8' },
        { id: 'cip-c7', from: 'cip-b8', to: 'cip-b9', condition: { variable: 'Temperature', operator: '>=', value: 121 } },
      ],
    },
  ],
};

// V2: longer sterilization
const cipV2: Recipe = JSON.parse(JSON.stringify(cipV1));
(cipV2.operations[1].blocks[3].config as any).duration = 30;
cipV2.operations[1].blocks[3].subtitle = '30 minutes';
cipV2.operations[1].blocks[3].label = 'Maintien 30min';

// ========================================
// Recipe 5: Scale-Up-50L (3 versions, 1 branch)
// ========================================
const su50V1: Recipe = {
  id: 'su50', name: 'Scale-Up-50L',
  orientation: 'vertical',
  operations: [
    {
      id: 'su-op1', number: 1, name: 'Preparation Cuve',
      blocks: [
        { id: 'su-b1', type: 'start', label: 'Debut', x: 300, y: 20 },
        { id: 'su-b2', type: 'instrument', label: 'CIP Cuve 50L', subtitle: 'CIP Cleaning', x: 280, y: 120, config: { sequence: 'CIP Cleaning Cycle', forceRestart: true } },
        { id: 'su-b3', type: 'instrument', label: 'SIP Cuve 50L', subtitle: 'SIP', x: 280, y: 230, config: { sequence: 'SIP Sterilization', forceRestart: true } },
        { id: 'su-b4', type: 'operator-prompt', label: 'Cuve prete?', x: 280, y: 340, config: { message: 'Verifier que la cuve 50L est prete pour le transfert', options: ['Prete', 'Pas prete', 'Maintenance'] } },
        { id: 'su-b5', type: 'end', label: 'Fin', x: 300, y: 440 },
      ],
      connections: [
        { id: 'su-c1', from: 'su-b1', to: 'su-b2' },
        { id: 'su-c2', from: 'su-b2', to: 'su-b3' },
        { id: 'su-c3', from: 'su-b3', to: 'su-b4' },
        { id: 'su-c4', from: 'su-b4', to: 'su-b5', branch: 'Prete' },
      ],
    },
    {
      id: 'su-op2', number: 2, name: 'Transfert & Batch',
      blocks: [
        { id: 'su-b6', type: 'start', label: 'Debut Transfert', x: 300, y: 20 },
        { id: 'su-b7', type: 'instrument', label: 'Pompe Transfert', subtitle: 'Media Transfer', x: 280, y: 120, config: { sequence: 'Media Transfer', forceRestart: false } },
        { id: 'su-b8', type: 'parameter', label: 'Consignes 50L', subtitle: 'T=37C, pH=7, agit=150rpm', x: 280, y: 230, config: { setpoints: [{ variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'pH', value: '7', unit: '' }, { variable: 'Agitation', value: '150', unit: 'rpm' }] } },
        { id: 'su-b9', type: 'cascade', label: 'DO Cascade 50L', x: 250, y: 350, config: { masterVariable: 'DO%', setpoint: 40, deadband: 1, actuators: [{ id: 'su-a1', name: 'STIRR_50L', variable: 'Agitation', unit: 'rpm', points: [{ x: 0, y: 100 }, { x: 50, y: 400 }], visible: true, color: '#3b82f6', min: 0, max: 50, xp: 200, ti: 120, td: 0, hysteresis: '05:00', mode: 'on' }] } },
        { id: 'su-b10', type: 'end', label: 'Fin', x: 300, y: 470 },
      ],
      connections: [
        { id: 'su-c5', from: 'su-b6', to: 'su-b7' },
        { id: 'su-c6', from: 'su-b7', to: 'su-b8', condition: { variable: 'Level', operator: '>=', value: 35 } },
        { id: 'su-c7', from: 'su-b8', to: 'su-b9' },
        { id: 'su-c8', from: 'su-b9', to: 'su-b10' },
      ],
    },
  ],
};

// V2: changed agitation to 200rpm and DO setpoint to 50
const su50V2: Recipe = JSON.parse(JSON.stringify(su50V1));
(su50V2.operations[1].blocks[2].config as any).setpoints[2].value = '200';
su50V2.operations[1].blocks[2].subtitle = 'T=37C, pH=7, agit=200rpm';
(su50V2.operations[1].blocks[3].config as any).setpoint = 50;

// V3: added air sparger actuator
const su50V3: Recipe = JSON.parse(JSON.stringify(su50V2));
(su50V3.operations[1].blocks[3].config as any).actuators.push({
  id: 'su-a2', name: 'AIR_50L', variable: 'Flow', unit: 'L/min',
  points: [{ x: 10, y: 2 }, { x: 60, y: 15 }],
  visible: true, color: '#22c55e', min: 10, max: 60, xp: 100, ti: 80, td: 0, hysteresis: '03:00', mode: 'on'
});

// Branch "200L" - scale to 200L
const su200: Recipe = JSON.parse(JSON.stringify(su50V2));
su200.operations[0].blocks[1].label = 'CIP Cuve 200L';
su200.operations[0].blocks[2].label = 'SIP Cuve 200L';
su200.operations[0].blocks[3] = { ...su200.operations[0].blocks[3], config: { message: 'Verifier que la cuve 200L est prete', options: ['Prete', 'Pas prete', 'Maintenance'] } as any };
(su200.operations[1].blocks[2].config as any).setpoints[2].value = '120';
su200.operations[1].blocks[2].subtitle = 'T=37C, pH=7, agit=120rpm';
(su200.operations[1].blocks[3].config as any).actuators[0].points = [{ x: 0, y: 80 }, { x: 50, y: 250 }];

// ========================================
// Recipe 6: mAb-Perfusion-200L (COMPLEX: 8 branches, merges, deep history)
// ========================================
const mabV1: Recipe = {
  id: 'mab-perf', name: 'mAb-Perfusion-200L',
  orientation: 'vertical',
  operations: [
    {
      id: 'mab-op1', number: 1, name: 'Preparation & Inoculation',
      blocks: [
        { id: 'mab-b1', type: 'start', label: 'Debut', x: 300, y: 20 },
        { id: 'mab-b2', type: 'parameter', label: 'Consignes initiales', subtitle: 'T=37C, pH=7.0, DO=40%', x: 280, y: 110, config: { setpoints: [{ variable: 'Temperature', value: '37', unit: 'C' }, { variable: 'pH', value: '7.0', unit: '' }, { variable: 'DO%', value: '40', unit: '%' }] } },
        { id: 'mab-b3', type: 'instrument', label: 'Calibration sondes', subtitle: 'Calibration All Probes', x: 280, y: 210, config: { sequence: 'Calibration All Probes', forceRestart: true } },
        { id: 'mab-b4', type: 'operator-prompt', label: 'Confirmer inoculation', x: 280, y: 310, config: { message: 'Inoculer le bioreacteur avec le train de semence?', options: ['Inoculer', 'Reporter'] } },
        { id: 'mab-b5', type: 'wait', label: 'Adaptation 4h', subtitle: '4 heures', x: 280, y: 410, config: { duration: 4, unit: 'h' } },
        { id: 'mab-b6', type: 'end', label: 'Fin Prep', x: 300, y: 510 },
      ],
      connections: [
        { id: 'mab-c1', from: 'mab-b1', to: 'mab-b2' },
        { id: 'mab-c2', from: 'mab-b2', to: 'mab-b3' },
        { id: 'mab-c3', from: 'mab-b3', to: 'mab-b4' },
        { id: 'mab-c4', from: 'mab-b4', to: 'mab-b5', branch: 'Inoculer' },
        { id: 'mab-c5', from: 'mab-b5', to: 'mab-b6' },
      ],
    },
    {
      id: 'mab-op2', number: 2, name: 'Phase Batch',
      blocks: [
        { id: 'mab-b10', type: 'start', label: 'Debut Batch', x: 300, y: 20 },
        { id: 'mab-b11', type: 'cascade', label: 'Regulation DO', subtitle: 'DO cascade', x: 250, y: 130, config: { masterVariable: 'DO%', setpoint: 40, deadband: 0.5, actuators: [{ id: 'ma1', name: 'STIRR_200L', variable: 'Agitation', unit: 'rpm', points: [{ x: 5, y: 100 }, { x: 50, y: 350 }], visible: true, color: '#3b82f6', min: 5, max: 50, xp: 200, ti: 120, td: 0, hysteresis: '05:00', mode: 'on' }, { id: 'ma2', name: 'AIR_200L', variable: 'Flow', unit: 'L/min', points: [{ x: 10, y: 5 }, { x: 60, y: 30 }], visible: true, color: '#22c55e', min: 10, max: 60, xp: 100, ti: 80, td: 0, hysteresis: '05:00', mode: 'on' }] } },
        { id: 'mab-b12', type: 'condition', label: 'VCD > 2e6?', x: 290, y: 270, config: { expression: 'VCD', operator: '>', value: 2, useExpression: false } },
        { id: 'mab-b13', type: 'end', label: 'Fin Batch', x: 300, y: 380 },
      ],
      connections: [
        { id: 'mab-c10', from: 'mab-b10', to: 'mab-b11' },
        { id: 'mab-c11', from: 'mab-b11', to: 'mab-b12', condition: { variable: 'ProcessTime', operator: '>', value: 72 } },
        { id: 'mab-c12', from: 'mab-b12', to: 'mab-b13', branch: 'true' },
      ],
    },
    {
      id: 'mab-op3', number: 3, name: 'Perfusion Continue',
      blocks: [
        { id: 'mab-b20', type: 'start', label: 'Debut Perfusion', x: 300, y: 20 },
        { id: 'mab-b21', type: 'parameter', label: 'Demarrer perfusion', subtitle: 'Perf=1VVD', x: 280, y: 120, config: { setpoints: [{ variable: 'Perfusion_Rate', value: '1', unit: 'VVD' }] } },
        { id: 'mab-b22', type: 'profile', label: 'Rampe perfusion', subtitle: '1-2.5 VVD sur 5j', x: 280, y: 230, config: { points: [{ time: 0, value: 1 }, { time: 48, value: 1.5 }, { time: 96, value: 2 }, { time: 120, value: 2.5 }], variable: 'Perfusion_Rate', unit: 'VVD' } },
        { id: 'mab-b23', type: 'wait', label: 'Steady state 14j', subtitle: '14 jours', x: 280, y: 340, config: { duration: 336, unit: 'h' } },
        { id: 'mab-b24', type: 'end', label: 'Fin Perfusion', x: 300, y: 440 },
      ],
      connections: [
        { id: 'mab-c20', from: 'mab-b20', to: 'mab-b21' },
        { id: 'mab-c21', from: 'mab-b21', to: 'mab-b22' },
        { id: 'mab-c22', from: 'mab-b22', to: 'mab-b23' },
        { id: 'mab-c23', from: 'mab-b23', to: 'mab-b24', condition: { variable: 'Viability', operator: '>=', value: 90 } },
      ],
    },
  ],
  customVariables: [
    { id: 'cv-mab1', name: 'CSPR', formula: 'Perfusion_Rate / VCD' },
    { id: 'cv-mab2', name: 'Productivity', formula: 'mAbTiter * Perfusion_Rate' },
  ],
};

// v2: pH 6.9, DO 50%
const mabV2: Recipe = JSON.parse(JSON.stringify(mabV1));
(mabV2.operations[0].blocks[1].config as any).setpoints[1].value = '6.9';
(mabV2.operations[0].blocks[1].config as any).setpoints[2].value = '50';
mabV2.operations[0].blocks[1].subtitle = 'T=37C, pH=6.9, DO=50%';

// v3: VCD threshold 4e6, wait 6h
const mabV3: Recipe = JSON.parse(JSON.stringify(mabV2));
(mabV3.operations[1].blocks[2].config as any).value = 4;
mabV3.operations[1].blocks[2].label = 'VCD > 4e6?';
(mabV3.operations[0].blocks[4].config as any).duration = 6;
mabV3.operations[0].blocks[4].subtitle = '6 heures';

// v4: perfusion ramp adjusted
const mabV4: Recipe = JSON.parse(JSON.stringify(mabV3));
(mabV4.operations[2].blocks[2].config as any).points = [{ time: 0, value: 0.8 }, { time: 24, value: 1.2 }, { time: 72, value: 1.8 }, { time: 120, value: 2.2 }];
mabV4.operations[2].blocks[2].subtitle = '0.8-2.2 VVD sur 5j';

// v5: merge from "Low pH" - pH 6.8, everything else from v4
const mabV5: Recipe = JSON.parse(JSON.stringify(mabV4));
(mabV5.operations[0].blocks[1].config as any).setpoints[1].value = '6.8';
mabV5.operations[0].blocks[1].subtitle = 'T=37C, pH=6.8, DO=50%';

// v6: add bleed step in perfusion
const mabV6: Recipe = JSON.parse(JSON.stringify(mabV5));
mabV6.operations[2].blocks.splice(3, 0, {
  id: 'mab-b25', type: 'parameter', label: 'Cell Bleed', subtitle: 'Bleed=10%/j', x: 280, y: 390, config: { setpoints: [{ variable: 'Bleed_Rate', value: '10', unit: '%/day' }] },
});
mabV6.operations[2].connections.splice(2, 0, { id: 'mab-c24', from: 'mab-b23', to: 'mab-b25' });
mabV6.operations[2].connections[3] = { id: 'mab-c23b', from: 'mab-b25', to: 'mab-b24', condition: { variable: 'Viability', operator: '>=', value: 90 } };

// v7: steady state 21 days
const mabV7: Recipe = JSON.parse(JSON.stringify(mabV6));
(mabV7.operations[2].blocks[3].config as any).duration = 504;
mabV7.operations[2].blocks[3].subtitle = '21 jours';
mabV7.operations[2].blocks[3].label = 'Steady state 21j';

// v8: agitation maxed
const mabV8: Recipe = JSON.parse(JSON.stringify(mabV7));
(mabV8.operations[1].blocks[1].config as any).actuators[0].points = [{ x: 5, y: 120 }, { x: 30, y: 280 }, { x: 50, y: 400 }];

// Branch "Haute Productivite" from v2: higher perfusion, higher DO
const mabHP: Recipe = JSON.parse(JSON.stringify(mabV2));
(mabHP.operations[1].blocks[1].config as any).setpoint = 60;
(mabHP.operations[2].blocks[1].config as any).setpoints[0].value = '1.5';
mabHP.operations[2].blocks[1].subtitle = 'Perf=1.5VVD';

const mabHP2: Recipe = JSON.parse(JSON.stringify(mabHP));
(mabHP2.operations[2].blocks[2].config as any).points = [{ time: 0, value: 1.5 }, { time: 48, value: 2.5 }, { time: 96, value: 3.5 }];
mabHP2.operations[2].blocks[2].subtitle = '1.5-3.5 VVD sur 4j';

const mabHP3: Recipe = JSON.parse(JSON.stringify(mabHP2));
(mabHP3.operations[1].blocks[1].config as any).actuators.push({
  id: 'ma3', name: 'O2EN_200L', variable: 'O2', unit: '%',
  points: [{ x: 50, y: 0 }, { x: 100, y: 100 }],
  visible: true, color: '#f97316', min: 50, max: 100, xp: 5, ti: 300, td: 0, hysteresis: '05:00', mode: 'on'
});

// Branch "Low pH" from v3
const mabLowPH: Recipe = JSON.parse(JSON.stringify(mabV3));
(mabLowPH.operations[0].blocks[1].config as any).setpoints[1].value = '6.8';
mabLowPH.operations[0].blocks[1].subtitle = 'T=37C, pH=6.8, DO=50%';

const mabLowPH2: Recipe = JSON.parse(JSON.stringify(mabLowPH));
(mabLowPH2.operations[0].blocks[4].config as any).duration = 8;
mabLowPH2.operations[0].blocks[4].subtitle = '8 heures';

// Branch "O2 Enrichi" from v4
const mabO2: Recipe = JSON.parse(JSON.stringify(mabV4));
(mabO2.operations[1].blocks[1].config as any).actuators.push({
  id: 'ma4', name: 'O2_PURE', variable: 'O2', unit: '%',
  points: [{ x: 40, y: 0 }, { x: 80, y: 100 }],
  visible: true, color: '#ef4444', min: 40, max: 80, xp: 10, ti: 200, td: 0, hysteresis: '03:00', mode: 'on'
});

const mabO2v2: Recipe = JSON.parse(JSON.stringify(mabO2));
(mabO2v2.operations[1].blocks[1].config as any).setpoint = 55;

// Branch "Feed Continu" from v5
const mabFeed: Recipe = JSON.parse(JSON.stringify(mabV5));
mabFeed.operations[2].blocks[1].label = 'Feed glucose continu';
(mabFeed.operations[2].blocks[1].config as any).setpoints = [{ variable: 'Perfusion_Rate', value: '1.5', unit: 'VVD' }, { variable: 'Glucose_Feed', value: '4', unit: 'g/L/j' }];
mabFeed.operations[2].blocks[1].subtitle = 'Perf=1.5VVD, Gluc=4g/L/j';

// Branch "Temp Shift" from HP branch commit 2 (branch from branch!)
const mabTempShift: Recipe = JSON.parse(JSON.stringify(mabHP2));
mabTempShift.operations[0].blocks.splice(4, 0, {
  id: 'mab-ts1', type: 'profile', label: 'Shift T 37->33C', subtitle: 'Rampe 37-33C sur 12h', x: 280, y: 360, config: { points: [{ time: 0, value: 37 }, { time: 12, value: 33 }], variable: 'Temperature', unit: 'C' },
});

// Branch "Scale 2000L" from v6
const mab2000L: Recipe = JSON.parse(JSON.stringify(mabV6));
mab2000L.name = 'mAb-Perfusion-200L';
(mab2000L.operations[1].blocks[1].config as any).actuators[0].points = [{ x: 5, y: 60 }, { x: 50, y: 200 }];
(mab2000L.operations[1].blocks[1].config as any).actuators[1].points = [{ x: 10, y: 20 }, { x: 60, y: 150 }];

// Branch "GMP Validation" from v7
const mabGMP: Recipe = JSON.parse(JSON.stringify(mabV7));

// ========================================
// BUILD SEED DATA
// ========================================

interface SeedData {
  recipes: Recipe[];
  commits: RecipeCommit[];
  branches: RecipeBranch[];
  activeBranchIds: Record<string, string>;
}

export function generateSeedData(): SeedData {
  const recipes: Recipe[] = [mabV8, choV5, ecoliV3, pichiaV2, cipV2, su50V3];
  const commits: RecipeCommit[] = [];
  const branches: RecipeBranch[] = [];
  const activeBranchIds: Record<string, string> = {};

  // Helper to create commit
  const mkCommit = (recipeId: string, branchId: string, parentId: string | null, snapshot: Recipe, msg: string, author: string, ts: number, tags: string[] = []): string => {
    const cid = id();
    commits.push({ id: cid, recipeId, branchId, parentCommitId: parentId, snapshot: JSON.parse(JSON.stringify(snapshot)), message: msg, author, timestamp: ts, tags });
    return cid;
  };

  // Helper to create branch
  const mkBranch = (recipeId: string, name: string, headId: string | null, parentBranchId: string | null, forkCommitId: string | null, ts: number, colorIdx: number): string => {
    const bid = id();
    branches.push({ id: bid, recipeId, name, headCommitId: headId, parentBranchId, forkCommitId, createdAt: ts, color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length] });
    return bid;
  };

  // --- CHO-Fed-Batch: 5 versions on Principal, 2 branches ---
  const choMainId = mkBranch('cho-fb', 'Principal', null, null, null, hoursAgo(100), 0);
  const choC1 = mkCommit('cho-fb', choMainId, null, choV1, 'Version initiale CHO Fed-Batch', 'Marie L.', hoursAgo(96), ['initial']);
  branches.find(b => b.id === choMainId)!.headCommitId = choC1;
  const choC2 = mkCommit('cho-fb', choMainId, choC1, choV2, 'Ajustement pH 7.0 + alarmes haute/basse', 'Marie L.', hoursAgo(72));
  branches.find(b => b.id === choMainId)!.headCommitId = choC2;
  const choC3 = mkCommit('cho-fb', choMainId, choC2, choV3, 'Stabilisation portee a 4h apres inoculation', 'Pierre D.', hoursAgo(48));
  branches.find(b => b.id === choMainId)!.headCommitId = choC3;
  const choC4 = mkCommit('cho-fb', choMainId, choC3, choV4, 'Modification cascade DO: ajout point 30%, consigne 40%', 'Marie L.', hoursAgo(24));
  branches.find(b => b.id === choMainId)!.headCommitId = choC4;
  const choC5 = mkCommit('cho-fb', choMainId, choC4, choV5, 'Ajout phase Fed-Batch avec rampe feed 2-10 mL/h', 'Pierre D.', hoursAgo(6), ['release-v2']);
  branches.find(b => b.id === choMainId)!.headCommitId = choC5;
  activeBranchIds['cho-fb'] = choMainId;

  // Branch "Haute Densite" - forked from V3
  const choHDBrId = mkBranch('cho-fb', 'Haute Densite', choC3, choMainId, choC3, hoursAgo(36), 1);
  const choHDC1 = mkCommit('cho-fb', choHDBrId, choC3, choHD, 'Config haute densite: agitation 1200rpm max, O2 enrichi', 'Sophie M.', hoursAgo(30));
  branches.find(b => b.id === choHDBrId)!.headCommitId = choHDC1;

  // Branch "pH Bas" - forked from V3
  const choPHBrId = mkBranch('cho-fb', 'pH Bas (6.8)', choC3, choMainId, choC3, hoursAgo(20), 3);
  const choPHC1 = mkCommit('cho-fb', choPHBrId, choC3, choPHBas, 'Test pH bas 6.8 pour meilleure productivite', 'Marie L.', hoursAgo(18));
  branches.find(b => b.id === choPHBrId)!.headCommitId = choPHC1;

  // --- E.coli-Expression: 3 versions ---
  const ecMainId = mkBranch('ecoli-exp', 'Principal', null, null, null, hoursAgo(80), 0);
  const ecC1 = mkCommit('ecoli-exp', ecMainId, null, ecoliV1, 'Protocole E.coli expression initial', 'Ahmed K.', hoursAgo(78), ['initial']);
  branches.find(b => b.id === ecMainId)!.headCommitId = ecC1;
  const ecC2 = mkCommit('ecoli-exp', ecMainId, ecC1, ecoliV2, 'Induction a 25C au lieu de 18C, 6h au lieu de 20h', 'Ahmed K.', hoursAgo(50));
  branches.find(b => b.id === ecMainId)!.headCommitId = ecC2;
  const ecC3 = mkCommit('ecoli-exp', ecMainId, ecC2, ecoliV3, 'Ajout operation Recolte avec centrifugation et resuspension', 'Julie R.', hoursAgo(12), ['validated']);
  branches.find(b => b.id === ecMainId)!.headCommitId = ecC3;
  activeBranchIds['ecoli-exp'] = ecMainId;

  // --- Pichia-Secretion: 2 versions, 1 branch ---
  const piMainId = mkBranch('pichia', 'Principal', null, null, null, hoursAgo(60), 0);
  const piC1 = mkCommit('pichia', piMainId, null, pichiaV1, 'Protocole Pichia pastoris secretion initial', 'Julie R.', hoursAgo(58), ['initial']);
  branches.find(b => b.id === piMainId)!.headCommitId = piC1;
  const piC2 = mkCommit('pichia', piMainId, piC1, pichiaV2, 'pH monte a 6.0, rampe methanol etendue a 12h', 'Julie R.', hoursAgo(25));
  branches.find(b => b.id === piMainId)!.headCommitId = piC2;
  activeBranchIds['pichia'] = piMainId;

  // Branch "Pulse Methanol"
  const piPulseBrId = mkBranch('pichia', 'Methanol Pulse', piC1, piMainId, piC1, hoursAgo(40), 2);
  const piPulseC1 = mkCommit('pichia', piPulseBrId, piC1, pichiaPulse, 'Strategie alimentation pulse methanol 10mL/2h', 'Ahmed K.', hoursAgo(35));
  branches.find(b => b.id === piPulseBrId)!.headCommitId = piPulseC1;

  // --- CIP-SIP-Standard: 2 versions ---
  const cipMainId = mkBranch('cip-sip', 'Principal', null, null, null, hoursAgo(40), 0);
  const cipC1 = mkCommit('cip-sip', cipMainId, null, cipV1, 'Protocole CIP/SIP standard', 'Pierre D.', hoursAgo(38), ['initial', 'SOP']);
  branches.find(b => b.id === cipMainId)!.headCommitId = cipC1;
  const cipC2 = mkCommit('cip-sip', cipMainId, cipC1, cipV2, 'Sterilisation prolongee a 30min (validation QA)', 'Pierre D.', hoursAgo(10), ['QA-approved']);
  branches.find(b => b.id === cipMainId)!.headCommitId = cipC2;
  activeBranchIds['cip-sip'] = cipMainId;

  // --- Scale-Up-50L: 3 versions, 1 branch ---
  const suMainId = mkBranch('su50', 'Principal', null, null, null, hoursAgo(55), 0);
  const suC1 = mkCommit('su50', suMainId, null, su50V1, 'Version initiale Scale-Up 50L', 'Sophie M.', hoursAgo(52), ['initial']);
  branches.find(b => b.id === suMainId)!.headCommitId = suC1;
  const suC2 = mkCommit('su50', suMainId, suC1, su50V2, 'Agitation augmentee 200rpm, consigne DO 50%', 'Sophie M.', hoursAgo(30));
  branches.find(b => b.id === suMainId)!.headCommitId = suC2;
  const suC3 = mkCommit('su50', suMainId, suC2, su50V3, 'Ajout sparger air dans cascade', 'Pierre D.', hoursAgo(8));
  branches.find(b => b.id === suMainId)!.headCommitId = suC3;
  activeBranchIds['su50'] = suMainId;

  // Branch "200L"
  const su200BrId = mkBranch('su50', 'Scale 200L', suC2, suMainId, suC2, hoursAgo(20), 4);
  const su200C1 = mkCommit('su50', su200BrId, suC2, su200, 'Adaptation pour cuve 200L: agitation 120rpm, volumes adaptes', 'Sophie M.', hoursAgo(15));
  branches.find(b => b.id === su200BrId)!.headCommitId = su200C1;

  // --- mAb-Perfusion-200L: 8 versions on Principal, 7 feature branches, 1 merge ---
  // Main branch: 8 commits
  const mabMainId = mkBranch('mab-perf', 'Principal', null, null, null, hoursAgo(200), 0);
  const mC1 = mkCommit('mab-perf', mabMainId, null, mabV1, 'Version initiale mAb Perfusion 200L', 'Marie L.', hoursAgo(192), ['initial']);
  branches.find(b => b.id === mabMainId)!.headCommitId = mC1;
  const mC2 = mkCommit('mab-perf', mabMainId, mC1, mabV2, 'Ajustement pH 6.9, DO 50%', 'Marie L.', hoursAgo(170));
  branches.find(b => b.id === mabMainId)!.headCommitId = mC2;
  const mC3 = mkCommit('mab-perf', mabMainId, mC2, mabV3, 'Seuil VCD 4e6, adaptation 6h', 'Pierre D.', hoursAgo(150));
  branches.find(b => b.id === mabMainId)!.headCommitId = mC3;
  const mC4 = mkCommit('mab-perf', mabMainId, mC3, mabV4, 'Ajustement rampe perfusion 0.8-2.2 VVD', 'Sophie M.', hoursAgo(120));
  branches.find(b => b.id === mabMainId)!.headCommitId = mC4;
  const mC5 = mkCommit('mab-perf', mabMainId, mC4, mabV5, 'Fusion de la variante "Low pH"', 'Marie L.', hoursAgo(90), ['merge']);
  branches.find(b => b.id === mabMainId)!.headCommitId = mC5;
  const mC6 = mkCommit('mab-perf', mabMainId, mC5, mabV6, 'Ajout cell bleed 10%/j en perfusion', 'Ahmed K.', hoursAgo(65));
  branches.find(b => b.id === mabMainId)!.headCommitId = mC6;
  const mC7 = mkCommit('mab-perf', mabMainId, mC6, mabV7, 'Steady state prolonge a 21 jours', 'Pierre D.', hoursAgo(30), ['En test']);
  branches.find(b => b.id === mabMainId)!.headCommitId = mC7;
  const mC8 = mkCommit('mab-perf', mabMainId, mC7, mabV8, 'Agitation optimisee avec 3 points de consigne', 'Sophie M.', hoursAgo(5));
  branches.find(b => b.id === mabMainId)!.headCommitId = mC8;
  activeBranchIds['mab-perf'] = mabMainId;

  // Branch 1: "Haute Productivite" from v2 - 3 commits
  const mabHPBrId = mkBranch('mab-perf', 'Haute Productivite', mC2, mabMainId, mC2, hoursAgo(160), 1);
  const mHPC1 = mkCommit('mab-perf', mabHPBrId, mC2, mabHP, 'Config haute productivite: DO 60%, perf 1.5VVD', 'Sophie M.', hoursAgo(155));
  branches.find(b => b.id === mabHPBrId)!.headCommitId = mHPC1;
  const mHPC2 = mkCommit('mab-perf', mabHPBrId, mHPC1, mabHP2, 'Rampe perfusion aggressive 1.5-3.5 VVD', 'Sophie M.', hoursAgo(140));
  branches.find(b => b.id === mabHPBrId)!.headCommitId = mHPC2;
  const mHPC3 = mkCommit('mab-perf', mabHPBrId, mHPC2, mabHP3, 'Ajout enrichissement O2 pur dans cascade', 'Sophie M.', hoursAgo(125));
  branches.find(b => b.id === mabHPBrId)!.headCommitId = mHPC3;

  // Branch 2: "Low pH (6.8)" from v3 - 2 commits (later merged into main at v5)
  const mabLPBrId = mkBranch('mab-perf', 'Low pH (6.8)', mC3, mabMainId, mC3, hoursAgo(145), 2);
  const mLPC1 = mkCommit('mab-perf', mabLPBrId, mC3, mabLowPH, 'Test pH bas 6.8 pour glycosylation optimale', 'Marie L.', hoursAgo(135));
  branches.find(b => b.id === mabLPBrId)!.headCommitId = mLPC1;
  const mLPC2 = mkCommit('mab-perf', mabLPBrId, mLPC1, mabLowPH2, 'Adaptation prolongee a 8h post-inoculation', 'Marie L.', hoursAgo(100));
  branches.find(b => b.id === mabLPBrId)!.headCommitId = mLPC2;

  // Branch 3: "O2 Enrichi" from v4 - 2 commits
  const mabO2BrId = mkBranch('mab-perf', 'O2 Enrichi', mC4, mabMainId, mC4, hoursAgo(115), 3);
  const mO2C1 = mkCommit('mab-perf', mabO2BrId, mC4, mabO2, 'Ajout sparger O2 pur dans cascade DO', 'Ahmed K.', hoursAgo(108));
  branches.find(b => b.id === mabO2BrId)!.headCommitId = mO2C1;
  const mO2C2 = mkCommit('mab-perf', mabO2BrId, mO2C1, mabO2v2, 'Consigne DO augmentee a 55%', 'Ahmed K.', hoursAgo(95));
  branches.find(b => b.id === mabO2BrId)!.headCommitId = mO2C2;

  // Branch 4: "Feed Continu" from v5 - 1 commit
  const mabFeedBrId = mkBranch('mab-perf', 'Feed Continu', mC5, mabMainId, mC5, hoursAgo(85), 4);
  const mFC1 = mkCommit('mab-perf', mabFeedBrId, mC5, mabFeed, 'Strategie feed glucose continu 4g/L/j', 'Julie R.', hoursAgo(75));
  branches.find(b => b.id === mabFeedBrId)!.headCommitId = mFC1;

  // Branch 5: "Temp Shift" forked from "Haute Productivite" commit 2 (branch from branch!)
  const mabTSBrId = mkBranch('mab-perf', 'Temp Shift 33C', mHPC2, mabHPBrId, mHPC2, hoursAgo(130), 5);
  const mTSC1 = mkCommit('mab-perf', mabTSBrId, mHPC2, mabTempShift, 'Temperature shift 37->33C pour productivite accrue', 'Julie R.', hoursAgo(118));
  branches.find(b => b.id === mabTSBrId)!.headCommitId = mTSC1;

  // Branch 6: "Scale 2000L" from v6
  const mab2kBrId = mkBranch('mab-perf', 'Scale 2000L', mC6, mabMainId, mC6, hoursAgo(55), 6);
  const m2kC1 = mkCommit('mab-perf', mab2kBrId, mC6, mab2000L, 'Adaptation parametres pour cuve 2000L', 'Pierre D.', hoursAgo(45));
  branches.find(b => b.id === mab2kBrId)!.headCommitId = m2kC1;

  // Branch 7: "GMP Validation" from v7
  const mabGMPBrId = mkBranch('mab-perf', 'GMP Validation', mC7, mabMainId, mC7, hoursAgo(25), 7);
  const mGMPC1 = mkCommit('mab-perf', mabGMPBrId, mC7, mabGMP, 'Gel des parametres pour validation GMP', 'Marie L.', hoursAgo(18), ['SOP', 'QA-approved']);
  branches.find(b => b.id === mabGMPBrId)!.headCommitId = mGMPC1;

  return { recipes, commits, branches, activeBranchIds };
}
