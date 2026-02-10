import { GitCommit } from 'lucide-react';
import { useVersioningStore } from '../../versioning/store';
import { useStore } from '../../store';
import { computeRecipeDiff } from '../../versioning/diff';
import { useMemo } from 'react';

interface VersionBadgeProps {
  recipeId?: string;
  compact?: boolean;
}

export default function VersionBadge({ recipeId, compact = false }: VersionBadgeProps) {
  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const recipes = useStore(s => s.recipes);
  const { getLatestCommit, getCommitNumber, getActiveBranch } = useVersioningStore();

  const targetRecipeId = recipeId || selectedRecipeId;
  if (!targetRecipeId) return null;

  const recipe = recipes.find(r => r.id === targetRecipeId);
  const latestCommit = getLatestCommit(targetRecipeId);
  const activeBranch = getActiveBranch(targetRecipeId);

  const hasUnsavedChanges = useMemo(() => {
    if (!latestCommit || !recipe) return false;
    const diff = computeRecipeDiff(latestCommit.snapshot, recipe);
    const s = diff.summary;
    return (s.blocksAdded + s.blocksRemoved + s.blocksModified +
      s.connectionsAdded + s.connectionsRemoved + s.connectionsModified +
      s.operationsAdded + s.operationsRemoved) > 0 || diff.nameChanged;
  }, [latestCommit, recipe]);

  if (!latestCommit) {
    if (compact) return null;
    return (
      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full">
        non versionne
      </span>
    );
  }

  const versionNum = getCommitNumber(latestCommit.id);
  const branchName = activeBranch?.name;
  const branchColor = activeBranch?.color || '#3b82f6';

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">
        <GitCommit size={10} style={{ color: branchColor }} />
        v1.{versionNum}
        {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span className="font-mono px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 flex items-center gap-1">
        <GitCommit size={12} style={{ color: branchColor }} />
        v1.{versionNum}
      </span>
      {branchName && branchName !== 'Principal' && (
        <span className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium" style={{ backgroundColor: branchColor }}>
          {branchName}
        </span>
      )}
      {hasUnsavedChanges && (
        <span className="w-2 h-2 rounded-full bg-orange-400" title="Changements non sauvegardes" />
      )}
    </div>
  );
}
