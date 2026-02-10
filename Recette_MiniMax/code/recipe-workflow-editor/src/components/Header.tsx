import { Plus } from 'lucide-react';

export default function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const timeStr = `${now.getHours()}h${now.getMinutes().toString().padStart(2, '0')}m`;

  return (
    <header className="h-12 bg-[#1a1a2e] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-6 h-6" />
          <span className="font-semibold text-white tracking-wide">WORKFLOW</span>
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          <button className="px-4 py-1.5 bg-emerald-500 text-white text-sm rounded-full font-medium">
            BioCat L1-1
          </button>
          <button className="px-4 py-1.5 text-gray-400 text-sm rounded-full hover:bg-white/10">
            L1-2
          </button>
          <button className="p-1.5 text-gray-400 hover:bg-white/10 rounded-full">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        {dateStr} <span className="text-gray-600 mx-1">|</span> {timeStr}
      </div>
    </header>
  );
}
