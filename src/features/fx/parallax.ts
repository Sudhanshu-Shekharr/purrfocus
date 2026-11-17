export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export type ParallaxOptions = {
  focusMode?: boolean;
  reducedMotion?: boolean;
  maxClamp?: number;
};

/**
 * Pure calculation for pointer parallax offset.
 * Clamped strictly to +/-6px in normal mode, +/-2px in focus mode, and 0 in reduced motion.
 */
export function computeParallaxOffset(
  pointer: { x: number; y: number },
  cardRect: { left: number; top: number; width: number; height: number },
  options: ParallaxOptions = {},
): { x: number; y: number } {
  if (options.reducedMotion) {
    return { x: 0, y: 0 };
  }

  // Focus mode dampens to +/-2px; normal mode is +/-6px
  const limit = options.maxClamp ?? (options.focusMode ? 2 : 6);
  if (limit <= 0) return { x: 0, y: 0 };

  const centerX = cardRect.left + cardRect.width / 2;
  const centerY = cardRect.top + cardRect.height / 2;
  const radiusX = Math.max(cardRect.width / 2, 1);
  const radiusY = Math.max(cardRect.height / 2, 1);

  const normX = clamp((pointer.x - centerX) / radiusX, -1, 1);
  const normY = clamp((pointer.y - centerY) / radiusY, -1, 1);

  return {
    x: Math.round(normX * limit * 100) / 100,
    y: Math.round(normY * limit * 100) / 100,
  };
}
