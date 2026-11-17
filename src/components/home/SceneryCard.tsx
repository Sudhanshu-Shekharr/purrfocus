import React, { useState, useRef, useCallback } from 'react';
import { Heart, Compass, Check, Sparkles, X } from 'lucide-react';
import { GlassCard, PillButton, Modal, Toggle, useToast } from '@/components/ui';
import { useSceneryStore } from '@/features/scenery/store';
import { preloadSceneImage } from '@/features/scenery/useSceneImage';
import { SCENES, getSceneById } from '@/data/scenes';
import type { Scene, SceneId } from '@/features/scenery/types';
import { getTimeOfDay, type TimeOfDay } from '@/lib/time';

function getSuggestionLabel(tod: TimeOfDay): string {
  switch (tod) {
    case 'morning':
      return 'Morning light suits this hour · Try it';
    case 'afternoon':
      return 'Afternoon light suits this hour · Try it';
    case 'evening':
      return 'Evening light suits this hour · Try it';
    case 'lateNight':
      return 'Late night quiet suits this hour · Try it';
  }
}

export interface SceneryCardProps {
  currentTimeOfDay?: TimeOfDay;
}

export const SceneryCard: React.FC<SceneryCardProps> = ({ currentTimeOfDay: testTod }) => {
  const { activeSceneId, favoriteSceneIds, setScene, toggleFavorite } = useSceneryStore();
  const { show: showToast } = useToast();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [dismissedTod, setDismissedTod] = useState<TimeOfDay | null>(null);

  const activeScene = getSceneById(activeSceneId);
  const isFavorite = favoriteSceneIds.includes(activeSceneId);

  const currentTod = testTod ?? getTimeOfDay();
  const isCurrentTodMatching =
    activeScene.timeOfDay === currentTod ||
    (currentTod === 'lateNight' && activeScene.timeOfDay === 'night');

  const matchingScene = !isCurrentTodMatching
    ? (SCENES.find(
        s =>
          s.id !== activeSceneId &&
          (s.timeOfDay === currentTod || (currentTod === 'lateNight' && s.timeOfDay === 'night')),
      ) ?? null)
    : null;

  // Compute the 3 rotating thumbnails: active scene + next 2 in ring order
  const activeIndex = SCENES.findIndex(s => s.id === activeSceneId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const visibleThumbnails: Scene[] = [
    SCENES[safeIndex]!,
    SCENES[(safeIndex + 1) % SCENES.length]!,
    SCENES[(safeIndex + 2) % SCENES.length]!,
  ];

  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const galleryCardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelectScene = useCallback(
    (scene: Scene, closeGallery = false) => {
      if (scene.id !== activeSceneId) {
        setScene(scene.id);
        showToast({ message: `Scene changed to ${scene.name}` });
      }
      if (closeGallery) {
        setGalleryOpen(false);
      }
    },
    [activeSceneId, setScene, showToast],
  );

  const handleToggleFavorite = useCallback(
    (sceneId: SceneId, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const targetScene = getSceneById(sceneId);
      const willBeFav = !favoriteSceneIds.includes(sceneId);
      toggleFavorite(sceneId);
      showToast({
        message: willBeFav
          ? `Saved ${targetScene.name} to favorites`
          : `Removed ${targetScene.name} from favorites`,
      });
    },
    [favoriteSceneIds, toggleFavorite, showToast],
  );

  // Keyboard navigation for the 3 thumbnails
  const handleThumbKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % visibleThumbnails.length;
      thumbRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + visibleThumbnails.length) % visibleThumbnails.length;
      thumbRefs.current[prev]?.focus();
    }
  };

  const filteredGalleryScenes = favoritesOnly
    ? SCENES.filter(s => favoriteSceneIds.includes(s.id))
    : SCENES;

  // Keyboard navigation inside gallery modal
  const handleGalleryKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (filteredGalleryScenes.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % filteredGalleryScenes.length;
      galleryCardRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + filteredGalleryScenes.length) % filteredGalleryScenes.length;
      galleryCardRefs.current[prev]?.focus();
    }
  };

  return (
    <>
      <GlassCard padding="lg" className="w-full h-full flex flex-col justify-between">
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Compass className="h-4 w-4 text-accent" />
                <h2 className="font-serif text-xl text-ink-900 font-medium">Somewhere lovely</h2>
              </div>
              <p className="font-sans text-small text-accent font-medium">{activeScene.name}</p>
            </div>

            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="text-small font-sans font-medium text-ink-700 hover:text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent py-0.5 px-1 rounded transition-colors"
            >
              Change scenery ↗
            </button>
          </div>

          <p className="font-sans text-small text-ink-500 mb-4">
            Curated atmospheric spaces for your study session.
          </p>

          {/* Three Rotating Thumbnails Row + (+2) Chip */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="grid grid-cols-3 gap-2.5 flex-1" role="group" aria-label="Quick scene selector">
              {visibleThumbnails.map((scene, i) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <button
                    key={scene.id}
                    ref={el => {
                      thumbRefs.current[i] = el;
                    }}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`Switch scene to ${scene.name}${isActive ? ' (currently active)' : ''}`}
                    onClick={() => handleSelectScene(scene)}
                    onMouseEnter={() => preloadSceneImage(scene.id)}
                    onFocus={() => preloadSceneImage(scene.id)}
                    onKeyDown={e => handleThumbKeyDown(e, i)}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-tile p-1.5 transition-all text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isActive
                        ? 'bg-glass-strong ring-2 ring-accent shadow-sm'
                        : 'glass hover:glass-strong hover:scale-[1.02]'
                    }`}
                  >
                    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-ink-900/10">
                      <img
                        src={scene.sources.thumb}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {isActive && (
                        <div
                          className="absolute inset-0 bg-accent/15 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <span className="h-5 w-5 rounded-full bg-accent text-surface flex items-center justify-center shadow-sm">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`font-sans text-micro text-center truncate w-full px-0.5 ${
                        isActive ? 'text-ink-900 font-semibold' : 'text-ink-700'
                      }`}
                    >
                      {scene.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* +2 Gallery Chip */}
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              aria-label={`+${SCENES.length - 3} more: View all scenery spaces`}
              className="glass hover:glass-strong h-[64px] px-2.5 rounded-tile flex flex-col items-center justify-center gap-0.5 border border-glass-border font-sans text-micro font-medium text-ink-700 hover:text-accent transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent hover:scale-[1.03]"
            >
              <span className="font-serif font-semibold text-small">+{SCENES.length - 3}</span>
              <span className="text-[10px] text-ink-500 uppercase">more</span>
            </button>
          </div>

          {/* Gentle Scene Suggestion Chip */}
          {matchingScene && dismissedTod !== currentTod && (
            <div
              data-testid="scene-suggestion-chip"
              className="flex items-center justify-between gap-2 px-3 py-1.5 mb-4 rounded-pill glass border border-glass-border/40 text-micro shadow-sm"
            >
              <button
                type="button"
                onClick={() => handleSelectScene(matchingScene)}
                className="flex-1 text-left font-sans text-ink-700 hover:text-accent transition-colors flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                aria-label={`${getSuggestionLabel(currentTod)} · Switch to suggested scene: ${matchingScene.name}`}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                <span className="font-medium text-ink-900">{getSuggestionLabel(currentTod)}</span>
                <span className="text-ink-500 text-[11px]">({matchingScene.ambientSuggestion})</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedTod(currentTod)}
                aria-label="Dismiss scene suggestion"
                className="text-ink-500 hover:text-ink-800 transition-colors p-0.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Favorite toggle button */}
        <div className="pt-3 border-t border-glass-border/30 flex items-center justify-between">
          <PillButton
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => handleToggleFavorite(activeSceneId)}
            aria-pressed={isFavorite}
            leftIcon={
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite ? 'fill-accent text-accent' : 'text-ink-700'
                }`}
              />
            }
            className="text-small -ml-2 hover:bg-glass"
          >
            {isFavorite ? 'Saved to favorites' : 'Save this space'}
          </PillButton>

          <span className="font-sans text-micro text-ink-500 capitalize">
            {activeScene.timeOfDay} ambience
          </span>
        </div>
      </GlassCard>

      {/* Scenery Gallery Modal */}
      <Modal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="Scenery Gallery"
        showTitle
        className="max-w-2xl w-full"
        footer={
          <div className="flex items-center justify-between gap-4 w-full">
            <span className="font-sans text-micro text-ink-500">
              Click any space to switch scenes immediately.
            </span>
            <PillButton
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setGalleryOpen(false)}
            >
              Done
            </PillButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Modal Toolbar: Description + Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="font-sans text-small text-ink-700">
              Select a space to instantly transform your study atmosphere.
            </p>
            <Toggle
              label="Favorites only"
              checked={favoritesOnly}
              onChange={setFavoritesOnly}
            />
          </div>

          {/* Scenery Grid — scales to 8-12 scenes seamlessly */}
          {filteredGalleryScenes.length === 0 ? (
            <div className="p-8 text-center glass rounded-tile my-4">
              <Heart className="h-8 w-8 text-ink-500/40 mx-auto mb-2" />
              <p className="font-sans text-body text-ink-700 font-medium">No favorites saved yet</p>
              <p className="font-sans text-small text-ink-500 mt-1">
                Click the heart on any space to add it to your favorites.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pr-1"
              role="listbox"
              aria-label="Available scenes"
            >
              {filteredGalleryScenes.map((scene, idx) => {
                const isActive = scene.id === activeSceneId;
                const isFav = favoriteSceneIds.includes(scene.id);

                return (
                  <button
                    key={scene.id}
                    ref={el => {
                      galleryCardRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelectScene(scene, true)}
                    onMouseEnter={() => preloadSceneImage(scene.id)}
                    onFocus={() => preloadSceneImage(scene.id)}
                    onKeyDown={e => handleGalleryKeyDown(e, idx)}
                    className={`group relative flex flex-col rounded-tile overflow-hidden text-left transition-all p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isActive
                        ? 'bg-glass-strong ring-2 ring-accent shadow-lift'
                        : 'glass hover:glass-strong hover:scale-[1.02]'
                    }`}
                  >
                    {/* Scene Image Preview */}
                    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-ink-900/10 mb-2">
                      <img
                        src={scene.sources.thumb}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Active checkmark badge */}
                      {isActive && (
                        <div
                          className="absolute top-2 left-2 h-6 w-6 rounded-full bg-accent text-surface flex items-center justify-center shadow-md"
                          aria-label="Active scene"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Favorite heart toggle button */}
                      <button
                        type="button"
                        onClick={e => handleToggleFavorite(scene.id, e)}
                        aria-label={isFav ? `Remove ${scene.name} from favorites` : `Add ${scene.name} to favorites`}
                        aria-pressed={isFav}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full glass hover:glass-strong flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isFav ? 'fill-accent text-accent' : 'text-ink-700'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between gap-1.5 w-full px-0.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-body text-ink-900 font-medium group-hover:text-accent transition-colors truncate">
                          {scene.name}
                        </h3>
                        <p className="font-sans text-micro text-ink-500 capitalize truncate">
                          {scene.timeOfDay} · {scene.ambientSuggestion}
                        </p>
                      </div>

                      {isActive && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-sans text-[10px] font-semibold tracking-wider">
                          ACTIVE
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
    </>
  );
};

export default SceneryCard;
