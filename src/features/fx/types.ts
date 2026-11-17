export type ParticleKind = 'heart' | 'sparkle' | 'paw' | 'petal';

export type Particle = {
  id: number;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
  opacity: number;
  scale: number;
};

export type BurstOptions = {
  kind: ParticleKind;
  x: number;
  y: number;
  count?: number;
  spread?: number;
  color?: string;
  colors?: string[];
  vxRange?: [number, number];
  vyRange?: [number, number];
};
