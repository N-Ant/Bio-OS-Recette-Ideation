import { Plus, Minus, Pencil, ArrowRight } from 'lucide-react';
import { ConnectionDiff } from '../../versioning/types';

export default function DiffConnectionLine({ diff }: { diff: ConnectionDiff }) {
  const bgColor = diff.type === 'added' ? 'bg-green-50 border-green-200'
    : diff.type === 'removed' ? 'bg-red-50 border-red-200'
    : 'bg-yellow-50 border-yellow-200';

  const iconColor = diff.type === 'added' ? '#22c55e'
    : diff.type === 'removed' ? '#ef4444'
    : '#eab308';

  const TypeIcon = diff.type === 'added' ? Plus
    : diff.type === 'removed' ? Minus
    : Pencil;

  return (
    <div className={`border rounded-lg p-2.5 ${bgColor}`}>
      <div className="flex items-center gap-2">
        <TypeIcon size={12} style={{ color: iconColor }} />
        <span className="text-xs text-gray-600">{diff.fromLabel}</span>
        <ArrowRight size={12} className="text-gray-400" />
        <span className="text-xs text-gray-600">{diff.toLabel}</span>
      </div>

      {diff.propertyChanges.length > 0 && (
        <div className="mt-1.5 ml-5 space-y-1">
          {diff.propertyChanges.map((change, i) => (
            <div key={i} className="text-[11px] flex items-center gap-1.5">
              <span className="text-gray-500">{change.property}:</span>
              <span className="px-1 bg-red-50 text-red-600 rounded line-through">{change.displayOld}</span>
              <span className="text-gray-400">&rarr;</span>
              <span className="px-1 bg-green-50 text-green-600 rounded">{change.displayNew}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
