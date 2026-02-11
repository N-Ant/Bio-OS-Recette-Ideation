import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Settings, MessageCircle, Cpu, Clock, LineChart, Square, Trash2, RotateCcw, Undo, Redo, GitBranch, X, ArrowDown, ArrowRight, Layers, Save, History, Eye } from 'lucide-react';
import { useStore, getNamedCalculations } from '../store';
import { PhaseType, PHASE_CONFIG, Block, Connection, ConditionConfig, ProfileConfig, OperatorPromptConfig, TransitionCondition, VARIABLES, FUNCTIONS } from '../types';
import BlockConfigModal from './BlockConfigModal';
import FormulaEditor from './FormulaEditor';
import { useVersioningStore } from '../versioning/store';
import BranchSelector from './versioning/BranchSelector';
import VersionBadge from './versioning/VersionBadge';

const IconMap: Record<string, typeof Play> = {
  Play, Settings, MessageCircle, Cpu, Clock, LineChart, Square, GitBranch, Layers,
};

const getBlockDimensions = (type: PhaseType) => {
  if (PHASE_CONFIG[type].shape === 'diamond') {
    return { width: 96, height: 96, outX: 48, outY: 96, inY: 0, trueX: 48, trueY: 96, falseX: 96, falseY: 48 };
  }
  return { width: 210, height: 66, outX: 105, outY: 66, inX: 105, inY: 0 };
};

