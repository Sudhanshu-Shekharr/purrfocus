import { describe, it, expect } from 'vitest';
import { getContrastRatio, parseColor, getRelativeLuminance, compositeOver } from './contrast';

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
    accentFocus: '#f6ad7b',
    surface: '#faf6f0',
    heroScrim: 'rgba(61, 58, 53, 0.75)',
    glassBgStrong: 'rgba(255, 250, 244, 0.88)',
    baseBackdrop: '#fdfbf7',
  };

  // Scene definitions from scenes.css (day and night/twilight palettes)
  const scenes = [
    {
      name: 'peach',
      sceneTint: 'rgba(246, 210, 185, 0.30)',
      sceneOverlay: 'rgba(61, 40, 30, 0.16)',
      glassBg: 'rgba(255, 252, 248, 0.88)',
    },
    {
      name: 'garden',
      sceneTint: 'rgba(195, 215, 190, 0.28)',
      sceneOverlay: 'rgba(38, 48, 35, 0.14)',
      glassBg: 'rgba(252, 254, 250, 0.88)',
    },
    {
      name: 'rain',
      sceneTint: 'rgba(180, 195, 215, 0.32)',
      sceneOverlay: 'rgba(35, 45, 65, 0.18)',
      glassBg: 'rgba(250, 252, 255, 0.88)',
    },
    {
      name: 'midnight',
      sceneTint: 'rgba(175, 185, 220, 0.28)',
      sceneOverlay: 'rgba(35, 38, 55, 0.16)',
      glassBg: 'rgba(253, 253, 255, 0.90)',
    },
    {
      name: 'nocturne',
      sceneTint: 'rgba(170, 180, 215, 0.28)',
      sceneOverlay: 'rgba(30, 34, 52, 0.16)',
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

      it('hero headline rotating text (surface) on hero scrim meets WCAG AA normal text (>= 4.5:1)', () => {
        const withTint = compositeOver(parseColor(scene.sceneTint), parseColor(tokens.baseBackdrop));
        const withOverlay = compositeOver(parseColor(scene.sceneOverlay), withTint);
        const heroBg = compositeOver(parseColor(tokens.heroScrim), withOverlay);
        const ratio = getContrastRatio(tokens.surface, heroBg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('hero headline accent ("focus.", accent-focus) on hero scrim meets WCAG AA large text (>= 3.0:1)', () => {
        const withTint = compositeOver(parseColor(scene.sceneTint), parseColor(tokens.baseBackdrop));
        const withOverlay = compositeOver(parseColor(scene.sceneOverlay), withTint);
        const heroBg = compositeOver(parseColor(tokens.heroScrim), withOverlay);
        const ratio = getContrastRatio(tokens.accentFocus, heroBg);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });
});
