import React, { useEffect, useRef } from 'react';
import { fx, type FxBurstPayload } from './fx';
import { particlePool } from './particles';
import type { Particle } from './types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function drawHeart(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color;
  const s = size / 24;
  ctx.beginPath();
  ctx.moveTo(0, s * -4);
  ctx.bezierCurveTo(s * -12, s * -18, s * -24, s * 2, 0, s * 18);
  ctx.bezierCurveTo(s * 24, s * 2, s * 12, s * -18, 0, s * -4);
  ctx.fill();
}

function drawSparkle(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color;
  const r = size * 0.5;
  const inner = r * 0.25;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const nextAngle = angle + Math.PI / 4;
    if (i === 0) {
      ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    } else {
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.lineTo(Math.cos(nextAngle) * inner, Math.sin(nextAngle) * inner);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPaw(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color;
  const s = size / 24;
  // Main pad
  ctx.beginPath();
  ctx.ellipse(0, s * 3, s * 7, s * 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 toe beans
  const toeOffsets = [
    { x: -6.5, y: -4, rx: 2.2, ry: 3, rot: -0.35 },
    { x: -2.3, y: -7, rx: 2.3, ry: 3.2, rot: -0.1 },
    { x: 2.3, y: -7, rx: 2.3, ry: 3.2, rot: 0.1 },
    { x: 6.5, y: -4, rx: 2.2, ry: 3, rot: 0.35 },
  ];
  for (const t of toeOffsets) {
    ctx.beginPath();
    ctx.ellipse(t.x * s, t.y * s, t.rx * s, t.ry * s, t.rot, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPetal(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color;
  const w = size * 0.45;
  const h = size * 0.85;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function renderParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  if (p.opacity <= 0.001 || p.scale <= 0.001) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(p.scale, p.scale);
  ctx.globalAlpha = p.opacity;

  switch (p.kind) {
    case 'heart':
      drawHeart(ctx, p.size, p.color);
      break;
    case 'sparkle':
      drawSparkle(ctx, p.size, p.color);
      break;
    case 'paw':
      drawPaw(ctx, p.size, p.color);
      break;
    case 'petal':
      drawPetal(ctx, p.size, p.color);
      break;
  }

  ctx.restore();
}

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const animFrameRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    particlePool.setReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
      ctx.scale(dpr, dpr);
    };

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 100);
    };

    resizeCanvas();
    window.addEventListener('resize', handleResize);

    const stepLoop = (timestamp: number) => {
      if (!isLoopRunningRef.current) return;

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const liveCount = particlePool.step(dt);

      // Render frame
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const live = particlePool.getLiveParticles();
      for (let i = 0; i < live.length; i++) {
        const p = live[i];
        if (p) renderParticle(ctx, p);
      }

      if (liveCount > 0 && !document.hidden) {
        animFrameRef.current = requestAnimationFrame(stepLoop);
      } else {
        // Halt loop when zero live particles
        isLoopRunningRef.current = false;
        animFrameRef.current = null;
        lastTimeRef.current = 0;
      }
    };

    const startLoop = () => {
      if (isLoopRunningRef.current || document.hidden || prefersReducedMotion) return;
      isLoopRunningRef.current = true;
      lastTimeRef.current = 0;
      animFrameRef.current = requestAnimationFrame(stepLoop);
    };

    const stopLoop = () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      isLoopRunningRef.current = false;
      lastTimeRef.current = 0;
    };

    // Burst listener from global event bus
    const unsubscribeBurst = fx.on('burst', (payload: FxBurstPayload) => {
      if (prefersReducedMotion) return;
      const spawned = particlePool.spawn(payload, prefersReducedMotion);
      if (spawned > 0) {
        startLoop();
      }
    });

    // Visibility change listener: pause loop when hidden, resume on show if particles remain
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else if (particlePool.getLiveCount() > 0) {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeBurst();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      stopLoop();
      particlePool.clear();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[250]"
      aria-hidden="true"
    />
  );
};

export default ParticleCanvas;
