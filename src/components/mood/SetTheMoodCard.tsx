import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Music2,
  CloudRain,
  Waves,
  Volume2,
  VolumeX,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';
import { GlassCard, Eyebrow, Tile, Slider, PillButton } from '@/components/ui';
import { useAmbientStore, selectIsAudible } from '@/features/audio/ambient/store';
import { PRESET_LAYERS } from '@/features/audio/ambient/layers';
import { useSceneryStore } from '@/features/scenery/store';
import { getSceneById } from '@/data/scenes';
import { MixLayersPanel } from './MixLayersPanel';
import { OwnMusicSheet } from './OwnMusicSheet';
import { ambientEngine } from '@/features/audio/ambient/engine';
import { primeAudioContext } from '@/features/audio/chime';

export interface SetTheMoodCardProps {
  className?: string;
  onOpenOwnMusic?: () => void;
}

export const SetTheMoodCard: React.FC<SetTheMoodCardProps> = ({
  className = '',
  onOpenOwnMusic,
}) => {
  const levels = useAmbientStore(state => state.levels);
  const master = useAmbientStore(state => state.master);
  const muted = useAmbientStore(state => state.muted);
  const isAudible = useAmbientStore(selectIsAudible);

  const selectSound = useAmbientStore(state => state.selectSound);
  const setLevel = useAmbientStore(state => state.setLevel);
  const setMaster = useAmbientStore(state => state.setMaster);
  const togglePlayback = useAmbientStore(state => state.togglePlayback);

  const [isMixOpen, setIsMixOpen] = useState(false);
  const [isOwnMusicOpen, setIsOwnMusicOpen] = useState(false);
  const [dismissedSceneId, setDismissedSceneId] = useState<string | null>(null);

  // Roving tabindex for preset tiles
  const [focusedTileIndex, setFocusedTileIndex] = useState(0);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([null, null, null]);

  // Scene suggestion logic
  const activeSceneId = useSceneryStore(state => state.activeSceneId);
  const scene = getSceneById(activeSceneId);
  const suggestedLayerId = scene?.ambientSuggestion;
  const suggestedDef = suggestedLayerId
    ? PRESET_LAYERS.find(p => p.id === suggestedLayerId)
    : undefined;
  const suggestedLevel = suggestedLayerId ? (levels[suggestedLayerId] ?? 0) : 0;
  const showSuggestion =
    Boolean(suggestedLayerId) &&
    suggestedLevel === 0 &&
    dismissedSceneId !== activeSceneId &&
    Boolean(suggestedDef);

  // Ensure ambient engine is initialized with listeners
  useEffect(() => {
    ambientEngine.init();
  }, []);

  const handleTileKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % PRESET_LAYERS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + PRESET_LAYERS.length) % PRESET_LAYERS.length;
      } else {
        return;
      }

      setFocusedTileIndex(nextIndex);
      tileRefs.current[nextIndex]?.focus();
    },
    [],
  );

  const handleTileSelect = (id: string) => {
    primeAudioContext();
    ambientEngine.startEngine();
    selectSound(id);
  };

  const handleStatusChipClick = () => {
    primeAudioContext();
    ambientEngine.startEngine();
    togglePlayback();
  };

  const handleAddSuggestion = () => {
    if (suggestedLayerId) {
      // Add to mix at 0.6 WITHOUT starting playback automatically
      setLevel(suggestedLayerId, 0.6, false);
    }
  };

  const handleDismissSuggestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedSceneId(activeSceneId);
  };

  const getTileIcon = (id: string) => {
    switch (id) {
      case 'soft-piano':
        return <Music2 className="h-5 w-5" />;
      case 'rainfall':
        return <CloudRain className="h-5 w-5" />;
      case 'brown-noise':
        return <Waves className="h-5 w-5" />;
      default:
        return <Music2 className="h-5 w-5" />;
    }
  };

  return (
    <GlassCard padding="md" className={`h-full flex flex-col justify-between ${className}`}>
      <div className="space-y-4">
        {/* 1. Header with Eyebrow, Title, and SOUND ON/OFF Status Chip */}
        <div>
          <Eyebrow className="text-ink-500 mb-1">SET THE MOOD</Eyebrow>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-pill glass text-accent" aria-hidden="true">
                <Music2 className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-lg font-medium text-ink-900 tracking-tight">
                Sound &amp; Mood
              </h2>
            </div>

            <button
              type="button"
              onClick={handleStatusChipClick}
              aria-label={
                isAudible
                  ? 'SOUND ON: Ambient sound is playing. Click to mute'
                  : 'SOUND OFF: Ambient sound is off. Click to play'
              }
              className={`glass px-2.5 py-1 rounded-pill font-sans text-micro font-medium border shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:glass-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                isAudible
                  ? 'border-accent/40 text-accent glass-strong'
                  : 'border-glass-border text-ink-500'
              }`}
            >
              {isAudible ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
                  <span>SOUND ON</span>
                </>
              ) : (
                <span>SOUND OFF</span>
              )}
            </button>
          </div>

          <p className="font-sans text-small text-ink-500">
            Atmospheric loops to accompany your focus.
          </p>
        </div>

        {/* 2. Preset Tiles with Roving Tabindex */}
        <div
          role="toolbar"
          aria-label="Ambient sound presets"
          className="grid grid-cols-3 gap-2"
        >
          {PRESET_LAYERS.map((layer, index) => {
            const isSelected = (levels[layer.id] ?? 0) > 0;
            return (
              <Tile
                key={layer.id}
                ref={el => {
                  tileRefs.current[index] = el;
                }}
                label={layer.label}
                icon={getTileIcon(layer.id)}
                selected={isSelected}
                tabIndex={focusedTileIndex === index ? 0 : -1}
                onSelect={() => handleTileSelect(layer.id)}
                onKeyDown={e => handleTileKeyDown(e, index)}
                className="p-2.5 text-micro"
                id={`tile-${layer.id}`}
              />
            );
          })}
        </div>

        {/* 3. Master Volume Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-micro text-ink-500 font-sans">
            <span className="flex items-center gap-1.5">
              {muted || master === 0 ? (
                <VolumeX className="h-3.5 w-3.5 text-ink-500" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-ink-500" />
              )}
              <span>Master volume</span>
            </span>
            <span className="tabular-nums font-medium text-ink-700">
              {muted ? 'Muted' : `${Math.round(master * 100)}%`}
            </span>
          </div>
          <Slider
            aria-label="Master ambient volume"
            aria-valuetext={`${Math.round(master * 100)}%`}
            value={Math.round(master * 100)}
            onChange={val => {
              primeAudioContext();
              ambientEngine.startEngine();
              setMaster(val / 100);
            }}
            min={0}
            max={100}
            step={1}
            showValue={false}
          />
        </div>

        {/* 4. Scene Suggestion Chip (never auto-plays) */}
        {showSuggestion && suggestedDef && (
          <div
            className="glass px-3 py-2 rounded-tile border border-accent/30 flex items-center justify-between gap-2 text-micro font-sans text-ink-700"
            data-testid="scene-ambient-suggestion"
          >
            <button
              type="button"
              onClick={handleAddSuggestion}
              className="flex items-center gap-1.5 text-left hover:text-ink-900 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent rounded"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>
                <strong className="font-medium text-ink-900">{suggestedDef.label}</strong> suits
                this scene · Add to mix
              </span>
            </button>
            <button
              type="button"
              onClick={handleDismissSuggestion}
              aria-label="Dismiss ambient suggestion"
              className="text-ink-500 hover:text-ink-900 p-1 rounded-pill transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* 5. Expandable Mix Layers Panel */}
        <div className="space-y-2">
          <PillButton
            variant="ghost"
            size="sm"
            onClick={() => setIsMixOpen(prev => !prev)}
            aria-expanded={isMixOpen}
            leftIcon={<Sliders className="h-3.5 w-3.5 text-accent" />}
            rightIcon={
              isMixOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            }
            className="w-full justify-between text-micro text-ink-700 hover:text-ink-900 h-8 px-3 glass"
          >
            <span>Mix layers ↗</span>
          </PillButton>

          {isMixOpen && <MixLayersPanel />}
        </div>
      </div>

      {/* 6. Footer: + Your Own Music Link & Info */}
      <div className="pt-4 mt-4 border-t border-glass-border/40 flex items-center justify-between text-micro text-ink-500 font-sans">
        <button
          type="button"
          onClick={() => {
            setIsOwnMusicOpen(true);
            onOpenOwnMusic?.();
          }}
          className="flex items-center gap-1.5 text-accent hover:underline font-medium transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent rounded"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Your own music</span>
        </button>
        <span>Curated lo-fi soundscapes</span>
      </div>

      <OwnMusicSheet
        open={isOwnMusicOpen}
        onClose={() => setIsOwnMusicOpen(false)}
      />
    </GlassCard>
  );
};

export default SetTheMoodCard;