// Mini profile curve for block preview - animated SVG
function MiniProfileCurve({ points }: { points: { time: number; value: number }[] }) {
  const data = points?.length ? points : [{ time: 0, value: 25 }, { time: 30, value: 32 }, { time: 60, value: 37 }];
  const maxT = Math.max(...data.map(p => p.time), 1);
  const maxV = Math.max(...data.map(p => p.value), 1);
  const minV = Math.min(...data.map(p => p.value), 0);
  const rangeV = maxV - minV || 1;
  
  // Create smooth curve path
  const w = 72, h = 28, pad = 4;
  const pts = data.map(pt => ({
    x: pad + (pt.time / maxT) * (w - 2 * pad),
    y: h - pad - ((pt.value - minV) / rangeV) * (h - 2 * pad)
  }));
  
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${h - pad} L ${pad} ${h - pad} Z`;
  
  return (
    <svg width={w} height={h} className="mt-1 rounded-md overflow-hidden">
      <defs>
        <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill="#fdf2f8" rx="4" />
      <path d={areaPath} fill="url(#miniGrad)" className="animate-pulse" style={{ animationDuration: '3s' }} />
      <path d={linePath} stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#ec4899" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

interface BlockNodeProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDrag: (id: string, x: number, y: number) => void;
  onStartConnection: (id: string, branch?: string) => void;
  onEndConnection: (id: string, isParallel?: boolean) => void;
  isConnecting: boolean;
  connectingFromId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  diffStatus?: 'added' | 'removed' | 'modified' | null;
}

function BlockNode({ block, isSelected, onSelect, onDoubleClick, onDrag, onStartConnection, onEndConnection, isConnecting, connectingFromId, zoom, pan, diffStatus }: BlockNodeProps) {
  const config = PHASE_CONFIG[block.type];
  const Icon = IconMap[config.icon];
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, blockX: 0, blockY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const isDiamond = config.shape === 'diamond';
  
  // Show handles when: hovering, connecting, or selected
  const showHandles = isHovered || isConnecting || isSelected;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.connection-point')) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    // Stocker la position initiale de la souris et du bloc
    setDragStart({ mouseX: e.clientX, mouseY: e.clientY, blockX: block.x, blockY: block.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Calculer le delta en coordonnées écran, puis diviser par zoom
      const deltaX = (e.clientX - dragStart.mouseX) / zoom;
      const deltaY = (e.clientY - dragStart.mouseY) / zoom;
      onDrag(block.id, Math.max(0, dragStart.blockX + deltaX), Math.max(0, dragStart.blockY + deltaY));
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, dragStart, block.id, onDrag, zoom]);

  const isSource = connectingFromId === block.id;
  const canBeTarget = isConnecting && connectingFromId !== block.id;

  const getConditionText = () => {
    if (block.type === 'condition' && block.config) {
      const cfg = block.config as ConditionConfig;
      return `${cfg.expression}${cfg.operator}${cfg.value}`;
    }
    return null;
  };

  // DIAMOND: Smaller, VRAI en bas, FAUX à droite
  if (isDiamond) {
    const condText = getConditionText();
    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        className="absolute cursor-move select-none"
        style={{ left: block.x, top: block.y, zIndex: isDragging ? 100 : 10 }}
      >
        <div
          className={`w-24 h-24 rotate-45 bg-white shadow-md border-2 transition-all ${diffStatus ? '' : isSelected ? 'border-blue-500 shadow-xl' : canBeTarget ? 'border-green-400' : 'border-yellow-400'}`}
          style={{
            backgroundColor: config.bgColor,
            ...(diffStatus === 'added' ? { borderColor: '#22c55e', boxShadow: '0 0 12px 3px rgba(34,197,94,0.4)' } :
              diffStatus === 'removed' ? { borderColor: '#ef4444', boxShadow: '0 0 12px 3px rgba(239,68,68,0.4)', opacity: 0.6 } :
              diffStatus === 'modified' ? { borderColor: '#f97316', boxShadow: '0 0 12px 3px rgba(249,115,22,0.4)' } : {}),
          }}
        >
          <div className="-rotate-45 w-full h-full flex flex-col items-center justify-center">
            <Icon size={16} style={{ color: config.color }} />
            <div className="text-[9px] font-medium text-gray-700 mt-0.5">{block.label}</div>
            {condText && <div className="text-[7px] text-gray-500 font-mono">{condText}</div>}
          </div>
        </div>
        
        {/* Input CENTER (top) - Séquentiel */}
        {(showHandles || canBeTarget) && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEndConnection(block.id, false); }}
            className={`connection-point absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${canBeTarget ? 'border-green-500 bg-green-100' : 'border-gray-400 hover:border-green-500'}`}
            title="Séquentiel"
          />
        )}
        {/* Input LEFT - Parallèle */}
        {(showHandles || canBeTarget) && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEndConnection(block.id, true); }}
            className={`connection-point absolute -top-2 left-2 w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${canBeTarget ? 'border-purple-500 bg-purple-100' : 'border-purple-400 hover:border-purple-500'}`}
            title="Parallèle"
          />
        )}
        
        {/* VRAI = Bottom (green) - only show when showHandles */}
        {showHandles && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 flex flex-col items-center">
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onStartConnection(block.id, 'true'); }}
              className={`connection-point w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${isSource ? 'border-green-500 bg-green-100' : 'border-green-500 hover:bg-green-100'}`}
            />
            <span className="text-[8px] font-bold text-green-600 mt-0.5">V</span>
          </div>
        )}
        
        {/* FAUX = Right (red) - only show when showHandles */}
        {showHandles && (
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center">
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onStartConnection(block.id, 'false'); }}
              className={`connection-point w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${isSource ? 'border-red-500 bg-red-100' : 'border-red-500 hover:bg-red-100'}`}
            />
            <span className="text-[8px] font-bold text-red-600 ml-0.5">F</span>
          </div>
        )}
      </div>
    );
  }

  // Profile block with mini curve preview
  const profileConfig = block.type === 'profile' && block.config ? block.config as ProfileConfig : null;

  // Operator prompt with multiple options
  const promptConfig = block.type === 'operator-prompt' && block.config ? block.config as OperatorPromptConfig : null;
  const promptOptions = promptConfig?.options || [];
  const hasMultipleOutputs = promptOptions.length > 1;

  // Colors for prompt options
  const optionColors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6'];

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      className={`absolute flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-md border-2 cursor-move transition-all select-none ${diffStatus ? '' : isSelected ? 'border-blue-500 shadow-xl' : canBeTarget ? 'border-green-400' : 'border-gray-200 hover:shadow-lg'}`}
      style={{
        left: block.x, top: block.y, minWidth: 190, zIndex: isDragging ? 100 : 10,
        ...(diffStatus === 'added' ? { borderColor: '#22c55e', boxShadow: '0 0 14px 4px rgba(34,197,94,0.35)' } :
          diffStatus === 'removed' ? { borderColor: '#ef4444', boxShadow: '0 0 14px 4px rgba(239,68,68,0.35)', opacity: 0.5 } :
          diffStatus === 'modified' ? { borderColor: '#f97316', boxShadow: '0 0 14px 4px rgba(249,115,22,0.35)' } : {}),
      }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bgColor }}>
        <Icon size={20} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{block.label}</div>
        {block.subtitle && <div className="text-xs text-gray-500 truncate">{block.subtitle}</div>}
        {profileConfig && <MiniProfileCurve points={profileConfig.points} />}
      </div>
      
      {/* Multiple outputs for operator-prompt (right side) */}
      {hasMultipleOutputs && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1" style={{ transform: `translateY(-${(promptOptions.length - 1) * 10}px)` }}>
          {promptOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onStartConnection(block.id, opt); }}
                className="connection-point w-3.5 h-3.5 rounded-full border-2 bg-white cursor-pointer hover:scale-110 transition-transform"
                style={{ borderColor: optionColors[i % optionColors.length] }}
                title={opt}
              />
              <span className="text-[9px] font-medium px-1 py-0.5 rounded" style={{ color: optionColors[i % optionColors.length], backgroundColor: `${optionColors[i % optionColors.length]}15` }}>
                {opt.length > 8 ? opt.slice(0, 8) + '…' : opt}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Output (bottom) - only if not multi-output prompt and showHandles */}
      {!hasMultipleOutputs && showHandles && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onStartConnection(block.id); }}
          className={`connection-point absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${isSource ? 'border-blue-500 bg-blue-100' : 'border-gray-400 hover:border-blue-500'}`}
        />
      )}
      
      {/* Input CENTER (top) - Séquentiel */}
      {(showHandles || canBeTarget) && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEndConnection(block.id, false); }}
          className={`connection-point absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${canBeTarget ? 'border-green-500 bg-green-100' : 'border-gray-400 hover:border-green-500'}`}
          title="Séquentiel"
        />
      )}
      {/* Input LEFT - Parallèle */}
      {(showHandles || canBeTarget) && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEndConnection(block.id, true); }}
          className={`connection-point absolute -top-2 left-4 w-4 h-4 rounded-full border-2 bg-white cursor-pointer transition-opacity ${canBeTarget ? 'border-purple-500 bg-purple-100' : 'border-purple-400 hover:border-purple-500'}`}
          title="Parallèle (condition partagée)"
        />
      )}
    </div>
  );
}

interface ConnectionLineProps {
  connection: Connection;
  blocks: Block[];
  allConnections: Connection[];
  isSelected: boolean;
  isPopupOpen: boolean;
  isMergeMode: boolean;
  isInMergeSelection: boolean;
  canMerge: boolean;
  orientation: 'vertical' | 'horizontal';
  onSelect: () => void;
  onDelete: () => void;
  onEditFormula: () => void;
  onTogglePopup: () => void;
  onMergeToggle: () => void;
  onStartMerge: () => void;
  onConfirmMerge: () => void;
  onUpdateForkOffset: (offset: number) => void;
  diffStatus?: 'added' | 'removed' | 'modified' | null;
}

function ConnectionLine({ connection, blocks, allConnections, isSelected, isPopupOpen, isMergeMode, isInMergeSelection, canMerge, orientation, onSelect, onDelete, onEditFormula, onTogglePopup, onMergeToggle, onStartMerge, onConfirmMerge, onUpdateForkOffset, diffStatus }: ConnectionLineProps) {
  const [isDraggingFork, setIsDraggingFork] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  
  // Handle fork point dragging
  useEffect(() => {
    if (!isDraggingFork) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY;
      const newOffset = Math.max(20, Math.min(200, dragStartOffset + deltaY));
      onUpdateForkOffset(newOffset);
    };
    const handleMouseUp = () => setIsDraggingFork(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingFork, dragStartY, dragStartOffset, onUpdateForkOffset]);
  
  const fromBlock = blocks.find((b) => b.id === connection.from);
  const toBlock = blocks.find((b) => b.id === connection.to);
  if (!fromBlock || !toBlock) return null;

  const fromDim = getBlockDimensions(fromBlock.type);
  const toDim = getBlockDimensions(toBlock.type);
  const isCondition = fromBlock.type === 'condition';
  const isPrompt = fromBlock.type === 'operator-prompt';
  const isSelfLoop = connection.from === connection.to;
  const isParallel = !!connection.parallelGroup;
  const parallelSiblings = isParallel ? allConnections.filter(c => c.parallelGroup === connection.parallelGroup) : [];
  const parallelIndex = parallelSiblings.findIndex(c => c.id === connection.id);
  const isFirstInParallel = parallelIndex === 0;
  const optionColors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6'];
  
  let x1: number, y1: number, x2: number, y2: number;
  
  // Handle prompt option branches
  if (isPrompt && connection.branch && connection.branch !== 'true' && connection.branch !== 'false') {
    const promptCfg = fromBlock.config as OperatorPromptConfig;
    const options = promptCfg?.options || [];
    const optIdx = options.indexOf(connection.branch);
    x1 = fromBlock.x + fromDim.width + 12;
    y1 = fromBlock.y + fromDim.height / 2 + (optIdx - (options.length - 1) / 2) * 20;
    x2 = toBlock.x + (toDim.inX || 105);
    y2 = toBlock.y;
  } else if (orientation === 'horizontal') {
    // Horizontal: output from right, input to left
    x1 = fromBlock.x + fromDim.width;
    y1 = fromBlock.y + fromDim.height / 2;
    x2 = toBlock.x;
    y2 = toBlock.y + toDim.height / 2;
  } else {
    // Vertical: output from bottom, input to top
    x1 = fromBlock.x + fromDim.outX;
    y1 = fromBlock.y + fromDim.outY;
    x2 = toBlock.x + (toDim.inX || 105);
    y2 = toBlock.y;
  }

  // Determine line color based on branch or parallel
  let color = '#6b7280';
  if (isInMergeSelection) color = '#a855f7'; // Bright purple when in merge selection
  else if (isMergeMode && canMerge) color = '#c4b5fd'; // Light purple when can be merged
  else if (isParallel) color = '#8b5cf6'; // Purple for parallel
  else if (connection.branch === 'true') color = '#22c55e';
  else if (connection.branch === 'false') color = '#ef4444';
  else if (isPrompt && connection.branch) {
    const promptCfg = fromBlock.config as OperatorPromptConfig;
    const optIdx = (promptCfg?.options || []).indexOf(connection.branch);
    color = optionColors[optIdx % optionColors.length];
  }

  // Override color in diff mode
  if (diffStatus === 'added') color = '#22c55e';
  else if (diffStatus === 'removed') color = '#ef4444';
  else if (diffStatus === 'modified') color = '#f97316';

  // Calculate fork point for parallel connections (use stored offset or default 50)
  const forkOffset = connection.forkOffset ?? 50;
  let forkY = y1 + forkOffset;
  let forkX = x1;
  
  // Bezier curve adapted to orientation
  let path: string;
  let trunkPath: string | null = null;
  
  // Self-loop: circular path that goes out and back to the same block
  if (isSelfLoop) {
    const loopSize = 60;
    if (orientation === 'horizontal') {
      // Loop goes down and back
      const cx = fromBlock.x + fromDim.width / 2;
      const cy = fromBlock.y + fromDim.height;
      path = `M ${x1} ${y1} C ${x1 + loopSize} ${y1 + loopSize}, ${x1 - loopSize} ${y1 + loopSize}, ${fromBlock.x + fromDim.width / 2} ${fromBlock.y + fromDim.height}`;
      x2 = cx;
      y2 = cy + 30;
    } else {
      // Loop goes right and back
      const rightX = fromBlock.x + fromDim.width + loopSize;
      path = `M ${x1} ${y1} C ${rightX} ${y1}, ${rightX} ${fromBlock.y}, ${fromBlock.x + fromDim.width} ${fromBlock.y + fromDim.height / 2}`;
      x2 = fromBlock.x + fromDim.width + 20;
      y2 = fromBlock.y + fromDim.height / 2;
    }
  } else if (isParallel && parallelSiblings.length > 1) {
    // For parallel: draw from fork point to target
    if (orientation === 'horizontal') {
      forkX = x1 + 50;
      forkY = y1;
      if (isFirstInParallel) {
        trunkPath = `M ${x1} ${y1} L ${forkX} ${forkY}`;
      }
      path = `M ${forkX} ${forkY} C ${forkX + 30} ${forkY}, ${x2 - 30} ${y2}, ${x2} ${y2}`;
    } else {
      if (isFirstInParallel) {
        trunkPath = `M ${x1} ${y1} L ${x1} ${forkY}`;
      }
      const cpY = forkY + Math.max(20, Math.abs(y2 - forkY) / 2);
      path = `M ${x1} ${forkY} C ${x1} ${forkY + 20}, ${x2} ${cpY - 15}, ${x2} ${y2}`;
    }
  } else if (orientation === 'horizontal') {
    const cpX = x1 + Math.max(30, Math.abs(x2 - x1) / 2);
    path = `M ${x1} ${y1} C ${cpX} ${y1}, ${x2 - Math.max(30, Math.abs(x2 - x1) / 2)} ${y2}, ${x2} ${y2}`;
  } else {
    const cpY = y1 + Math.max(30, Math.abs(y2 - y1) / 2);
    path = `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY - 15}, ${x2} ${y2}`;
  }

  let midX: number, midY: number;
  if (isSelfLoop) {
    // Position condition badge to the right of the loop
    midX = fromBlock.x + fromDim.width + 70;
    midY = fromBlock.y + fromDim.height / 2;
  } else if (isParallel && isFirstInParallel) {
    midX = (x1 + x2) / 2;
    midY = forkY - 10;
  } else {
    midX = (x1 + x2) / 2;
    midY = (y1 + y2) / 2;
  }
  const arrowId = `arrow-${connection.id}`;

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: isSelected ? 5 : 1, opacity: diffStatus === 'removed' ? 0.45 : 1 }}>
      <defs>
        <marker id={arrowId} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={isSelected ? '#3b82f6' : color} />
        </marker>
      </defs>
      
      {/* Clickable area */}
      <path d={path} stroke="transparent" strokeWidth="16" fill="none" className={`pointer-events-auto ${isMergeMode && canMerge ? 'cursor-pointer' : 'cursor-pointer'}`} onClick={(e) => { e.stopPropagation(); isMergeMode ? onMergeToggle() : onSelect(); }} />
      
      {/* Trunk line for parallel (only on first) */}
      {trunkPath && (
        <path d={trunkPath} stroke={color} strokeWidth={3} fill="none" />
      )}
      
      {/* Fork point indicator for parallel (only on first) - draggable */}
      {isParallel && isFirstInParallel && parallelSiblings.length > 1 && (
        <circle 
          cx={orientation === 'horizontal' ? forkX : x1} 
          cy={forkY} 
          r="8" 
          fill={isDraggingFork ? '#a855f7' : color} 
          stroke="white" 
          strokeWidth="2"
          className="pointer-events-auto cursor-ns-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingFork(true);
            setDragStartY(e.clientY);
            setDragStartOffset(forkOffset);
          }}
        />
      )}
      
      {/* Visible line */}
      <path d={path} stroke={isSelected ? '#3b82f6' : color} strokeWidth={diffStatus ? 3.5 : isInMergeSelection ? 4 : isSelected ? 2.5 : 2} fill="none" markerEnd={`url(#${arrowId})`} strokeDasharray={diffStatus === 'removed' ? '8 4' : isMergeMode && canMerge && !isInMergeSelection ? '8 4' : undefined} />
      
      {/* TRANSITION badge on connection - for parallel, only show on first */}
      {(!isParallel || isFirstInParallel) && (connection.condition || connection.formula) ? (
        /* Badge with condition - improved readability */
        <g transform={`translate(${midX}, ${midY})`} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onEditFormula(); }}>
          <rect 
            x="-60" y="-14" 
            width="120" height="28" 
            rx="6" 
            fill="#dcfce7" 
            stroke={isSelected ? '#3b82f6' : '#22c55e'} 
            strokeWidth={isSelected ? 2.5 : 1.5}
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
          />
          <text x="0" y="5" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="500" fill="#166534">
            {connection.condition 
              ? `${connection.condition.variable} ${connection.condition.operator} ${connection.condition.value}` 
              : (connection.formula && connection.formula.length > 14 ? connection.formula.slice(0, 14) + '…' : connection.formula)}
          </text>
        </g>
      ) : (!isParallel || isFirstInParallel) ? (
        /* Empty transition - "+ Condition" badge - for parallel, only show on first */
        <g transform={`translate(${midX}, ${midY})`} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onEditFormula(); }}>
          <rect 
            x="-40" y="-12" 
            width="80" height="24" 
            rx="5" 
            fill="white" 
            stroke={isSelected ? '#3b82f6' : isParallel ? '#8b5cf6' : '#d1d5db'} 
            strokeWidth={isSelected ? 2 : 1.5} 
            strokeDasharray={isSelected ? '0' : '4 2'}
          />
          <text x="0" y="4" textAnchor="middle" fontSize="11" fill={isParallel ? '#8b5cf6' : '#9ca3af'}>{isParallel ? '⫘ Parallèle' : '+ Condition'}</text>
        </g>
      ) : null}
      
      {/* Buttons on the RIGHT of the condition badge */}
      {isSelected && !isMergeMode && (
        <g transform={`translate(${midX + 65}, ${midY})`}>
          {/* Delete button */}
          <g transform="translate(0, -10)" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <circle cx="0" cy="0" r="10" fill="white" stroke="#ef4444" strokeWidth="1.5" />
            <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ef4444" strokeWidth="2" />
            <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ef4444" strokeWidth="2" />
          </g>
          {/* Merge button - ⫘ parallel symbol */}
          <g transform="translate(0, 14)" className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onStartMerge(); }}>
            <circle cx="0" cy="0" r="10" fill="white" stroke="#8b5cf6" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#8b5cf6" fontWeight="bold">⫘</text>
          </g>
        </g>
      )}
      
      {/* Validate button when in merge mode and in selection */}
      {isMergeMode && isInMergeSelection && (
        <g transform={`translate(${midX + 65}, ${midY})`} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onConfirmMerge(); }}>
          <circle cx="0" cy="0" r="12" fill="#22c55e" stroke="white" strokeWidth="2" />
          <path d="M -4 0 L -1 3 L 5 -3" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      
      {/* Add to merge button when in merge mode and can be merged */}
      {isMergeMode && canMerge && !isInMergeSelection && (
        <g transform={`translate(${midX + 65}, ${midY})`} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onMergeToggle(); }}>
          <circle cx="0" cy="0" r="10" fill="white" stroke="#8b5cf6" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#8b5cf6" fontWeight="bold">⫘</text>
        </g>
      )}
    </svg>
  );
}

