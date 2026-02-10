import {
  Recipe, Operation, Block, Connection,
  ParameterConfig, WaitConfig, ProfileConfig,
  OperatorPromptConfig, ConditionConfig, CascadeConfig, InstrumentConfig,
} from '../types';
import {
  RecipeDiff, OperationDiff, BlockDiff, ConnectionDiff,
  PropertyChange, DiffSummary,
} from './types';

// ========== Helpers ==========

function fmt(v: unknown): string {
  if (v === undefined || v === null) return '(vide)';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function changed(prop: string, oldVal: unknown, newVal: unknown, displayOld?: string, displayNew?: string): PropertyChange | null {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;
  return {
    property: prop,
    oldValue: oldVal,
    newValue: newVal,
    displayOld: displayOld ?? fmt(oldVal),
    displayNew: displayNew ?? fmt(newVal),
  };
}

// ========== Config Comparators ==========

function diffParameterConfig(oldCfg: ParameterConfig | undefined, newCfg: ParameterConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const oldSp = oldCfg?.setpoints || [];
  const newSp = newCfg?.setpoints || [];

  if (oldSp.length !== newSp.length) {
    const c = changed('Nombre de setpoints', oldSp.length, newSp.length);
    if (c) changes.push(c);
  }

  const maxLen = Math.max(oldSp.length, newSp.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldSp[i];
    const n = newSp[i];
    if (!o && n) {
      changes.push({ property: `Setpoint ${n.variable}`, oldValue: null, newValue: n.value, displayOld: '(aucun)', displayNew: `${n.variable} = ${n.value} ${n.unit}` });
    } else if (o && !n) {
      changes.push({ property: `Setpoint ${o.variable}`, oldValue: o.value, newValue: null, displayOld: `${o.variable} = ${o.value} ${o.unit}`, displayNew: '(supprime)' });
    } else if (o && n) {
      if (o.variable !== n.variable || o.value !== n.value || o.unit !== n.unit) {
        changes.push({ property: `Setpoint ${o.variable}`, oldValue: `${o.value} ${o.unit}`, newValue: `${n.value} ${n.unit}`, displayOld: `${o.variable} = ${o.value} ${o.unit}`, displayNew: `${n.variable} = ${n.value} ${n.unit}` });
      }
      const ah = changed(`Alarme haute ${o.variable}`, o.alarmHigh, n.alarmHigh);
      if (ah) changes.push(ah);
      const al = changed(`Alarme basse ${o.variable}`, o.alarmLow, n.alarmLow);
      if (al) changes.push(al);
    }
  }
  return changes;
}

function diffWaitConfig(oldCfg: WaitConfig | undefined, newCfg: WaitConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const unitLabels: Record<string, string> = { s: 'sec', min: 'min', h: 'h' };
  const c = changed('Duree d\'attente', oldCfg?.duration, newCfg?.duration,
    oldCfg ? `${oldCfg.duration} ${unitLabels[oldCfg.unit] || oldCfg.unit}` : '(vide)',
    newCfg ? `${newCfg.duration} ${unitLabels[newCfg.unit] || newCfg.unit}` : '(vide)');
  if (c) changes.push(c);
  const u = changed('Unite', oldCfg?.unit, newCfg?.unit);
  if (u) changes.push(u);
  const cond = changed('Condition', oldCfg?.condition, newCfg?.condition);
  if (cond) changes.push(cond);
  return changes;
}

function diffProfileConfig(oldCfg: ProfileConfig | undefined, newCfg: ProfileConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const v = changed('Variable', oldCfg?.variable, newCfg?.variable);
  if (v) changes.push(v);
  const u = changed('Unite', oldCfg?.unit, newCfg?.unit);
  if (u) changes.push(u);
  const p = changed('Points du profil', oldCfg?.points, newCfg?.points,
    oldCfg?.points?.map(p => `(${p.time}, ${p.value})`).join(', ') || '(vide)',
    newCfg?.points?.map(p => `(${p.time}, ${p.value})`).join(', ') || '(vide)');
  if (p) changes.push(p);
  return changes;
}

function diffPromptConfig(oldCfg: OperatorPromptConfig | undefined, newCfg: OperatorPromptConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const m = changed('Message', oldCfg?.message, newCfg?.message);
  if (m) changes.push(m);
  const o = changed('Options', oldCfg?.options, newCfg?.options,
    oldCfg?.options?.join(', ') || '(aucune)',
    newCfg?.options?.join(', ') || '(aucune)');
  if (o) changes.push(o);
  return changes;
}

function diffConditionConfig(oldCfg: ConditionConfig | undefined, newCfg: ConditionConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const e = changed('Expression', oldCfg?.expression, newCfg?.expression);
  if (e) changes.push(e);
  const op = changed('Operateur', oldCfg?.operator, newCfg?.operator);
  if (op) changes.push(op);
  const v = changed('Valeur', oldCfg?.value, newCfg?.value);
  if (v) changes.push(v);
  return changes;
}

function diffInstrumentConfig(oldCfg: InstrumentConfig | undefined, newCfg: InstrumentConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const s = changed('Sequence DCU', oldCfg?.sequence, newCfg?.sequence);
  if (s) changes.push(s);
  const f = changed('Force restart', oldCfg?.forceRestart, newCfg?.forceRestart);
  if (f) changes.push(f);
  return changes;
}

function diffCascadeConfig(oldCfg: CascadeConfig | undefined, newCfg: CascadeConfig | undefined): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const mv = changed('Variable maitre', oldCfg?.masterVariable, newCfg?.masterVariable);
  if (mv) changes.push(mv);
  const sp = changed('Consigne', oldCfg?.setpoint, newCfg?.setpoint,
    oldCfg ? `${oldCfg.setpoint}%` : '(vide)',
    newCfg ? `${newCfg.setpoint}%` : '(vide)');
  if (sp) changes.push(sp);
  const db = changed('Bande morte', oldCfg?.deadband, newCfg?.deadband);
  if (db) changes.push(db);

  // Compare actuators by ID
  const oldActs = oldCfg?.actuators || [];
  const newActs = newCfg?.actuators || [];
  const oldMap = new Map(oldActs.map(a => [a.id, a]));
  const newMap = new Map(newActs.map(a => [a.id, a]));

  for (const [id, newAct] of newMap) {
    if (!oldMap.has(id)) {
      changes.push({ property: `Actionneur ${newAct.name}`, oldValue: null, newValue: newAct.name, displayOld: '(aucun)', displayNew: `Ajoute: ${newAct.name} (${newAct.variable})` });
    }
  }
  for (const [id, oldAct] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({ property: `Actionneur ${oldAct.name}`, oldValue: oldAct.name, newValue: null, displayOld: `${oldAct.name} (${oldAct.variable})`, displayNew: '(supprime)' });
    } else {
      const newAct = newMap.get(id)!;
      const actChanges: string[] = [];
      if (oldAct.name !== newAct.name) actChanges.push(`nom: ${oldAct.name} -> ${newAct.name}`);
      if (oldAct.variable !== newAct.variable) actChanges.push(`variable: ${oldAct.variable} -> ${newAct.variable}`);
      if (JSON.stringify(oldAct.points) !== JSON.stringify(newAct.points)) actChanges.push('points modifies');
      if (oldAct.xp !== newAct.xp || oldAct.ti !== newAct.ti || oldAct.td !== newAct.td) actChanges.push('PID modifie');
      if (actChanges.length > 0) {
        changes.push({ property: `Actionneur ${oldAct.name}`, oldValue: oldAct, newValue: newAct, displayOld: oldAct.name, displayNew: actChanges.join(', ') });
      }
    }
  }
  return changes;
}

