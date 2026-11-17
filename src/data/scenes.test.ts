import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SCENES, DEFAULT_SCENE_ID, VALID_SCENE_IDS, getSceneById } from './scenes';

describe('scenes catalog data integrity', () => {
  it('contains exactly five scenes', () => {
    expect(SCENES).toHaveLength(5);
    expect(VALID_SCENE_IDS).toHaveLength(5);
  });

  it('has unique IDs for every scene', () => {
    const ids = SCENES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('provides all 3 source URLs (sm, md, thumb) for each scene', () => {
    for (const scene of SCENES) {
      expect(scene.sources.thumb).toBeDefined();
      expect(scene.sources.thumb).toMatch(/\.webp$/);
      expect(scene.sources.sm).toBeDefined();
      expect(scene.sources.sm).toMatch(/\.webp$/);
      expect(scene.sources.md).toBeDefined();
      expect(scene.sources.md).toMatch(/\.webp$/);
    }
  });

  it('has a valid tokenSet that exists in scenes.css for every scene', () => {
    const scenesCssPath = path.resolve(process.cwd(), 'src/styles/scenes.css');
    const cssContent = fs.readFileSync(scenesCssPath, 'utf-8');

    for (const scene of SCENES) {
      expect(scene.tokenSet).toBeTruthy();
      // Ensure [data-scene='tokenSet'] or :root exists in scenes.css
      const pattern = new RegExp(`\\[data-scene=['"]?${scene.tokenSet}['"]?\\]`);
      expect(cssContent).toMatch(pattern);
    }
  });

  it('has a valid atmospheric fallbackGradient for each scene', () => {
    for (const scene of SCENES) {
      expect(scene.fallbackGradient).toBeDefined();
      expect(scene.fallbackGradient).toMatch(/linear-gradient/);
    }
  });

  it('has the default scene present and resolvable', () => {
    expect(VALID_SCENE_IDS).toContain(DEFAULT_SCENE_ID);
    const defaultScene = getSceneById(DEFAULT_SCENE_ID);
    expect(defaultScene.id).toBe(DEFAULT_SCENE_ID);
    expect(defaultScene.tokenSet).toBe('peach');
  });

  it('falls back gracefully to default scene if an unknown id is requested', () => {
    const fallback = getSceneById('unknown-xyz');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(SCENES[0]?.id);
  });
});
