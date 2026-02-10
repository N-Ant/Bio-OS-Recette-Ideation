import { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';

export default function RestoreConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCommitId, getCommitSnapshot, getCommitNumber, commits, setRestoredFromCommitId } = useVersioningStore();
  const { replaceRecipe, selectedRecipeId, selectOperation } = useStore();

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('versioning:restore-confirm', handler);
    return () => window.removeEventListener('versioning:restore-confirm', handler);
  }, []);

  if (!isOpen || !selectedCommitId) return null;

  const commit = commits.find(c => c.id === selectedCommitId);
  if (!commit) return null;

  const versionNum = getCommitNumber(selectedCommitId);

  const handleRestore = () => {
    const snapshot = getCommitSnapshot(selectedCommitId);
    if (snapshot && selectedRecipeId) {
      replaceRecipe(selectedRecipeId, snapshot);
      // Track which commit was restored for correct parentCommitId on next save
      setRestoredFromCommitId(selectedCommitId);
      // Select first operation of the restored recipe
      const firstOp = snapshot.operations[0];
      if (firstOp) selectOperation(firstOp.id);
      setIsOpen(false);
    }
  };

  const handleClose = () => setIsOpen(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle size={20} />
            <h2 className="font-semibold">Restaurer une version</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-orange-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-200 rounded">v1.{versionNum}</span>
              <span className="text-sm font-medium text-gray-800">{commit.message}</span>
            </div>
            <div className="text-xs text-gray-400">
              {commit.author} &middot; {formatDistanceToNow(commit.timestamp, { addSuffix: true, locale: fr })}
            </div>
          </div>

          <p className="text-sm text-gray-600">
            La recette sera remplacee par l'etat de la version <strong>v1.{versionNum}</strong>.
            Vous pourrez continuer a travailler et sauvegarder quand vous le souhaitez.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
            Les modifications non sauvegardees seront perdues.
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Restaurer v1.{versionNum}
          </button>
        </div>
      </div>
    </div>
  );
}