// ========== Extract block properties (for added/removed blocks) ==========

function extractBlockProperties(block: Block): PropertyChange[] {
  const props: PropertyChange[] = [];
  const cfg = block.config;
  if (!cfg) return props;

  switch (block.type) {
    case 'parameter': {
      const c = cfg as ParameterConfig;
      for (const sp of c.setpoints || []) {
        props.push({ property: `Setpoint ${sp.variable}`, oldValue: null, newValue: sp.value, displayOld: '', displayNew: `${sp.variable} = ${sp.value} ${sp.unit}` });
        if (sp.alarmHigh != null) props.push({ property: `Alarme haute ${sp.variable}`, oldValue: null, newValue: sp.alarmHigh, displayOld: '', displayNew: fmt(sp.alarmHigh) });
        if (sp.alarmLow != null) props.push({ property: `Alarme basse ${sp.variable}`, oldValue: null, newValue: sp.alarmLow, displayOld: '', displayNew: fmt(sp.alarmLow) });
      }
      break;
    }
    case 'wait': {
      const c = cfg as WaitConfig;
      const unitLabels: Record<string, string> = { s: 'sec', min: 'min', h: 'h' };
      if (c.duration != null) props.push({ property: 'Duree d\'attente', oldValue: null, newValue: c.duration, displayOld: '', displayNew: `${c.duration} ${unitLabels[c.unit] || c.unit}` });
      if (c.condition) props.push({ property: 'Condition', oldValue: null, newValue: c.condition, displayOld: '', displayNew: fmt(c.condition) });
      break;
    }
    case 'profile': {
      const c = cfg as ProfileConfig;
      if (c.variable) props.push({ property: 'Variable', oldValue: null, newValue: c.variable, displayOld: '', displayNew: c.variable });
      if (c.unit) props.push({ property: 'Unite', oldValue: null, newValue: c.unit, displayOld: '', displayNew: c.unit });
      if (c.points?.length) props.push({ property: 'Points du profil', oldValue: null, newValue: c.points, displayOld: '', displayNew: c.points.map(p => `(${p.time}, ${p.value})`).join(', ') });
      break;
    }
    case 'operator-prompt': {
      const c = cfg as OperatorPromptConfig;
      if (c.message) props.push({ property: 'Message', oldValue: null, newValue: c.message, displayOld: '', displayNew: c.message });
      if (c.options?.length) props.push({ property: 'Options', oldValue: null, newValue: c.options, displayOld: '', displayNew: c.options.join(', ') });
      break;
    }
    case 'condition': {
      const c = cfg as ConditionConfig;
      if (c.expression) props.push({ property: 'Expression', oldValue: null, newValue: c.expression, displayOld: '', displayNew: c.expression });
      if (c.operator) props.push({ property: 'Operateur', oldValue: null, newValue: c.operator, displayOld: '', displayNew: c.operator });
      if (c.value != null) props.push({ property: 'Valeur', oldValue: null, newValue: c.value, displayOld: '', displayNew: fmt(c.value) });
      break;
    }
    case 'instrument': {
      const c = cfg as InstrumentConfig;
      if (c.sequence) props.push({ property: 'Sequence DCU', oldValue: null, newValue: c.sequence, displayOld: '', displayNew: c.sequence });
      if (c.forceRestart != null) props.push({ property: 'Force restart', oldValue: null, newValue: c.forceRestart, displayOld: '', displayNew: fmt(c.forceRestart) });
      break;
    }
    case 'cascade': {
      const c = cfg as CascadeConfig;
      if (c.masterVariable) props.push({ property: 'Variable maitre', oldValue: null, newValue: c.masterVariable, displayOld: '', displayNew: c.masterVariable });
      if (c.setpoint != null) props.push({ property: 'Consigne', oldValue: null, newValue: c.setpoint, displayOld: '', displayNew: `${c.setpoint}%` });
      if (c.deadband != null) props.push({ property: 'Bande morte', oldValue: null, newValue: c.deadband, displayOld: '', displayNew: fmt(c.deadband) });
      for (const act of c.actuators || []) {
        props.push({ property: `Actionneur`, oldValue: null, newValue: act.name, displayOld: '', displayNew: `${act.name} (${act.variable})` });
      }
      break;
    }
  }
  return props;
}

