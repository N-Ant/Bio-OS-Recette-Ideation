import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe } from '../types';
import { VersioningState, VersioningActions, RecipeCommit, RecipeBranch, BRANCH_COLORS } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useVersioningStore = create<VersioningState & VersioningActions>()(
  persist(
    (set, get) => ({
      // State
      commits: [],
      branches: [],
      activeBranchIds: {},

      // UI state
      isHistoryPanelOpen: false,
      isDiffViewerOpen: false,
      isBranchManagerOpen: false,
      isCommitDialogOpen: false,
      selectedCommitId: null,
      compareFromCommitId: null,
      compareToCommitId: null,
      preferredAuthor: '',
      canvasDiffMode: false,
      canvasDiffData: null,
      isMergeDialogOpen: false,
      mergeSourceBranchId: null,
      restoredFromCommitId: null,

      // === Commit Actions ===
      createCommit: (recipeId: string, snapshot: Recipe, message: string, author: string, tags: string[] = []) => {
        const state = get();
        let branchId = state.activeBranchIds[recipeId];

        // Auto-create main branch if needed
        if (!branchId) {
          const mainBranch: RecipeBranch = {
            id: generateId(),
            recipeId,
            name: 'Principal',
            headCommitId: null,
            parentBranchId: null,
            forkCommitId: null,
            createdAt: Date.now(),
            color: BRANCH_COLORS[0],
          };
          branchId = mainBranch.id;
          set(s => ({
            branches: [...s.branches, mainBranch],
            activeBranchIds: { ...s.activeBranchIds, [recipeId]: branchId },
          }));
        }

        const currentState = get();
        const currentBranch = currentState.branches.find(b => b.id === branchId);
        const restoredId = currentState.restoredFromCommitId;

        // If we restored a non-HEAD commit, use that as parent to create proper divergence
        const parentCommitId = (restoredId && restoredId !== currentBranch?.headCommitId)
          ? restoredId
          : (currentBranch?.headCommitId || null);

        const commitId = generateId();
        const commit: RecipeCommit = {
          id: commitId,
          recipeId,
          branchId,
          parentCommitId,
          snapshot: JSON.parse(JSON.stringify(snapshot)), // Deep clone
          message,
          author,
          timestamp: Date.now(),
          tags,
        };

        set(s => ({
          commits: [...s.commits, commit],
          branches: s.branches.map(b => b.id === branchId ? { ...b, headCommitId: commitId } : b),
          preferredAuthor: author,
          restoredFromCommitId: null, // Clear after committing
        }));

        return commitId;
      },

      addTag: (commitId, tag) => set(s => ({
        commits: s.commits.map(c => c.id === commitId ? { ...c, tags: [...c.tags, tag] } : c),
      })),

      removeTag: (commitId, tag) => set(s => ({
        commits: s.commits.map(c => c.id === commitId ? { ...c, tags: c.tags.filter(t => t !== tag) } : c),
      })),

      // === Branch Actions ===
      createBranch: (recipeId, name, fromCommitId) => {
        const state = get();
        const parentBranch = state.branches.find(b => b.id === state.activeBranchIds[recipeId]);
        const forkCommitId = fromCommitId || parentBranch?.headCommitId || null;
        const branchCount = state.branches.filter(b => b.recipeId === recipeId).length;

        const branchId = generateId();
        const branch: RecipeBranch = {
          id: branchId,
          recipeId,
          name,
          headCommitId: forkCommitId,
          parentBranchId: parentBranch?.id || null,
          forkCommitId,
          createdAt: Date.now(),
          color: BRANCH_COLORS[branchCount % BRANCH_COLORS.length],
        };

        set(s => ({
          branches: [...s.branches, branch],
          activeBranchIds: { ...s.activeBranchIds, [recipeId]: branchId },
        }));

        return branchId;
      },

      switchBranch: (recipeId, branchId) => set(s => ({
        activeBranchIds: { ...s.activeBranchIds, [recipeId]: branchId },
      })),

      renameBranch: (branchId, name) => set(s => ({
        branches: s.branches.map(b => b.id === branchId ? { ...b, name } : b),
      })),

      deleteBranch: (branchId) => {
        const state = get();
        const branch = state.branches.find(b => b.id === branchId);
        if (!branch) return;

        // Don't delete the last branch for a recipe
        const recipeBranches = state.branches.filter(b => b.recipeId === branch.recipeId);
        if (recipeBranches.length <= 1) return;

        // Switch to another branch if this was active
        const isActive = state.activeBranchIds[branch.recipeId] === branchId;
        const otherBranch = recipeBranches.find(b => b.id !== branchId);

        set(s => ({
          branches: s.branches.filter(b => b.id !== branchId),
          commits: s.commits.filter(c => c.branchId !== branchId),
          activeBranchIds: isActive && otherBranch
            ? { ...s.activeBranchIds, [branch.recipeId]: otherBranch.id }
            : s.activeBranchIds,
        }));
      },

      // === Merge ===
      mergeBranch: (sourceBranchId, targetBranchId, author, deleteSource) => {
        const state = get();
        const sourceBranch = state.branches.find(b => b.id === sourceBranchId);
        const targetBranch = state.branches.find(b => b.id === targetBranchId);
        if (!sourceBranch || !targetBranch || !sourceBranch.headCommitId) return null;

        const sourceCommit = state.commits.find(c => c.id === sourceBranch.headCommitId);
        if (!sourceCommit) return null;

        const snapshot: Recipe = JSON.parse(JSON.stringify(sourceCommit.snapshot));
        const commitId = generateId();

        const commit: RecipeCommit = {
          id: commitId,
          recipeId: targetBranch.recipeId,
          branchId: targetBranchId,
          parentCommitId: targetBranch.headCommitId,
          mergeSourceCommitId: sourceBranch.headCommitId,
          mergeSourceBranchName: sourceBranch.name,
          snapshot,
          message: `Fusion de la variante "${sourceBranch.name}"`,
          author,
          timestamp: Date.now(),
          tags: ['merge'],
        };

        set(s => {
          const newState: Partial<VersioningState> = {
            commits: [...s.commits, commit],
            branches: s.branches.map(b => b.id === targetBranchId ? { ...b, headCommitId: commitId } : b),
            activeBranchIds: { ...s.activeBranchIds, [targetBranch.recipeId]: targetBranchId },
            isMergeDialogOpen: false,
            mergeSourceBranchId: null,
            restoredFromCommitId: null,
          };

          if (deleteSource) {
            newState.branches = (newState.branches || s.branches).filter(b => b.id !== sourceBranchId);
            newState.commits = (newState.commits || s.commits).filter(c => c.branchId !== sourceBranchId);
          }

          return newState;
        });

        return commitId;
      },

      // === Selectors ===
      getCommitSnapshot: (commitId) => {
        const commit = get().commits.find(c => c.id === commitId);
        return commit ? JSON.parse(JSON.stringify(commit.snapshot)) : null;
      },

      getCommitsForRecipe: (recipeId) => {
        return get().commits.filter(c => c.recipeId === recipeId).sort((a, b) => a.timestamp - b.timestamp);
      },

      getCommitsForBranch: (branchId) => {
        const state = get();
        const branch = state.branches.find(b => b.id === branchId);
        if (!branch) return [];

        // Walk back from headCommitId through parentCommitId chain
        const commits: RecipeCommit[] = [];
        const commitMap = new Map(state.commits.map(c => [c.id, c]));
        let currentId = branch.headCommitId;
        while (currentId) {
          const commit = commitMap.get(currentId);
          if (!commit) break;
          commits.unshift(commit);
          currentId = commit.parentCommitId;
        }
        return commits;
      },

      getActiveBranch: (recipeId) => {
        const state = get();
        const branchId = state.activeBranchIds[recipeId];
        return state.branches.find(b => b.id === branchId) || null;
      },

      getBranchesForRecipe: (recipeId) => {
        return get().branches.filter(b => b.recipeId === recipeId);
      },

      getLatestCommit: (recipeId) => {
        const state = get();
        const branchId = state.activeBranchIds[recipeId];
        if (!branchId) return null;
        const branch = state.branches.find(b => b.id === branchId);
        if (!branch?.headCommitId) return null;
        return state.commits.find(c => c.id === branch.headCommitId) || null;
      },

      getCommitNumber: (commitId) => {
        const state = get();
        const commit = state.commits.find(c => c.id === commitId);
        if (!commit) return 0;
        const branchCommits = state.getCommitsForBranch(commit.branchId);
        return branchCommits.findIndex(c => c.id === commitId) + 1;
      },

      // === UI Actions ===
      setHistoryPanelOpen: (open) => set({ isHistoryPanelOpen: open }),
      setDiffViewerOpen: (open) => set({ isDiffViewerOpen: open }),
      setBranchManagerOpen: (open) => set({ isBranchManagerOpen: open }),
      setCommitDialogOpen: (open) => set({ isCommitDialogOpen: open }),
      setSelectedCommitId: (id) => set({ selectedCommitId: id }),
      setCompareCommits: (fromId, toId) => set({ compareFromCommitId: fromId, compareToCommitId: toId }),
      setPreferredAuthor: (author) => set({ preferredAuthor: author }),
      setCanvasDiffMode: (active, diffData) => set({ canvasDiffMode: active, canvasDiffData: diffData ?? null }),
      setMergeDialogOpen: (open, sourceBranchId) => set({ isMergeDialogOpen: open, mergeSourceBranchId: sourceBranchId ?? null }),
      setRestoredFromCommitId: (id) => set({ restoredFromCommitId: id }),
    }),
    {
      name: 'recipe-versioning-v1',
      partialize: (state) => ({
        commits: state.commits,
        branches: state.branches,
        activeBranchIds: state.activeBranchIds,
        preferredAuthor: state.preferredAuthor,
      }),
    }
  )
);
