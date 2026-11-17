import type { AmbientLayerId, LayerKind } from './types';

export interface AmbientLayerDefinition {
  id: AmbientLayerId;
  label: string;
  kind: LayerKind;
  iconName: 'piano' | 'rain' | 'wave' | 'music';
  sceneSuggestionKey: string;
  description: string;
}

export const PRESET_LAYERS: readonly AmbientLayerDefinition[] = [
  {
    id: 'soft-piano',
    label: 'Soft piano',
    kind: 'synth',
    iconName: 'piano',
    sceneSuggestionKey: 'soft-piano',
    description: 'Slow pentatonic loop with warm sine harmonics',
  },
  {
    id: 'rainfall',
    label: 'Rainfall',
    kind: 'synth',
    iconName: 'rain',
    sceneSuggestionKey: 'rainfall',
    description: 'Filtered rain noise with gentle sparse droplets',
  },
  {
    id: 'brown-noise',
    label: 'Brown noise',
    kind: 'synth',
    iconName: 'wave',
    sceneSuggestionKey: 'brown-noise',
    description: 'Deep, integrated noise for calming background focus',
  },
] as const;

export function getLayerDefinition(id: AmbientLayerId): AmbientLayerDefinition | undefined {
  return PRESET_LAYERS.find(layer => layer.id === id);
}
