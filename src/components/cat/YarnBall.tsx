import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { playRustleSfx } from '@/features/cat/sfx';
import { emitPawPrint } from '@/features/fx/emitters';

export const YarnBall: React.FC = () => {
  const overlay = useCatRuntimeStore(s => s.overlay);
  const stopPlay = useCatRuntimeStore(s => s.stopPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPawRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (overlay?.type !== 'play') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto flex items-center justify-center z-20"
      aria-label="Play area with draggable yarn ball"
    >
      <motion.div
        drag
        dragConstraints={containerRef}
        dragElastic={0.2}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onDragStart={(_event, info) => {
          playRustleSfx();
          lastPawRef.current = { x: info.point.x, y: info.point.y };
          emitPawPrint(info.point.x, info.point.y);
        }}
        onDrag={(_event, info) => {
          const dist = Math.hypot(
            info.point.x - lastPawRef.current.x,
            info.point.y - lastPawRef.current.y,
          );
          if (dist > 32) {
            lastPawRef.current = { x: info.point.x, y: info.point.y };
            emitPawPrint(info.point.x, info.point.y);
          }
        }}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Yarn Ball SVG */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          {/* Main Ball */}
          <circle cx="24" cy="24" r="20" fill="#E74C3C" stroke="#2C3E50" strokeWidth="2.5" />
          {/* Yarn Strands */}
          <path
            d="M10 18 C16 10 32 10 38 18"
            stroke="#C0392B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M8 26 C14 36 34 36 40 26"
            stroke="#C0392B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 8 C26 14 26 34 16 40"
            stroke="#C0392B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M32 8 C22 14 22 34 32 40"
            stroke="#FF7675"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Loose trailing thread */}
          <path
            d="M36 34 C44 40 46 44 42 46"
            stroke="#E74C3C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Small dismiss button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            stopPlay();
          }}
          className="absolute -top-2 -right-2 p-0.5 rounded-full bg-white/80 dark:bg-black/80 border border-glass-border shadow-xs text-ink-700 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label="Stop playing"
          title="Finish playtime"
        >
          <X className="h-3 w-3" />
        </button>
      </motion.div>
    </div>
  );
};
