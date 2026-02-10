import { MousePointer2 } from 'lucide-react';

interface AICursorProps {
  x: number;
  y: number;
  label?: string;
  isClicking?: boolean;
  typingText?: string;
  visible?: boolean;
}

export default function AICursor({ x, y, label, isClicking, typingText, visible = true }: AICursorProps) {
  if (!visible || x < 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* AI Cursor */}
      <div
        className={`absolute transition-all duration-700 ease-out ${isClicking ? 'scale-90' : 'scale-100'}`}
        style={{ left: x, top: y }}
      >
        <div className="relative">
          {/* Cursor icon */}
          <div className="text-blue-600 drop-shadow-lg">
            <MousePointer2 size={28} fill="currentColor" strokeWidth={1.5} stroke="white" />
          </div>
          
          {/* Click ripple effect */}
          {isClicking && (
            <div className="absolute top-0 left-0">
              <div className="w-10 h-10 bg-blue-500/40 rounded-full animate-ping" />
            </div>
          )}
        </div>
      </div>

      {/* Action label */}
      {label && (
        <div
          className="absolute bg-gray-900/90 text-white text-sm px-4 py-2 rounded-lg shadow-xl transition-all duration-500"
          style={{ left: x + 35, top: y + 5 }}
        >
          {label}
        </div>
      )}

      {/* Typing indicator - shows what's being typed */}
      {typingText && (
        <div
          className="absolute bg-white border-2 border-blue-500 text-gray-800 px-3 py-2 rounded-lg shadow-xl transition-all duration-300"
          style={{ left: x + 35, top: y - 15 }}
        >
          <span className="font-mono text-lg">{typingText}</span>
          <span className="animate-pulse text-blue-500 ml-0.5">|</span>
        </div>
      )}
    </div>
  );
}
