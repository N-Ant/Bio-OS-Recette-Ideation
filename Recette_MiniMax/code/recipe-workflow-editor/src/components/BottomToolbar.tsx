import { ZoomIn, ZoomOut, Undo, Redo, RotateCcw } from 'lucide-react';

export default function BottomToolbar() {
  return (
    <div className="h-12 bg-gray-100 border-t border-gray-200 flex items-center justify-center px-6">
      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
          <ZoomOut size={18} />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-2" />
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
          <Undo size={18} />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
          <Redo size={18} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-2" />
        <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