// ========== Block Diff ==========

function diffBlockConfig(oldBlock: Block, newBlock: Block): PropertyChange[] {
  const type = newBlock.type;
  switch (type) {
    case 'parameter':
      return diffParameterConfig(oldBlock.config as ParameterConfig, newBlock.config as ParameterConfig);
    case 'wait':
      return diffWaitConfig(oldBlock.config as WaitConfig, newBlock.config as WaitConfig);
    case 'profile':
      return diffProfileConfig(oldBlock.config as ProfileConfig, newBlock.config as ProfileConfig);
    case 'operator-prompt':
      return diffPromptConfig(oldBlock.config as OperatorPromptConfig, newBlock.config as OperatorPromptConfig);
    case 'condition':
      return diffConditionConfig(oldBlock.config as ConditionConfig, newBlock.config as ConditionConfig);
    case 'instrument':
      return diffInstrumentConfig(oldBlock.config as InstrumentConfig, newBlock.config as InstrumentConfig);
    case 'cascade':
      return diffCascadeConfig(oldBlock.config as CascadeConfig, newBlock.config as CascadeConfig);
    default:
      return [];
  }
}

function diffBlock(oldBlock: Block, newBlock: Block): BlockDiff | null {
  const propertyChanges: PropertyChange[] = [];

  const lbl = changed('Label', oldBlock.label, newBlock.label);
  if (lbl) propertyChanges.push(lbl);
  const sub = changed('Sous-titre', oldBlock.subtitle, newBlock.subtitle);
  if (sub) propertyChanges.push(sub);
  const tp = changed('Type', oldBlock.type, newBlock.type);
  if (tp) propertyChanges.push(tp);

  // Position changes
  const posX = changed('Position X', oldBlock.x, newBlock.x);
  if (posX) propertyChanges.push(posX);
  const posY = changed('Position Y', oldBlock.y, newBlock.y);
  if (posY) propertyChanges.push(posY);

  // Config changes
  propertyChanges.push(...diffBlockConfig(oldBlock, newBlock));

  if (propertyChanges.length === 0) return null;

  const isPositionOnly = propertyChanges.every(c => c.property === 'Position X' || c.property === 'Position Y');

  return {
    blockId: newBlock.id,
    type: 'modified',
    blockLabel: newBlock.label,
    blockType: newBlock.type,
    propertyChanges,
    isPositionOnly,
  };
}

