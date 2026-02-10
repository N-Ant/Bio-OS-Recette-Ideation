import { useState } from 'react';
import { Plus, Minus, Pencil, Play, Settings, MessageCircle, Cpu, Clock, LineChart, Square, GitBranch, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { BlockDiff, PropertyChange } from '../../versioning/types';
import { PhaseType, PHASE_CONFIG } from '../../types';

const IconMap: Record<string, typeof Play> = {
  Play, Settings, MessageCircle, Cpu, Clock, LineChart, Square, GitBranch, Layers,
};

function PropertyChangeRow({ change, mode }: { change: PropertyChange; mode: 'modified' | 'added' | 'removed' }) {
  // De-emphasize position-only changes
  const isPosition = change.property === 'Position X' || change.property === 'Position Y';

  if (mode === 'added') {
    return (
      <div className={`flex items-start gap-2 text-xs ${isPosition ? 'opacity-40' : ''}`}>
        <span className="text-gray-500 min-w-[120px] flex-shrink-0 font-medium">{change.property}</span>
        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded truncate max-w-[200px]">{change.displayNew}</span>
      </div>
    );
  }

  if (mode === 'removed') {
    return (
      <div className={`flex items-start gap-2 text-xs ${isPosition ? 'opacity-40' : ''}`}>
        <span className="text-gray-500 min-w-[120px] flex-shrink-0 font-medium">{change.property}</span>
        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded truncate max-w-[200px]">{change.displayOld || change.displayNew}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 text-xs ${isPosition ? 'opacity-40' : ''}`}>
      <span className="text-gray-500 min-w-[120px] flex-shrink-0 font-medium">{change.property}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded line-through truncate max-w-[140px]">{change.displayOld}</span>
        <span className="text-gray-400">&rarr;</span>
        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded truncate max-w-[140px]">{change.displayNew}</span>
      </div>
    </div>
  );
}

export default function DiffBlockCard({ diff }: { diff: BlockDiff }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const phaseType = diff.blockType as PhaseType;
  const phaseConfig = PHASE_CONFIG[phaseType];
  const Icon = phaseConfig ? IconMap[phaseConfig.icon] : null;

  const bgColor = diff.type === 'added' ? 'bg-green-50 border-green-200'
    : diff.type === 'removed' ? 'bg-red-50 border-red-200'
    : diff.isPositionOnly ? 'bg-gray-50 border-gray-200'
    : 'bg-yellow-50 border-yellow-200';

  const iconColor = diff.type === 'added' ? '#22c55e'
    : diff.type === 'removed' ? '#ef4444'
    : '#eab308';

  const TypeIcon = diff.type === 'added' ? Plus
    : diff.type === 'removed' ? Minus
    : Pencil;

  const hasProperties = diff.propertyChanges.length > 0;
  const nonPositionChanges = diff.propertyChanges.filter(c => c.property !== 'Position X' && c.property !== 'Position Y');

  return (
    <div className={`border rounded-lg overflow-hidden ${bgColor}`}>
      {/* Header - clickable to expand */}
      <button
        onClick={() => hasProperties && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 p-3 text-left ${hasProperties ? 'cursor-pointer hover:bg-black/[0.03]' : 'cursor-default'}`}
      >
        {hasProperties ? (
          isExpanded ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        ) : (
          <div className="w-[14px] flex-shrink-0" />
        )}
        <TypeIcon size={14} style={{ color: iconColor }} className="flex-shrink-0" />
        {Icon && (
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: phaseConfig?.bgColor }}>
            <Icon size={14} style={{ color: phaseConfig?.color }} />
          </div>
        )}
        <span className="text-sm font-medium text-gray-800 truncate">{diff.blockLabel}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-white/60 rounded text-gray-500 flex-shrink-0">{phaseType}</span>
        {hasProperties && !isExpanded && (
          <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
            {nonPositionChanges.length} reglage{nonPositionChanges.length > 1 ? 's' : ''}
          </span>
        )}
      </button>

      {/* Expanded property changes */}
      {isExpanded && hasProperties && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 ml-[30px] border-t border-black/5">
          {diff.propertyChanges.map((change, i) => (
            <PropertyChangeRow key={i} change={change} mode={diff.type === 'modified' ? 'modified' : diff.type} />
          ))}
        </div>
      )}
    </div>
  );
}
