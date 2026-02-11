import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe, Block, Connection, Operation, PhaseType, CustomVariable, ParameterConfig } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Demo recipe - each operation has its own blocks and connections
const demoComplexRecipe: Recipe = {
  id: 'demo',
  name: 'Demo-Complex',
  units: [
    { name: 'L-1', zone: 'Culture', variables: [
      'pH.Value', 'pH.Setpoint', 'pH.Output',
      'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
      'pO2.Value', 'pO2.Setpoint', 'pO2.Output',
      'STIRR_1.Value', 'STIRR_1.Setpoint', 'STIRR_1.Output',
      'AIRSP.Value', 'AIRSP.Setpoint', 'AIRSP.Output',
      'O2SP.Value', 'O2SP.Setpoint', 'O2SP.Output',
      'CO2.Value', 'CO2.Setpoint',
      'GASFL_1.Value', 'GASFL_1.Setpoint', 'GASFL_1.Output',
      'LEVEL.Value', 'LEVEL.Setpoint',
      'PRESSURE.Value', 'PRESSURE.Setpoint',
      'ProcessTime', 'BatchTime', 'OperationTime'
    ]},
    { name: 'L-2', zone: 'Culture', variables: [
      'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
      'pO2.Value', 'pO2.Setpoint', 'pO2.Output',
      'STIRR_1.Value', 'STIRR_1.Setpoint', 'STIRR_1.Output',
      'AIRSP.Value', 'AIRSP.Setpoint',
      'CO2.Value', 'CO2.Setpoint',
      'LEVEL.Value', 'LEVEL.Setpoint',
      'PRESSURE.Value', 'PRESSURE.Setpoint',
      'ProcessTime', 'BatchTime', 'OperationTime'
    ]},
    { name: 'Feed-1', zone: 'Alimentation', variables: [
      'FEED.Value', 'FEED.Setpoint', 'FEED.Output',
      'LEVEL.Value', 'LEVEL.Setpoint',
      'PRESSURE.Value', 'PRESSURE.Setpoint',
      'ProcessTime'
    ]},
    { name: 'Balance-1', zone: 'Alimentation', variables: [
      'FEED.Value', 'FEED.Setpoint',
      'LEVEL.Value', 'LEVEL.Setpoint',
      'ProcessTime', 'BatchTime'
    ]},
    { name: 'Harvest-1', zone: 'Purification', variables: [
      'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
      'PRESSURE.Value', 'PRESSURE.Setpoint',
      'LEVEL.Value', 'LEVEL.Setpoint',
      'FEED.Value', 'FEED.Setpoint', 'FEED.Output',
      'ProcessTime', 'BatchTime', 'OperationTime'
    ]},
  ],
  operations: [
    { 
      id: 'op1', number: 1, name: 'Initialisation',
      blocks: [
        { id: 'd1', type: 'start', label: 'Demarrage', x: 300, y: 20 },
        { id: 'd2', type: 'parameter', label: 'Init Parametres', subtitle: 'pH=7, Temp=37C', x: 280, y: 100, config: { setpoints: [{ variable: 'pH', value: '7', unit: '' }, { variable: 'Temperature', value: '37', unit: 'C' }] } },
        { id: 'd3', type: 'end', label: 'Fin Init', x: 300, y: 200 }
      ],
      connections: [
        { id: 'c1', from: 'd1', to: 'd2' },
        { id: 'c2', from: 'd2', to: 'd3', condition: { variable: 'ProcessTime', operator: '>=', value: 5 } }
      ]
    },
    { 
      id: 'op2', number: 2, name: 'Fermentation',
      blocks: [
        { id: 'f1', type: 'start', label: 'Debut Fermentation', x: 300, y: 20 },
        { id: 'f2', type: 'instrument', label: 'Boost O2', subtitle: 'Foam Control', x: 280, y: 100, config: { sequence: 'Foam Control Sequence', forceRestart: false } },
        { id: 'f3', type: 'wait', label: 'Attendre 30min', subtitle: '30 minutes', x: 280, y: 200, config: { duration: 30, unit: 'min' } },
        { id: 'f4', type: 'profile', label: 'Profil Temp', subtitle: 'Rampe 25-37C', x: 280, y: 300, config: { points: [{ time: 0, value: 25 }, { time: 30, value: 30 }, { time: 60, value: 37 }], variable: 'Temperature', unit: 'C' } },
        { id: 'f5', type: 'operator-prompt', label: 'Confirmer', x: 280, y: 400, config: { message: 'Fermentation terminee?', options: ['Oui', 'Non'] } },
        { id: 'f6', type: 'end', label: 'Fin Fermentation', x: 300, y: 500 }
      ],
      connections: [
        { id: 'fc1', from: 'f1', to: 'f2' },
        { id: 'fc2', from: 'f2', to: 'f3', condition: { variable: 'DO%', operator: '>', value: 30 } },
        { id: 'fc3', from: 'f3', to: 'f4' },
        { id: 'fc4', from: 'f4', to: 'f5' },
        { id: 'fc5', from: 'f5', to: 'f6' }
      ]
    },
    { 
      id: 'op3', number: 3, name: 'Harvest',
      blocks: [
        { id: 'h1', type: 'start', label: 'Debut Recolte', x: 300, y: 20 },
        { id: 'h2', type: 'instrument', label: 'Pompe Vidange', subtitle: 'Harvest', x: 280, y: 100, config: { sequence: 'Harvest Sequence', forceRestart: true } },
        { id: 'h3', type: 'end', label: 'Fin', x: 300, y: 200 }
      ],
      connections: [
        { id: 'hc1', from: 'h1', to: 'h2' },
        { id: 'hc2', from: 'h2', to: 'h3', condition: { variable: 'Level', operator: '<', value: 10 } }
      ]
    }
  ],
  customVariables: [
    { id: 'cv1', name: 'PhParTemp', formula: 'pH.Value / TEMP.Value', targetVariable: 'PhParTemp.Value', description: 'Ratio pH / Temperature' },
    { id: 'cv2', name: 'O2_Totalizer', formula: 'getValue(O2_Totalizer.Value;0) + GASFL_1.Value * (calcCycle()/60)', targetVariable: 'O2_Totalizer.Value', description: 'Totalisation debit O2', resultLimitation: true, resultMin: 0, resultMax: 9999 }
  ],
  orientation: 'vertical'
};

