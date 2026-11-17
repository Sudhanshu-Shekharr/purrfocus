import React from 'react';
import { Music2, CloudRain, Waves, Volume2 } from 'lucide-react';
import { GlassCard, Tile, Slider } from '@/components/ui';

export const MoodCardSlot: React.FC = () => {
  return (
    <GlassCard padding="md" className="h-full flex flex-col justify-between">
      {/* 1. Header with title, icon, and SOUND OFF status chip */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-pill glass text-accent" aria-hidden="true">
              <Music2 className="h-4 w-4" />
            </span>
            <h2 className="font-serif text-lg font-medium text-ink-900 tracking-tight">
              Sound &amp; Mood
            </h2>
          </div>
          <span className="glass px-2.5 py-0.5 rounded-pill font-sans text-micro font-medium text-ink-500 border border-glass-border shadow-xs">
            SOUND OFF
          </span>
        </div>

        <p className="font-sans text-small text-ink-500 mb-4">
          Atmospheric loops to accompany your focus.
        </p>

        {/* 2. Three ambient preset tiles */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Tile
            label="Piano"
            icon={<Music2 className="h-5 w-5" />}
            disabled
            className="p-2.5 text-micro"
          />
          <Tile
            label="Rainfall"
            icon={<CloudRain className="h-5 w-5" />}
            disabled
            className="p-2.5 text-micro"
          />
          <Tile
            label="Brown"
            icon={<Waves className="h-5 w-5" />}
            disabled
            className="p-2.5 text-micro"
          />
        </div>

        {/* 3. Disabled volume slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-micro text-ink-500 font-sans">
            <span className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-ink-500" />
              <span>Master volume</span>
            </span>
            <span>40%</span>
          </div>
          <Slider
            aria-label="Ambient volume (disabled placeholder)"
            value={40}
            onChange={() => {}}
            disabled
            showValue={false}
          />
        </div>
      </div>

      {/* 4. Footer hint */}
      <div className="pt-4 mt-4 border-t border-glass-border/40 flex items-center justify-between text-micro text-ink-500">
        <span>Curated lo-fi soundscapes</span>
        <span className="font-medium text-ink-700">Phase 7</span>
      </div>
    </GlassCard>
  );
};

export default MoodCardSlot;
