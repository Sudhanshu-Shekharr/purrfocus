import React from 'react';
import { Music2, CloudRain, Waves, RotateCcw } from 'lucide-react';
import { Slider, PillButton } from '@/components/ui';
import { useAmbientStore } from '@/features/audio/ambient/store';
import { PRESET_LAYERS } from '@/features/audio/ambient/layers';

export const MixLayersPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const levels = useAmbientStore(state => state.levels);
  const setLevel = useAmbientStore(state => state.setLevel);
  const resetMix = useAmbientStore(state => state.resetMix);

  const getLayerIcon = (id: string) => {
    switch (id) {
      case 'soft-piano':
        return <Music2 className="h-4 w-4 text-accent" />;
      case 'rainfall':
        return <CloudRain className="h-4 w-4 text-accent" />;
      case 'brown-noise':
        return <Waves className="h-4 w-4 text-accent" />;
      default:
        return <Music2 className="h-4 w-4 text-accent" />;
    }
  };

  // Combine preset layers and any dynamic uploaded layers in state.levels
  const allLayerIds = Array.from(
    new Set([...PRESET_LAYERS.map(l => l.id), ...Object.keys(levels)]),
  );

  return (
    <div
      className={`glass rounded-tile p-3.5 space-y-3.5 border border-glass-border/70 ${className}`}
      data-testid="mix-layers-panel"
    >
      <div className="flex items-center justify-between text-small font-sans font-medium text-ink-900">
        <span>Mix individual layers</span>
        <PillButton
          variant="ghost"
          size="sm"
          onClick={resetMix}
          leftIcon={<RotateCcw className="h-3 w-3" />}
          className="text-micro text-ink-500 hover:text-ink-900 h-6 px-2"
        >
          Reset mix
        </PillButton>
      </div>

      <div className="space-y-3">
        {allLayerIds.map(id => {
          const presetDef = PRESET_LAYERS.find(p => p.id === id);
          const label = presetDef ? presetDef.label : id;
          const currentLevel = levels[id] ?? 0;
          const pct = Math.round(currentLevel * 100);

          return (
            <div key={id} className="space-y-1 font-sans">
              <div className="flex items-center justify-between text-micro text-ink-700">
                <span className="flex items-center gap-1.5 font-medium">
                  {getLayerIcon(id)}
                  <span>{label}</span>
                </span>
                <span className="tabular-nums text-ink-500">{pct}%</span>
              </div>
              <Slider
                aria-label={`${label} volume`}
                aria-valuetext={`${pct}%`}
                value={pct}
                onChange={val => setLevel(id, val / 100)}
                min={0}
                max={100}
                step={1}
                showValue={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MixLayersPanel;
