import { useState, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Delete } from 'lucide-react';
import { MATH_FUNCTIONS, MFCS_VARIABLES, DEFAULT_UNITS, RecipeUnit } from '../types';

interface FormulaEditorProps {
  formula: string;
  onFormulaChange: (formula: string) => void;
  showMetaData?: boolean;
  showResultLimitation?: boolean;
  availableVariables?: string[];
  availableCalculations?: { name: string; formula: string }[];
  mode?: 'condition' | 'calculation';
  units?: RecipeUnit[];  // Bioreactor units with their variables
  // Meta data fields (only when showMetaData)
  name?: string;
  onNameChange?: (name: string) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  resultLimitation?: boolean;
  onResultLimitationChange?: (enabled: boolean) => void;
  resultMin?: number;
  onResultMinChange?: (min: number) => void;
  resultMax?: number;
  onResultMaxChange?: (max: number) => void;
}

// Lightweight formula validation
function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula.trim()) return { valid: true };

  // Check balanced parentheses
  let depth = 0;
  for (const ch of formula) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) return { valid: false, error: 'Parenthèse fermante en trop' };
  }
  if (depth > 0) return { valid: false, error: `${depth} parenthèse(s) non fermée(s)` };

  // Check for consecutive operators
  if (/[+\-*/]{2,}/.test(formula.replace(/\s/g, ''))) {
    return { valid: false, error: 'Opérateurs consécutifs' };
  }

  return { valid: true };
}

