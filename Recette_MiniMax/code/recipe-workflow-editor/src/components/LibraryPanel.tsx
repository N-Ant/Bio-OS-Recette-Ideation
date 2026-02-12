import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Variable, Minus, X, Pencil } from 'lucide-react';
import { PhaseType, CustomVariable, DEFAULT_UNITS, getCompatibleUnits } from '../types';
import { useStore, getNamedCalculations } from '../store';
import FormulaEditor from './FormulaEditor';

const phases: { type: PhaseType; label: string; bg: string; icon: string }[] = [
  { type: 'start', label: 'Start', bg: '#55B479', icon: 'play' },
  { type: 'parameter', label: 'Parameter', bg: '#84B3FF', icon: 'P' },
  { type: 'wait', label: 'Wait Phase', bg: '#6B7280', icon: 'wait' },
  { type: 'operator-prompt', label: 'Operator Prompt', bg: '#FFC35E', icon: 'user' },
  { type: 'instrument', label: 'Instrument Phase', bg: '#8B5CF6', icon: 'instrument' },
  { type: 'profile', label: 'Profile', bg: '#50BE9A', icon: 'chart' },
  { type: 'cascade', label: 'Cascade', bg: '#06B6D4', icon: 'cascade' },
  { type: 'end', label: 'End', bg: '#FB6A6A', icon: 'flag' },
];

