import type { Particle, ParticleKind, BurstOptions } from './types';

export const MAX_PARTICLES = 40;

const DEFAULT_HEART_COLORS = ['#FF6B81', '#FF758F', '#FF4D6D', '#FF8FA3', '#FFB3C1'];
const DEFAULT_SPARKLE_COLORS = ['#FFD166', '#FFE29A', '#F9C74F', '#FFF3B0'];
const DEFAULT_PAW_COLORS = ['#B08968', '#7F5539', '#9C6644'];
const DEFAULT_PETAL_COLORS = ['#F4A261', '#E76F51', '#F8BBD0', '#FFD1B3'];

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export class ParticlePool {
  private particles: Particle[] = [];
  private nextId = 1;
  private readonly maxParticles: number;
  private reducedMotion: boolean;

  constructor(options: { maxParticles?: number; reducedMotion?: boolean } = {}) {
    this.maxParticles = options.maxParticles ?? MAX_PARTICLES;
    this.reducedMotion = options.reducedMotion ?? false;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public getLiveCount(): number {
    return this.particles.length;
  }

  public getLiveParticles(): readonly Particle[] {
    return this.particles;
  }

  public clear(): void {
    this.particles = [];
  }

  /**
   * Spawn particles up to the maximum budget of 40.
   * If reduced motion is active, spawn is a strict no-op.
   * Particles that exceed the budget are dropped (not queued).
   */
  public spawn(opts: BurstOptions, isReducedMotion?: boolean): number {
    const reduced = isReducedMotion !== undefined ? isReducedMotion : this.reducedMotion;
    if (reduced) {
      return 0;
    }

    const count = opts.count ?? (opts.kind === 'petal' ? 16 : opts.kind === 'paw' ? 1 : 5);
    const availableSlots = this.maxParticles - this.particles.length;
    if (availableSlots <= 0) {
      return 0; // Budget exhausted: drop spawn
    }

    const toSpawn = Math.min(count, availableSlots);
    const spread = opts.spread ?? 24;

    for (let i = 0; i < toSpawn; i++) {
      const offsetX = randomRange(-spread, spread);
      const offsetY = randomRange(-spread, spread);
      const particle = this.createParticle(opts.kind, opts.x + offsetX, opts.y + offsetY, opts);
      this.particles.push(particle);
    }

    return toSpawn;
  }

  private createParticle(
    kind: ParticleKind,
    x: number,
    y: number,
    opts: BurstOptions,
  ): Particle {
    const id = this.nextId++;

    switch (kind) {
      case 'heart': {
        const color = opts.color ?? pickRandom(opts.colors ?? DEFAULT_HEART_COLORS);
        return {
          id,
          kind,
          x,
          y,
          vx: randomRange(-25, 25),
          vy: randomRange(-75, -110), // gently floats up
          size: randomRange(14, 22),
          rotation: randomRange(-0.2, 0.2),
          vRot: randomRange(-0.3, 0.3),
          life: 0,
          maxLife: randomRange(1.4, 1.8),
          color,
          opacity: 0,
          scale: 0.6,
        };
      }

      case 'sparkle': {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(40, 95);
        const color = opts.color ?? pickRandom(opts.colors ?? DEFAULT_SPARKLE_COLORS);
        return {
          id,
          kind,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: randomRange(10, 18),
          rotation: randomRange(0, Math.PI),
          vRot: randomRange(2.5, 5.0),
          life: 0,
          maxLife: randomRange(1.1, 1.4),
          color,
          opacity: 0,
          scale: 0.5,
        };
      }

      case 'paw': {
        const color = opts.color ?? pickRandom(opts.colors ?? DEFAULT_PAW_COLORS);
        return {
          id,
          kind,
          x,
          y,
          vx: randomRange(-10, 10),
          vy: randomRange(-8, 8),
          size: randomRange(18, 26),
          rotation: randomRange(-0.3, 0.3),
          vRot: randomRange(-0.1, 0.1),
          life: 0,
          maxLife: randomRange(1.0, 1.3),
          color,
          opacity: 0,
          scale: 0.8,
        };
      }

      case 'petal': {
        const color = opts.color ?? pickRandom(opts.colors ?? DEFAULT_PETAL_COLORS);
        return {
          id,
          kind,
          x,
          y,
          vx: randomRange(-35, 35),
          vy: randomRange(45, 80), // gently falls downward
          size: randomRange(12, 18),
          rotation: randomRange(0, Math.PI * 2),
          vRot: randomRange(1.0, 2.2),
          life: 0,
          maxLife: randomRange(2.2, 2.5),
          color,
          opacity: 0,
          scale: 0.7,
        };
      }
    }
  }

  /**
   * Advance particle physics and lifetimes by dt (in seconds).
   * Returns current live particle count.
   */
  public step(dt: number): number {
    if (this.particles.length === 0) {
      return 0;
    }

    const alive: Particle[] = [];

    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.maxLife) {
        continue; // expired
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      // Kind-specific natural harmonic sway
      if (p.kind === 'heart') {
        p.x += Math.sin(p.life * 4.5) * 16 * dt;
      } else if (p.kind === 'petal') {
        p.x += Math.sin(p.life * 2.8) * 22 * dt;
      }

      // Smooth envelope for opacity and scale
      const progress = p.life / p.maxLife;

      if (progress < 0.15) {
        // Quick soft fade in
        p.opacity = progress / 0.15;
      } else if (progress > 0.65) {
        // Smooth fade out
        p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
      } else {
        p.opacity = 1;
      }

      // Scale curves
      if (p.kind === 'heart') {
        p.scale = 0.6 + Math.sin(progress * Math.PI) * 0.45;
      } else if (p.kind === 'sparkle') {
        p.scale = progress < 0.3 ? 0.5 + (progress / 0.3) * 0.7 : Math.max(0.2, 1.2 - (progress - 0.3) * 1.1);
      } else if (p.kind === 'paw') {
        p.scale = 0.8 + Math.sin(progress * Math.PI * 0.5) * 0.2;
      } else if (p.kind === 'petal') {
        p.scale = 0.7 + Math.sin(progress * Math.PI) * 0.3;
      }

      alive.push(p);
    }

    this.particles = alive;
    return this.particles.length;
  }
}

/** Global shared particle pool instance */
export const particlePool = new ParticlePool();
