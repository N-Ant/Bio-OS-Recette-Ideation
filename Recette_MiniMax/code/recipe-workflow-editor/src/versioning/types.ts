import { Recipe } from '../types';

// === Commit (Version) ===
export interface RecipeCommit {
  id: string;
  recipeId: string;
  branchId: string;
  parentCommitId: string | null;
  mergeSourceCommitId?: string | null; // HEAD of source branch at merge time
  mergeSourceBranchName?: string | null; // name of source branch (kept even if branch deleted)
  snapshot: Recipe; // Complete clone of the recipe at this point
  message: string;
  author: string;
  timestamp: number;
  tags: string[];
}

// === Branch (Variante) ===
export interface RecipeBranch {
  id: string;
  recipeId: string;
  name: string;
  headCommitId: string | null;
  parentBranchId: string | null;
  forkCommitId: string | null; // Commit from which this branch was forked
  createdAt: number;
  color: string;
}

// === Diff Types ===
export interface PropertyChange {
  property: string;
  oldValue: unknown;
  newValue: unknown;
  displayOld: string; // Human-readable formatted value
  displayNew: string;
}

export interface BlockDiff {
  blockId: string;
  type: 'added' | 'removed' | 'modified';
  blockLabel: string;
  blockType: string;
  propertyChanges: PropertyChange[];
  isPositionOnly: boolean; // True if only x/y changed
}

export interface ConnectionDiff {
  connectionId: string;
  type: 'added' | 'removed' | 'modified';
  fromLabel: string;
  toLabel: string;
  propertyChanges: PropertyChange[];
}

export interface OperationDiff {
  operationId: string;
  type: 'added' | 'removed' | 'modified';
  operationName: string;
  blockDiffs: BlockDiff[];
  connectionDiffs: ConnectionDiff[];
}

export interface DiffSummary {
  blocksAdded: number;
  blocksRemoved: number;
  blocksModified: number;
  connectionsAdded: number;
  connectionsRemoved: number;
  connectionsModified: number;
  operationsAdded: number;
  operationsRemoved: number;
  operationsModified: number;
}

export interface RecipeDiff {
  oldRecipeId: string;
  newRecipeId: string;
  operationDiffs: OperationDiff[];
  nameChanged: boolean;
  oldName: string;
  newName: string;
  summary: DiffSummary;
}

// === Versioning Store State ===
export interface VersioningState {
  commits: RecipeCommit[];
  branches: RecipeBranch[];
  activeBranchIds: Record<string, string>; // recipeId -> branchId

  // UI state
  isHistoryPanelOpen: boolean;
  isDiffViewerOpen: boolean;
  isBranchManagerOpen: boolean;
  isCommitDialogOpen: boolean;
  selectedCommitId: string | null;
  compareFromCommitId: string | null;
  compareToCommitId: string | null;
  preferredAuthor: string;

  // Canvas overlay diff mode
  canvasDiffMode: boolean;
  canvasDiffData: RecipeDiff | null;

  // Merge dialog
  isMergeDialogOpen: boolean;
  mergeSourceBranchId: string | null;

  // Restore tracking (session-only, not persisted)
  restoredFromCommitId: string | null;
}

export interface VersioningActions {
  // Commit actions
  createCommit: (recipeId: string, snapshot: Recipe, message: string, author: string, tags?: string[]) => string;
  addTag: (commitId: string, tag: string) => void;
  removeTag: (commitId: string, tag: string) => void;

  // Branch actions
  createBranch: (recipeId: string, name: string, fromCommitId?: string) => string;
  switchBranch: (recipeId: string, branchId: string) => void;
  renameBranch: (branchId: string, name: string) => void;
  deleteBranch: (branchId: string) => void;
  mergeBranch: (sourceBranchId: string, targetBranchId: string, author: string, deleteSource: boolean) => string | null;

  // Restore
  getCommitSnapshot: (commitId: string) => Recipe | null;

  // Selectors
  getCommitsForRecipe: (recipeId: string) => RecipeCommit[];
  getCommitsForBranch: (branchId: string) => RecipeCommit[];
  getActiveBranch: (recipeId: string) => RecipeBranch | null;
  getBranchesForRecipe: (recipeId: string) => RecipeBranch[];
  getLatestCommit: (recipeId: string) => RecipeCommit | null;
  getCommitNumber: (commitId: string) => number;

  // UI actions
  setHistoryPanelOpen: (open: boolean) => void;
  setDiffViewerOpen: (open: boolean) => void;
  setBranchManagerOpen: (open: boolean) => void;
  setCommitDialogOpen: (open: boolean) => void;
  setSelectedCommitId: (id: string | null) => void;
  setCompareCommits: (fromId: string | null, toId: string | null) => void;
  setPreferredAuthor: (author: string) => void;

  // Canvas overlay diff
  setCanvasDiffMode: (active: boolean, diffData?: RecipeDiff | null) => void;

  // Merge dialog
  setMergeDialogOpen: (open: boolean, sourceBranchId?: string | null) => void;

  // Restore tracking
  setRestoredFromCommitId: (id: string | null) => void;
}

export const BRANCH_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ef4444', // red
];
