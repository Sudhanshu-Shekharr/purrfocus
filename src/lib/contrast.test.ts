import { describe, it, expect } from 'vitest';
import { getContrastRatio, parseColor, getRelativeLuminance } from './contrast';

describe('WCAG 2.x Contrast Calculation', () => {
  it('correctly calculates known color pairs', () => {
    // Pure black and pure white
    const blackWhite = getContrastRatio('#000000', '#ffffff');
    expect(blackWhite).toBeCloseTo(21, 1);

    // Identical colors
    const same = getContrastRatio('#3d3a35', '#3d3a35');
    expect(same).toBeCloseTo(1, 2);
  });

  it('correctly computes relative luminance', () => {
    expect(getRelativeLuminance(parseColor('#000000'))).toBe(0);
    expect(getRelativeLuminance(parseColor('#ffffff'))).toBe(1);
  });
});

describe('Scenic Backgrounds Contrast Audit (§5, §9.2)', () => {
  // Common design tokens from tokens.css
  const tokens = {
    ink900: '#3d3a35',
    ink700: '#5b534b',
    ink500: '#6b5f55',
    accent: '#8b5e3c',
    glassBgStrong: 'rgba(255, 250, 244, 0.88)',
    baseBackdrop: '#fdfbf7',
  };

  // Scene definitions from scenes.css (day and night/twilight palettes)
  const scenes = [
    {
      name: 'peach',
      sceneTint: 'rgba(246, 210, 185, 0.30)',
      glassBg: 'rgba(255, 252, 248, 0.88)',
    },
    {
      name: 'garden',
      sceneTint: 'rgba(195, 215, 190, 0.28)',
      glassBg: 'rgba(252, 254, 250, 0.88)',
    },
    {
      name: 'rain',
      sceneTint: 'rgba(180, 195, 215, 0.32)',
      glassBg: 'rgba(250, 252, 255, 0.88)',
    },
    {
      name: 'midnight',
      sceneTint: 'rgba(175, 185, 220, 0.28)',
      glassBg: 'rgba(253, 253, 255, 0.90)',
    },
    {
      name: 'nocturne',
      sceneTint: 'rgba(170, 180, 215, 0.28)',
      glassBg: 'rgba(253, 253, 255, 0.90)',
    },
  ];

  scenes.forEach(scene => {
    describe(`Scene: ${scene.name}`, () => {
      it('ink-900 on glass-bg meets WCAG AA normal text (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.ink900, scene.glassBg, tokens.baseBackdrop);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('ink-700 on glass-bg meets WCAG AA normal text (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.ink700, scene.glassBg, tokens.baseBackdrop);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('ink-500 on glass-bg-strong meets WCAG AA normal text (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.ink500, tokens.glassBgStrong, tokens.baseBackdrop);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('accent on glass-bg meets WCAG AA large text/controls (>= 3.0:1)', () => {
        const ratio = getContrastRatio(tokens.accent, scene.glassBg, tokens.baseBackdrop);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });

      it('timer digits (ink-900) on glass-bg meets WCAG AA large text (>= 3.0:1)', () => {
        const ratio = getContrastRatio(tokens.ink900, scene.glassBg, tokens.baseBackdrop);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });
});