// ========== Connection Diff ==========

function diffConnection(oldConn: Connection, newConn: Connection, blocks: Block[]): ConnectionDiff | null {
  const propertyChanges: PropertyChange[] = [];
  const b = changed('Branche', oldConn.branch, newConn.branch);
  if (b) propertyChanges.push(b);
  const f = changed('Formule', oldConn.formula, newConn.formula);
  if (f) propertyChanges.push(f);
  const cond = changed('Condition', oldConn.condition, newConn.condition,
    oldConn.condition ? `${oldConn.condition.variable} ${oldConn.condition.operator} ${oldConn.condition.value}` : '(aucune)',
    newConn.condition ? `${newConn.condition.variable} ${newConn.condition.operator} ${newConn.condition.value}` : '(aucune)');
  if (cond) propertyChanges.push(cond);
  const pg = changed('Groupe parallele', oldConn.parallelGroup, newConn.parallelGroup);
  if (pg) propertyChanges.push(pg);
  const from = changed('Source', oldConn.from, newConn.from);
  if (from) propertyChanges.push(from);
  const to = changed('Destination', oldConn.to, newConn.to);
  if (to) propertyChanges.push(to);

  if (propertyChanges.length === 0) return null;

  const fromBlock = blocks.find(bl => bl.id === newConn.from);
  const toBlock = blocks.find(bl => bl.id === newConn.to);

  return {
    connectionId: newConn.id,
    type: 'modified',
    fromLabel: fromBlock?.label || newConn.from,
    toLabel: toBlock?.label || newConn.to,
    propertyChanges,
  };
}

// ========== Operation Diff ==========

