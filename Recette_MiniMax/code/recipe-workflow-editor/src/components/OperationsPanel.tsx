import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, ChevronUp, ChevronDown, Minus, Layout, Beaker, Droplets, TrendingUp, Activity, Droplet, Flame, Power, Bookmark, Save, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { OPERATION_TEMPLATES, TEMPLATE_CATEGORIES, type OperationTemplate } from '../data/operationTemplates';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  Beaker, Droplets, TrendingUp, Activity, Droplet, Flame, Power, Bookmark,
};

export default function OperationsPanel() {
  const { recipes, selectedRecipeId, selectedOperationId, userTemplates, selectOperation, addOperation, addOperationFromTemplate, saveOperationAsTemplate, deleteUserTemplate, deleteOperation, moveOperation } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const recipe = recipes.find((r) => r.id === selectedRecipeId);
  const operations = recipe?.operations || [];

  const computeMenuPos = useCallback(() => {
    if (!addBtnRef.current) return null;
    const rect = addBtnRef.current.getBoundingClientRect();
    return { top: rect.top, left: rect.right + 8 };
  }, []);

  const openTemplates = () => {
    setMenuPos(computeMenuPos());
    setShowTemplates(true);
  };

  const closeAll = useCallback(() => {
    setShowTemplates(false);
    setMenuPos(null);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    if (!showTemplates) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTemplates, closeAll]);

  // Clear saved feedback after 2s
  useEffect(() => {
    if (!savedFeedback) return;
    const t = setTimeout(() => setSavedFeedback(null), 2000);
    return () => clearTimeout(t);
  }, [savedFeedback]);

  const handleAdd = () => {
    if (newName.trim()) {
      addOperation(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleTemplateSelect = (template: OperationTemplate) => {
    addOperationFromTemplate(template);
    closeAll();
  };

  const handleSaveAsTemplate = (opId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveOperationAsTemplate(opId);
    setSavedFeedback(opId);
  };

  const templatesByCategory = TEMPLATE_CATEGORIES.map((cat) => ({
    ...cat,
    templates: OPERATION_TEMPLATES.filter((t) => t.category === cat.key),
  }));

  return (
    <div className={`bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden ${isCollapsed ? 'w-auto' : 'w-44 lg:w-56 max-h-[calc(100vh-140px)]'}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-base font-medium text-gray-800">Operation</span>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Minus size={14} className={`text-gray-500 transition-transform ${isCollapsed ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Operations List */}
          <div className="flex-1 overflow-y-auto p-4 pt-2">
            <div className="space-y-3 relative">
              {operations.map((op, idx) => (
                <div key={op.id} className="relative">
                  {/* Vertical connector line */}
                  {idx > 0 && (
                    <div className="absolute left-1/2 -top-3 w-0.5 h-3 bg-gray-300 -translate-x-1/2" />
                  )}
                  <div
                    onClick={() => selectOperation(op.id)}
                    className={`relative flex items-center rounded-full cursor-pointer group border-2 transition-all ${
                      selectedOperationId === op.id
                        ? 'border-blue-400 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 px-4 py-2.5">{op.name}</span>

                    <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100">
                      {/* Save as template */}
                      <button
                        onClick={(e) => handleSaveAsTemplate(op.id, e)}
                        title="Sauvegarder comme template"
                        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-500"
                      >
                        {savedFeedback === op.id ? <Bookmark size={12} className="text-blue-500 fill-blue-500" /> : <Save size={12} />}
                      </button>

                      <div className="flex flex-col ml-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveOperation(op.id, 'up'); }}
                          disabled={idx === 0}
                          className={`p-0.5 rounded hover:bg-gray-200 ${idx === 0 ? 'text-gray-300' : 'text-gray-500'}`}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveOperation(op.id, 'down'); }}
                          disabled={idx === operations.length - 1}
                          className={`p-0.5 rounded hover:bg-gray-200 ${idx === operations.length - 1 ? 'text-gray-300' : 'text-gray-500'}`}
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteOperation(op.id); }}
                        className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  {idx < operations.length - 1 && (
                    <div className="absolute left-1/2 -bottom-3 w-0.5 h-3 bg-gray-300 -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>

            {/* Add Operation */}
            {isAdding ? (
              <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Phase name"
                  className="w-full text-sm px-3 py-2 border rounded-lg mb-2"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="flex-1 text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg">Add</button>
                  <button onClick={() => { setIsAdding(false); setNewName(''); }} className="flex-1 text-sm px-3 py-1.5 bg-gray-200 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-1.5">
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button
                  ref={addBtnRef}
                  onClick={() => showTemplates ? closeAll() : openTemplates()}
                  title="Depuis un template"
                  className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <Layout size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Fixed-position Template Picker Popover */}
      {showTemplates && menuPos && (
        <div
          ref={menuRef}
          className="fixed bg-white rounded-xl shadow-lg border border-gray-200 w-72 max-h-96 overflow-y-auto"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <span className="text-sm font-medium text-gray-700">Templates</span>
            <button onClick={closeAll} className="p-1 hover:bg-gray-100 rounded">
              <X size={14} className="text-gray-400" />
            </button>
          </div>

          {/* User templates */}
          {userTemplates.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Mes Templates
              </div>
              {userTemplates.map((tpl) => (
                <div key={tpl.id} className="flex items-start group/tpl">
                  <button
                    onClick={() => handleTemplateSelect(tpl)}
                    className="flex-1 flex items-start gap-3 px-4 py-2 hover:bg-gray-50 text-left min-w-0"
                  >
                    <Bookmark size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-700">{tpl.name}</div>
                      <div className="text-xs text-gray-400 truncate">{tpl.blocks.length} blocs</div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteUserTemplate(tpl.id); }}
                    className="opacity-0 group-hover/tpl:opacity-100 p-2 hover:bg-red-50 text-gray-300 hover:text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="border-t border-gray-100 my-1" />
            </div>
          )}

          {/* Built-in templates */}
          {templatesByCategory.map((cat) => (
            <div key={cat.key}>
              <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
                {cat.label}
              </div>
              {cat.templates.map((tpl) => {
                const Icon = TEMPLATE_ICONS[tpl.icon] || Bookmark;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateSelect(tpl)}
                    className="w-full flex items-start gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                  >
                    <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: cat.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-700">{tpl.name}</div>
                      <div className="text-xs text-gray-400 truncate">{tpl.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
