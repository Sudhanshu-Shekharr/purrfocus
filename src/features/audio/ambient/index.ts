import { ambientEngine } from './engine';

export * from './types';
export * from './store';
export * from './engine';
export * from './layers';
export * from './sources';

export function registerDefaultSources(engine = ambientEngine): void {
  engine.registerDefaultSources();
}

// Auto-register default presets on singleton
registerDefaultSources(ambientEngine);
