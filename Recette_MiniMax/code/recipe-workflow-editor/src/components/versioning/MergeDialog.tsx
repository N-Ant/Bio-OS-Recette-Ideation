import { useState, useMemo, useEffect } from 'react';
import { X, GitMerge, ArrowRight, Trash2, GitBranch, ChevronDown } from 'lucide-react';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';
import { computeRecipeDiff } from '../../versioning/diff';
import DiffOperationSection from './DiffOperationSection';

export default function MergeDialog() {
  const {
    isMergeDialogOpen, mergeSourceBranchId, setMergeDialogOpen,
    mergeBranch, getBranchesForRecipe, getActiveBranch,
    commits, preferredAuthor,
  } = useVersioningStore();

  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const replaceRecipe = useStore(s => s.replaceRecipe);

  const [deleteSource, setDeleteSource] = useState(true);
  const [author, setAuthor] = useState(preferredAuthor || '');
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  const branches = selectedRecipeId ? getBranchesForRecipe(selectedRecipeId) : [];
  const activeBranch = selectedRecipeId ? getActiveBranch(selectedRecipeId) : null;

  const sourceBranch = branches.find(b => b.id === mergeSourceBranchId);
  const targetCandidates = branches.filter(b => b.id !== mergeSourceBranchId);

  // Default target to main branch when dialog opens or source changes
  useEffect(() => {
    if (isMergeDialogOpen && mergeSourceBranchId) {
      const mainBranch = branches.find(b => !b.parentBranchId && b.id !== mergeSourceBranchId);
      setTargetBranchId(mainBranch?.id || targetCandidates[0]?.id || null);
      setIsTargetDropdownOpen(false);
    }
  }, [isMergeDialogOpen, mergeSourceBranchId]);

  const targetBranch = branches.find(b => b.id === targetBranchId);

  // Compute diff between target HEAD and source HEAD
  const diff = useMemo(() => {
    if (!sourceBranch?.headCommitId || !targetBranch?.headCommitId) return null;
    const sourceCommit = commits.find(c => c.id === sourceBranch.headCommitId);
    const targetCommit = commits.find(c => c.id === targetBranch.headCommitId);
    if (!sourceCommit || !targetCommit) return null;
    return computeRecipeDiff(targetCommit.snapshot, sourceCommit.snapshot);
  }, [sourceBranch?.headCommitId, targetBranch?.headCommitId, commits]);

  if (!isMergeDialogOpen || !sourceBranch || !targetBranch || !selectedRecipeId) return null;

  const s = diff?.summary;
  const totalChanges = s
    ? s.blocksAdded + s.blocksRemoved + s.blocksModified +
      s.connectionsAdded + s.connectionsRemoved + s.connectionsModified +
      s.operationsAdded + s.operationsRemoved
    : 0;

  const handleMerge = () => {
    const commitId = mergeBranch(
      sourceBranch.id,
      targetBranch.id,
      author.trim() || 'Anonyme',
      deleteSource
    );
    if (commitId) {
      // Apply the merged snapshot to the canvas
      const snapshot = useVersioningStore.getState().getCommitSnapshot(commitId);
      if (snapshot) {
        replaceRecipe(selectedRecipeId, snapshot);
      }
    }
  };

  const handleClose = () => setMergeDialogOpen(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-purple-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-purple-700">
            <GitMerge size={20} />
            <h2 className="font-semibold text-lg">Fusionner une variante</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-purple-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Merge direction */}
        <div className="px-4 lg:px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 justify-center flex-wrap">
            {/* Source (fixed) */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg" style={{ backgroundColor: sourceBranch.color + '15' }}>
              <GitBranch size={16} style={{ color: sourceBranch.color }} />
              <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none" style={{ color: sourceBranch.color }}>{sourceBranch.name}</span>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
            {/* Target (selectable) */}
            <div className="relative">
              <button
                onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: targetBranch.color + '15', borderColor: targetBranch.color + '40' }}
              >
                <GitBranch size={16} style={{ color: targetBranch.color }} />
                <span className="font-medium text-sm" style={{ color: targetBranch.color }}>{targetBranch.name}</span>
                <ChevronDown size={14} style={{ color: targetBranch.color }} className={`transition-transform ${isTargetDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTargetDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-10 min-w-[180px] py-1 max-h-64 overflow-y-auto">
                  {targetCandidates.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setTargetBranchId(b.id); setIsTargetDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${b.id === targetBranchId ? 'bg-gray-50' : ''}`}
                    >
                      <GitBranch size={14} style={{ color: b.color }} />
                      <span style={{ color: b.color }} className="font-medium">{b.name}</span>
                      {!b.parentBranchId && <span className="text-[10px] text-gray-400 ml-auto">principale</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            L'etat de "{sourceBranch.name}" sera applique dans "{targetBranch.name}"
          </p>
        </div>

        {/* Diff summary */}
        {diff && totalChanges > 0 && (
          <div className="px-6 py-3 border-b bg-blue-50 flex flex-wrap gap-2 text-xs flex-shrink-0">
            {s!.blocksAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s!.blocksAdded} bloc(s)</span>}
            {s!.blocksRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s!.blocksRemoved} bloc(s)</span>}
            {s!.blocksModified > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">~{s!.blocksModified} bloc(s)</span>}
            {s!.connectionsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s!.connectionsAdded} connexion(s)</span>}
            {s!.connectionsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s!.connectionsRemoved} connexion(s)</span>}
            {s!.operationsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s!.operationsAdded} operation(s)</span>}
            {s!.operationsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s!.operationsRemoved} operation(s)</span>}
          </div>
        )}

        {diff && totalChanges === 0 && (
          <div className="px-6 py-3 border-b bg-yellow-50 text-sm text-yellow-700 text-center flex-shrink-0">
            Aucune difference entre les deux variantes
          </div>
        )}

        {/* Diff details - scrollable */}
        {diff && totalChanges > 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {diff.nameChanged && (
              <div className="p-3 bg-purple-50 rounded-lg text-sm">
                <span className="text-purple-700">Nom: </span>
                <span className="line-through text-red-600">{diff.oldName}</span>
                <span className="text-gray-400"> &rarr; </span>
                <span className="text-green-600">{diff.newName}</span>
              </div>
            )}
            {diff.operationDiffs.map(opDiff => (
              <DiffOperationSection key={opDiff.operationId} diff={opDiff} />
            ))}
          </div>
        )}

        {/* Options */}
        <div className="px-6 py-4 border-t space-y-3 flex-shrink-0">
          <div>
            <label className="text-sm font-medium text-gray-700">Auteur</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Votre nom"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteSource}
              onChange={e => setDeleteSource(e.target.checked)}
              className="rounded border-gray-300 text-purple-500 focus:ring-purple-400"
            />
            <Trash2 size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">Supprimer la variante "{sourceBranch.name}" apres la fusion</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
          <button
            onClick={handleMerge}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"
          >
            <GitMerge size={16} />
            Fusionner dans {targetBranch.name}
          </button>
        </div>
      </div>
    </div>
  );
}