// Modal for editing a calculation/variable
function CalcEditModal({ variable, onSave, onClose }: { variable?: CustomVariable; onSave: (data: Omit<CustomVariable, 'id'>) => void; onClose: () => void }) {
  const [name, setName] = useState(variable?.name || '');
  const [formula, setFormula] = useState(variable?.formula || '');
  const [description, setDescription] = useState(variable?.description || '');
  const [resultLimitation, setResultLimitation] = useState(variable?.resultLimitation || false);
  const [resultMin, setResultMin] = useState(variable?.resultMin ?? 0);
  const [resultMax, setResultMax] = useState(variable?.resultMax ?? 100);

  const storeState = useStore.getState();
  const namedCalcs = getNamedCalculations(storeState).filter(c => c.name !== variable?.name);
  const recipeUnits = (() => { const r = storeState.recipes.find(r => r.id === storeState.selectedRecipeId); return r?.units; })();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b bg-emerald-50">
          <div>
            <h2 className="text-base font-semibold text-emerald-900">{variable ? 'Modifier le calcul' : 'Nouveau calcul'}</h2>
            <p className="text-xs text-emerald-600">Définir une formule nommée (MFCS Calculation)</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-emerald-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nom du calcul</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: O2_Totalizer" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du calcul" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <FormulaEditor
            formula={formula}
            onFormulaChange={setFormula}
            mode="calculation"
            availableCalculations={namedCalcs}
            units={recipeUnits}
            showResultLimitation
            resultLimitation={resultLimitation}
            onResultLimitationChange={setResultLimitation}
            resultMin={resultMin}
            onResultMinChange={setResultMin}
            resultMax={resultMax}
            onResultMaxChange={setResultMax}
          />
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
          <button
            onClick={() => {
              if (!name.trim() || !formula.trim()) return;
              onSave({ name: name.trim(), formula: formula.trim(), description: description.trim() || undefined, resultLimitation: resultLimitation || undefined, resultMin, resultMax });
              onClose();
            }}
            disabled={!name.trim() || !formula.trim()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPanel() {
  const { recipes, selectedRecipeId, addCustomVariable, updateCustomVariable, deleteCustomVariable } = useStore();
  const [showVariables, setShowVariables] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingVar, setEditingVar] = useState<CustomVariable | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const recipe = recipes.find(r => r.id === selectedRecipeId);
  const customVariables = recipe?.customVariables || [];
  const activeUnits = recipe?.units && recipe.units.length > 0 ? recipe.units : DEFAULT_UNITS;

  const handleDragStart = (e: React.DragEvent, type: PhaseType) => {
    e.dataTransfer.setData('phaseType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'play':
        return (
          <svg width="14" height="16" viewBox="0 0 12 14" fill="none">
            <path d="M2 2L10 7L2 12V2Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'P':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="4" y="4" width="12" height="12" rx="2" fill="white" fillOpacity="0.3"/>
            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
          </svg>
        );
      case 'wait':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'user':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/>
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'instrument':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M7 14L10 10L13 13L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'chart':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 20L8 14L13 17L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'flag':
        return (
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
            <path d="M2 11V2.5C2 2.3 2.1 2.2 2.2 2.1C2.3 2 2.4 2 2.5 2H6.5C6.7 2 6.8 2 6.9 2L8.5 3.5C8.6 3.6 8.7 3.7 8.8 3.7C8.9 3.8 9 3.8 9.2 3.8H13.5C13.7 3.8 13.8 3.9 13.8 4C13.9 4.1 13.8 4.2 13.7 4.4L11.5 8C11.4 8.1 11.4 8.2 11.4 8.3C11.4 8.4 11.5 8.5 11.5 8.6L13.7 12.2C13.8 12.4 13.8 12.5 13.8 12.6C13.7 12.7 13.6 12.7 13.5 12.7H9.2C9 12.7 8.9 12.7 8.8 12.6L7.2 11C7.1 10.9 7 10.9 6.9 10.8C6.8 10.8 6.7 10.8 6.5 10.8H2V11ZM2 11V17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'cascade':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="5" rx="1" stroke="white" strokeWidth="2"/>
            <rect x="3" y="10" width="18" height="5" rx="1" stroke="white" strokeWidth="2"/>
            <rect x="3" y="17" width="18" height="5" rx="1" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div data-panel="library" className="w-44 lg:w-56 bg-white rounded-2xl shadow-lg flex flex-col max-h-[calc(100vh-140px)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-base font-medium text-gray-800">Librairie</span>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Minus size={14} className={`text-gray-500 transition-transform ${isCollapsed ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Collapsed: summary */}
      {isCollapsed && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm text-gray-500">{phases.length} blocs disponibles</span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Phase Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {phases.map((phase) => (
                <div
                  key={phase.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, phase.type)}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-grab hover:bg-gray-50 transition-colors active:cursor-grabbing"
                >
                  <div 
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: phase.bg }}
                  >
                    {renderIcon(phase.icon)}
                  </div>
                  <span className="text-sm text-gray-700">{phase.label}</span>
                </div>
              ))}
            </div>

            {/* Calculations / Variables Section */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Variable size={14} className="text-emerald-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Calculations</span>
                </div>
                {showVariables ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {showVariables && (
                <div className="px-3 pb-3 space-y-2">
                  {customVariables.map((v) => {
                    const compatible = getCompatibleUnits(v.formula, activeUnits);
                    return (
                      <div key={v.id} className="bg-emerald-50 rounded-lg px-2 py-1.5 group">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-emerald-700 truncate">{v.name}</span>
                              <span className="flex gap-0.5 flex-shrink-0">
                                {compatible.map(u => (
                                  <span key={u} className="text-[8px] px-0.5 py-0 bg-blue-100 text-blue-600 rounded font-medium leading-tight">{u}</span>
                                ))}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-600 font-mono truncate">{v.formula}</div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingVar(v)}
                              className="p-1 text-emerald-500 hover:text-emerald-700"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteCustomVariable(v.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {v.resultLimitation && (
                          <div className="text-[10px] text-gray-400 mt-0.5">Limites: {v.resultMin} - {v.resultMax}</div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 py-1.5 border border-dashed border-emerald-300 rounded-lg hover:border-emerald-400"
                  >
                    <Plus size={12} /> Nouveau calcul
                  </button>
                </div>
              )}
            </div>

            {/* Edit modal */}
            {editingVar && (
              <CalcEditModal
                variable={editingVar}
                onSave={(data) => updateCustomVariable(editingVar.id, data)}
                onClose={() => setEditingVar(null)}
              />
            )}

            {/* Create modal */}
            {isCreating && (
              <CalcEditModal
                onSave={(data) => addCustomVariable(data.name, data.formula, { description: data.description, resultLimitation: data.resultLimitation, resultMin: data.resultMin, resultMax: data.resultMax })}
                onClose={() => setIsCreating(false)}
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center">
            Glisser-deposer sur le canvas
          </div>
        </>
      )}
    </div>
  );
}
