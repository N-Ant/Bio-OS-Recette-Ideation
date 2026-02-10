import { useState } from 'react';
import { X, GitBranch, Trash2, Edit2, Check, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';

export default function BranchManager() {
  const {
    isBranchManagerOpen, setBranchManagerOpen,
    getBranchesForRecipe, getActiveBranch, getCommitsForBranch,
    switchBranch, renameBranch, deleteBranch, createBranch,
    getCommitSnapshot,
  } = useVersioningStore();
  const { selectedRecipeId, replaceRecipe, selectOperation } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isBranchManagerOpen || !selectedRecipeId) return null;

  const branches = getBranchesForRecipe(selectedRecipeId);
  const activeBranch = getActiveBranch(selectedRecipeId);

  const handleSwitch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch || branch.id === activeBranch?.id) return;
    switchBranch(selectedRecipeId, branchId);
    if (branch.headCommitId) {
      const snapshot = getCommitSnapshot(branch.headCommitId);
      if (snapshot) {
        replaceRecipe(selectedRecipeId, snapshot);
        const firstOp = snapshot.operations[0];
        if (firstOp) selectOperation(firstOp.id);
      }
    }
  };

  const handleRename = (branchId: string) => {
    if (editName.trim()) renameBranch(branchId, editName.trim());
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createBranch(selectedRecipeId, newName.trim());
    setNewName('');
    setIsCreating(false);
  };

  const handleDelete = (branchId: string) => {
    if (branches.length <= 1) return;
    deleteBranch(branchId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBranchManagerOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-purple-500" />
            <h2 className="text-lg font-semibold">Gestion des variantes</h2>
          </div>
          <button onClick={() => setBranchManagerOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {branches.map(branch => {
            const commitCount = getCommitsForBranch(branch.id).length;
            const isActive = branch.id === activeBranch?.id;
            const isEditing = editingId === branch.id;
            const parentBranch = branches.find(b => b.id === branch.parentBranchId);

            return (
              <div
                key={branch.id}
                className={`border rounded-xl p-4 transition-colors ${isActive ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(branch.id)}
                        className="flex-1 text-sm border rounded px-2 py-1"
                        autoFocus
                      />
                      <button onClick={() => handleRename(branch.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-800">{branch.name}</span>
                          {isActive && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">actif</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {commitCount} version(s) &middot; Cree {formatDistanceToNow(branch.createdAt, { addSuffix: true, locale: fr })}
                          {parentBranch && <span> &middot; Fork de {parentBranch.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isActive && (
                          <button
                            onClick={() => handleSwitch(branch.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Basculer vers cette variante"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingId(branch.id); setEditName(branch.name); }}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                          title="Renommer"
                        >
                          <Edit2 size={14} />
                        </button>
                        {branches.length > 1 && !isActive && (
                          <button
                            onClick={() => handleDelete(branch.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Create new branch */}
          {isCreating ? (
            <div className="border border-dashed border-purple-300 rounded-xl p-4 bg-purple-50/30">
              <div className="text-sm font-medium text-purple-700 mb-2">Nouvelle variante</div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Nom de la variante..."
                className="w-full text-sm border rounded-lg px-3 py-2 mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm">Creer</button>
                <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Annuler</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/30 transition-colors"
            >
              + Nouvelle variante
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={() => setBranchManagerOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Fermer</button>
        </div>
      </div>
    </div>
  );
}
