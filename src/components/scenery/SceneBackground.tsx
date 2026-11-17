import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSceneryStore } from '@/features/scenery/store';
import { getSceneById } from '@/data/scenes';
import type { SceneId } from '@/features/scenery/types';

type BackgroundLayerProps = {
  sceneId: SceneId;
  isExiting?: boolean;
};

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ sceneId, isExiting = false }) => {
  const scene = getSceneById(sceneId);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      data-layer-scene={sceneId}
      className={`absolute inset-0 transition-opacity duration-[800ms] ease-soft ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: scene.fallbackGradient,
      }}
    >
      {!hasError && (
        <picture className="w-full h-full block">
          <source
            media="(max-width: 960px)"
            srcSet={`${scene.sources.sm} 960w`}
            sizes="100vw"
          />
          <source
            media="(min-width: 961px)"
            srcSet={`${scene.sources.md} 1672w`}
            sizes="100vw"
          />
          <img
            src={scene.sources.md}
            srcSet={`${scene.sources.sm} 960w, ${scene.sources.md} 1672w`}
            sizes="100vw"
            alt=""
            width={1672}
            height={940}
            fetchPriority={isExiting ? 'low' : 'high'}
            loading={isExiting ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover object-center transition-opacity duration-500 ease-soft ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      )}
    </div>
  );
};

export const SceneBackground: React.FC = () => {
  const activeSceneId = useSceneryStore(state => state.activeSceneId);
  const shouldReduceMotion = useReducedMotion();

  const [currentId, setCurrentId] = useState<SceneId>(activeSceneId);
  const [outgoingId, setOutgoingId] = useState<SceneId | null>(null);
  const prevSceneIdRef = React.useRef<SceneId>(activeSceneId);

  useEffect(() => {
    if (activeSceneId === prevSceneIdRef.current) return;

    const outgoing = prevSceneIdRef.current;
    prevSceneIdRef.current = activeSceneId;

    if (shouldReduceMotion) {
      setCurrentId(activeSceneId);
      setOutgoingId(null);
      return;
    }

    setOutgoingId(outgoing);
    setCurrentId(activeSceneId);

    const timer = setTimeout(() => {
      setOutgoingId(null);
    }, 800);

    return () => clearTimeout(timer);
  }, [activeSceneId, shouldReduceMotion]);

  return (
    <div
      aria-hidden="true"
      data-testid="scene-background"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-base"
    >
      {/* Stacked scene layers for crossfade */}
      {outgoingId && <BackgroundLayer key={`outgoing-${outgoingId}`} sceneId={outgoingId} isExiting />}
      <BackgroundLayer key={`current-${currentId}`} sceneId={currentId} />

      {/* Dynamic scene overlay tint */}
      <div
        className="absolute inset-0 transition-colors duration-[800ms] ease-soft"
        style={{ backgroundColor: 'var(--scene-overlay)' }}
      />

      {/* Ambient vignette for header & footer contrast preservation */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 16, 14, 0.22) 0%, rgba(20, 16, 14, 0.02) 20%, rgba(20, 16, 14, 0.02) 80%, rgba(20, 16, 14, 0.28) 100%)',
        }}
      />
    </div>
  );
};

export default SceneBackground;
