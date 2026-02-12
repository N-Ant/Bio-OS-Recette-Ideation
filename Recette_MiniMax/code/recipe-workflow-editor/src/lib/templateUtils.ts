import type { Operation, Block, Connection } from '../types';
import type { OperationTemplate, TemplateBlock, TemplateConnection } from '../data/operationTemplates';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function instantiateTemplate(template: OperationTemplate, operationNumber: number): Operation {
  // Build ID mapping: placeholderId → real unique ID
  const idMap = new Map<string, string>();
  for (const tb of template.blocks) {
    idMap.set(tb.placeholderId, generateId());
  }

  // Deep-clone blocks with real IDs
  const blocks: Block[] = template.blocks.map((tb) => ({
    id: idMap.get(tb.placeholderId)!,
    type: tb.type,
    label: tb.label,
    subtitle: tb.subtitle,
    x: tb.x,
    y: tb.y,
    config: tb.config ? JSON.parse(JSON.stringify(tb.config)) : undefined,
  }));

  // Remap connections
  const connections: Connection[] = template.connections.map((tc) => ({
    id: generateId(),
    from: idMap.get(tc.fromPlaceholder)!,
    to: idMap.get(tc.toPlaceholder)!,
    branch: tc.branch,
  }));

  return {
    id: generateId(),
    number: operationNumber,
    name: template.name,
    blocks,
    connections,
  };
}

export function operationToTemplate(operation: Operation, description?: string): OperationTemplate {
  // Map real block IDs → placeholder IDs
  const idMap = new Map<string, string>();
  operation.blocks.forEach((b, i) => {
    idMap.set(b.id, `p${i}`);
  });

  const blocks: TemplateBlock[] = operation.blocks.map((b) => ({
    placeholderId: idMap.get(b.id)!,
    type: b.type,
    label: b.label,
    subtitle: b.subtitle,
    x: b.x,
    y: b.y,
    config: b.config ? JSON.parse(JSON.stringify(b.config)) : undefined,
  }));

  const connections: TemplateConnection[] = operation.connections
    .filter((c) => idMap.has(c.from) && idMap.has(c.to))
    .map((c) => ({
      fromPlaceholder: idMap.get(c.from)!,
      toPlaceholder: idMap.get(c.to)!,
      branch: c.branch,
    }));

  return {
    id: `user-${generateId()}`,
    name: operation.name,
    category: 'Utility',
    description: description || `Sauvegarde de "${operation.name}"`,
    icon: 'Bookmark',
    blocks,
    connections,
  };
}
