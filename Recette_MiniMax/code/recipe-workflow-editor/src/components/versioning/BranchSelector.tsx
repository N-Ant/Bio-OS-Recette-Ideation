import { GitBranch, ChevronDown, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';

interface BranchSelectorProps {
  compact?: boolean;
}

export default function BranchSelector({ compact = false }: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const replaceRecipe = useStore(s => s.replaceRecipe);
  const selectOperation = useStore(s => s.selectOperation);
  const {
    getBranchesForRecipe, getActiveBranch, switchBranch, createBranch,
    getCommitSnapshot, setBranchManagerOpen,
  } = useVersioningStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedRecipeId) return null;

  const branches = getBranchesForRecipe(selectedRecipeId);
  const activeBranch = getActiveBranch(selectedRecipeId);

  if (branches.length === 0) return null;

  const handleSwitchBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch || branch.id === activeBranch?.id) {
      setIsOpen(false);
      return;
    }

    switchBranch(selectedRecipeId, branchId);
    // Clear restored state when switching branches
    useVersioningStore.getState().setRestoredFromCommitId(null);

    // Restore the recipe from the branch's head commit
    if (branch.headCommitId) {
      const snapshot = getCommitSnapshot(branch.headCommitId);
      if (snapshot) {
        replaceRecipe(selectedRecipeId, snapshot);
        const firstOp = snapshot.operations[0];
        if (firstOp) selectOperation(firstOp.id);
      }
    }
    setIsOpen(false);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    createBranch(selectedRecipeId, newBranchName.trim());
    setNewBranchName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg text-sm transition-colors ${
          compact
            ? 'px-2 py-1 hover:bg-gray-100 text-gray-600'
            : 'px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 w-full'
        }`}
      >
        <GitBranch size={14} style={{ color: activeBranch?.color || '#3b82f6' }} />
        <span className="truncate">{activeBranch?.name || 'Principal'}</span>
        <ChevronDown size={14} className="text-gray-400 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Variantes</div>

          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => handleSwitchBranch(branch.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                branch.id === activeBranch?.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />
              <span className="truncate">{branch.name}</span>
              {branch.id === activeBranch?.id && <span className="ml-auto text-[10px] text-blue-500">actif</span>}
            </button>
          ))}

          <div className="border-t my-1" />

          {isCreating ? (
            <div className="px-3 py-2">
              <input
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                placeholder="Nom de la variante..."
                className="w-full text-sm border rounded px-2 py-1 focus:ring-1 focus:ring-blue-300"
                autoFocus
              />
              <div className="flex gap-1 mt-1">
                <button onClick={handleCreateBranch} className="flex-1 text-xs py-1 bg-blue-500 text-white rounded">Creer</button>
                <button onClick={() => setIsCreating(false)} className="flex-1 text-xs py-1 bg-gray-100 rounded">Annuler</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              <Plus size={14} /> Nouvelle variante
            </button>
          )}

          {branches.length > 1 && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={() => { setBranchManagerOpen(true); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Gerer les variantes...
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
