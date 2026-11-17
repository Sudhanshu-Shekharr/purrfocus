import { describe, it, expect } from 'vitest';
import { computeParallaxOffset } from './parallax';

describe('computeParallaxOffset (Pure Logic)', () => {
  const cardRect = {
    left: 100,
    top: 100,
    width: 200,
    height: 200,
  };
  // Center is at (200, 200), radius is 100px in both dimensions

  it('clamps parallax offset strictly to +/-6px in default mode', () => {
    // Pointer far to the right and bottom
    const offsetFarRight = computeParallaxOffset(
      { x: 1000, y: 1000 },
      cardRect,
    );
    expect(offsetFarRight.x).toBe(6);
    expect(offsetFarRight.y).toBe(6);

    // Pointer far to the top-left
    const offsetFarLeft = computeParallaxOffset(
      { x: -500, y: -500 },
      cardRect,
    );
    expect(offsetFarLeft.x).toBe(-6);
    expect(offsetFarLeft.y).toBe(-6);

    // Pointer at exact center returns (0, 0)
    const offsetCenter = computeParallaxOffset(
      { x: 200, y: 200 },
      cardRect,
    );
    expect(offsetCenter.x).toBe(0);
    expect(offsetCenter.y).toBe(0);
  });

  it('dampens parallax offset to +/-2px during Focus Mode', () => {
    const offsetFarRight = computeParallaxOffset(
      { x: 800, y: 800 },
      cardRect,
      { focusMode: true },
    );
    expect(offsetFarRight.x).toBe(2);
    expect(offsetFarRight.y).toBe(2);

    const offsetFarLeft = computeParallaxOffset(
      { x: -100, y: -100 },
      cardRect,
      { focusMode: true },
    );
    expect(offsetFarLeft.x).toBe(-2);
    expect(offsetFarLeft.y).toBe(-2);
  });

  it('returns strictly {0, 0} under reduced motion', () => {
    const offset = computeParallaxOffset(
      { x: 500, y: 500 },
      cardRect,
      { reducedMotion: true },
    );
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);

    const offsetFocusAndReduced = computeParallaxOffset(
      { x: 800, y: 800 },
      cardRect,
      { focusMode: true, reducedMotion: true },
    );
    expect(offsetFocusAndReduced.x).toBe(0);
    expect(offsetFocusAndReduced.y).toBe(0);
  });

  it('proportional mapping for intermediate pointer positions', () => {
    // Pointer halfway between center and right edge: (250, 200) -> normalized x = 0.5
    const halfOffset = computeParallaxOffset(
      { x: 250, y: 200 },
      cardRect,
    );
    expect(halfOffset.x).toBe(3);
    expect(halfOffset.y).toBe(0);
  });
});