function TemporaryConnectionLine({ fromBlock, mousePos, branch }: { fromBlock: Block; mousePos: { x: number; y: number }; branch?: string }) {
  const isCondition = fromBlock.type === 'condition';
  const isPrompt = fromBlock.type === 'operator-prompt';
  const fromDim = getBlockDimensions(fromBlock.type);
  let x1: number, y1: number;
  
  const optionColors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6'];
  
  if (isCondition && branch === 'true') {
    x1 = fromBlock.x + 48;
    y1 = fromBlock.y + 102;
  } else if (isCondition && branch === 'false') {
    x1 = fromBlock.x + 102;
    y1 = fromBlock.y + 48;
  } else if (isPrompt && branch) {
    const promptCfg = fromBlock.config as OperatorPromptConfig;
    const options = promptCfg?.options || [];
    const optIdx = options.indexOf(branch);
    x1 = fromBlock.x + fromDim.width + 12;
    y1 = fromBlock.y + fromDim.height / 2 + (optIdx - (options.length - 1) / 2) * 20;
  } else {
    x1 = fromBlock.x + fromDim.outX;
    y1 = fromBlock.y + fromDim.outY;
  }

  const x2 = mousePos.x;
  const y2 = mousePos.y;
  
  // Determine color
  let color = '#3b82f6';
  if (branch === 'true') color = '#22c55e';
  else if (branch === 'false') color = '#ef4444';
  else if (isPrompt && branch) {
    const promptCfg = fromBlock.config as OperatorPromptConfig;
    const optIdx = (promptCfg?.options || []).indexOf(branch);
    color = optionColors[optIdx % optionColors.length];
  }
  
  const cpY = y1 + Math.max(20, Math.abs(y2 - y1) / 2);
  const path = `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}`;

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
      <path d={path} stroke={color} strokeWidth="2.5" strokeDasharray="6 3" fill="none" />
      <circle cx={x2} cy={y2} r="6" fill={color} opacity="0.5" />
    </svg>
  );
}

