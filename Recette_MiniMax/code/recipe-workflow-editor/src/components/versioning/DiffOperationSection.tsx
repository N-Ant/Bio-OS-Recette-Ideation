import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, Pencil } from 'lucide-react';
import { OperationDiff } from '../../versioning/types';
import DiffBlockCard from './DiffBlockCard';
import DiffConnectionLine from './DiffConnectionLine';

export default function DiffOperationSection({ diff }: { diff: OperationDiff }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const iconColor = diff.type === 'added' ? '#22c55e'
    : diff.type === 'removed' ? '#ef4444'
    : '#eab308';

  const TypeIcon = diff.type === 'added' ? Plus
    : diff.type === 'removed' ? Minus
    : Pencil;

  const bgHeader = diff.type === 'added' ? 'bg-green-50'
    : diff.type === 'removed' ? 'bg-red-50'
    : 'bg-gray-50';

  const significantBlockDiffs = diff.blockDiffs.filter(b => !b.isPositionOnly || b.type !== 'modified');
  const positionOnlyDiffs = diff.blockDiffs.filter(b => b.isPositionOnly && b.type === 'modified');

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left ${bgHeader} hover:bg-opacity-80 transition-colors`}
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <TypeIcon size={14} style={{ color: iconColor }} />
        <span className="font-medium text-sm text-gray-800">Operation: {diff.operationName}</span>
        <div className="ml-auto flex gap-2 text-[10px]">
          {diff.blockDiffs.filter(b => b.type === 'added').length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
              +{diff.blockDiffs.filter(b => b.type === 'added').length} blocs
            </span>
          )}
          {diff.blockDiffs.filter(b => b.type === 'removed').length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">
              -{diff.blockDiffs.filter(b => b.type === 'removed').length} blocs
            </span>
          )}
          {significantBlockDiffs.filter(b => b.type === 'modified').length > 0 && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
              ~{significantBlockDiffs.filter(b => b.type === 'modified').length} blocs
            </span>
          )}
          {diff.connectionDiffs.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {diff.connectionDiffs.length} connexions
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Block changes */}
          {significantBlockDiffs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Blocs</div>
              {significantBlockDiffs.map(blockDiff => (
                <DiffBlockCard key={blockDiff.blockId} diff={blockDiff} />
              ))}
            </div>
          )}

          {/* Connection changes */}
          {diff.connectionDiffs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Connexions</div>
              {diff.connectionDiffs.map(connDiff => (
                <DiffConnectionLine key={connDiff.connectionId} diff={connDiff} />
              ))}
            </div>
          )}

          {/* Position-only changes (collapsed) */}
          {positionOnlyDiffs.length > 0 && (
            <div className="text-xs text-gray-400 mt-2">
              + {positionOnlyDiffs.length} bloc(s) repositionne(s) (position uniquement)
            </div>
          )}

          {significantBlockDiffs.length === 0 && diff.connectionDiffs.length === 0 && positionOnlyDiffs.length > 0 && (
            <div className="text-sm text-gray-400 text-center py-2">
              Seuls des changements de position
            </div>
          )}
        </div>
      )}
    </div>
  );
}
