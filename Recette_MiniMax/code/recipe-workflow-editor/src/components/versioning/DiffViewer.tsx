import { useMemo } from 'react';
import { X, ArrowLeftRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useVersioningStore } from '../../versioning/store';
import { computeRecipeDiff } from '../../versioning/diff';
import DiffOperationSection from './DiffOperationSection';

export default function DiffViewer() {
  const {
    isDiffViewerOpen, setDiffViewerOpen,
    compareFromCommitId, compareToCommitId,
    commits, getCommitNumber, setCanvasDiffMode,
  } = useVersioningStore();

  const fromCommit = commits.find(c => c.id === compareFromCommitId);
  const toCommit = commits.find(c => c.id === compareToCommitId);

  const diff = useMemo(() => {
    if (!fromCommit || !toCommit) return null;
    return computeRecipeDiff(fromCommit.snapshot, toCommit.snapshot);
  }, [fromCommit, toCommit]);

  if (!isDiffViewerOpen || !diff || !fromCommit || !toCommit) return null;

  const fromNum = getCommitNumber(fromCommit.id);
  const toNum = getCommitNumber(toCommit.id);
  const s = diff.summary;
  const totalChanges = s.blocksAdded + s.blocksRemoved + s.blocksModified +
    s.connectionsAdded + s.connectionsRemoved + s.connectionsModified +
    s.operationsAdded + s.operationsRemoved;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDiffViewerOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 lg:px-6 py-4 border-b bg-gray-50 flex items-start sm:items-center justify-between flex-shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <ArrowLeftRight size={20} className="text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm px-2 py-0.5 bg-red-100 text-red-700 rounded">v1.{fromNum}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="font-mono text-sm px-2 py-0.5 bg-green-100 text-green-700 rounded">v1.{toNum}</span>
              </h2>
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {fromCommit.author} ({formatDistanceToNow(fromCommit.timestamp, { locale: fr })})
                {' '}&rarr;{' '}
                {toCommit.author} ({formatDistanceToNow(toCommit.timestamp, { locale: fr })})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {totalChanges > 0 && (
              <button
                onClick={() => { setCanvasDiffMode(true, diff); setDiffViewerOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Voir sur la recette</span>
                <span className="sm:hidden">Canvas</span>
              </button>
            )}
            <button onClick={() => setDiffViewerOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="px-4 lg:px-6 py-3 border-b bg-blue-50 flex flex-wrap gap-2 text-xs flex-shrink-0">
          {totalChanges === 0 ? (
            <span className="text-gray-500">Aucun changement</span>
          ) : (
            <>
              {s.blocksAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s.blocksAdded} bloc(s) ajoute(s)</span>}
              {s.blocksRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s.blocksRemoved} bloc(s) supprime(s)</span>}
              {s.blocksModified > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">~{s.blocksModified} bloc(s) modifie(s)</span>}
              {s.connectionsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s.connectionsAdded} connexion(s)</span>}
              {s.connectionsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s.connectionsRemoved} connexion(s)</span>}
              {s.connectionsModified > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">~{s.connectionsModified} connexion(s)</span>}
              {s.operationsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{s.operationsAdded} operation(s)</span>}
              {s.operationsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{s.operationsRemoved} operation(s)</span>}
            </>
          )}
        </div>

        {/* Commit messages */}
        <div className="px-6 py-3 border-b flex gap-4 text-sm flex-shrink-0">
          <div className="flex-1 p-2 bg-red-50 rounded-lg">
            <div className="text-[10px] text-red-400 font-medium mb-0.5">v1.{fromNum}</div>
            <div className="text-gray-700">{fromCommit.message}</div>
          </div>
          <div className="flex-1 p-2 bg-green-50 rounded-lg">
            <div className="text-[10px] text-green-400 font-medium mb-0.5">v1.{toNum}</div>
            <div className="text-gray-700">{toCommit.message}</div>
          </div>
        </div>

        {/* Name change */}
        {diff.nameChanged && (
          <div className="px-6 py-2 border-b bg-purple-50 text-sm flex-shrink-0">
            <span className="text-purple-700">Nom de la recette: </span>
            <span className="line-through text-red-600">{diff.oldName}</span>
            <span className="text-gray-400"> &rarr; </span>
            <span className="text-green-600">{diff.newName}</span>
          </div>
        )}

        {/* Operation diffs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {diff.operationDiffs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
              <p>Aucune difference detectee</p>
            </div>
          ) : (
            diff.operationDiffs.map(opDiff => (
              <DiffOperationSection key={opDiff.operationId} diff={opDiff} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
