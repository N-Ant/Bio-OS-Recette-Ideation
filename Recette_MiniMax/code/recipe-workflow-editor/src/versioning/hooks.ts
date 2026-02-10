import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { useVersioningStore } from './store';
import { computeRecipeDiff } from './diff';
import { generateSeedData } from './seed';

/**
 * Main hook combining common versioning operations.
 */
export function useVersioning() {
  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const recipe = useStore(s => s.getCurrentRecipe());
  const {
    createCommit, getLatestCommit, getActiveBranch, getBranchesForRecipe,
    getCommitsForBranch, getCommitNumber,
    setCommitDialogOpen, setHistoryPanelOpen, setDiffViewerOpen,
    setBranchManagerOpen, setCompareCommits,
  } = useVersioningStore();

  const latestCommit = selectedRecipeId ? getLatestCommit(selectedRecipeId) : null;
  const activeBranch = selectedRecipeId ? getActiveBranch(selectedRecipeId) : null;
  const branches = selectedRecipeId ? getBranchesForRecipe(selectedRecipeId) : [];
  const branchCommits = activeBranch ? getCommitsForBranch(activeBranch.id) : [];

  const versionNumber = latestCommit ? getCommitNumber(latestCommit.id) : 0;

  return {
    recipe,
    latestCommit,
    activeBranch,
    branches,
    branchCommits,
    versionNumber,
    createCommit,
    openCommitDialog: () => setCommitDialogOpen(true),
    openHistoryPanel: () => setHistoryPanelOpen(true),
    openDiffViewer: (fromId: string, toId: string) => { setCompareCommits(fromId, toId); setDiffViewerOpen(true); },
    openBranchManager: () => setBranchManagerOpen(true),
  };
}

/**
 * Returns the active branch for the current recipe.
 */
export function useCurrentBranch() {
  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const getActiveBranch = useVersioningStore(s => s.getActiveBranch);
  return selectedRecipeId ? getActiveBranch(selectedRecipeId) : null;
}

/**
 * Returns true if the current recipe has changes since the last saved version.
 */
export function useHasUnsavedChanges() {
  const recipe = useStore(s => s.getCurrentRecipe());
  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const getLatestCommit = useVersioningStore(s => s.getLatestCommit);

  return useMemo(() => {
    if (!recipe || !selectedRecipeId) return false;
    const latestCommit = getLatestCommit(selectedRecipeId);
    if (!latestCommit) return false; // No versions yet, not considered "unsaved"
    const diff = computeRecipeDiff(latestCommit.snapshot, recipe);
    const s = diff.summary;
    return (s.blocksAdded + s.blocksRemoved + s.blocksModified +
      s.connectionsAdded + s.connectionsRemoved + s.connectionsModified +
      s.operationsAdded + s.operationsRemoved) > 0 || diff.nameChanged;
  }, [recipe, selectedRecipeId, getLatestCommit]);
}

/**
 * Auto-initialization hook.
 * On first load (no versioning data), seeds demo recipes with full history.
 * On subsequent loads, auto-creates initial commits for new recipes.
 */
export function useVersioningInit() {
  const recipes = useStore(s => s.recipes);
  const { commits, createCommit, branches } = useVersioningStore();
  const seeded = useRef(false);

  useEffect(() => {
    // One-time seed: if versioning store is empty OR doesn't know about seeded recipes
    const hasSeededRecipes = commits.some(c => c.recipeId === 'cho-fb');
    if (!seeded.current && !hasSeededRecipes) {
      seeded.current = true;
      const seed = generateSeedData();

      // Replace recipes in main store with seeded ones (keep existing user recipes too)
      const existingIds = new Set(seed.recipes.map(r => r.id));
      const userRecipes = useStore.getState().recipes.filter(r => !existingIds.has(r.id));
      useStore.setState({
        recipes: [...seed.recipes, ...userRecipes],
        selectedRecipeId: seed.recipes[0]?.id || null,
        selectedOperationId: seed.recipes[0]?.operations[0]?.id || null,
      });

      // Load versioning data (merge with any existing)
      const vs = useVersioningStore.getState();
      useVersioningStore.setState({
        commits: [...vs.commits.filter(c => !seed.commits.some(sc => sc.id === c.id)), ...seed.commits],
        branches: [...vs.branches.filter(b => !seed.branches.some(sb => sb.id === b.id)), ...seed.branches],
        activeBranchIds: { ...vs.activeBranchIds, ...seed.activeBranchIds },
      });
      return;
    }

    // For new recipes without commits, auto-create initial version
    for (const recipe of recipes) {
      const hasCommits = commits.some(c => c.recipeId === recipe.id);
      const hasBranch = branches.some(b => b.recipeId === recipe.id);
      if (!hasCommits && !hasBranch && recipe.operations.length > 0) {
        createCommit(recipe.id, recipe, 'Version initiale', 'Systeme', ['initial']);
      }
    }
  }, [recipes.length]);
}
