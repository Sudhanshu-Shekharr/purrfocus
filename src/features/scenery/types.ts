export type SceneId = 'scene1' | 'scene2' | 'scene3' | 'scene4' | 'scene5';

export type AmbientSuggestion = 'soft-piano' | 'rainfall' | 'brown-noise';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'lateNight' | 'night';

export type SceneSources = {
  sm: string;
  md: string;
  thumb: string;
};

export type Scene = {
  id: SceneId;
  name: string;
  tokenSet: string;
  sources: SceneSources;
  fallbackGradient: string;
  ambientSuggestion?: AmbientSuggestion;
  timeOfDay?: TimeOfDay;
};