function diffOperation(oldOp: Operation, newOp: Operation): OperationDiff | null {
  const blockDiffs: BlockDiff[] = [];
  const connectionDiffs: ConnectionDiff[] = [];

  const oldBlockMap = new Map(oldOp.blocks.map(b => [b.id, b]));
  const newBlockMap = new Map(newOp.blocks.map(b => [b.id, b]));

  // Blocks added
  for (const [id, block] of newBlockMap) {
    if (!oldBlockMap.has(id)) {
      blockDiffs.push({ blockId: id, type: 'added', blockLabel: block.label, blockType: block.type, propertyChanges: extractBlockProperties(block), isPositionOnly: false });
    }
  }
  // Blocks removed
  for (const [id, block] of oldBlockMap) {
    if (!newBlockMap.has(id)) {
      blockDiffs.push({ blockId: id, type: 'removed', blockLabel: block.label, blockType: block.type, propertyChanges: extractBlockProperties(block), isPositionOnly: false });
    }
  }
  // Blocks modified
  for (const [id, newBlock] of newBlockMap) {
    const oldBlock = oldBlockMap.get(id);
    if (oldBlock) {
      const d = diffBlock(oldBlock, newBlock);
      if (d) blockDiffs.push(d);
    }
  }

  // Connections
  const oldConnMap = new Map(oldOp.connections.map(c => [c.id, c]));
  const newConnMap = new Map(newOp.connections.map(c => [c.id, c]));
  const allBlocks = newOp.blocks;

  for (const [id, conn] of newConnMap) {
    if (!oldConnMap.has(id)) {
      const fromBlock = allBlocks.find(b => b.id === conn.from);
      const toBlock = allBlocks.find(b => b.id === conn.to);
      connectionDiffs.push({ connectionId: id, type: 'added', fromLabel: fromBlock?.label || conn.from, toLabel: toBlock?.label || conn.to, propertyChanges: [] });
    }
  }
  for (const [id, conn] of oldConnMap) {
    if (!newConnMap.has(id)) {
      const fromBlock = oldOp.blocks.find(b => b.id === conn.from);
      const toBlock = oldOp.blocks.find(b => b.id === conn.to);
      connectionDiffs.push({ connectionId: id, type: 'removed', fromLabel: fromBlock?.label || conn.from, toLabel: toBlock?.label || conn.to, propertyChanges: [] });
    }
  }
  for (const [id, newConn] of newConnMap) {
    const oldConn = oldConnMap.get(id);
    if (oldConn) {
      const d = diffConnection(oldConn, newConn, allBlocks);
      if (d) connectionDiffs.push(d);
    }
  }

  // Filter: only report if there are non-position-only changes or significant diffs
  const hasSignificantChanges = blockDiffs.some(d => !d.isPositionOnly) || connectionDiffs.length > 0;
  const nameChanged = oldOp.name !== newOp.name;

  if (!hasSignificantChanges && blockDiffs.length === 0 && !nameChanged) return null;

  return {
    operationId: newOp.id,
    type: 'modified',
    operationName: newOp.name,
    blockDiffs,
    connectionDiffs,
  };
}

// ========== Main Entry Point ==========

export function computeRecipeDiff(oldRecipe: Recipe, newRecipe: Recipe): RecipeDiff {
  const operationDiffs: OperationDiff[] = [];

  const oldOpMap = new Map(oldRecipe.operations.map(o => [o.id, o]));
  const newOpMap = new Map(newRecipe.operations.map(o => [o.id, o]));

  // Operations added
  for (const [id, op] of newOpMap) {
    if (!oldOpMap.has(id)) {
      operationDiffs.push({
        operationId: id, type: 'added', operationName: op.name,
        blockDiffs: op.blocks.map(b => ({ blockId: b.id, type: 'added' as const, blockLabel: b.label, blockType: b.type, propertyChanges: extractBlockProperties(b), isPositionOnly: false })),
        connectionDiffs: op.connections.map(c => {
          const fb = op.blocks.find(b => b.id === c.from);
          const tb = op.blocks.find(b => b.id === c.to);
          return { connectionId: c.id, type: 'added' as const, fromLabel: fb?.label || c.from, toLabel: tb?.label || c.to, propertyChanges: [] };
        }),
      });
    }
  }
  // Operations removed
  for (const [id, op] of oldOpMap) {
    if (!newOpMap.has(id)) {
      operationDiffs.push({
        operationId: id, type: 'removed', operationName: op.name,
        blockDiffs: op.blocks.map(b => ({ blockId: b.id, type: 'removed' as const, blockLabel: b.label, blockType: b.type, propertyChanges: extractBlockProperties(b), isPositionOnly: false })),
        connectionDiffs: op.connections.map(c => {
          const fb = op.blocks.find(b => b.id === c.from);
          const tb = op.blocks.find(b => b.id === c.to);
          return { connectionId: c.id, type: 'removed' as const, fromLabel: fb?.label || c.from, toLabel: tb?.label || c.to, propertyChanges: [] };
        }),
      });
    }
  }
  // Operations modified
  for (const [id, newOp] of newOpMap) {
    const oldOp = oldOpMap.get(id);
    if (oldOp) {
      const d = diffOperation(oldOp, newOp);
      if (d) operationDiffs.push(d);
    }
  }

  const summary: DiffSummary = {
    blocksAdded: operationDiffs.reduce((s, od) => s + od.blockDiffs.filter(b => b.type === 'added').length, 0),
    blocksRemoved: operationDiffs.reduce((s, od) => s + od.blockDiffs.filter(b => b.type === 'removed').length, 0),
    blocksModified: operationDiffs.reduce((s, od) => s + od.blockDiffs.filter(b => b.type === 'modified' && !b.isPositionOnly).length, 0),
    connectionsAdded: operationDiffs.reduce((s, od) => s + od.connectionDiffs.filter(c => c.type === 'added').length, 0),
    connectionsRemoved: operationDiffs.reduce((s, od) => s + od.connectionDiffs.filter(c => c.type === 'removed').length, 0),
    connectionsModified: operationDiffs.reduce((s, od) => s + od.connectionDiffs.filter(c => c.type === 'modified').length, 0),
    operationsAdded: operationDiffs.filter(o => o.type === 'added').length,
    operationsRemoved: operationDiffs.filter(o => o.type === 'removed').length,
    operationsModified: operationDiffs.filter(o => o.type === 'modified').length,
  };

  return {
    oldRecipeId: oldRecipe.id,
    newRecipeId: newRecipe.id,
    operationDiffs,
    nameChanged: oldRecipe.name !== newRecipe.name,
    oldName: oldRecipe.name,
    newName: newRecipe.name,
    summary,
  };
}

