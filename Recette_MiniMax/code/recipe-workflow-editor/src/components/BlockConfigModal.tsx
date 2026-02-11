import { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { Block, PhaseType, VARIABLES, DCU_SEQUENCES, FUNCTIONS, ParameterConfig, InstrumentConfig, WaitConfig, ProfileConfig, OperatorPromptConfig, ConditionConfig, CascadeConfig, CascadeActuator, CascadePoint, Connection, SetpointEntry } from '../types';
import FormulaEditor from './FormulaEditor';
import { useStore, getNamedCalculations, getCalculatedVariables } from '../store';

interface Props {
  block: Block;
  blocks?: Block[];
  connections?: Connection[];
  onSave: (config: Block['config'], label: string, subtitle: string) => void;
  onClose: () => void;
}

export default function BlockConfigModal({ block, blocks = [], connections = [], onSave, onClose }: Props) {
  const [label, setLabel] = useState(block.label);
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [config, setConfig] = useState<Block['config']>(block.config);
  const [selectedActuatorId, setSelectedActuatorId] = useState<string | null>(null);
  const [expandedPidId, setExpandedPidId] = useState<string | null>(null);

  // Get recipe units for FormulaEditor
  const recipeUnits = (() => {
    const state = useStore.getState();
    const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
    return recipe?.units;
  })();

  useEffect(() => {
    if (!config) {
      switch (block.type) {
        case 'parameter':
          setConfig({ setpoints: [{ variable: 'pH', value: '7.0', unit: '' }] } as ParameterConfig);
          break;
        case 'instrument':
          setConfig({ sequence: 'pH Calibration', forceRestart: false } as InstrumentConfig);
          break;
        case 'wait':
          setConfig({ duration: 60, unit: 's' } as WaitConfig);
          break;
        case 'profile':
          setConfig({ points: [{ time: 0, value: 25 }, { time: 30, value: 30 }, { time: 60, value: 37 }], variable: 'Temperature', unit: 'C' } as ProfileConfig);
          break;
        case 'operator-prompt':
          setConfig({ message: 'Please confirm', options: ['OK', 'Cancel'] } as OperatorPromptConfig);
          break;
        case 'condition':
          setConfig({ expression: 'pH', operator: '>', value: 7.0, useExpression: false } as ConditionConfig);
          break;
        case 'cascade':
          setConfig({
            masterVariable: 'DO%', 
            setpoint: 30,
            deadband: 0.5,
            actuators: [
              { id: '1', name: 'STIRR_1', variable: 'Agitation', unit: 'rpm', points: [{ x: 5, y: 200 }, { x: 50, y: 500 }], visible: true, color: '#3b82f6', min: 5, max: 50, xp: 150, ti: 100, td: 0, hysteresis: '05:00', mode: 'off' },
              { id: '2', name: 'GASFL_1', variable: 'Flow', unit: 'L/min', points: [{ x: 10, y: 1 }, { x: 66.6, y: 10 }], visible: true, color: '#22c55e', min: 10, max: 66.6, xp: 90, ti: 50, td: 0, hysteresis: '05:00', mode: 'off' },
              { id: '3', name: 'O2EN_1', variable: 'O2', unit: '%', points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], visible: false, color: '#f97316', min: 0, max: 100, xp: 5, ti: 300, td: 0, hysteresis: '05:00', mode: 'off' }
            ]
          } as CascadeConfig);
          break;
      }
    }
  }, [block.type, config]);

  const handleSave = () => {
    onSave(config, label, subtitle);
    onClose();
  };

  const [expandedFormulaIdx, setExpandedFormulaIdx] = useState<number | null>(null);

  const renderParameterConfig = () => {
    const cfg = config as ParameterConfig || { setpoints: [] };
    const storeState = useStore.getState();
    const namedCalcs = getNamedCalculations(storeState);
    const calcVars = getCalculatedVariables(storeState);

    const updateSetpoint = (index: number, updates: Partial<SetpointEntry>) => {
      const s = [...cfg.setpoints];
      s[index] = { ...s[index], ...updates };
      setConfig({ ...cfg, setpoints: s });
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Setpoints</span>
          <button onClick={() => setConfig({ ...cfg, setpoints: [...(cfg.setpoints || []), { variable: 'pH', value: '7.0', unit: '', alarmHigh: undefined, alarmLow: undefined }] })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Ajouter</button>
        </div>
        {cfg.setpoints?.map((sp, i) => {
          const mode = sp.valueMode || 'value';
          return (
            <div key={i} className="bg-gray-50 p-2 rounded-lg space-y-2">
              <div className="flex gap-2 items-center">
                <select value={sp.variable} onChange={(e) => updateSetpoint(i, { variable: e.target.value })} className="text-sm border rounded px-2 py-1 w-36">
                  <optgroup label="Variables process">
                    {VARIABLES.map(v => <option key={v}>{v}</option>)}
                  </optgroup>
                  {calcVars.length > 0 && (
                    <optgroup label="Variables calculées">
                      {calcVars.map(v => <option key={v} value={v}>{v}</option>)}
                    </optgroup>
                  )}
                </select>
                {/* Value mode selector */}
                <select
                  value={mode}
                  onChange={(e) => {
                    const newMode = e.target.value as 'value' | 'calculation' | 'reset';
                    updateSetpoint(i, { valueMode: newMode });
                    if (newMode === 'calculation') setExpandedFormulaIdx(i);
                    else setExpandedFormulaIdx(null);
                  }}
                  className="text-xs border rounded px-1.5 py-1 w-28 bg-white"
                >
                  <option value="value">Value</option>
                  <option value="calculation">Calculation...</option>
                  <option value="reset">Reset</option>
                </select>
                {mode === 'value' && (
                  <input
                    type="text"
                    value={sp.value}
                    onChange={(e) => updateSetpoint(i, { value: e.target.value })}
                    placeholder="Valeur ou formule (ex: pH*2)"
                    className="flex-1 text-sm border rounded px-2 py-1 font-mono"
                  />
                )}
                {mode === 'reset' && (
                  <div className="flex-1 text-sm text-gray-400 italic px-2 py-1">Reset getValue()</div>
                )}
                {mode === 'calculation' && (
                  <button
                    onClick={() => setExpandedFormulaIdx(expandedFormulaIdx === i ? null : i)}
                    className="flex-1 text-left text-xs font-medium bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 hover:bg-emerald-100 truncate"
                  >
                    {sp.formulaName ? (
                      <span className="text-emerald-800">{sp.formulaName}</span>
                    ) : (
                      <span className="text-emerald-500 italic">Edit Calculation...</span>
                    )}
                  </button>
                )}
                <input placeholder="Unité" value={sp.unit} onChange={(e) => updateSetpoint(i, { unit: e.target.value })} className="w-14 text-sm border rounded px-2 py-1" />
                <input
                  type="number"
                  value={sp.alarmLow ?? ''}
                  onChange={(e) => updateSetpoint(i, { alarmLow: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  placeholder="Low"
                  className="w-16 text-sm border rounded px-2 py-1 border-orange-300"
                />
                <input
                  type="number"
                  value={sp.alarmHigh ?? ''}
                  onChange={(e) => updateSetpoint(i, { alarmHigh: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  placeholder="High"
                  className="w-16 text-sm border rounded px-2 py-1 border-red-300"
                />
                <button onClick={() => { const s = cfg.setpoints.filter((_, j) => j !== i); setConfig({ ...cfg, setpoints: s }); setExpandedFormulaIdx(null); }} className="text-red-500"><Trash2 size={14} /></button>
              </div>
              {/* Inline FormulaEditor when in calculation mode */}
              {mode === 'calculation' && expandedFormulaIdx === i && (
                <div className="ml-2 space-y-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  {/* Select existing or create new */}
                  {namedCalcs.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Calcul existant</label>
                      <select
                        value={sp.formulaName && namedCalcs.some(c => c.name === sp.formulaName) ? sp.formulaName : ''}
                        onChange={(e) => {
                          const name = e.target.value;
                          if (!name) {
                            updateSetpoint(i, { formulaName: '', formula: '', formulaDescription: '', resultLimitation: false, resultMin: 0, resultMax: 100 } as any);
                            return;
                          }
                          const calc = namedCalcs.find(c => c.name === name);
                          if (calc) {
                            updateSetpoint(i, {
                              formulaName: calc.name,
                              formula: calc.formula,
                              formulaDescription: calc.description || '',
                              resultLimitation: calc.resultLimitation || false,
                              resultMin: calc.resultMin ?? 0,
                              resultMax: calc.resultMax ?? 100,
                            } as any);
                          }
                        }}
                        className="w-full mt-1 text-xs border rounded px-2 py-1.5 bg-white"
                      >
                        <option value="">-- Nouveau calcul --</option>
                        {namedCalcs.map(c => (
                          <option key={c.name} value={c.name}>{c.name}{c.description ? ` (${c.description})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="text-xs font-medium text-emerald-700 mb-1">META DATA</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Nom <span className="text-red-500">*</span></label>
                      <input
                        value={sp.formulaName || ''}
                        onChange={(e) => updateSetpoint(i, { formulaName: e.target.value } as any)}
                        placeholder="ex: O2_Totalizer"
                        className={`w-full text-xs border rounded px-2 py-1 font-mono ${!sp.formulaName ? 'border-red-300 bg-red-50' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Description</label>
                      <input
                        value={(sp as any).formulaDescription || ''}
                        onChange={(e) => updateSetpoint(i, { formulaDescription: e.target.value } as any)}
                        placeholder="Description du calcul"
                        className="w-full text-xs border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={(sp as any).resultLimitation || false}
                        onChange={(e) => updateSetpoint(i, { resultLimitation: e.target.checked } as any)}
                        className="rounded"
                      />
                      Result Limitation
                    </label>
                    {(sp as any).resultLimitation && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Min:</span>
                          <input type="number" value={(sp as any).resultMin ?? 0} onChange={(e) => updateSetpoint(i, { resultMin: parseFloat(e.target.value) || 0 } as any)} className="w-16 text-xs border rounded px-1 py-0.5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Max:</span>
                          <input type="number" value={(sp as any).resultMax ?? 100} onChange={(e) => updateSetpoint(i, { resultMax: parseFloat(e.target.value) || 0 } as any)} className="w-16 text-xs border rounded px-1 py-0.5" />
                        </div>
                      </>
                    )}
                  </div>
                  <FormulaEditor
                    formula={sp.formula || ''}
                    onFormulaChange={(formula) => updateSetpoint(i, { formula })}
                    mode="calculation"
                    availableCalculations={namedCalcs}
                    units={recipeUnits}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInstrumentConfig = () => {
    const cfg = config as InstrumentConfig || { sequence: 'pH Calibration', forceRestart: false };
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium flex items-center gap-2">
            <span>Séquence DCU</span>
            <span className="text-xs text-gray-400">(Phase du contrôleur)</span>
          </label>
          <select 
            value={cfg.sequence} 
            onChange={(e) => setConfig({ ...cfg, sequence: e.target.value })} 
            className="w-full mt-1 border rounded px-3 py-2 bg-white"
          >
            {DCU_SEQUENCES.map(seq => (
              <option key={seq} value={seq}>{seq}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Sélectionnez la séquence à exécuter sur le DCU</p>
        </div>
        <div className="border-t pt-4">
          <label className="text-sm font-medium">Force Restart</label>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setConfig({ ...cfg, forceRestart: false })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                !cfg.forceRestart ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Non
            </button>
            <button
              onClick={() => setConfig({ ...cfg, forceRestart: true })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                cfg.forceRestart ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Oui
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {cfg.forceRestart 
              ? '⚠️ La séquence redémarrera même si elle est déjà en cours'
              : 'La séquence ne sera pas redémarrée si déjà en cours'
            }
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
          <div className="text-xs font-medium text-purple-700">Aperçu</div>
          <div className="text-sm text-purple-900 mt-1">
            Exécuter: <strong>{cfg.sequence}</strong>
            {cfg.forceRestart && <span className="ml-2 text-orange-600">(Force restart)</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderWaitConfig = () => {
    const cfg = config as WaitConfig || { duration: 60, unit: 's' };
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">Duree</label>
            <input type="number" value={cfg.duration} onChange={(e) => setConfig({ ...cfg, duration: parseFloat(e.target.value) })} className="w-full mt-1 border rounded px-3 py-2" data-ai-target="duration-input" />
          </div>
          <div className="w-24">
            <label className="text-sm font-medium">Unite</label>
            <select value={cfg.unit} onChange={(e) => setConfig({ ...cfg, unit: e.target.value as 's' | 'min' | 'h' })} className="w-full mt-1 border rounded px-3 py-2">
              <option value="s">Secondes</option>
              <option value="min">Minutes</option>
              <option value="h">Heures</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileConfig = () => {
    const cfg = config as ProfileConfig || { points: [], variable: 'Temperature', unit: 'C' };
    
    // SVG Chart dimensions
    const w = 500, h = 200;
    const pad = { left: 50, right: 20, top: 20, bottom: 35 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    
    const points = cfg.points?.length ? cfg.points : [];
    const maxT = points.length ? Math.max(...points.map(p => p.time), 1) : 60;
    const maxV = points.length ? Math.max(...points.map(p => p.value), 1) : 100;
    const minV = points.length ? Math.min(...points.map(p => p.value), 0) : 0;
    const rangeV = maxV - minV || 1;
    
    // Convert data points to SVG coordinates
    const svgPoints = points.map(pt => ({
      x: pad.left + (pt.time / maxT) * plotW,
      y: pad.top + plotH - ((pt.value - minV) / rangeV) * plotH,
      time: pt.time,
      value: pt.value
    }));
    
    const linePath = svgPoints.length ? svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';
    const areaPath = linePath && svgPoints.length ? linePath + ` L ${svgPoints[svgPoints.length - 1].x} ${pad.top + plotH} L ${pad.left} ${pad.top + plotH} Z` : '';
    
    // Grid lines
    const gridLinesH = [0, 1, 2, 3, 4].map(i => pad.top + (plotH / 4) * i);
    const gridLinesV = [0, 1, 2, 3, 4].map(i => pad.left + (plotW / 4) * i);
    
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">Variable</label>
            <select value={cfg.variable} onChange={(e) => setConfig({ ...cfg, variable: e.target.value })} className="w-full mt-1 border rounded px-3 py-2">
              {VARIABLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="text-sm font-medium">Unite</label>
            <input value={cfg.unit} onChange={(e) => setConfig({ ...cfg, unit: e.target.value })} className="w-full mt-1 border rounded px-3 py-2" />
          </div>
        </div>
        
        {/* SVG Chart */}
        <div className="border rounded-xl bg-gradient-to-br from-gray-50 to-white p-3 shadow-inner">
          <div className="text-xs text-gray-500 mb-2 font-medium">Courbe du profil</div>
          <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            
            {/* Background */}
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#fafafa" rx="4" />
            
            {/* Grid */}
            {gridLinesH.map((y, i) => (
              <line key={`h${i}`} x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {gridLinesV.map((x, i) => (
              <line key={`v${i}`} x1={x} y1={pad.top} x2={x} y2={h - pad.bottom} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            
            {/* Axes */}
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="#374151" strokeWidth="2" />
            <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="#374151" strokeWidth="2" />
            
            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4].map(i => {
              const val = minV + (rangeV / 4) * (4 - i);
              const y = pad.top + (plotH / 4) * i;
              return <text key={`yl${i}`} x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">{val.toFixed(1)}</text>;
            })}
            
            {/* X-axis labels */}
            {[0, 1, 2, 3, 4].map(i => {
              const val = (maxT / 4) * i;
              const x = pad.left + (plotW / 4) * i;
              return <text key={`xl${i}`} x={x} y={h - pad.bottom + 15} textAnchor="middle" fontSize="10" fill="#6b7280">{val.toFixed(0)}</text>;
            })}
            
            {/* Axis titles */}
            <text x={w / 2} y={h - 5} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="500">Temps (min)</text>
            <text x="12" y={h / 2} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="500" transform={`rotate(-90 12 ${h / 2})`}>{cfg.variable} ({cfg.unit})</text>
            
            {/* Area fill */}
            {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}
            
            {/* Line */}
            {linePath && <path d={linePath} stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />}
            
            {/* Data points */}
            {svgPoints.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="8" fill="#ec4899" opacity="0.2" />
                <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#ec4899" strokeWidth="2.5" />
                <text x={p.x + 10} y={p.y - 8} fontSize="9" fill="#374151" fontFamily="monospace">({p.time}, {p.value})</text>
              </g>
            ))}
            
            {/* Empty state */}
            {!points.length && (
              <text x={w / 2} y={h / 2} textAnchor="middle" fontSize="12" fill="#9ca3af">Ajoutez des points pour visualiser la courbe</text>
            )}
          </svg>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Points (Temps, Valeur)</span>
          <button onClick={() => setConfig({ ...cfg, points: [...(cfg.points || []), { time: (cfg.points?.length || 0) * 10, value: 0 }] })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Ajouter</button>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {cfg.points?.map((pt, i) => (
            <div key={i} className="flex gap-2 items-center bg-gray-50 p-1.5 rounded">
              <span className="text-xs text-gray-500 w-14">Temps:</span>
              <input type="number" value={pt.time} onChange={(e) => { const p = [...cfg.points]; p[i].time = parseFloat(e.target.value) || 0; setConfig({ ...cfg, points: p }); }} className="w-20 text-sm border rounded px-2 py-1" />
              <span className="text-xs text-gray-500 w-14">Valeur:</span>
              <input type="number" value={pt.value} onChange={(e) => { const p = [...cfg.points]; p[i].value = parseFloat(e.target.value) || 0; setConfig({ ...cfg, points: p }); }} className="w-20 text-sm border rounded px-2 py-1" />
              <button onClick={() => setConfig({ ...cfg, points: cfg.points.filter((_, j) => j !== i) })} className="text-red-500 ml-auto"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPromptConfig = () => {
    const cfg = config as OperatorPromptConfig || { message: '', options: [] };
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea value={cfg.message} onChange={(e) => setConfig({ ...cfg, message: e.target.value })} rows={3} className="w-full mt-1 border rounded px-3 py-2" placeholder="Message a afficher..." />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Options de reponse</label>
            <button onClick={() => setConfig({ ...cfg, options: [...(cfg.options || []), 'Option'] })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Ajouter</button>
          </div>
          <div className="space-y-1 mt-2">
            {cfg.options?.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input value={opt} onChange={(e) => { const o = [...cfg.options]; o[i] = e.target.value; setConfig({ ...cfg, options: o }); }} className="flex-1 text-sm border rounded px-2 py-1" />
                <button onClick={() => setConfig({ ...cfg, options: cfg.options.filter((_, j) => j !== i) })} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const ACTUATOR_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

  const renderCascadeConfig = () => {
    const cfg = config as CascadeConfig || { masterVariable: 'DO%', setpoint: 30, deadband: 0.5, actuators: [] };
    
    // SVG Chart dimensions
    const w = 700, h = 280;
    const pad = { left: 60, right: 20, top: 30, bottom: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    
    const visibleActuators = cfg.actuators?.filter(a => a.visible) || [];
    
    // Grid lines
    const gridLinesH = [0, 1, 2, 3, 4].map(i => pad.top + (plotH / 4) * i);
    const gridLinesV = [0, 1, 2, 3, 4, 5].map(i => pad.left + (plotW / 5) * i);
    
    const addActuator = () => {
      const lastX = cfg.actuators?.length ? Math.max(...cfg.actuators.flatMap(a => a.points?.map(p => p.x) || [0])) : 0;
      const newActuator: CascadeActuator = {
        id: generateId(),
        name: `ACT_${(cfg.actuators?.length || 0) + 1}`,
        variable: 'Flow',
        unit: 'L/min',
        points: [{ x: lastX, y: 0 }, { x: 100, y: 10 }],
        visible: true,
        color: ACTUATOR_COLORS[(cfg.actuators?.length || 0) % ACTUATOR_COLORS.length],
        min: 0, max: 100, xp: 100, ti: 50, td: 0, hysteresis: '05:00', mode: 'off'
      };
      setConfig({ ...cfg, actuators: [...(cfg.actuators || []), newActuator] });
    };
    
    const addPoint = (actId: string) => {
      const act = cfg.actuators.find(a => a.id === actId);
      if (!act) return;
      const lastPt = act.points?.[act.points.length - 1] || { x: 0, y: 0 };
      const newPt: CascadePoint = { x: Math.min(lastPt.x + 10, 100), y: lastPt.y };
      updateActuator(actId, { points: [...(act.points || []), newPt] });
    };
    
    const updatePoint = (actId: string, ptIndex: number, updates: Partial<CascadePoint>) => {
      const act = cfg.actuators.find(a => a.id === actId);
      if (!act) return;
      const newPoints = act.points.map((p, i) => i === ptIndex ? { ...p, ...updates } : p);
      updateActuator(actId, { points: newPoints });
    };
    
    const removePoint = (actId: string, ptIndex: number) => {
      const act = cfg.actuators.find(a => a.id === actId);
      if (!act || act.points.length <= 2) return; // Keep at least 2 points
      updateActuator(actId, { points: act.points.filter((_, i) => i !== ptIndex) });
    };
    
    const updateActuator = (id: string, updates: Partial<CascadeActuator>) => {
      setConfig({
        ...cfg,
        actuators: cfg.actuators.map(a => a.id === id ? { ...a, ...updates } : a)
      });
    };
    
    const removeActuator = (id: string) => {
      setConfig({ ...cfg, actuators: cfg.actuators.filter(a => a.id !== id) });
    };
    
    return (
      <div className="space-y-4">
        {/* Master variable */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Variable maître</label>
            <select 
              value={cfg.masterVariable} 
              onChange={(e) => setConfig({ ...cfg, masterVariable: e.target.value })}
              className="w-full mt-1 border rounded px-3 py-2"
            >
              {VARIABLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Consigne (%)</label>
            <input 
              type="number" 
              value={cfg.setpoint} 
              onChange={(e) => setConfig({ ...cfg, setpoint: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 border rounded px-3 py-2" 
            />
          </div>
          <div>
            <label className="text-sm font-medium">DEADB (%sat)</label>
            <input 
              type="number" 
              step="0.1"
              value={cfg.deadband || 0.5} 
              onChange={(e) => setConfig({ ...cfg, deadband: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 border rounded px-3 py-2 bg-yellow-50" 
            />
          </div>
        </div>
        
        {/* Cascade Graph - Single graph, toggle visibility per actuator */}
        <div className="border rounded-xl bg-gradient-to-br from-cyan-50 to-white p-3 shadow-inner">
          <div className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-2">
            <span>Profil Cascade</span>
            <span className="text-cyan-600">({cfg.masterVariable} → Actionneurs)</span>
            {selectedActuatorId && <span className="ml-2 px-2 py-0.5 bg-cyan-200 rounded text-cyan-800">Cliquez pour ajouter un point</span>}
          </div>
          <svg 
            width={w} height={h} className={`w-full ${selectedActuatorId ? 'cursor-crosshair' : ''}`} viewBox={`0 0 ${w} ${h}`}
            onClick={(e) => {
              if (!selectedActuatorId) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const scaleX = w / rect.width;
              const clickX = (e.clientX - rect.left) * scaleX;
              const clickY = (e.clientY - rect.top) * scaleX;
              const xPercent = Math.round(((clickX - pad.left) / plotW) * 100);
              if (xPercent < 0 || xPercent > 100) return;
              const act = cfg.actuators.find(a => a.id === selectedActuatorId);
              if (!act) return;
              const pts = act.points || [];
              const yVals = pts.map(p => p.y);
              const yMin = Math.min(...yVals, 0);
              const yMax = Math.max(...yVals, 100);
              const yRange = yMax - yMin || 1;
              const yVal = Math.round(yMin + ((pad.top + plotH - clickY) / plotH) * yRange);
              const newPt = { x: xPercent, y: Math.max(0, yVal) };
              const newPts = [...pts, newPt].sort((a, b) => a.x - b.x);
              updateActuator(selectedActuatorId, { points: newPts });
            }}
          >
            <defs>
              {visibleActuators.map(act => (
                <linearGradient key={`grad-${act.id}`} id={`areaGrad-${act.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={act.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={act.color} stopOpacity="0.02" />
                </linearGradient>
              ))}
            </defs>
            
            {/* Background */}
            <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#f8fafc" rx="4" />
            
            {/* Grid */}
            {gridLinesH.map((y, i) => (
              <line key={`h${i}`} x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            ))}
            {gridLinesV.map((x, i) => (
              <line key={`v${i}`} x1={x} y1={pad.top} x2={x} y2={h - pad.bottom} stroke="#e2e8f0" strokeWidth="1" />
            ))}
            
            {/* Axes */}
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="#334155" strokeWidth="2" />
            <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="#334155" strokeWidth="2" />
            
            {/* X-axis labels (Out %) */}
            {[0, 20, 40, 60, 80, 100].map((val, i) => {
              const x = pad.left + (plotW / 5) * i;
              return <text key={`xl${i}`} x={x} y={h - pad.bottom + 18} textAnchor="middle" fontSize="10" fill="#64748b">{val}%</text>;
            })}
            <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="500">Sortie Régulateur (Out %)</text>
            
            {/* Y-axis: normalized 0-100% for all actuators */}
            {[0, 25, 50, 75, 100].map((val, i) => {
              const y = pad.top + (plotH / 4) * (4 - i / 25);
              return <text key={`yl${i}`} x={pad.left - 8} y={pad.top + plotH - (val / 100) * plotH + 4} textAnchor="end" fontSize="10" fill="#64748b">{val}%</text>;
            })}
            <text x="15" y={h / 2} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="500" transform={`rotate(-90 15 ${h / 2})`}>Niveau (%)</text>
            
            {/* Actuator polylines from points[] */}
            {visibleActuators.map(act => {
              const pts = act.points || [];
              if (pts.length < 2) return null;
              
              // Normalize Y using 0 as baseline and max point of THIS actuator as ceiling
              const yMax = Math.max(...pts.map(p => p.y));
              const yRange = yMax || 1;
              
              // Convert points to SVG coords
              const svgPts = pts.map(p => ({
                x: pad.left + (p.x / 100) * plotW,
                y: pad.top + plotH - (p.y / yRange) * plotH,
                val: p.y
              }));
              
              const linePath = svgPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaPath = linePath + ` L ${svgPts[svgPts.length - 1].x} ${pad.top + plotH} L ${svgPts[0].x} ${pad.top + plotH} Z`;
              
              return (
                <g key={act.id}>
                  <path d={areaPath} fill={`url(#areaGrad-${act.id})`} />
                  <path d={linePath} stroke={act.color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {svgPts.map((p, i) => (
                    <g key={i} style={{ cursor: 'pointer' }} onDoubleClick={(e) => {
                      e.stopPropagation();
                      const newY = prompt(`Point ${i + 1} - Nouvelle valeur Y (${act.unit}):`, String(p.val));
                      if (newY !== null) updatePoint(act.id, i, { y: parseFloat(newY) || 0 });
                    }}>
                      <circle cx={p.x} cy={p.y} r="8" fill={act.color} opacity="0.15" />
                      <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={act.color} strokeWidth="2" />
                      <text x={p.x + 10} y={p.y - 5} fontSize="9" fill={act.color} fontWeight="500">{p.val}{act.unit}</text>
                    </g>
                  ))}
                  <text x={(svgPts[0].x + svgPts[svgPts.length - 1].x) / 2} y={pad.top + 12} textAnchor="middle" fontSize="10" fill={act.color} fontWeight="600">{act.name}</text>
                </g>
              );
            })}
            
            {/* Empty state */}
            {!visibleActuators.length && (
              <text x={w / 2} y={h / 2} textAnchor="middle" fontSize="12" fill="#94a3b8">Activez la visibilité des actionneurs ci-dessous</text>
            )}
          </svg>
        </div>
        
        {/* Actuators list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Actionneurs (Cascade)</span>
            <button onClick={addActuator} className="text-xs text-cyan-600 flex items-center gap-1 hover:text-cyan-700">
              <Plus size={14} /> Ajouter
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cfg.actuators?.map((act, i) => (
              <div key={act.id} className="bg-gray-50 rounded-lg p-3 border" style={{ borderLeftColor: act.color, borderLeftWidth: 4 }}>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => updateActuator(act.id, { visible: !act.visible })}
                    className={`p-1 rounded ${act.visible ? 'text-cyan-600 hover:bg-cyan-100' : 'text-gray-400 hover:bg-gray-200'}`}
                    title={act.visible ? 'Masquer du graphe' : 'Afficher sur le graphe'}
                  >
                    {act.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <input 
                    value={act.name}
                    onChange={(e) => updateActuator(act.id, { name: e.target.value })}
                    className="flex-1 text-sm font-medium border rounded px-2 py-1"
                  />
                  <select 
                    value={act.variable}
                    onChange={(e) => updateActuator(act.id, { variable: e.target.value })}
                    className="text-sm border rounded px-2 py-1 w-28"
                  >
                    {VARIABLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                  <input 
                    value={act.unit}
                    onChange={(e) => updateActuator(act.id, { unit: e.target.value })}
                    placeholder="Unité"
                    className="w-16 text-sm border rounded px-2 py-1"
                  />
                  <button 
                    onClick={() => setExpandedPidId(expandedPidId === act.id ? null : act.id)} 
                    className={`px-2 py-1 rounded text-xs ${expandedPidId === act.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600 hover:bg-yellow-100'}`}
                    title="Paramètres PID"
                  >
                    ⚙️
                  </button>
                  <button onClick={() => removeActuator(act.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* PID Parameters Panel */}
                {expandedPidId === act.id && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      <div>
                        <label className="text-yellow-700">Min %</label>
                        <input type="number" value={act.min ?? 0} onChange={(e) => updateActuator(act.id, { min: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">Max %</label>
                        <input type="number" value={act.max ?? 100} onChange={(e) => updateActuator(act.id, { max: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">XP %</label>
                        <input type="number" value={act.xp ?? 100} onChange={(e) => updateActuator(act.id, { xp: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">TI (s)</label>
                        <input type="number" value={act.ti ?? 50} onChange={(e) => updateActuator(act.id, { ti: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">TD (s)</label>
                        <input type="number" value={act.td ?? 0} onChange={(e) => updateActuator(act.id, { td: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">Hyst.</label>
                        <input value={act.hysteresis ?? '05:00'} onChange={(e) => updateActuator(act.id, { hysteresis: e.target.value })} className="w-full border rounded px-1 py-0.5" />
                      </div>
                      <div>
                        <label className="text-yellow-700">Mode</label>
                        <select value={act.mode ?? 'off'} onChange={(e) => updateActuator(act.id, { mode: e.target.value as 'on' | 'off' })} className="w-full border rounded px-1 py-0.5">
                          <option value="off">off</option>
                          <option value="on">on</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">Points (X%, Y):</span>
                    <button onClick={() => addPoint(act.id)} className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                      <Plus size={12} /> Ajouter
                    </button>
                    <button 
                      onClick={() => setSelectedActuatorId(selectedActuatorId === act.id ? null : act.id)} 
                      className={`ml-auto px-2 py-0.5 rounded text-xs ${selectedActuatorId === act.id ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-cyan-100'}`}
                    >
                      {selectedActuatorId === act.id ? '✓ Édition graphe' : '🖱 Clic graphe'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {act.points?.map((pt, pi) => (
                      <div key={pi} className="flex items-center gap-1 bg-white border rounded px-1 py-0.5">
                        <span className="text-gray-400 font-bold w-4">{pi + 1}.</span>
                        <input type="number" value={pt.x} onChange={(e) => updatePoint(act.id, pi, { x: parseFloat(e.target.value) || 0 })} className="w-12 border rounded px-1 py-0.5 text-center" />
                        <span className="text-gray-400">%,</span>
                        <input type="number" value={pt.y} onChange={(e) => updatePoint(act.id, pi, { y: parseFloat(e.target.value) || 0 })} className="w-14 border rounded px-1 py-0.5 text-center" />
                        {act.points.length > 2 && (
                          <button onClick={() => removePoint(act.id, pi)} className="text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Preview */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
          <div className="text-xs font-medium text-cyan-700 mb-1">Logique Cascade</div>
          <div className="text-sm text-cyan-900">
            Si <strong>{cfg.masterVariable}</strong> &lt; <strong>{cfg.setpoint}%</strong> → 
            {cfg.actuators?.filter(a => a.visible).map((a, i) => {
              const pts = a.points || [];
              const yMin = pts.length ? Math.min(...pts.map(p => p.y)) : 0;
              const yMax = pts.length ? Math.max(...pts.map(p => p.y)) : 0;
              return <span key={a.id}>{i > 0 ? ' → ' : ' '}<span style={{ color: a.color }}>{a.name}</span> ({yMin}-{yMax}{a.unit})</span>;
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderConditionConfig = () => {
    const cfg = config as ConditionConfig || { expression: 'pH', operator: '>', value: 7, useExpression: false };
    
    // Detect if a Prompt is connected before this Condition
    const incomingConnection = connections.find(c => c.to === block.id);
    const parentBlock = incomingConnection ? blocks.find(b => b.id === incomingConnection.from) : null;
    const isAfterPrompt = parentBlock?.type === 'operator-prompt';
    const promptOptions = isAfterPrompt && parentBlock?.config 
      ? (parentBlock.config as OperatorPromptConfig).options || [] 
      : [];
    
    // If after prompt, show simplified UI
    if (isAfterPrompt && promptOptions.length > 0) {
      const selectedOption = cfg.expression || promptOptions[0];
      return (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700 text-sm font-medium mb-1">
              <HelpCircle size={16} />
              Condition basée sur réponse Prompt
            </div>
            <p className="text-xs text-orange-600">
              Ce bloc est connecté après "{parentBlock?.label}". Sélectionnez quelle réponse déclenche cette branche.
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Réponse attendue</label>
            <select 
              value={selectedOption} 
              onChange={(e) => setConfig({ ...cfg, expression: e.target.value, operator: '==', value: 1 })} 
              className="w-full mt-1 border-2 border-orange-300 rounded-lg px-3 py-2.5 text-base font-medium bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {promptOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-center text-white shadow-md">
            <div className="text-xs opacity-80 mb-1">Cette branche s'active si</div>
            <div className="text-lg font-bold">Réponse = "{selectedOption}"</div>
          </div>
          
          <p className="text-xs text-gray-500">VRAI (bas) = réponse sélectionnée • FAUX (droite) = autre réponse</p>
        </div>
      );
    }
    
    // Standard condition UI
    const storeState = useStore.getState();
    const condNamedCalcs = getNamedCalculations(storeState);

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">VRAI = bas (vert), FAUX = droite (rouge)</p>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={cfg.useExpression || false}
            onChange={(e) => setConfig({ ...cfg, useExpression: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm">Utiliser une expression avancée (FormulaEditor)</label>
        </div>

        <div>
          <label className="text-sm font-medium">{cfg.useExpression ? 'Expression' : 'Variable'}</label>
          {cfg.useExpression ? (
            <div className="mt-1">
              <FormulaEditor
                formula={cfg.expression}
                onFormulaChange={(expr) => setConfig({ ...cfg, expression: expr })}
                mode="condition"
                availableCalculations={condNamedCalcs}
                units={recipeUnits}
              />
            </div>
          ) : (
            <select value={cfg.expression} onChange={(e) => setConfig({ ...cfg, expression: e.target.value })} className="w-full mt-1 border rounded px-3 py-2">
              <optgroup label="Variables process">
                {VARIABLES.map(v => <option key={v}>{v}</option>)}
              </optgroup>
              {(() => { const cv = getCalculatedVariables(useStore.getState()); return cv.length > 0 ? (
                <optgroup label="Variables calculées">
                  {cv.map(v => <option key={v} value={v}>{v}</option>)}
                </optgroup>
              ) : null; })()}
            </select>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Operateur</label>
          <div className="flex gap-1 mt-1 flex-wrap">
            {(['>', '<', '>=', '<=', '==', '!='] as const).map(op => (
              <button key={op} onClick={() => setConfig({ ...cfg, operator: op })} className={`px-3 py-2 rounded text-sm font-mono ${cfg.operator === op ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>{op}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Valeur</label>
          <input type="number" value={cfg.value} onChange={(e) => setConfig({ ...cfg, value: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border rounded px-3 py-2" />
        </div>

        <div className="p-3 bg-gray-800 rounded-lg text-center font-mono text-sm text-yellow-300">
          IF {cfg.expression} {cfg.operator} {cfg.value}
        </div>
      </div>
    );
  };

  const renderConfigForm = () => {
    switch (block.type) {
      case 'parameter': return renderParameterConfig();
      case 'instrument': return renderInstrumentConfig();
      case 'wait': return renderWaitConfig();
      case 'profile': return renderProfileConfig();
      case 'operator-prompt': return renderPromptConfig();
      case 'condition': return renderConditionConfig();
      case 'cascade': return renderCascadeConfig();
      default: return <p className="text-gray-500 text-sm">Aucune configuration disponible.</p>;
    }
  };

  const typeLabels: Record<PhaseType, string> = {
    'start': 'Demarrage',
    'parameter': 'Phase Parametre',
    'operator-prompt': 'Prompt Operateur',
    'instrument': 'Phase Instrument',
    'wait': 'Phase Attente',
    'profile': 'Phase Profil',
    'condition': 'Condition (IF)',
    'cascade': 'Cascade (Régulation)',
    'end': 'Fin',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold">Configuration du bloc</h2>
            <p className="text-sm text-gray-500">{typeLabels[block.type]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Nom du bloc</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" data-ai-target="block-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Sous-titre</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="ex: pH=7" className="w-full mt-1 border rounded px-3 py-2" data-ai-target="block-subtitle" />
            </div>
          </div>
          
          <hr />
          
          {renderConfigForm()}
        </div>
        
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-ai-target="save-button">Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}
