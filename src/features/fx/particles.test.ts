import { describe, it, expect, beforeEach } from 'vitest';
import { ParticlePool, MAX_PARTICLES } from './particles';
import { getScenePetalColors, triggerCelebratePetals } from './petals';
import { fx, type FxBurstPayload } from './fx';

describe('Particle System (Pure Logic)', () => {
  let pool: ParticlePool;

  beforeEach(() => {
    pool = new ParticlePool();
  });

  describe('Budget cap and dropping excess spawns', () => {
    it('caps live particles strictly at 40 and drops spawns beyond budget', () => {
      expect(pool.getLiveCount()).toBe(0);

      // Spawn 25 hearts
      const spawnedFirst = pool.spawn({ kind: 'heart', x: 100, y: 100, count: 25 });
      expect(spawnedFirst).toBe(25);
      expect(pool.getLiveCount()).toBe(25);

      // Try to spawn 25 more; only 15 slots remaining (40 - 25)
      const spawnedSecond = pool.spawn({ kind: 'sparkle', x: 200, y: 200, count: 25 });
      expect(spawnedSecond).toBe(15);
      expect(pool.getLiveCount()).toBe(MAX_PARTICLES); // exactly 40

      // Any further spawn is dropped (returns 0)
      const dropped = pool.spawn({ kind: 'paw', x: 300, y: 300, count: 5 });
      expect(dropped).toBe(0);
      expect(pool.getLiveCount()).toBe(MAX_PARTICLES);
    });
  });

  describe('Lifetime expiry and stepping', () => {
    it('removes particles after their lifetime expires', () => {
      pool.spawn({ kind: 'sparkle', x: 50, y: 50, count: 5 });
      expect(pool.getLiveCount()).toBe(5);

      // Step physics forward by 0.5s: particles still alive
      const countMid = pool.step(0.5);
      expect(countMid).toBe(5);

      // Step physics forward by 2.0s (total 2.5s): sparkles (maxLife ~1.4s) have expired
      const countEnd = pool.step(2.0);
      expect(countEnd).toBe(0);
      expect(pool.getLiveCount()).toBe(0);
    });

    it('stepping with zero particles returns 0 immediately', () => {
      expect(pool.step(0.16)).toBe(0);
    });

    it('applies physics sway and opacity envelope during lifetime', () => {
      pool.spawn({ kind: 'heart', x: 100, y: 200, count: 1 });
      const [initial] = pool.getLiveParticles();
      expect(initial).toBeDefined();
      if (!initial) return;

      const initialY = initial.y;

      // Step by 0.1s
      pool.step(0.1);
      const [stepped] = pool.getLiveParticles();
      expect(stepped).toBeDefined();
      if (!stepped) return;

      // y moved up (negative vy), opacity faded in
      expect(stepped.y).toBeLessThan(initialY);
      expect(stepped.opacity).toBeGreaterThan(0);
      expect(stepped.x).not.toBeNaN();
      expect(stepped.y).not.toBeNaN();
    });
  });

  describe('Reduced motion handling', () => {
    it('is a strict no-op when reduced motion is true', () => {
      pool.setReducedMotion(true);

      const spawned = pool.spawn({ kind: 'heart', x: 100, y: 100, count: 10 });
      expect(spawned).toBe(0);
      expect(pool.getLiveCount()).toBe(0);
    });

    it('honors isReducedMotion override flag', () => {
      const spawned = pool.spawn({ kind: 'petal', x: 100, y: 100, count: 5 }, true);
      expect(spawned).toBe(0);
      expect(pool.getLiveCount()).toBe(0);
    });
  });

  describe('Scene petal palette mapping', () => {
    it('returns tailored palettes for scene token sets and ids', () => {
      const peachColors = getScenePetalColors('peach');
      expect(peachColors).toBeDefined();
      expect(peachColors.length).toBeGreaterThan(2);

      const gardenColors = getScenePetalColors('garden');
      expect(gardenColors).not.toEqual(peachColors);

      const rainColors = getScenePetalColors('scene1');
      expect(rainColors).toBeDefined();

      const defaultColors = getScenePetalColors('unknown');
      expect(defaultColors).toBeDefined();
    });

    it('triggers celebrate petals across provided rectangle bounds', () => {
      const received: FxBurstPayload[] = [];
      const unsub = fx.on('burst', payload => {
        received.push(payload);
      });

      triggerCelebratePetals(
        { left: 100, top: 200, width: 300, height: 400 },
        'garden',
      );

      expect(received.length).toBe(16); // 16 petals
      expect(received[0]?.kind).toBe('petal');
      // Starts slightly above card top (200)
      expect(received[0]?.y).toBeLessThan(200);

      unsub();
    });
  });
});