/**
 * Generate a human-readable commit message from a RecipeDiff.
 */
export function generateCommitMessage(diff: RecipeDiff): string {
  const parts: string[] = [];

  if (diff.nameChanged) {
    parts.push(`Renommage: "${diff.oldName}" → "${diff.newName}"`);
  }

  for (const opDiff of diff.operationDiffs) {
    if (opDiff.type === 'added') {
      parts.push(`Ajout operation "${opDiff.operationName}"`);
      continue;
    }
    if (opDiff.type === 'removed') {
      parts.push(`Suppression operation "${opDiff.operationName}"`);
      continue;
    }

    // Modified operation - describe block changes
    const added = opDiff.blockDiffs.filter(b => b.type === 'added');
    const removed = opDiff.blockDiffs.filter(b => b.type === 'removed');
    const modified = opDiff.blockDiffs.filter(b => b.type === 'modified' && !b.isPositionOnly);

    for (const b of added) {
      parts.push(`Ajout phase "${b.blockLabel}" (${b.blockType})`);
    }
    for (const b of removed) {
      parts.push(`Suppression phase "${b.blockLabel}"`);
    }
    for (const b of modified) {
      const propDescs = b.propertyChanges.slice(0, 3).map(pc =>
        `${pc.property}: ${pc.displayOld} → ${pc.displayNew}`
      );
      if (propDescs.length > 0) {
        parts.push(`Modification "${b.blockLabel}": ${propDescs.join(', ')}${b.propertyChanges.length > 3 ? ` (+${b.propertyChanges.length - 3})` : ''}`);
      } else {
        parts.push(`Modification "${b.blockLabel}"`);
      }
    }

    // Connection changes
    const connAdded = opDiff.connectionDiffs.filter(c => c.type === 'added');
    const connRemoved = opDiff.connectionDiffs.filter(c => c.type === 'removed');
    for (const c of connAdded) {
      parts.push(`Nouvelle connexion ${c.fromLabel} → ${c.toLabel}`);
    }
    for (const c of connRemoved) {
      parts.push(`Suppression connexion ${c.fromLabel} → ${c.toLabel}`);
    }
  }

  if (parts.length === 0) return 'Mise a jour mineure';

  // Keep it concise: max ~3 main items, then summarize
  if (parts.length <= 3) return parts.join('. ');

  const main = parts.slice(0, 3).join('. ');
  const rest = parts.length - 3;
  return `${main} (+${rest} autre${rest > 1 ? 's' : ''} changement${rest > 1 ? 's' : ''})`;
}
