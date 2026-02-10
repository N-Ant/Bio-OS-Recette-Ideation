import { useState, useRef } from 'react';
import { Upload, MoreHorizontal, Trash2, Edit2, Download, Minus, History, GitBranch } from 'lucide-react';
import { useStore } from '../store';
import { useVersioningStore } from '../versioning/store';
import VersionBadge from './versioning/VersionBadge';

export default function RecipePanel() {
  const { recipes, selectedRecipeId, selectRecipe, addRecipe, deleteRecipe, renameRecipe, importRecipe } = useStore();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewRecipe = () => {
    const name = `Recipe-${recipes.length + 1}`;
    addRecipe(name);
  };

  const handleRename = (id: string) => {
    renameRecipe(id, editName);
    setEditingId(null);
  };

  const handleExport = (recipe: typeof recipes[0]) => {
    const json = JSON.stringify(recipe, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name}.json`;
    a.click();
    setMenuOpen(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const recipe = JSON.parse(event.target?.result as string);
          importRecipe(recipe);
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden ${isCollapsed ? 'w-auto' : 'w-48 lg:w-64 max-h-[calc(100vh-140px)]'}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <span className="text-base font-medium text-gray-800">Recette</span>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Minus size={14} className={`text-gray-500 transition-transform ${isCollapsed ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          {/* New Recipe Button */}
          <div className="px-4 pb-3">
            <button 
              onClick={handleNewRecipe} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              New Recipe <span className="text-pink-300 text-lg">+</span>
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50">
              <div className="w-4 h-4 border-2 border-gray-300 rounded" />
              Cases à cocher
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="6" y1="12" x2="18" y2="12"/>
                <line x1="8" y1="18" x2="16" y2="18"/>
              </svg>
              Filter
            </button>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto px-2">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => selectRecipe(recipe.id)}
                className={`relative flex items-center justify-between px-3 py-3 cursor-pointer group border-b border-gray-100 ${
                  selectedRecipeId === recipe.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                {editingId === recipe.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(recipe.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(recipe.id)}
                    className="flex-1 text-sm px-2 py-1 border rounded"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700">{recipe.name}</span>
                      <div className="mt-0.5"><VersionBadge recipeId={recipe.id} compact /></div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === recipe.id ? null : recipe.id); }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </>
                )}
                
                {menuOpen === recipe.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button onClick={() => { setEditingId(recipe.id); setEditName(recipe.name); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100"><Edit2 size={14} /> Rename</button>
                    <button onClick={() => handleExport(recipe)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100"><Download size={14} /> Export</button>
                    <button onClick={() => { selectRecipe(recipe.id); useVersioningStore.getState().setHistoryPanelOpen(true); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100"><History size={14} /> Historique</button>
                    <button onClick={() => { selectRecipe(recipe.id); useVersioningStore.getState().setBranchManagerOpen(true); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100"><GitBranch size={14} /> Variantes</button>
                    <button onClick={() => { deleteRecipe(recipe.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Import Button */}
          <div className="p-4 flex justify-center">
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm border border-gray-200 rounded-full hover:bg-gray-50"
            >
              <Upload size={14} /> Import Recipe
            </button>
          </div>
        </>
      )}
    </div>
  );
}
