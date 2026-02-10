import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info, Sparkles, ChevronLeft, ArrowLeftRight, Tag, Plus, GitBranch } from 'lucide-react';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';
import { computeRecipeDiff, generateCommitMessage } from '../../versioning/diff';
import { DiffSummary, RecipeDiff } from '../../versioning/types';
import DiffOperationSection from './DiffOperationSection';

const PREDEFINED_TAGS = [
  { label: 'SOP', color: '#3B82F6', description: 'Procedure standard' },
  { label: 'QA-approved', color: '#10B981', description: 'Valide QA' },
  { label: 'En test', color: '#F59E0B', description: 'En cours de validation' },
  { label: 'Draft', color: '#6B7280', description: 'Brouillon' },
  { label: 'Production', color: '#8B5CF6', description: 'Pret pour production' },
  { label: 'Archive', color: '#EF4444', description: 'Version archivee' },
];

export default function CommitDialog() {
  const { isCommitDialogOpen, setCommitDialogOpen, createCommit, createBranch, getLatestCommit, preferredAuthor, setPreferredAuthor, restoredFromCommitId, getCommitNumber, getActiveBranch } = useVersioningStore();
  const getCurrentRecipe = useStore(s => s.getCurrentRecipe);

  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState(preferredAuthor || '');
  const [summary, setSummary] = useState<DiffSummary | null>(null);
  const [fullDiff, setFullDiff] = useState<RecipeDiff | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [saveAsNewBranch, setSaveAsNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const recipe = getCurrentRecipe();

  useEffect(() => {
    if (!isCommitDialogOpen || !recipe) return;
    setAuthor(preferredAuthor || '');
    setMessage('');
    setShowDetails(false);
    setSelectedTags([]);
    setCustomTagInput('');
    setShowTagPicker(false);
    setSaveAsNewBranch(false);
    setNewBranchName('');

    // Compute diff against latest commit
    const latest = getLatestCommit(recipe.id);
    if (latest) {
      const diff = computeRecipeDiff(latest.snapshot, recipe);
      setSummary(diff.summary);
      setFullDiff(diff);
    } else {
      setSummary(null);
      setFullDiff(null);
    }
  }, [isCommitDialogOpen, recipe?.id]);

  const handleAutoGenerate = () => {
    if (fullDiff) {
      setMessage(generateCommitMessage(fullDiff));
    } else {
      setMessage('Version initiale');
    }
  };

  if (!isCommitDialogOpen || !recipe) return null;

  const handleSave = () => {
    if (!message.trim()) return;
    if (saveAsNewBranch && newBranchName.trim()) {
      // Create branch first, then commit on the new branch
      createBranch(recipe.id, newBranchName.trim());
    }
    createCommit(recipe.id, recipe, message.trim(), author.trim() || 'Anonyme', selectedTags);
    if (author.trim()) setPreferredAuthor(author.trim());
    setCommitDialogOpen(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags(prev => [...prev, t]);
    }
    setCustomTagInput('');
  };

  // Check if committing from a restored (non-HEAD) commit
  const activeBranch = recipe ? getActiveBranch(recipe.id) : null;
  const isRestoredState = restoredFromCommitId != null && restoredFromCommitId !== activeBranch?.headCommitId;
  const restoredVersionNum = isRestoredState ? getCommitNumber(restoredFromCommitId) : null;

  const totalChanges = summary
    ? summary.blocksAdded + summary.blocksRemoved + summary.blocksModified +
      summary.connectionsAdded + summary.connectionsRemoved + summary.connectionsModified +
      summary.operationsAdded + summary.operationsRemoved
    : 0;

  // --- Details view (full diff) ---
  if (showDetails && fullDiff) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetails(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetails(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <ArrowLeftRight size={18} className="text-blue-500" />
              <h2 className="font-semibold">Details des changements</h2>
            </div>
            <button onClick={() => setCommitDialogOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
          </div>

          {/* Summary bar */}
          <div className="px-6 py-3 border-b bg-blue-50 flex flex-wrap gap-2 text-xs flex-shrink-0">
            {summary!.blocksAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary!.blocksAdded} bloc(s) ajoute(s)</span>}
            {summary!.blocksRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary!.blocksRemoved} bloc(s) supprime(s)</span>}
            {summary!.blocksModified > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">~{summary!.blocksModified} bloc(s) modifie(s)</span>}
            {summary!.connectionsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary!.connectionsAdded} connexion(s)</span>}
            {summary!.connectionsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary!.connectionsRemoved} connexion(s)</span>}
            {summary!.operationsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary!.operationsAdded} operation(s)</span>}
            {summary!.operationsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary!.operationsRemoved} operation(s)</span>}
          </div>

          {/* Name change */}
          {fullDiff.nameChanged && (
            <div className="px-6 py-2 border-b bg-purple-50 text-sm flex-shrink-0">
              <span className="text-purple-700">Nom de la recette: </span>
              <span className="line-through text-red-600">{fullDiff.oldName}</span>
              <span className="text-gray-400"> &rarr; </span>
              <span className="text-green-600">{fullDiff.newName}</span>
            </div>
          )}

          {/* Operation diffs - scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fullDiff.operationDiffs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
                <p>Aucune difference detectee</p>
              </div>
            ) : (
              fullDiff.operationDiffs.map(opDiff => (
                <DiffOperationSection key={opDiff.operationId} diff={opDiff} />
              ))
            )}
          </div>

          {/* Footer - back to save */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <ChevronLeft size={16} />
              Retour
            </button>
            <button
              onClick={handleSave}
              disabled={!message.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${message.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Save size={16} />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Normal save form ---
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCommitDialogOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Save size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold">Sauvegarder une version</h2>
          </div>
          <button onClick={() => setCommitDialogOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Restored state banner */}
          {isRestoredState && restoredVersionNum != null && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center gap-2">
              <Info size={16} />
              Cette version sera basee sur v1.{restoredVersionNum} (restauree)
            </div>
          )}

          {/* Change summary */}
          {summary && totalChanges > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-blue-700">Changements depuis la derniere version</span>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                >
                  <ArrowLeftRight size={11} />
                  Voir details
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {summary.blocksAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary.blocksAdded} bloc(s)</span>}
                {summary.blocksRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary.blocksRemoved} bloc(s)</span>}
                {summary.blocksModified > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">~{summary.blocksModified} bloc(s)</span>}
                {summary.connectionsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary.connectionsAdded} connexion(s)</span>}
                {summary.connectionsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary.connectionsRemoved} connexion(s)</span>}
                {summary.operationsAdded > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">+{summary.operationsAdded} operation(s)</span>}
                {summary.operationsRemoved > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">-{summary.operationsRemoved} operation(s)</span>}
              </div>
            </div>
          )}

          {summary === null && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex items-center gap-2">
              <AlertCircle size={16} />
              Premiere version de cette recette
            </div>
          )}

          {summary && totalChanges === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle size={16} />
              Aucun changement detecte depuis la derniere version
            </div>
          )}

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Note de version *</label>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Sparkles size={13} />
                Generer auto
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ex: Ajout phase de purge O2, modification consigne pH..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-sm font-medium text-gray-700">Auteur</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Votre nom"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Tag size={14} className="text-purple-500" />
                Labels
              </label>
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {showTagPicker ? 'Masquer' : 'Ajouter'}
              </button>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTags.map(tag => {
                  const preset = PREDEFINED_TAGS.find(p => p.label === tag);
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-70"
                      style={{
                        backgroundColor: (preset?.color || '#8B5CF6') + '18',
                        color: preset?.color || '#8B5CF6',
                      }}
                      onClick={() => toggleTag(tag)}
                      title="Cliquer pour retirer"
                    >
                      <Tag size={9} />
                      {tag}
                      <X size={10} className="ml-0.5" />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Tag picker */}
            {showTagPicker && (
              <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50">
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.map(pt => {
                    const isActive = selectedTags.includes(pt.label);
                    return (
                      <button
                        key={pt.label}
                        type="button"
                        onClick={() => toggleTag(pt.label)}
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${isActive ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                        style={{
                          backgroundColor: pt.color + (isActive ? '25' : '12'),
                          color: pt.color,
                          ringColor: isActive ? pt.color : undefined,
                        }}
                        title={pt.description}
                      >
                        <Tag size={9} />
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    placeholder="Label personnalise..."
                    className="flex-1 text-xs border rounded px-2 py-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                    className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-40 flex items-center gap-1"
                  >
                    <Plus size={10} /> Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save as new branch toggle */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsNewBranch}
                onChange={e => setSaveAsNewBranch(e.target.checked)}
                className="rounded border-gray-300 text-green-500 focus:ring-green-400"
              />
              <GitBranch size={14} className="text-green-600" />
              <span className="text-sm text-gray-700">Sauvegarder comme nouvelle variante</span>
            </label>
            {saveAsNewBranch && (
              <input
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="Nom de la variante..."
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:border-green-400"
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button onClick={() => setCommitDialogOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
          <button
            onClick={handleSave}
            disabled={!message.trim() || (saveAsNewBranch && !newBranchName.trim())}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${message.trim() && (!saveAsNewBranch || newBranchName.trim()) ? (saveAsNewBranch ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-500 text-white hover:bg-blue-600') : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {saveAsNewBranch ? <GitBranch size={16} /> : <Save size={16} />}
            {saveAsNewBranch ? `Creer variante "${newBranchName || '...'}"` : <>Sauvegarder v{(() => {
              const latest = getLatestCommit(recipe.id);
              if (!latest) return '1.0';
              const branchCommits = useVersioningStore.getState().getCommitsForBranch(latest.branchId);
              return `1.${branchCommits.length}`;
            })()}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