const defaultRecipes: Recipe[] = [
  demoComplexRecipe,
  { 
    id: '1', name: 'Grow-A', 
    operations: [
      { id: 'op1', number: 1, name: 'Preparation', blocks: [{ id: 'b1', type: 'start', label: 'Start', x: 250, y: 50 }, { id: 'b2', type: 'end', label: 'End', x: 250, y: 150 }], connections: [{ id: 'c1', from: 'b1', to: 'b2' }] },
      { id: 'op2', number: 2, name: 'Inoculation', blocks: [], connections: [] },
      { id: 'op3', number: 3, name: 'Batch', blocks: [], connections: [] }
    ] 
  },
  { id: '2', name: 'Grow-B', operations: [{ id: 'op1', number: 1, name: 'Preparation', blocks: [], connections: [] }] },
  { id: '3', name: 'Feed-1', operations: [] },
];

interface StoreState {
  recipes: Recipe[];
  selectedRecipeId: string | null;
  selectedBlockId: string | null;
  selectedOperationId: string | null;
  configModalBlockId: string | null;
  setConfigModalBlockId: (id: string | null) => void;
  editingConnectionId: string | null;
  setEditingConnectionId: (id: string | null) => void;
  selectRecipe: (id: string) => void;
  addRecipe: (name: string) => void;
  deleteRecipe: (id: string) => void;
  renameRecipe: (id: string, name: string) => void;
  importRecipe: (recipe: Recipe) => void;
  addOperation: (name: string) => void;
  deleteOperation: (id: string) => void;
  moveOperation: (id: string, direction: 'up' | 'down') => void;
  selectOperation: (id: string) => void;
  addBlock: (type: PhaseType, x: number, y: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  addConnection: (from: string, to: string, branch?: string, parallelGroup?: string) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (connectionId: string) => void;
  addCustomVariable: (name: string, formula: string, extra?: Partial<CustomVariable>) => void;
  updateCustomVariable: (id: string, updates: Partial<CustomVariable>) => void;
  deleteCustomVariable: (id: string) => void;
  setOrientation: (orientation: 'vertical' | 'horizontal') => void;
  getBlockById: (id: string) => Block | undefined;
  replaceRecipe: (id: string, recipe: Recipe) => void;
  getCurrentRecipe: () => Recipe | undefined;
}

// Helper to get current operation
const getCurrentOperation = (state: StoreState): Operation | undefined => {
  const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
  return recipe?.operations.find(o => o.id === state.selectedOperationId);
};

// Helper: get named calculations from customVariables
export interface NamedCalculation {
  name: string;
  formula: string;
  description?: string;
  resultLimitation?: boolean;
  resultMin?: number;
  resultMax?: number;
}

export const getNamedCalculations = (state: StoreState): NamedCalculation[] => {
  const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
  if (!recipe) return [];
  // From library calculations
  const fromLib: NamedCalculation[] = (recipe.customVariables || []).map(v => ({
    name: v.name, formula: v.formula, description: v.description,
    resultLimitation: v.resultLimitation, resultMin: v.resultMin, resultMax: v.resultMax
  }));
  // From named inline formulas in parameter phase setpoints
  const fromSetpoints: NamedCalculation[] = [];
  for (const op of recipe.operations) {
    for (const block of op.blocks) {
      if (block.type === 'parameter' && block.config) {
        const cfg = block.config as ParameterConfig;
        for (const sp of cfg.setpoints || []) {
          if (sp.formulaName && sp.formula) {
            fromSetpoints.push({
              name: sp.formulaName, formula: sp.formula,
              description: sp.formulaDescription,
              resultLimitation: sp.resultLimitation, resultMin: sp.resultMin, resultMax: sp.resultMax
            });
          }
        }
      }
    }
  }
  return [...fromLib, ...fromSetpoints];
};

// Helper: get calculated variable names (targetVariable) for dropdown injection
export const getCalculatedVariables = (state: StoreState): string[] => {
  const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
  if (!recipe) return [];
  return (recipe.customVariables || [])
    .filter(v => v.targetVariable)
    .map(v => v.targetVariable!);
};

// Helper to update current operation
const updateCurrentOperation = (state: StoreState, updater: (op: Operation) => Operation): Recipe[] => {
  return state.recipes.map(r => {
    if (r.id !== state.selectedRecipeId) return r;
    return {
      ...r,
      operations: r.operations.map(op => {
        if (op.id !== state.selectedOperationId) return op;
        return updater(op);
      })
    };
  });
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      recipes: defaultRecipes,
      selectedRecipeId: 'demo',
      selectedBlockId: null,
      selectedOperationId: 'op1',
      configModalBlockId: null,
      editingConnectionId: null,
      
      setConfigModalBlockId: (id) => set({ configModalBlockId: id }),
      setEditingConnectionId: (id) => set({ editingConnectionId: id }),
      
      getBlockById: (id) => {
        const state = get();
        const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
        const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
        return op?.blocks.find(b => b.id === id);
      },

      selectRecipe: (id) => {
        const recipe = get().recipes.find(r => r.id === id);
        const firstOpId = recipe?.operations[0]?.id || null;
        set({ selectedRecipeId: id, selectedBlockId: null, selectedOperationId: firstOpId });
      },
      
      addRecipe: (name) => {
        const id = generateId();
        const opId = generateId();
        set((state) => ({
          recipes: [...state.recipes, { id, name, operations: [{ id: opId, number: 1, name: 'Operation 1', blocks: [], connections: [] }] }],
          selectedRecipeId: id,
          selectedOperationId: opId,
        }));
      },
      
      deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        selectedRecipeId: state.selectedRecipeId === id ? (state.recipes[0]?.id || null) : state.selectedRecipeId,
      })),
      
      renameRecipe: (id, name) => set((state) => ({
        recipes: state.recipes.map((r) => r.id === id ? { ...r, name } : r),
      })),
      
      importRecipe: (recipe) => {
        const id = generateId();
        set((state) => ({
          recipes: [...state.recipes, { ...recipe, id }],
          selectedRecipeId: id,
        }));
      },
      
      addOperation: (name) => set((state) => {
        const recipe = state.recipes.find((r) => r.id === state.selectedRecipeId);
        if (!recipe) return state;
        const newOp: Operation = { id: generateId(), number: recipe.operations.length + 1, name, blocks: [], connections: [] };
        return {
          recipes: state.recipes.map((r) => r.id === state.selectedRecipeId ? { ...r, operations: [...r.operations, newOp] } : r),
          selectedOperationId: newOp.id,
        };
      }),
      
      deleteOperation: (id) => set((state) => {
        const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
        const remainingOps = recipe?.operations.filter(o => o.id !== id) || [];
        return {
          recipes: state.recipes.map((r) => r.id === state.selectedRecipeId 
            ? { ...r, operations: remainingOps.map((o, i) => ({ ...o, number: i + 1 })) } 
            : r),
          selectedOperationId: state.selectedOperationId === id ? (remainingOps[0]?.id || null) : state.selectedOperationId,
        };
      }),

      moveOperation: (id, direction) => set((state) => {
        const recipe = state.recipes.find((r) => r.id === state.selectedRecipeId);
        if (!recipe) return state;
        const ops = [...recipe.operations];
        const idx = ops.findIndex((o) => o.id === id);
        if (idx === -1) return state;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= ops.length) return state;
        [ops[idx], ops[newIdx]] = [ops[newIdx], ops[idx]];
        const reordered = ops.map((o, i) => ({ ...o, number: i + 1 }));
        return {
          recipes: state.recipes.map((r) => r.id === state.selectedRecipeId ? { ...r, operations: reordered } : r),
        };
      }),
      
      selectOperation: (id) => set({ selectedOperationId: id, selectedBlockId: null }),
      
      addBlock: (type, x, y) => set((state) => {
        const labels: Record<PhaseType, string> = {
          'start': 'Start', 'parameter': 'Parameter', 'operator-prompt': 'Prompt',
          'instrument': 'Instrument', 'wait': 'Wait', 'profile': 'Profile',
          'condition': 'Condition', 'cascade': 'Cascade', 'end': 'End'
        };
        const newBlock: Block = { id: generateId(), type, label: labels[type], x, y };
        return {
          recipes: updateCurrentOperation(state, op => ({ ...op, blocks: [...op.blocks, newBlock] })),
          selectedBlockId: newBlock.id,
        };
      }),
      
      updateBlock: (id, updates) => set((state) => ({
        recipes: updateCurrentOperation(state, op => ({ 
          ...op, 
          blocks: op.blocks.map(b => b.id === id ? { ...b, ...updates } : b) 
        })),
      })),
      
      deleteBlock: (id) => set((state) => ({
        recipes: updateCurrentOperation(state, op => ({ 
          ...op, 
          blocks: op.blocks.filter(b => b.id !== id),
          connections: op.connections.filter(c => c.from !== id && c.to !== id)
        })),
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      })),
      
      selectBlock: (id) => set({ selectedBlockId: id }),
      
      addConnection: (from, to, branch, parallelGroup) => set((state) => {
        const op = getCurrentOperation(state);
        if (!op) return state;
        
        const fromBlock = op.blocks.find(b => b.id === from);
        const newConnId = generateId();
        
        // For condition/prompt blocks with branches, allow multiple connections (one per branch)
        // For regular blocks, replace existing connection from same source
        let newConnections: Connection[];
        const newConn: Connection = { id: newConnId, from, to, branch, parallelGroup };
        
        if (branch) {
          // Remove only connections with the same branch from this block
          newConnections = [...op.connections.filter(c => !(c.from === from && c.branch === branch)), newConn];
        } else if (fromBlock?.type === 'condition' || fromBlock?.type === 'operator-prompt') {
          // Multi-output blocks without branch specified - just add (shouldn't happen normally)
          newConnections = [...op.connections, newConn];
        } else {
          // Regular blocks - allow multiple connections from same block
          newConnections = [...op.connections, newConn];
        }
        
        return {
          recipes: updateCurrentOperation(state, o => ({ ...o, connections: newConnections })),
        };
      }),

      updateConnection: (id, updates) => set((state) => ({
        recipes: updateCurrentOperation(state, op => ({ 
          ...op, 
          connections: op.connections.map(c => c.id === id ? { ...c, ...updates } : c) 
        })),
      })),
      
      deleteConnection: (connectionId) => set((state) => ({
        recipes: updateCurrentOperation(state, op => ({ 
          ...op, 
          connections: op.connections.filter(c => c.id !== connectionId) 
        })),
      })),
      
      addCustomVariable: (name, formula, extra) => set((state) => ({
        recipes: state.recipes.map((r) => r.id === state.selectedRecipeId
          ? { ...r, customVariables: [...(r.customVariables || []), { id: generateId(), name, formula, ...extra }] }
          : r),
      })),
      
      updateCustomVariable: (id, updates) => set((state) => ({
        recipes: state.recipes.map((r) => r.id === state.selectedRecipeId 
          ? { ...r, customVariables: (r.customVariables || []).map((v) => v.id === id ? { ...v, ...updates } : v) } 
          : r),
      })),
      
      deleteCustomVariable: (id) => set((state) => ({
        recipes: state.recipes.map((r) => r.id === state.selectedRecipeId 
          ? { ...r, customVariables: (r.customVariables || []).filter((v) => v.id !== id) } 
          : r),
      })),
      
      replaceRecipe: (id, recipe) => set((state) => ({
        recipes: state.recipes.map(r => r.id === id ? { ...recipe, id } : r),
      })),

      getCurrentRecipe: () => {
        const state = get();
        return state.recipes.find(r => r.id === state.selectedRecipeId);
      },

      setOrientation: (orientation) => set((state) => {
        const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
        const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
        if (!op || !recipe) return state;
        
        const oldOrientation = recipe.orientation || 'vertical';
        if (oldOrientation === orientation) return state;
        
        // Reposition blocks when orientation changes
        const repositionedBlocks = op.blocks.map((block, index) => {
          if (orientation === 'horizontal') {
            // Vertical -> Horizontal: x becomes based on index, y stays centered
            return { ...block, x: 50 + index * 220, y: 150 };
          } else {
            // Horizontal -> Vertical: y becomes based on index, x stays centered
            return { ...block, x: 280, y: 20 + index * 100 };
          }
        });
        
        return {
          recipes: state.recipes.map(r => {
            if (r.id !== state.selectedRecipeId) return r;
            return {
              ...r,
              orientation,
              operations: r.operations.map(o => {
                if (o.id !== state.selectedOperationId) return o;
                return { ...o, blocks: repositionedBlocks };
              })
            };
          }),
        };
      }),
    }),
    {
      name: 'recipe-workflow-storage-v6',
      partialize: (state) => ({
        recipes: state.recipes,
        selectedRecipeId: state.selectedRecipeId,
        selectedOperationId: state.selectedOperationId,
      }),
      merge: (persisted: any, current: any) => {
        if (persisted && persisted.recipes) {
          // Migrate: add default units to recipes that don't have them
          persisted.recipes = persisted.recipes.map((r: any) => {
            if (!r.units || (r.units.length === 1 && r.units[0].name === 'L-1')) {
              r.units = [
                { name: 'L-1', variables: [
                  'pH.Value', 'pH.Setpoint', 'pH.Output',
                  'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
                  'pO2.Value', 'pO2.Setpoint', 'pO2.Output',
                  'STIRR_1.Value', 'STIRR_1.Setpoint', 'STIRR_1.Output',
                  'AIRSP.Value', 'AIRSP.Setpoint', 'AIRSP.Output',
                  'O2SP.Value', 'O2SP.Setpoint', 'O2SP.Output',
                  'CO2.Value', 'CO2.Setpoint',
                  'GASFL_1.Value', 'GASFL_1.Setpoint', 'GASFL_1.Output',
                  'LEVEL.Value', 'LEVEL.Setpoint',
                  'PRESSURE.Value', 'PRESSURE.Setpoint',
                  'ProcessTime', 'BatchTime', 'OperationTime'
                ]},
                { name: 'L-2', variables: [
                  'TEMP.Value', 'TEMP.Setpoint', 'TEMP.Output',
                  'pO2.Value', 'pO2.Setpoint', 'pO2.Output',
                  'STIRR_1.Value', 'STIRR_1.Setpoint', 'STIRR_1.Output',
                  'AIRSP.Value', 'AIRSP.Setpoint',
                  'CO2.Value', 'CO2.Setpoint',
                  'LEVEL.Value', 'LEVEL.Setpoint',
                  'PRESSURE.Value', 'PRESSURE.Setpoint',
                  'ProcessTime', 'BatchTime', 'OperationTime'
                ]},
                { name: 'Feed-1', variables: [
                  'FEED.Value', 'FEED.Setpoint', 'FEED.Output',
                  'LEVEL.Value', 'LEVEL.Setpoint',
                  'PRESSURE.Value', 'PRESSURE.Setpoint',
                  'ProcessTime'
                ]},
              ];
            }
            return r;
          });
        }
        return { ...current, ...persisted };
      },
    }
  )
);
