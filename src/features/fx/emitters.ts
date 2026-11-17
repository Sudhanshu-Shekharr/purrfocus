import { fx } from './fx';
import { triggerCelebratePetals } from './petals';
import { useSceneryStore } from '@/features/scenery/store';

export function emitPetHearts(customCoords?: { x: number; y: number }): void {
  let x = customCoords?.x;
  let y = customCoords?.y;

  if (x === undefined || y === undefined) {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('cat-sprite') || document.getElementById('cat-companion-card');
      const rect = el?.getBoundingClientRect();
      if (rect) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height * 0.45;
      }
    }
  }

  if (x !== undefined && y !== undefined) {
    fx.emit('burst', {
      kind: 'heart',
      x,
      y,
      count: 6,
      spread: 24,
    });
  }
}

export function emitTreatSparkles(customCoords?: { x: number; y: number }): void {
  let x = customCoords?.x;
  let y = customCoords?.y;

  if (x === undefined || y === undefined) {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('cat-sprite') || document.getElementById('cat-companion-card');
      const rect = el?.getBoundingClientRect();
      if (rect) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height * 0.6;
      }
    }
  }

  if (x !== undefined && y !== undefined) {
    fx.emit('burst', {
      kind: 'sparkle',
      x,
      y,
      count: 8,
      spread: 28,
    });
  }
}

export function emitCelebratePetals(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('cat-companion-card') || document.getElementById('cat-sprite');
  const rect = el?.getBoundingClientRect();
  if (rect) {
    const activeSceneId = useSceneryStore.getState().activeSceneId;
    triggerCelebratePetals(rect, activeSceneId);
  }
}

export function emitPawPrint(x: number, y: number): void {
  fx.emit('burst', {
    kind: 'paw',
    x,
    y,
    count: 1,
    spread: 0,
  });
}
