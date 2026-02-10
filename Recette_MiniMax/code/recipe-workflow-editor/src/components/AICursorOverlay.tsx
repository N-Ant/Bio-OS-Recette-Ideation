import { useEffect, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

interface CursorStep {
  type: 'move' | 'click' | 'drag' | 'type' | 'wait';
  x?: number;
  y?: number;
  toX?: number;
  toY?: number;
  text?: string;
  duration?: number;
  label?: string;
}

interface AICursorOverlayProps {
  steps: CursorStep[];
  isActive: boolean;
  onComplete: () => void;
}

export default function AICursorOverlay({ steps, isActive, onComplete }: AICursorOverlayProps) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [currentStep, setCurrentStep] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [showRipple, setShowRipple] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!isActive || steps.length === 0) {
      setPosition({ x: -100, y: -100 });
      return;
    }

    const runAnimation = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        const step = steps[i];
        setLabel(step.label || '');

        switch (step.type) {
          case 'move':
            await animateMove(step.x!, step.y!, step.duration || 600);
            break;
          case 'click':
            await animateClick(step.x!, step.y!);
            break;
          case 'drag':
            await animateDrag(step.x!, step.y!, step.toX!, step.toY!, step.duration || 1000);
            break;
          case 'type':
            await animateType(step.text!, step.duration || 50);
            break;
          case 'wait':
            await wait(step.duration || 500);
            break;
        }
        await wait(200);
      }
      onComplete();
    };

    runAnimation();
  }, [isActive, steps]);

  const animateMove = (x: number, y: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startX = position.x < 0 ? x - 100 : position.x;
      const startY = position.y < 0 ? y - 50 : position.y;
      const startTime = performance.now();
      // Durée minimale de 600ms pour des mouvements visibles
      const actualDuration = Math.max(duration, 600);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / actualDuration, 1);
        // Easing plus doux pour un mouvement naturel
        const eased = easeInOutQuad(progress);
        
        setPosition({
          x: startX + (x - startX) * eased,
          y: startY + (y - startY) * eased
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };

  const animateClick = (x: number, y: number): Promise<void> => {
    return new Promise(async (resolve) => {
      await animateMove(x, y, 600);
      await wait(200); // Pause avant le clic
      setIsClicking(true);
      setShowRipple(true);
      await wait(250);
      setIsClicking(false);
      await wait(400);
      setShowRipple(false);
      resolve();
    });
  };

  const animateDrag = (fromX: number, fromY: number, toX: number, toY: number, duration: number): Promise<void> => {
    return new Promise(async (resolve) => {
      await animateMove(fromX, fromY, 700);
      await wait(300); // Pause avant de saisir
      setIsClicking(true);
      setIsDragging(true);
      await wait(250);
      // Durée du drag plus longue pour être visible
      await animateMove(toX, toY, Math.max(duration, 1000));
      await wait(200);
      setIsClicking(false);
      setIsDragging(false);
      await wait(400);
      resolve();
    });
  };

  const animateType = (text: string, charDelay: number): Promise<void> => {
    return new Promise((resolve) => {
      let i = 0;
      setTypingText('');
      // Délai minimum de 120ms par caractère pour être lisible
      const actualDelay = Math.max(charDelay, 120);
      const interval = setInterval(() => {
        if (i < text.length) {
          setTypingText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setTypingText('');
            resolve();
          }, 800);
        }
      }, actualDelay);
    });
  };

  const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* AI Cursor */}
      <div
        className={`absolute transition-transform ${isClicking ? 'scale-90' : 'scale-100'}`}
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-2px, -2px)',
        }}
      >
        <div className="relative">
          {/* Cursor icon */}
          <div className={`${isDragging ? 'text-purple-600' : 'text-blue-600'} drop-shadow-lg`}>
            <MousePointer2 size={24} fill="currentColor" strokeWidth={1.5} stroke="white" />
          </div>
          
          {/* Click ripple effect */}
          {showRipple && (
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
            </div>
          )}
          
          {/* Drag indicator */}
          {isDragging && (
            <div className="absolute -top-6 left-4 bg-purple-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Déplacement...
            </div>
          )}
        </div>
      </div>

      {/* Action label */}
      {label && (
        <div
          className="absolute bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg"
          style={{
            left: position.x + 30,
            top: position.y + 10,
          }}
        >
          {label}
        </div>
      )}

      {/* Typing indicator */}
      {typingText && (
        <div
          className="absolute bg-white border-2 border-blue-500 text-gray-800 text-sm px-3 py-1.5 rounded shadow-lg"
          style={{
            left: position.x + 30,
            top: position.y - 10,
          }}
        >
          <span className="font-mono">{typingText}</span>
          <span className="animate-pulse text-blue-500">|</span>
        </div>
      )}
    </div>
  );
}
