# Credits & Attributions

Purrfocus is crafted with care using open web standards, procedural Web Audio synthesis, and cozy design aesthetics.

---

## Audio & Procedural Soundscapes

### Procedural Web Audio Synthesis
- **Brown Noise Generator (`src/features/audio/ambient/sources/brownNoise.ts`)**:
  - Pure procedural synthesis generating a continuous 4-second audio buffer using a digital leaky integrator filter:
    $$y[n] = 0.98 \cdot y[n-1] + 0.02 \cdot x[n]$$
    where $x[n]$ is uniform white noise. Output is normalized and clamped to $[-1, 1]$ to create warm, deep background rumble without network audio requests.
- **Rainfall Soundscape (`src/features/audio/ambient/sources/rain.ts`)**:
  - Two-stage synthesis combining white noise passed through a Biquad bandpass filter ($1200$ Hz, $Q = 0.7$) with a lookahead droplet scheduler synthesizing soft resonant droplet impulses ($1800$ Hz, $40$ms exponential decay).
- **Soft Piano Progression (`src/features/audio/ambient/sources/softPiano.ts`)**:
  - Procedural 16-second pentatonic progression loop ($E\flat_3, F_3, A\flat_3, B\flat_3, C_4$) generated with paired triangle and sine wave oscillators.
  - Spatial warmth achieved via a simulated feedback delay reverb network ($350$ms delay line, $0.25$ feedback gain).

### Audio Libraries
- **Howler.js (`howler`)**:
  - Created by James Simpson & Goldfire Studios (MIT License). Used for local file uploads and seamless audio layer streaming.

---

## Typography & Icons

- **Fraunces**: Variable optical serif typeface designed by Phaedra Charles and Flavia Zimbardi (SIL Open Font License).
- **Plus Jakarta Sans**: Geometric sans-serif designed by Gumpita Rahayu and Tokotype (SIL Open Font License).
- **JetBrains Mono**: Monospaced typeface designed by Philipp Nurullin and JetBrains (SIL Open Font License).
- **Lucide Icons**: Community-crafted icon library based on Feather Icons (ISC License).

---

## Artwork & Aesthetics

- Atmospheric scenery pixel art and cat companion illustrations inspired by classic lo-fi study livestreams and cozy aesthetic games.
- **Cat Companion Poses (Placeholder Sets)**:
  - **Mochi (`src/assets/cat/placeholder/`)**: Cream Tabby companion pose SVGs (idle, study, break, pet, play, treat, celebrate, sleepy, gentle).
  - **Chai (`src/assets/cat/chai/`)**: Warm Calico companion pose SVGs with warm orange, cream, and dark patches. Placeholder SVG asset set created for companion customizer.
- **Companion Accessories & Outfits (`src/components/cat/CatAccessory.tsx`)**:
  - Procedural vector SVG layers for Wire Glasses, Cozy Knit Scarf, Slouchy Beanie, Silk Ribbon Bow, and Studio Headphones matching Mochi's cream tabby and Chai's warm calico palettes, dynamic across standard, stretch, and nap poses.
