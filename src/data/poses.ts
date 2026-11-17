import type { PoseId } from '@/features/cat/types';

export type PoseDefinition = {
  id: PoseId;
  name: string;
  caption: string;
  alt: string;
  src: string;
  preloadNext?: readonly PoseId[];
};

export const POSES: Record<PoseId, PoseDefinition> = {
  idle_happy: {
    id: 'idle_happy',
    name: 'Happy & Idle',
    caption: 'a happy little cat',
    alt: 'A happy cream cat smiling calmly with curled tail',
    src: new URL('../assets/cat/placeholder/idle_happy.svg', import.meta.url).href,
    preloadNext: ['study_book', 'study_write', 'study_laptop', 'sleepy'],
  },
  study_book: {
    id: 'study_book',
    name: 'Study: Book',
    caption: 'reading beside you',
    alt: 'A focused cat wearing glasses reading an open book',
    src: new URL('../assets/cat/placeholder/study_book.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  study_write: {
    id: 'study_write',
    name: 'Study: Writing',
    caption: 'taking quiet notes',
    alt: 'A studious cat holding a pencil writing on a notepad',
    src: new URL('../assets/cat/placeholder/study_write.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  study_laptop: {
    id: 'study_laptop',
    name: 'Study: Laptop',
    caption: 'typing on a tiny laptop',
    alt: 'A busy cat typing diligently on a small laptop',
    src: new URL('../assets/cat/placeholder/study_laptop.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  break_tea: {
    id: 'break_tea',
    name: 'Short Break: Tea',
    caption: 'enjoying warm tea',
    alt: 'A relaxed cat holding a steaming mug of tea',
    src: new URL('../assets/cat/placeholder/break_tea.svg', import.meta.url).href,
    preloadNext: ['study_book', 'idle_happy'],
  },
  break_nap: {
    id: 'break_nap',
    name: 'Long Break: Nap',
    caption: 'napping between chapters',
    alt: 'A peaceful cat curled up soundly sleeping',
    src: new URL('../assets/cat/placeholder/break_nap.svg', import.meta.url).href,
    preloadNext: ['study_book', 'idle_happy'],
  },
  stretch: {
    id: 'stretch',
    name: 'Stretch Together',
    caption: 'stretching together',
    alt: 'A limber cat doing a full body stretch with front paws forward',
    src: new URL('../assets/cat/placeholder/stretch.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  pet_happy: {
    id: 'pet_happy',
    name: 'Being Petted',
    caption: 'purring with bliss',
    alt: 'A joyful cat with closed eyes and blushing cheeks enjoying soft pets',
    src: new URL('../assets/cat/placeholder/pet_happy.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  play: {
    id: 'play',
    name: 'Playful Pounce',
    caption: 'pouncing at yarn',
    alt: 'An energized cat swatting at a bright ball of yarn',
    src: new URL('../assets/cat/placeholder/play.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  treat: {
    id: 'treat',
    name: 'Tiny Treat',
    caption: 'nibbling a tiny treat',
    alt: 'A happy cat eating a golden fish cookie with crumbs',
    src: new URL('../assets/cat/placeholder/treat.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  celebrate: {
    id: 'celebrate',
    name: 'Celebration',
    caption: 'purring with pride',
    alt: 'A proud cat celebrating with sparkles and stars around its head',
    src: new URL('../assets/cat/placeholder/celebrate.svg', import.meta.url).href,
    preloadNext: ['break_tea', 'break_nap'],
  },
  sleepy: {
    id: 'sleepy',
    name: 'Sleepy Doze',
    caption: 'dozing in a warm spot',
    alt: 'A drowsy cat with heavy eyelids dozing peacefully',
    src: new URL('../assets/cat/placeholder/sleepy.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  sad_gentle: {
    id: 'sad_gentle',
    name: 'Gentle Patience',
    caption: 'waiting patiently',
    alt: 'A gentle cat with a soft understanding expression waiting patiently',
    src: new URL('../assets/cat/placeholder/sad_gentle.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
};

export const CHAI_POSES: Record<PoseId, PoseDefinition> = {
  idle_happy: {
    id: 'idle_happy',
    name: 'Happy & Idle',
    caption: 'a happy calico cat',
    alt: 'A happy calico cat with cinnamon patches smiling calmly with curled tail',
    src: new URL('../assets/cat/chai/idle_happy.svg', import.meta.url).href,
    preloadNext: ['study_book', 'study_write', 'study_laptop', 'sleepy'],
  },
  study_book: {
    id: 'study_book',
    name: 'Study: Book',
    caption: 'reading beside you',
    alt: 'A focused calico cat wearing glasses reading an open book',
    src: new URL('../assets/cat/chai/study_book.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  study_write: {
    id: 'study_write',
    name: 'Study: Writing',
    caption: 'taking quiet notes',
    alt: 'A studious calico cat holding a pencil writing on a notepad',
    src: new URL('../assets/cat/chai/study_write.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  study_laptop: {
    id: 'study_laptop',
    name: 'Study: Laptop',
    caption: 'typing on a tiny laptop',
    alt: 'A busy calico cat typing diligently on a small laptop',
    src: new URL('../assets/cat/chai/study_laptop.svg', import.meta.url).href,
    preloadNext: ['celebrate', 'break_tea'],
  },
  break_tea: {
    id: 'break_tea',
    name: 'Short Break: Tea',
    caption: 'enjoying warm tea',
    alt: 'A relaxed calico cat holding a steaming mug of tea',
    src: new URL('../assets/cat/chai/break_tea.svg', import.meta.url).href,
    preloadNext: ['study_book', 'idle_happy'],
  },
  break_nap: {
    id: 'break_nap',
    name: 'Long Break: Nap',
    caption: 'napping between chapters',
    alt: 'A peaceful calico cat curled up soundly sleeping',
    src: new URL('../assets/cat/chai/break_nap.svg', import.meta.url).href,
    preloadNext: ['study_book', 'idle_happy'],
  },
  stretch: {
    id: 'stretch',
    name: 'Stretch Together',
    caption: 'stretching together',
    alt: 'A limber calico cat doing a full body stretch with front paws forward',
    src: new URL('../assets/cat/chai/stretch.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  pet_happy: {
    id: 'pet_happy',
    name: 'Being Petted',
    caption: 'purring with bliss',
    alt: 'A joyful calico cat with closed eyes and blushing cheeks enjoying soft pets',
    src: new URL('../assets/cat/chai/pet_happy.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  play: {
    id: 'play',
    name: 'Playful Pounce',
    caption: 'pouncing at yarn',
    alt: 'An energized calico cat swatting at a bright ball of yarn',
    src: new URL('../assets/cat/chai/play.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  treat: {
    id: 'treat',
    name: 'Tiny Treat',
    caption: 'nibbling a tiny treat',
    alt: 'A happy calico cat eating a golden fish cookie with crumbs',
    src: new URL('../assets/cat/chai/treat.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  celebrate: {
    id: 'celebrate',
    name: 'Celebration',
    caption: 'purring with pride',
    alt: 'A proud calico cat celebrating with sparkles and stars around its head',
    src: new URL('../assets/cat/chai/celebrate.svg', import.meta.url).href,
    preloadNext: ['break_tea', 'break_nap'],
  },
  sleepy: {
    id: 'sleepy',
    name: 'Sleepy Doze',
    caption: 'dozing in a warm spot',
    alt: 'A drowsy calico cat with heavy eyelids dozing peacefully',
    src: new URL('../assets/cat/chai/sleepy.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
  sad_gentle: {
    id: 'sad_gentle',
    name: 'Gentle Patience',
    caption: 'waiting patiently',
    alt: 'A gentle calico cat with a soft understanding expression waiting patiently',
    src: new URL('../assets/cat/chai/sad_gentle.svg', import.meta.url).href,
    preloadNext: ['idle_happy'],
  },
};

export function getPoseDefinition(poseId: PoseId, catId: string = 'mochi'): PoseDefinition {
  const poses = catId === 'chai' ? CHAI_POSES : POSES;
  return poses[poseId] ?? poses.idle_happy ?? POSES[poseId] ?? POSES.idle_happy;
}

const preloadedUrls = new Set<string>();

/**
 * Preloads a cat pose image so transitions are instant without layout pop.
 */
export function preloadPose(poseId: PoseId, catId: string = 'mochi'): void {
  const pose = getPoseDefinition(poseId, catId);
  if (!pose || typeof window === 'undefined') return;
  if (!preloadedUrls.has(pose.src)) {
    preloadedUrls.add(pose.src);
    const img = new Image();
    img.src = pose.src;
  }
}

/**
 * Preloads the next most likely poses defined on the current pose.
 */
export function preloadNextLikelyPoses(currentPoseId: PoseId, catId: string = 'mochi'): void {
  const pose = getPoseDefinition(currentPoseId, catId);
  if (!pose?.preloadNext || typeof window === 'undefined') return;
  for (const nextId of pose.preloadNext) {
    preloadPose(nextId, catId);
  }
}