// Transition editor modal - Full condition editor per MFCS manual
function TransitionEditor({ connection, customVariables, onSave, onClose }: { connection: Connection; customVariables: { id: string; name: string; formula: string }[]; onSave: (condition?: TransitionCondition, formula?: string) => void; onClose: () => void }) {
  const [mode, setMode] = useState<'simple' | 'formula'>(connection.formula && !connection.condition ? 'formula' : 'simple');
  const [condition, setCondition] = useState<TransitionCondition>(connection.condition || { variable: 'pH', operator: '>', value: 7 });
  const [formula, setFormula] = useState(connection.formula || '');
  
  // Combine system variables with custom variables
  const allVariables = [...VARIABLES, ...customVariables.map(v => v.name)];
  
  const handleSave = () => {
    if (mode === 'simple') {
      onSave(condition, undefined);
    } else {
      onSave(undefined, formula || undefined);
    }
  };
  
  const handleClear = () => {
    setCondition({ variable: 'pH', operator: '>', value: 7 });
    setFormula('');
    onSave(undefined, undefined);
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Condition de Transition</h3>
            <p className="text-xs text-gray-500">La phase suivante demarre quand cette condition est remplie</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('simple')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Condition Simple</button>
          <button onClick={() => setMode('formula')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'formula' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Formule Avancee</button>
        </div>
        
        {mode === 'simple' ? (
          <div className="space-y-4">
            {/* Variable */}
            <div>
              <label className="text-sm font-medium text-gray-700">Variable</label>
              <select value={condition.variable} onChange={(e) => setCondition({ ...condition, variable: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2">
                <optgroup label="Variables système">
                  {VARIABLES.map(v => <option key={v}>{v}</option>)}
                </optgroup>
                {customVariables.length > 0 && (
                  <optgroup label="Variables personnalisées">
                    {customVariables.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            
            {/* Operator */}
            <div>
              <label className="text-sm font-medium text-gray-700">Operateur</label>
              <div className="flex gap-1 mt-1">
                {(['>', '<', '>=', '<=', '==', '!='] as const).map(op => (
                  <button key={op} onClick={() => setCondition({ ...condition, operator: op })} className={`flex-1 py-2 rounded-lg text-sm font-mono ${condition.operator === op ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{op}</button>
                ))}
              </div>
            </div>
            
            {/* Value */}
            <div>
              <label className="text-sm font-medium text-gray-700">Valeur</label>
              <input type="number" step="any" value={condition.value} onChange={(e) => setCondition({ ...condition, value: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border rounded-lg px-3 py-2" />
            </div>
            
            {/* Preview */}
            <div className="p-3 bg-gray-800 rounded-lg text-center font-mono text-green-400">
              {condition.variable} {condition.operator} {condition.value}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FormulaEditor
              formula={formula}
              onFormulaChange={setFormula}
              mode="condition"
              availableCalculations={getNamedCalculations(useStore.getState())}
              units={(() => { const s = useStore.getState(); const r = s.recipes.find(r => r.id === s.selectedRecipeId); return r?.units; })()}
            />
            {formula && (
              <div className="p-3 bg-gray-800 rounded-lg text-center font-mono text-green-400 text-sm">
                {formula}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <button onClick={handleClear} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm">Effacer condition</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Canvas() {
  const { recipes, selectedRecipeId, selectedOperationId, selectedBlockId, selectBlock, addBlock, updateBlock, deleteBlock, addConnection, updateConnection, deleteConnection, setOrientation, configModalBlockId, setConfigModalBlockId, getBlockById } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingBranch, setConnectingBranch] = useState<string | undefined>();
  const [connectingParallelGroup, setConnectingParallelGroup] = useState<string | undefined>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // Merge mode state
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  
  // Config modal from store (can be triggered externally)
  const configModalBlock = configModalBlockId ? getBlockById(configModalBlockId) : null;
  const setConfigModalBlock = (block: Block | null) => setConfigModalBlockId(block?.id || null);
  const [openPopupConnId, setOpenPopupConnId] = useState<string | null>(null);
  const [editingFormulaConn, setEditingFormulaConn] = useState<Connection | null>(null);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const recipe = recipes.find((r) => r.id === selectedRecipeId);
  const operation = recipe?.operations.find(o => o.id === selectedOperationId);
  const blocks = operation?.blocks || [];
  const connections = operation?.connections || [];

  const connectingBlock = connectingFrom ? blocks.find((b) => b.id === connectingFrom) : null;

  // Canvas diff overlay
  const canvasDiffMode = useVersioningStore(s => s.canvasDiffMode);
  const canvasDiffData = useVersioningStore(s => s.canvasDiffData);
  const setCanvasDiffMode = useVersioningStore(s => s.setCanvasDiffMode);

  const { blockDiffMap, connectionDiffMap } = useMemo(() => {
    const bMap = new Map<string, 'added' | 'removed' | 'modified'>();
    const cMap = new Map<string, 'added' | 'removed' | 'modified'>();
    if (!canvasDiffMode || !canvasDiffData || !selectedOperationId) return { blockDiffMap: bMap, connectionDiffMap: cMap };

    for (const opDiff of canvasDiffData.operationDiffs) {
      // Match by operationId, or show all diffs if only one operation exists
      if (opDiff.operationId !== selectedOperationId && canvasDiffData.operationDiffs.length > 1) continue;
      for (const bd of opDiff.blockDiffs) {
        if (!bd.isPositionOnly) bMap.set(bd.blockId, bd.type);
      }
      for (const cd of opDiff.connectionDiffs) {
        cMap.set(cd.connectionId, cd.type);
      }
    }
    return { blockDiffMap: bMap, connectionDiffMap: cMap };
  }, [canvasDiffMode, canvasDiffData, selectedOperationId]);

  useEffect(() => {
    if (!connectingFrom || !canvasRef.current) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      // Convertir en coordonnées canvas (model)
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setMousePos({ x, y });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setConnectingFrom(null); setConnectingBranch(undefined); setConnectingParallelGroup(undefined); }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('keydown', handleKeyDown); };
  }, [connectingFrom, zoom, pan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        deleteConnection(selectedConnectionId);
        setSelectedConnectionId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectionId, deleteConnection]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.min(2, Math.max(0.25, z * delta)));
    } else {
      // Pan with wheel (without ctrl)
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  // Pan with middle mouse or left mouse on empty space
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button (1) or left click on canvas background
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current?.querySelector('.canvas-content'))) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  useEffect(() => {
    if (!isPanning) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };
    const handleMouseUp = () => setIsPanning(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isPanning, panStart]);

  // Convertir coordonnées viewport en coordonnées canvas (model)
  const viewportToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // Soustraire le pan et diviser par le zoom
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [zoom, pan]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('phaseType') as PhaseType;
    if (!type || !canvasRef.current) return;
    const coords = viewportToCanvas(e.clientX, e.clientY);
    addBlock(type, Math.max(0, coords.x - 80), Math.max(0, coords.y - 25));
  }, [addBlock, viewportToCanvas]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  const handleDrag = useCallback((id: string, x: number, y: number) => { updateBlock(id, { x, y }); }, [updateBlock]);

  const handleStartConnection = (id: string, branch?: 'true' | 'false') => {
    const block = blocks.find((b) => b.id === id);
    if (block && canvasRef.current) {
      const dim = getBlockDimensions(block.type);
      if (block.type === 'condition' && branch === 'true') {
        setMousePos({ x: block.x + 48, y: block.y + 102 });
      } else if (block.type === 'condition' && branch === 'false') {
        setMousePos({ x: block.x + 102, y: block.y + 48 });
      } else {
        setMousePos({ x: block.x + dim.outX, y: block.y + dim.outY });
      }
    }
    setConnectingFrom(id);
    setConnectingBranch(branch);
    setSelectedConnectionId(null);
  };

  const handleEndConnection = (id: string, isParallel?: boolean) => {
    if (connectingFrom) {  // Allow self-loops (from === to)
      let parallelGroup = connectingParallelGroup;
      
      // If dropping on left side (parallel mode), find or create a parallel group
      if (isParallel) {
        // Find existing parallel group from same source, or create new one
        const existingParallel = connections.find(c => c.from === connectingFrom && c.parallelGroup);
        parallelGroup = existingParallel?.parallelGroup || `pg_${Date.now()}`;
      }
      
      addConnection(connectingFrom, id, connectingBranch, parallelGroup);
    }
    setConnectingFrom(null);
    setConnectingBranch(undefined);
    setConnectingParallelGroup(undefined);
  };

  const handleCanvasClick = () => {
    selectBlock(null);
    setConnectingFrom(null);
    setConnectingBranch(undefined);
    setConnectingParallelGroup(undefined);
    setSelectedConnectionId(null);
    setOpenPopupConnId(null);
  };

  const handleSaveTransition = (condition?: TransitionCondition, formula?: string) => {
    if (editingFormulaConn) {
      // If parallel group, update all connections in the group
      if (editingFormulaConn.parallelGroup) {
        connections
          .filter(c => c.parallelGroup === editingFormulaConn.parallelGroup)
          .forEach(c => updateConnection(c.id, { condition, formula }));
      } else {
        updateConnection(editingFormulaConn.id, { condition, formula });
      }
    }
    setEditingFormulaConn(null);
  };

  // Start merge mode
  const handleStartMerge = () => {
    if (selectedConnectionId) {
      setMergeMode(true);
      setMergeSelection([selectedConnectionId]);
    }
  };

  // Toggle connection in merge selection
  const handleToggleMergeSelection = (connId: string) => {
    if (!mergeMode) return;
    const conn = connections.find(c => c.id === connId);
    const firstConn = connections.find(c => c.id === mergeSelection[0]);
    // Only allow merging connections from the same source block
    if (conn && firstConn && conn.from === firstConn.from) {
      setMergeSelection(prev => 
        prev.includes(connId) 
          ? prev.filter(id => id !== connId)
          : [...prev, connId]
      );
    }
  };

  // Confirm merge
  const handleConfirmMerge = () => {
    if (mergeSelection.length >= 2) {
      const parallelGroup = `pg_${Date.now()}`;
      // Get condition from first connection if any
      const firstConn = connections.find(c => c.id === mergeSelection[0]);
      const sharedCondition = firstConn?.condition;
      const sharedFormula = firstConn?.formula;
      
      mergeSelection.forEach(connId => {
        updateConnection(connId, { 
          parallelGroup, 
          condition: sharedCondition, 
          formula: sharedFormula 
        });
      });
    }
    setMergeMode(false);
    setMergeSelection([]);
    setSelectedConnectionId(null);
  };

  // Cancel merge
  const handleCancelMerge = () => {
    setMergeMode(false);
    setMergeSelection([]);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const orientation = recipe?.orientation || 'vertical';

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">1. {operation?.name || 'Preparation'}</span>
          {/* Orientation toggle */}
          <button
            onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2 transition-colors"
            title={orientation === 'vertical' ? 'Passer en horizontal' : 'Passer en vertical'}
          >
            {orientation === 'vertical' ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
            {orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
          </button>
          <button className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Apercu
          </button>
          <div className="border-l border-gray-200 h-6 mx-1" />
          <BranchSelector compact />
          <VersionBadge />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => useVersioningStore.getState().setCommitDialogOpen(true)}
            className="p-2 hover:bg-blue-50 rounded-lg"
            title="Sauvegarder version"
          >
            <Save size={18} className="text-blue-500" />
          </button>
          <button
            onClick={() => useVersioningStore.getState().setHistoryPanelOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Historique des versions"
          >
            <History size={18} className="text-gray-500" />
          </button>
          <div className="border-l border-gray-200 h-6 mx-1" />
          <button className="p-2 hover:bg-gray-100 rounded-lg"><RotateCcw size={18} className="text-gray-500" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-lg"><Undo size={18} className="text-gray-500" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-lg"><Redo size={18} className="text-gray-500" /></button>
        </div>
      </div>

      {connectingFrom && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-lg text-white font-medium ${connectingBranch === 'true' ? 'bg-green-500' : connectingBranch === 'false' ? 'bg-red-500' : connectingBranch ? 'bg-orange-500' : 'bg-blue-500'}`}>
          {connectingBranch === 'true' ? 'VRAI' : connectingBranch === 'false' ? 'FAUX' : connectingBranch ? `Option: ${connectingBranch}` : 'Connexion'} - Cliquez sur le bloc cible (Echap annuler)
        </div>
      )}

      {/* Diff overlay mode banner */}
      {canvasDiffMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-2.5 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-blue-200">
          <Eye size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Mode Diff</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Ajoute</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Supprime</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500" /> Modifie</span>
          </div>
          <button
            onClick={() => setCanvasDiffMode(false)}
            className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
          >
            <X size={14} />
            Quitter
          </button>
        </div>
      )}

      <div
        id="canvas-area"
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        className={`flex-1 relative overflow-hidden bg-white ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        style={{ minHeight: 600 }}
      >
        {/* Zoomable/pannable content */}
        <div 
          className="canvas-content absolute inset-0 bg-white bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '3000px',
            height: '2000px'
          }}
        >
        {connections.map((conn) => {
          const firstMergeConn = mergeSelection[0] ? connections.find(c => c.id === mergeSelection[0]) : null;
          const canMerge = mergeMode && firstMergeConn && conn.from === firstMergeConn.from && conn.id !== mergeSelection[0];
          return (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              blocks={blocks}
              allConnections={connections}
              isSelected={selectedConnectionId === conn.id}
              isPopupOpen={openPopupConnId === conn.id}
              isMergeMode={mergeMode}
              isInMergeSelection={mergeSelection.includes(conn.id)}
              canMerge={!!canMerge}
              orientation={orientation}
              onSelect={() => { setSelectedConnectionId(conn.id); selectBlock(null); }}
              onDelete={() => { deleteConnection(conn.id); setSelectedConnectionId(null); setOpenPopupConnId(null); }}
              onEditFormula={() => { setEditingFormulaConn(conn); setOpenPopupConnId(null); }}
              onTogglePopup={() => setOpenPopupConnId(openPopupConnId === conn.id ? null : conn.id)}
              onMergeToggle={() => handleToggleMergeSelection(conn.id)}
              onStartMerge={() => { setMergeMode(true); setMergeSelection([conn.id]); }}
              onConfirmMerge={handleConfirmMerge}
              onUpdateForkOffset={(offset) => {
                // Update forkOffset for all connections in the parallel group
                if (conn.parallelGroup) {
                  connections.filter(c => c.parallelGroup === conn.parallelGroup)
                    .forEach(c => updateConnection(c.id, { forkOffset: offset }));
                } else {
                  updateConnection(conn.id, { forkOffset: offset });
                }
              }}
              diffStatus={connectionDiffMap.get(conn.id) || null}
            />
          );
        })}

        {connectingBlock && <TemporaryConnectionLine fromBlock={connectingBlock} mousePos={mousePos} branch={connectingBranch} />}
        
        {blocks.map((block) => (
          <BlockNode
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            onSelect={() => { selectBlock(block.id); setSelectedConnectionId(null); }}
            onDoubleClick={() => setConfigModalBlock(block)}
            onDrag={handleDrag}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            isConnecting={connectingFrom !== null}
            connectingFromId={connectingFrom}
            zoom={zoom}
            pan={pan}
            diffStatus={blockDiffMap.get(block.id) || null}
          />
        ))}

        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center bg-white/80 p-6 rounded-xl">
              <div className="text-lg mb-2 font-medium">Glissez des phases depuis la Library</div>
              <div className="text-sm">Double-cliquez pour configurer</div>
            </div>
          </div>
        )}
        </div>
        
        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border flex items-center gap-1 p-1 z-30">
          <button onClick={() => setZoom(z => Math.min(2, z * 1.2))} className="p-2 hover:bg-gray-100 rounded text-gray-600 text-lg font-bold">+</button>
          <span className="px-2 text-sm text-gray-600 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.25, z * 0.8))} className="p-2 hover:bg-gray-100 rounded text-gray-600 text-lg font-bold">−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Reset</button>
        </div>
      </div>

      {selectedBlock && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border p-3 flex items-center gap-3 z-40">
          <input value={selectedBlock.label} onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })} className="px-3 py-1.5 border rounded-lg text-sm w-32" />
          <button onClick={() => setConfigModalBlock(selectedBlock)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Configurer</button>
          <button onClick={() => deleteBlock(selectedBlock.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      )}

      {selectedConnectionId && !mergeMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border p-3 flex items-center gap-3 z-40">
          <span className="text-sm text-gray-600">Connexion</span>
          <button onClick={() => { const conn = connections.find(c => c.id === selectedConnectionId); if (conn) setEditingFormulaConn(conn); }} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Formule</button>
          <button onClick={handleStartMerge} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm flex items-center gap-1">
            <GitBranch size={14} /> Merger
          </button>
          <button onClick={() => { deleteConnection(selectedConnectionId); setSelectedConnectionId(null); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm flex items-center gap-1"><Trash2 size={14} /> Supprimer</button>
        </div>
      )}

      {mergeMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-purple-50 border-2 border-purple-400 rounded-xl shadow-xl p-3 flex items-center gap-3 z-40">
          <span className="text-sm text-purple-700 font-medium">Mode Merge : {mergeSelection.length} sélectionné(s)</span>
          <span className="text-xs text-purple-500">Cliquez sur d'autres connexions du même bloc</span>
          <button onClick={handleConfirmMerge} disabled={mergeSelection.length < 2} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${mergeSelection.length >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
            ✓ Confirmer
          </button>
          <button onClick={handleCancelMerge} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Annuler</button>
        </div>
      )}

      {configModalBlock && <BlockConfigModal block={configModalBlock} blocks={blocks} connections={connections} onSave={(cfg, lbl, sub) => { updateBlock(configModalBlock.id, { config: cfg, label: lbl, subtitle: sub }); }} onClose={() => setConfigModalBlock(null)} />}
      
      {editingFormulaConn && <TransitionEditor connection={editingFormulaConn} customVariables={recipe?.customVariables || []} onSave={handleSaveTransition} onClose={() => setEditingFormulaConn(null)} />}
    </div>
  );
}