export default function FormulaEditor({
  formula,
  onFormulaChange,
  showMetaData = false,
  showResultLimitation = false,
  availableVariables = MFCS_VARIABLES,
  availableCalculations = [],
  mode = 'calculation',
  units,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  resultLimitation,
  onResultLimitationChange,
  resultMin,
  onResultMinChange,
  resultMax,
  onResultMaxChange,
}: FormulaEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [showVarPopover, setShowVarPopover] = useState(false);
  const [showCalcPopover, setShowCalcPopover] = useState(false);
  const [varSearch, setVarSearch] = useState('');
  const [calcSearch, setCalcSearch] = useState('');

  const validation = validateFormula(formula);

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    const input = inputRef.current;
    if (!input) {
      onFormulaChange(formula + text);
      return;
    }
    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;
    const newFormula = formula.slice(0, start) + text + formula.slice(end);
    onFormulaChange(newFormula);
    // Restore cursor after text
    requestAnimationFrame(() => {
      input.focus();
      const newPos = start + text.length;
      input.setSelectionRange(newPos, newPos);
    });
  }, [formula, onFormulaChange]);

  const handleBackspace = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      onFormulaChange(formula.slice(0, -1));
      return;
    }
    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;
    if (start !== end) {
      // Delete selection
      onFormulaChange(formula.slice(0, start) + formula.slice(end));
      requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start, start); });
    } else if (start > 0) {
      onFormulaChange(formula.slice(0, start - 1) + formula.slice(start));
      requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start - 1, start - 1); });
    }
  }, [formula, onFormulaChange]);

  const activeUnits = units && units.length > 0 ? units : DEFAULT_UNITS;

  // Deduplicate variables across all units, track which units have each
  const allVarsSet = new Set<string>();
  for (const u of activeUnits) for (const v of u.variables) allVarsSet.add(v);
  const allVars = Array.from(allVarsSet);
  const varToUnits = (v: string) => activeUnits.filter(u => u.variables.includes(v)).map(u => u.name);

  const filteredVars = allVars.filter(v =>
    v.toLowerCase().includes(varSearch.toLowerCase())
  );

  const filteredCalcs = availableCalculations.filter(c =>
    c.name.toLowerCase().includes(calcSearch.toLowerCase())
  );

  const [expandedRefNames, setExpandedRefNames] = useState<Set<string>>(new Set());

  // Detect referenced calculation names in the formula
  const referencedCalcs = useMemo(() => {
    if (!formula) return [];
    return availableCalculations.filter(c => formula.includes(c.name));
  }, [formula, availableCalculations]);

  // Render formula preview with interactive calculation references
  const renderFormulaPreview = () => {
    if (!formula || !validation.valid) return null;
    if (referencedCalcs.length === 0) return <span>{formula}</span>;

    // Split formula by known calc names to create segments
    const parts: { text: string; isRef: boolean; calc?: typeof availableCalculations[0] }[] = [];
    let remaining = formula;
    // Sort by length desc to match longest names first
    const sortedRefs = [...referencedCalcs].sort((a, b) => b.name.length - a.name.length);

    while (remaining.length > 0) {
      let earliestIdx = remaining.length;
      let matchedCalc: typeof availableCalculations[0] | undefined;
      for (const c of sortedRefs) {
        const idx = remaining.indexOf(c.name);
        if (idx !== -1 && idx < earliestIdx) {
          earliestIdx = idx;
          matchedCalc = c;
        }
      }
      if (!matchedCalc) {
        parts.push({ text: remaining, isRef: false });
        break;
      }
      if (earliestIdx > 0) {
        parts.push({ text: remaining.slice(0, earliestIdx), isRef: false });
      }
      parts.push({ text: matchedCalc.name, isRef: true, calc: matchedCalc });
      remaining = remaining.slice(earliestIdx + matchedCalc.name.length);
    }

    return (
      <span>
        {parts.map((p, idx) =>
          p.isRef && p.calc ? (
            <span key={idx} className="inline-flex flex-col">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const next = new Set(expandedRefNames);
                  if (next.has(p.calc!.name)) next.delete(p.calc!.name);
                  else next.add(p.calc!.name);
                  setExpandedRefNames(next);
                }}
                className="cursor-pointer underline decoration-dotted decoration-emerald-500 hover:text-yellow-300 transition-colors"
                title={`Cliquer pour voir: ${p.calc.formula}`}
              >
                {p.text}
              </span>
              {expandedRefNames.has(p.calc.name) && (
                <span className="text-[10px] text-yellow-300/80 bg-gray-700 rounded px-1 py-0.5 mt-0.5 inline-block">
                  = {p.calc.formula}
                </span>
              )}
            </span>
          ) : (
            <span key={idx}>{p.text}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-3 border border-emerald-200 rounded-xl p-3 bg-emerald-50/30">
      {/* ─── ZONE 1: META DATA (collapsible) ─── */}
      {showMetaData && (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <button
            onClick={() => setMetaExpanded(!metaExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {metaExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            META DATA
          </button>
          {metaExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom</label>
                <input
                  value={name || ''}
                  onChange={(e) => onNameChange?.(e.target.value)}
                  placeholder="Nom du calcul"
                  className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <input
                  value={description || ''}
                  onChange={(e) => onDescriptionChange?.(e.target.value)}
                  placeholder="Description"
                  className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                />
              </div>
              {showResultLimitation && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={resultLimitation || false}
                      onChange={(e) => onResultLimitationChange?.(e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-xs font-medium text-gray-600">Result Limitation</label>
                  </div>
                  {resultLimitation && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Min</label>
                        <input
                          type="number"
                          value={resultMin ?? 0}
                          onChange={(e) => onResultMinChange?.(parseFloat(e.target.value) || 0)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Max</label>
                        <input
                          type="number"
                          value={resultMax ?? 100}
                          onChange={(e) => onResultMaxChange?.(parseFloat(e.target.value) || 0)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── ZONE 2: FUNCTIONS ─── */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Functions</div>
        <div className="flex flex-wrap gap-1">
          {/* VARIABLE button with popover */}
          <div className="relative">
            <button
              onClick={() => { setShowVarPopover(!showVarPopover); setShowCalcPopover(false); }}
              className="px-2 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              VARIABLE
            </button>
            {showVarPopover && (
              <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-2">
                <div className="flex items-center gap-1 mb-2 border rounded px-2 py-1 bg-gray-50">
                  <Search size={12} className="text-gray-400" />
                  <input
                    value={varSearch}
                    onChange={(e) => setVarSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 text-xs bg-transparent outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {filteredVars.map(v => {
                    const presentIn = varToUnits(v);
                    return (
                      <button
                        key={v}
                        onClick={() => { insertAtCursor(v); setShowVarPopover(false); setVarSearch(''); }}
                        className="w-full flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <span className="font-mono text-gray-700">{v}</span>
                        <span className="flex gap-0.5 flex-shrink-0 ml-1">
                          {presentIn.map(u => (
                            <span key={u} className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">{u}</span>
                          ))}
                        </span>
                      </button>
                    );
                  })}
                  {filteredVars.length === 0 && (
                    <div className="text-xs text-gray-400 p-2 text-center">Aucune variable</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FORMULA button (reuse named calculations) */}
          {availableCalculations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => { setShowCalcPopover(!showCalcPopover); setShowVarPopover(false); }}
                className="px-2 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                FORMULA
              </button>
              {showCalcPopover && (
                <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-2">
                  <div className="flex items-center gap-1 mb-2 border rounded px-2 py-1 bg-gray-50">
                    <Search size={12} className="text-gray-400" />
                    <input
                      value={calcSearch}
                      onChange={(e) => setCalcSearch(e.target.value)}
                      placeholder="Rechercher calcul..."
                      className="flex-1 text-xs bg-transparent outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {filteredCalcs.map(c => (
                      <button
                        key={c.name}
                        onClick={() => { insertAtCursor(c.name); setShowCalcPopover(false); setCalcSearch(''); }}
                        className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-emerald-50"
                      >
                        <div className="font-medium text-emerald-700">{c.name}</div>
                        <div className="text-gray-400 font-mono truncate">{c.formula}</div>
                      </button>
                    ))}
                    {filteredCalcs.length === 0 && (
                      <div className="text-xs text-gray-400 p-2 text-center">Aucun calcul</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Math function buttons */}
          {MATH_FUNCTIONS.map(fn => (
            <button
              key={fn}
              onClick={() => insertAtCursor(`${fn}(`)}
              className="px-2 py-1.5 text-xs font-mono bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              {fn}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ZONE 3: FORMULA / CONDITION input ─── */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {mode === 'condition' ? 'Condition' : 'Formula'}
        </div>
        <input
          ref={inputRef}
          value={formula}
          onChange={(e) => onFormulaChange(e.target.value)}
          placeholder={mode === 'condition' ? 'ex: pH.Value > 7.0 AND pO2.Value < 50' : 'ex: getValue(O2_Total.Value;0) + O2_Flow.Value * (calcCycle()/60)'}
          className={`w-full border-2 rounded-lg px-3 py-2.5 font-mono text-sm transition-colors ${
            !validation.valid ? 'border-red-400 bg-red-50' : formula ? 'border-emerald-400 bg-white' : 'border-gray-200 bg-white'
          }`}
          onClick={() => { setShowVarPopover(false); setShowCalcPopover(false); }}
        />
        {/* Live preview + validation */}
        <div className="flex items-start justify-between gap-2">
          {formula && (
            <div className={`text-xs font-mono px-2 py-1 rounded flex-1 ${
              validation.valid ? 'bg-gray-800 text-emerald-400' : 'bg-red-100 text-red-600'
            }`}>
              {validation.valid ? renderFormulaPreview() : validation.error}
            </div>
          )}
          {!formula && <div />}
          {formula && validation.valid && (
            <span className="text-xs text-emerald-600 font-medium flex-shrink-0 mt-1">OK</span>
          )}
        </div>
      </div>

      {/* ─── ZONE 4: OTHERS (operators / logic) ─── */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Others</div>
        <div className="flex flex-wrap gap-1">
          {['(', ')', ';', '<', '>', '<=', '>=', '==', '!=', 'OR', 'AND', 'NOT'].map(op => (
            <button
              key={op}
              onClick={() => insertAtCursor(op.length > 2 ? ` ${op} ` : op)}
              className="px-2.5 py-1.5 text-xs font-mono bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md border border-amber-200 transition-colors"
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ZONE 5: NUM BLOCK ─── */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Num Block</div>
        <div className="grid grid-cols-5 gap-1 max-w-[260px]">
          {['7', '8', '9', '+', '-'].map(k => (
            <button key={k} onClick={() => insertAtCursor(k)} className="py-2 text-sm font-mono bg-white hover:bg-gray-50 text-gray-800 rounded-md border border-gray-200 transition-colors">{k}</button>
          ))}
          {['4', '5', '6', '*', '/'].map(k => (
            <button key={k} onClick={() => insertAtCursor(k)} className="py-2 text-sm font-mono bg-white hover:bg-gray-50 text-gray-800 rounded-md border border-gray-200 transition-colors">{k}</button>
          ))}
          {['1', '2', '3', '.'].map(k => (
            <button key={k} onClick={() => insertAtCursor(k)} className="py-2 text-sm font-mono bg-white hover:bg-gray-50 text-gray-800 rounded-md border border-gray-200 transition-colors">{k}</button>
          ))}
          <button onClick={handleBackspace} className="py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-colors flex items-center justify-center">
            <Delete size={14} />
          </button>
          <button onClick={() => insertAtCursor('0')} className="col-span-2 py-2 text-sm font-mono bg-white hover:bg-gray-50 text-gray-800 rounded-md border border-gray-200 transition-colors">0</button>
          <button onClick={() => insertAtCursor(' ')} className="col-span-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-md border border-gray-200 transition-colors">espace</button>
        </div>
      </div>
    </div>
  );
}
