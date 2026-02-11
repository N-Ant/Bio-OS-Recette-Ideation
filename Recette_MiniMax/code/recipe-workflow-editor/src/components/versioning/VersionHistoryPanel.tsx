import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { X, GitCommit, ArrowLeftRight, RotateCcw, Save, Tag, GitBranch, Download, GitMerge, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../../store';
import { useVersioningStore } from '../../versioning/store';
import { RecipeCommit, RecipeBranch } from '../../versioning/types';

interface GraphRow {
  commit: RecipeCommit;
  branch: RecipeBranch;
  col: number;
  isHead: boolean;
  isFork: boolean;
  isMerge: boolean;
  forkFromCol: number | null; // column of parent branch if this is the first commit on a fork
  forkFromRowIdx: number | null; // row index of the fork-point commit on the parent branch
  mergeFromCol: number | null; // column of the merge source commit
  mergeFromRowIdx: number | null; // row index of the merge source commit
  mergeFromColor: string | null; // color of the source branch
  isFirstOnBranch: boolean;
  isLastOnBranch: boolean;
}

/** Pre-computed per-branch row index range (in the sorted rows array). */
interface BranchSpan {
  branchId: string;
  col: number;
  color: string;
  isActive: boolean;
  firstRowIdx: number; // smallest index (possibly extended for fork connections)
  lastRowIdx: number;  // largest index  (possibly extended for fork connections)
  actualFirstRowIdx: number; // real HEAD row (before extension)
  actualLastRowIdx: number;  // real oldest commit row (before extension)
}

const ROW_H = 56; // fixed row height in px – keeps SVG math simple

export default function VersionHistoryPanel() {
  const {
    isHistoryPanelOpen, setHistoryPanelOpen,
    setCommitDialogOpen, setDiffViewerOpen, setCompareCommits,
    selectedCommitId, setSelectedCommitId,
    getCommitsForBranch, getBranchesForRecipe, getActiveBranch, getCommitNumber,
    switchBranch, restoredFromCommitId, getCommitSnapshot, setMergeDialogOpen,
    addTag, removeTag,
  } = useVersioningStore();

  const [tagInputCommitId, setTagInputCommitId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');

  // Refs for overlay SVG connection lines (fork + merge curves)
  const timelineRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connLines, setConnLines] = useState<{ d: string; color: string; dash: string }[]>([]);

  const setNodeRef = useCallback((commitId: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(commitId, el);
    else nodeRefs.current.delete(commitId);
  }, []);

  const selectedRecipeId = useStore(s => s.selectedRecipeId);
  const replaceRecipe = useStore(s => s.replaceRecipe);

  const branches = selectedRecipeId ? getBranchesForRecipe(selectedRecipeId) : [];
  const activeBranch = selectedRecipeId ? getActiveBranch(selectedRecipeId) : null;

  // The "working commit" is either the restored commit or the active branch HEAD
  const workingCommitId = restoredFromCommitId || activeBranch?.headCommitId || null;
  // When restoring a non-HEAD commit, only the restored commit should be filled (not the HEAD)
  const hasNonHeadRestore = !!restoredFromCommitId && restoredFromCommitId !== activeBranch?.headCommitId;

  const { rows, totalCols, branchSpans } = useMemo(() => {
    if (branches.length === 0)
      return { rows: [] as GraphRow[], totalCols: 1, branchSpans: [] as BranchSpan[] };

    // Sort branches: main first, then by creation date
    const sorted = [...branches].sort((a, b) => {
      if (!a.parentBranchId) return -1;
      if (!b.parentBranchId) return 1;
      return a.createdAt - b.createdAt;
    });
    const bCols = new Map<string, number>();
    sorted.forEach((b, i) => bCols.set(b.id, i));

    // Build rows
    const allRows: GraphRow[] = [];
    const forkCommitBranches = new Map<string, string>(); // branchId -> parent branchId

    for (const branch of sorted) {
      if (branch.forkCommitId && branch.parentBranchId) {
        forkCommitBranches.set(branch.id, branch.parentBranchId);
      }
    }

    for (const branch of sorted) {
      const commits = getCommitsForBranch(branch.id);
      const col = bCols.get(branch.id)!;
      const branchOwnCommits = commits.filter(c => c.branchId === branch.id);

      for (let i = 0; i < branchOwnCommits.length; i++) {
        const commit = branchOwnCommits[i];
        const isFirstOnBranch = i === 0;
        const isLastOnBranch = i === branchOwnCommits.length - 1;

        // If this is the first commit on a forked branch, record the parent col
        let forkFromCol: number | null = null;
        if (isFirstOnBranch && forkCommitBranches.has(branch.id)) {
          const parentBranchId = forkCommitBranches.get(branch.id)!;
          forkFromCol = bCols.get(parentBranchId) ?? null;
        }

        allRows.push({
          commit,
          branch,
          col,
          isHead: commit.id === branch.headCommitId,
          isFork: false, // will set below
          isMerge: !!commit.mergeSourceCommitId,
          forkFromCol,
          forkFromRowIdx: null, // will set after sort
          mergeFromCol: null, // will set after sort
          mergeFromRowIdx: null, // will set after sort
          mergeFromColor: null, // will set after sort
          isFirstOnBranch,
          isLastOnBranch,
        });
      }
    }

    // Mark fork points
    const forkCommitIdSet = new Set<string>();
    for (const branch of sorted) {
      if (branch.forkCommitId) forkCommitIdSet.add(branch.forkCommitId);
    }
    for (const row of allRows) {
      if (forkCommitIdSet.has(row.commit.id)) row.isFork = true;
    }

    // Sort by timestamp descending (newest first)
    allRows.sort((a, b) => b.commit.timestamp - a.commit.timestamp);

    // Resolve forkFromRowIdx: find the row index of the fork-point commit for each forked branch
    const forkCommitIdMap = new Map<string, string>(); // branchId -> forkCommitId
    for (const branch of sorted) {
      if (branch.forkCommitId && branch.parentBranchId) {
        forkCommitIdMap.set(branch.id, branch.forkCommitId);
      }
    }
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.forkFromCol !== null) {
        const forkCommitId = forkCommitIdMap.get(row.branch.id);
        if (forkCommitId) {
          const forkRowIdx = allRows.findIndex(r => r.commit.id === forkCommitId);
          if (forkRowIdx !== -1) row.forkFromRowIdx = forkRowIdx;
        }
      }
      // Resolve merge source: find the row of the merge source commit
      if (row.isMerge && row.commit.mergeSourceCommitId) {
        const srcRow = allRows.findIndex(r => r.commit.id === row.commit.mergeSourceCommitId);
        if (srcRow !== -1) {
          row.mergeFromCol = allRows[srcRow].col;
          row.mergeFromRowIdx = srcRow;
          row.mergeFromColor = allRows[srcRow].branch.color;
        }
      }
    }

    // --- Build branch spans using ROW INDICES ---
    const spans: BranchSpan[] = [];
    const spanMap = new Map<string, BranchSpan>();
    for (const branch of sorted) {
      let firstIdx = -1;
      let lastIdx = -1;
      for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].branch.id === branch.id) {
          if (firstIdx === -1) firstIdx = i;
          lastIdx = i;
        }
      }
      if (firstIdx === -1) continue; // no rows for this branch
      const span: BranchSpan = {
        branchId: branch.id,
        col: bCols.get(branch.id)!,
        color: branch.color,
        isActive: branch.id === activeBranch?.id,
        firstRowIdx: firstIdx,
        lastRowIdx: lastIdx,
        actualFirstRowIdx: firstIdx,
        actualLastRowIdx: lastIdx,
      };
      spans.push(span);
      spanMap.set(branch.id, span);
    }

    // No longer extend parent spans – fork curves now handle the visual connection

    return { rows: allRows, totalCols: sorted.length, branchSpans: spans };
  }, [branches, activeBranch?.id, getCommitsForBranch]);

  // Compute overlay connection lines from actual DOM positions
  const updateConnLines = useCallback(() => {
    const container = timelineRef.current;
    if (!container || rows.length === 0) { setConnLines([]); return; }
    const containerRect = container.getBoundingClientRect();
    const lines: { d: string; color: string; dash: string }[] = [];

    for (const row of rows) {
      const nodeEl = nodeRefs.current.get(row.commit.id);
      if (!nodeEl) continue;
      const nodeRect = nodeEl.getBoundingClientRect();
      const nodeY = nodeRect.top + nodeRect.height / 2 - containerRect.top + container.scrollTop;
      const nodeX = nodeRect.left + nodeRect.width / 2 - containerRect.left;

      // Fork line
      if (row.forkFromRowIdx !== null && row.forkFromCol !== null) {
        const forkCommitId = rows[row.forkFromRowIdx]?.commit.id;
        const parentEl = forkCommitId ? nodeRefs.current.get(forkCommitId) : null;
        if (parentEl) {
          const pRect = parentEl.getBoundingClientRect();
          const pY = pRect.top + pRect.height / 2 - containerRect.top + container.scrollTop;
          const pX = pRect.left + pRect.width / 2 - containerRect.left;
          const dy = pY - nodeY;
          lines.push({
            d: `M ${nodeX} ${nodeY} C ${nodeX} ${nodeY + dy * 0.35}, ${pX} ${nodeY + dy * 0.65}, ${pX} ${pY}`,
            color: row.branch.color,
            dash: '4 3',
          });
        }
      }

      // Merge line
      if (row.isMerge && row.mergeFromRowIdx !== null) {
        const srcCommitId = rows[row.mergeFromRowIdx]?.commit.id;
        const srcEl = srcCommitId ? nodeRefs.current.get(srcCommitId) : null;
        if (srcEl) {
          const sRect = srcEl.getBoundingClientRect();
          const sY = sRect.top + sRect.height / 2 - containerRect.top + container.scrollTop;
          const sX = sRect.left + sRect.width / 2 - containerRect.left;
          const dy = sY - nodeY;
          lines.push({
            d: `M ${sX} ${sY} C ${sX} ${sY - dy * 0.35}, ${nodeX} ${sY - dy * 0.65}, ${nodeX} ${nodeY}`,
            color: row.mergeFromColor || row.branch.color,
            dash: '6 3',
          });
        }
      }
    }

    setConnLines(lines);
  }, [rows]);

  // Re-compute lines after render and when selection changes (expands rows)
  useEffect(() => {
    // Small delay to let DOM settle after render
    const timer = setTimeout(updateConnLines, 50);
    return () => clearTimeout(timer);
  }, [updateConnLines, selectedCommitId, rows]);

  if (!isHistoryPanelOpen || !selectedRecipeId) return null;

  const handleCompare = (commitId: string, commitBranchId: string) => {
    const branchCommits = getCommitsForBranch(commitBranchId);
    const idx = branchCommits.findIndex(c => c.id === commitId);
    if (idx > 0) {
      setCompareCommits(branchCommits[idx - 1].id, commitId);
      setDiffViewerOpen(true);
    }
  };

  const handleSwitchToBranch = (branch: RecipeBranch) => {
    if (!selectedRecipeId || branch.id === activeBranch?.id) return;
    switchBranch(selectedRecipeId, branch.id);
    // Clear restored state - we're now at the HEAD of the new branch
    useVersioningStore.getState().setRestoredFromCommitId(null);
    const snapshot = useVersioningStore.getState().getCommitSnapshot(branch.headCommitId!);
    if (snapshot) replaceRecipe(selectedRecipeId, snapshot);
  };

  const handleExportVersion = (commitId: string) => {
    const snapshot = getCommitSnapshot(commitId);
    if (!snapshot) return;
    const commit = rows.find(r => r.commit.id === commitId)?.commit;
    const vNum = getCommitNumber(commitId);
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.name}_v1.${vNum}${commit ? `_${commit.message.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}` : ''}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic lane width: shrinks when many branches to avoid graph overflow
  const LANE_W = totalCols <= 6 ? 28 : totalCols <= 10 ? 22 : 16;
  const GRAPH_W = totalCols * LANE_W + 16;

  /**
   * For a given row index, compute which vertical branch lines pass through it,
   * plus whether the line should clip at the top or bottom (first/last row of that branch).
   */
  const getVisibleLines = (rowIdx: number) => {
    const lines: {
      col: number;
      color: string;
      isActive: boolean;
      isSelf: boolean;
      clipTop: boolean;   // true => line starts at center (this is the HEAD / newest row)
      clipBottom: boolean; // true => line ends at center (this is the oldest row)
    }[] = [];

    const rowBranchId = rows[rowIdx].branch.id;

    for (const span of branchSpans) {
      if (rowIdx < span.firstRowIdx || rowIdx > span.lastRowIdx) continue;
      lines.push({
        col: span.col,
        color: span.color,
        isActive: span.isActive,
        isSelf: span.branchId === rowBranchId,
        clipTop: rowIdx === span.firstRowIdx,
        clipBottom: rowIdx === span.lastRowIdx,
      });
    }
    return lines;
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[85vw] sm:w-[420px] bg-white shadow-2xl border-l z-40 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitCommit size={18} className="text-blue-500" />
          <span className="font-semibold text-sm">Historique des versions</span>
        </div>
        <button onClick={() => setHistoryPanelOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {/* Branch legend - scrollable */}
      {branches.length > 1 && (
        <div className="border-b flex-shrink-0 overflow-x-auto">
          <div className="flex flex-wrap gap-1.5 px-4 py-2">
            {branches.map(b => {
              const isActive = b.id === activeBranch?.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSwitchToBranch(b)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${isActive ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                  style={{
                    backgroundColor: b.color + (isActive ? '25' : '12'),
                    color: b.color,
                    outline: isActive ? `2px solid ${b.color}` : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  <GitBranch size={11} />
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-2 border-b flex-shrink-0 flex gap-2">
        <button
          onClick={() => setCommitDialogOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Save size={16} />
          Sauvegarder
        </button>
        {activeBranch && activeBranch.parentBranchId && (
          <button
            onClick={() => setMergeDialogOpen(true, activeBranch.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            <GitMerge size={16} />
            Fusionner
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto relative" ref={timelineRef} onScroll={updateConnLines}>
        {/* Overlay SVG for fork and merge curves */}
        {connLines.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none z-[6]" style={{ width: '100%', height: timelineRef.current?.scrollHeight || '100%' }}>
            {connLines.map((line, i) => (
              <path key={i} d={line.d} fill="none" stroke={line.color} strokeWidth={2} strokeDasharray={line.dash} opacity={0.55} />
            ))}
          </svg>
        )}
        {rows.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            <GitCommit size={32} className="mx-auto mb-2 opacity-30" />
            <p>Aucune version sauvegardee</p>
            <p className="text-xs mt-1">Cliquez "Sauvegarder version" pour commencer</p>
          </div>
        ) : (
          <div>
            {rows.map((row, idx) => {
              const { commit, branch } = row;
              const versionNum = getCommitNumber(commit.id);
              const isSelected = selectedCommitId === commit.id;
              const isOnActive = branch.id === activeBranch?.id;
              const isWorking = commit.id === workingCommitId; // "you are here"
              const nodeX = 12 + row.col * LANE_W;

              // --- Vertical branch lines for this row (index-based) ---
              const visibleLines = getVisibleLines(idx);

              return (
                <div
                  key={commit.id}
                  onClick={() => setSelectedCommitId(isSelected ? null : commit.id)}
                  className={`flex cursor-pointer transition-colors border-b border-gray-100 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  style={{ minHeight: ROW_H }}
                >
                  {/* Graph column - stretches to full row height */}
                  <div
                    className="flex-shrink-0 relative self-stretch"
                    style={{ width: GRAPH_W }}
                  >
                    {/* Vertical lines for branches passing through this row */}
                    {visibleLines.map(vl => {
                      const x = 12 + vl.col * LANE_W;
                      return (
                        <div
                          key={vl.col}
                          className="absolute"
                          style={{
                            left: x - 1,
                            width: 2,
                            top: vl.clipTop ? '50%' : 0,
                            bottom: vl.clipBottom ? '50%' : 0,
                            backgroundColor: vl.color,
                            opacity: vl.isActive ? (vl.isSelf ? 0.7 : 0.25) : 0.15,
                          }}
                        />
                      );
                    })}

                    {/* Fork and merge curves are rendered via the overlay SVG above */}

                    {/* Node circle */}
                    {(() => {
                      // Filled = working commit, or HEAD when no non-head restore is active
                      const isFilled = isWorking || (row.isHead && !hasNonHeadRestore);
                      const nodeSize = LANE_W <= 18 ? 10 : 14;
                      return (
                        <div
                          ref={(el) => setNodeRef(commit.id, el)}
                          className="absolute flex items-center justify-center rounded-full z-10"
                          style={{
                            left: nodeX - nodeSize / 2,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: nodeSize,
                            height: nodeSize,
                            borderWidth: isFilled ? 3 : 2,
                            borderStyle: 'solid',
                            borderColor: branch.color,
                            backgroundColor: isFilled ? branch.color : '#ffffff',
                            opacity: isOnActive || isWorking ? 1 : 0.5,
                            boxShadow: isFilled ? `0 0 0 2px ${branch.color}33` : undefined,
                          }}
                        >
                          {isFilled && (
                            <div
                              className="rounded-full"
                              style={{ width: 4, height: 4, backgroundColor: '#ffffff' }}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {/* Fork indicator ring */}
                    {row.isFork && (
                      <div
                        className="absolute rounded-full z-[9]"
                        style={{
                          left: nodeX - (LANE_W <= 18 ? 8 : 11),
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: LANE_W <= 18 ? 16 : 22,
                          height: LANE_W <= 18 ? 16 : 22,
                          border: `1.5px dashed ${branch.color}`,
                          opacity: 0.35,
                        }}
                      />
                    )}

                    {/* Merge indicator ring */}
                    {row.isMerge && (
                      <div
                        className="absolute rounded-full z-[9]"
                        style={{
                          left: nodeX - (LANE_W <= 18 ? 8 : 11),
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: LANE_W <= 18 ? 16 : 22,
                          height: LANE_W <= 18 ? 16 : 22,
                          border: `2px solid ${row.mergeFromColor || branch.color}`,
                          opacity: 0.5,
                        }}
                      />
                    )}
                  </div>

                  {/* Text content */}
                  <div className={`flex-1 min-w-0 px-3 py-3 ${!isOnActive ? 'opacity-50' : ''}`}>
                    {/* Version + badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: branch.color + '15', color: branch.color }}
                      >
                        v1.{versionNum}
                      </span>
                      {row.isHead && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white"
                          style={{ backgroundColor: branch.color }}
                        >
                          HEAD
                        </span>
                      )}
                      {!isOnActive && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: branch.color + '18', color: branch.color }}
                        >
                          {branch.name}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-[13px] font-medium text-gray-800 mt-1.5 leading-snug line-clamp-2">
                      {commit.message}
                    </p>

                    {/* Author + time */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span className="font-medium text-gray-500">{commit.author}</span>
                      <span>&middot;</span>
                      <span>{formatDistanceToNow(commit.timestamp, { addSuffix: true, locale: fr })}</span>
                    </div>

                    {/* Tags */}
                    {(commit.tags.length > 0 || isSelected) && (
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {commit.tags.map(tag => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full ${isSelected ? 'cursor-pointer hover:bg-purple-100' : ''}`}
                            onClick={isSelected ? (e) => { e.stopPropagation(); removeTag(commit.id, tag); } : undefined}
                            title={isSelected ? 'Cliquer pour retirer' : undefined}
                          >
                            <Tag size={8} />{tag}
                            {isSelected && <X size={8} className="ml-0.5 opacity-50" />}
                          </span>
                        ))}
                        {isSelected && (
                          tagInputCommitId === commit.id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <input
                                value={tagInputValue}
                                onChange={e => setTagInputValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && tagInputValue.trim()) {
                                    addTag(commit.id, tagInputValue.trim());
                                    setTagInputValue('');
                                    setTagInputCommitId(null);
                                  }
                                  if (e.key === 'Escape') setTagInputCommitId(null);
                                }}
                                placeholder="Label..."
                                className="w-20 text-[10px] border rounded px-1.5 py-0.5 focus:ring-1 focus:ring-purple-300"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (tagInputValue.trim()) {
                                    addTag(commit.id, tagInputValue.trim());
                                    setTagInputValue('');
                                  }
                                  setTagInputCommitId(null);
                                }}
                                className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
                              >OK</button>
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setTagInputCommitId(commit.id); setTagInputValue(''); }}
                              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-dashed border-purple-300 text-purple-400 rounded-full hover:bg-purple-50 hover:text-purple-600"
                            >
                              <Plus size={8} />
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {isSelected && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <button
                          onClick={e => { e.stopPropagation(); handleCompare(commit.id, commit.branchId); }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-[11px] text-gray-700 font-medium"
                        >
                          <ArrowLeftRight size={12} /> Diff
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleExportVersion(commit.id); }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-[11px] text-blue-700 font-medium"
                        >
                          <Download size={12} /> Exporter
                        </button>
                        {!(row.isHead && isOnActive) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              useVersioningStore.setState({ selectedCommitId: commit.id });
                              window.dispatchEvent(new CustomEvent('versioning:restore-confirm'));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 hover:bg-orange-200 rounded-md text-[11px] text-orange-700 font-medium"
                          >
                            <RotateCcw size={12} /> Restaurer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
