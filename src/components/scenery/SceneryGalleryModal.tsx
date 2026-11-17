import React, { useState, useRef, useCallback } from 'react';
import { Heart, Sun, Moon, Sunset, CloudRain, Music2, Waves, Check } from 'lucide-react';
import { Modal, Toggle, PillButton } from '@/components/ui';
import { SCENES } from '@/data/scenes';
import { useSceneryStore } from '@/features/scenery/store';
import { preloadSceneImage } from '@/features/scenery/useSceneImage';
import { useToast } from '@/components/ui/Toast';
import type { Scene } from '@/features/scenery/types';

export type SceneryGalleryModalProps = {
  open: boolean;
  onClose: () => void;
};

function getTimeOfDayIcon(timeOfDay?: string) {
  switch (timeOfDay) {
    case 'morning':
      return <Sun className="h-3 w-3 text-warning" />;
    case 'afternoon':
      return <Sun className="h-3 w-3 text-accent" />;
    case 'evening':
      return <Sunset className="h-3 w-3 text-accent" />;
    case 'night':
      return <Moon className="h-3 w-3 text-info" />;
    default:
      return null;
  }
}

function getAmbientIcon(ambient?: string) {
  switch (ambient) {
    case 'rainfall':
      return <CloudRain className="h-3 w-3" />;
    case 'brown-noise':
      return <Waves className="h-3 w-3" />;
    case 'soft-piano':
    default:
      return <Music2 className="h-3 w-3" />;
  }
}

export const SceneryGalleryModal: React.FC<SceneryGalleryModalProps> = ({ open, onClose }) => {
  const { activeSceneId, favoriteSceneIds, setScene, toggleFavorite } = useSceneryStore();
  const toast = useToast();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredScenes = favoritesOnly
    ? SCENES.filter(s => favoriteSceneIds.includes(s.id))
    : SCENES;

  const handleSelectScene = (scene: Scene) => {
    setScene(scene.id);
    toast.show({ message: `Scene changed to ${scene.name}` });
    onClose();
  };

  const handleToggleFavorite = (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    const isFav = favoriteSceneIds.includes(scene.id);
    toggleFavorite(scene.id);
    toast.show({
      message: isFav
        ? `Removed ${scene.name} from favorites`
        : `Saved ${scene.name} to favorites`,
    });
  };

  // Keyboard grid navigation (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const total = filteredScenes.length;
    if (total === 0) return;

    let nextIndex = index;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (index + 1) % total;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (index - 1 + total) % total;
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = index + 2 < total ? index + 2 : (index + 1) % total;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = index - 2 >= 0 ? index - 2 : (index - 1 + total) % total;
        break;
      default:
        return;
    }

    cardRefs.current[nextIndex]?.focus();
  }, [filteredScenes.length]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Somewhere lovely"
      variant="center"
      className="max-w-2xl w-full"
      showTitle
      footer={
        <div className="flex items-center justify-between gap-4 w-full">
          <span className="font-sans text-micro text-ink-500">
            Click any scene to switch immediately
          </span>
          <PillButton variant="primary" size="sm" type="button" onClick={onClose}>
            Done
          </PillButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 w-full">
        {/* Header toolbar with Favorites filter */}
        <div className="flex items-center justify-between border-b border-glass-border/40 pb-3">
          <p className="font-sans text-small text-ink-700">
            Choose an ambient environment for your study session.
          </p>

          <div className="flex items-center gap-2">
            <Toggle
              label="Favorites only"
              checked={favoritesOnly}
              onChange={setFavoritesOnly}
              className="text-small"
            />
          </div>
        </div>

        {/* Gallery Grid (scales to 8-12 scenes) */}
        {filteredScenes.length === 0 ? (
          <div className="py-12 text-center text-ink-500 font-sans text-small">
            <p className="mb-2">No favorite spaces saved yet.</p>
            <p className="text-micro">Tap the heart on any space to keep it in your favorites.</p>
          </div>
        ) : (
          <div
            role="grid"
            aria-label="Scenery options"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-1"
          >
            {filteredScenes.map((scene, idx) => {
              const isActive = scene.id === activeSceneId;
              const isFav = favoriteSceneIds.includes(scene.id);

              return (
                <button
                  key={scene.id}
                  ref={el => { cardRefs.current[idx] = el; }}
                  type="button"
                  role="gridcell"
                  aria-selected={isActive}
                  onClick={() => handleSelectScene(scene)}
                  onMouseEnter={() => preloadSceneImage(scene.id)}
                  onFocus={() => preloadSceneImage(scene.id)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  className={`group relative text-left rounded-card p-3 transition-all duration-base ease-soft border ${
                    isActive
                      ? 'glass-strong ring-2 ring-accent border-accent shadow-lift'
                      : 'glass border-glass-border hover:glass-strong hover:scale-[1.01]'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                >
                  {/* Image preview with aspect ratio */}
                  <div className="relative aspect-video w-full rounded-tile overflow-hidden mb-2.5 bg-ink-900/10">
                    <img
                      src={scene.sources.thumb}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-soft"
                    />

                    {/* Gradient backing fallback */}
                    <div
                      className="absolute inset-0 -z-10"
                      style={{ background: scene.fallbackGradient }}
                    />

                    {/* Top right favorite heart button */}
                    <button
                      type="button"
                      aria-label={isFav ? `Remove ${scene.name} from favorites` : `Save ${scene.name} to favorites`}
                      aria-pressed={isFav}
                      onClick={e => handleToggleFavorite(e, scene)}
                      className="absolute top-2 right-2 p-1.5 rounded-full glass hover:glass-strong shadow-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isFav ? 'fill-accent text-accent' : 'text-surface'
                        }`}
                      />
                    </button>

                    {/* Active badge */}
                    {isActive && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-pill bg-ink-900/90 text-surface font-sans text-micro flex items-center gap-1 shadow-sm">
                        <Check className="h-3 w-3 text-accent" />
                        <span>Active space</span>
                      </div>
                    )}
                  </div>

                  {/* Scene metadata */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-serif text-body font-medium text-ink-900 group-hover:text-accent transition-colors">
                        {scene.name}
                      </h4>
                      <p className="font-sans text-micro text-ink-500 capitalize flex items-center gap-1">
                        {getTimeOfDayIcon(scene.timeOfDay)}
                        <span>{scene.timeOfDay}</span>
                      </p>
                    </div>

                    {scene.ambientSuggestion && (
                      <span className="glass px-2 py-0.5 rounded-pill text-micro font-sans text-ink-700 flex items-center gap-1 shrink-0">
                        {getAmbientIcon(scene.ambientSuggestion)}
                        <span className="capitalize">{scene.ambientSuggestion.replace('-', ' ')}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SceneryGalleryModal;
