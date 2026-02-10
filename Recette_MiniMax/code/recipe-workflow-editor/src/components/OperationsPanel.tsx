import { useState } from 'react';
import { Plus, X, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { useStore } from '../store';

export default function OperationsPanel() {
  const { recipes, selectedRecipeId, selectedOperationId, selectOperation, addOperation, deleteOperation, moveOperation } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const recipe = recipes.find((r) => r.id === selectedRecipeId);
  const operations = recipe?.operations || [];

  const handleAdd = () => {
    if (newName.trim()) {
      addOperation(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

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
                    
                    <div className="flex flex-col pr-2 opacity-0 group-hover:opacity-100">
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
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full flex-shrink-0 mr-2"
                    >
                      <X size={12} />
                    </button>
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
                  <button onClick={() => setIsAdding(false)} className="flex-1 text-sm px-3 py-1.5 bg-gray-200 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)} 
                className="mt-4 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
