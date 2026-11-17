export type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

/**
 * Parse hex or rgb/rgba color string into RGBA object.
 */
export function parseColor(input: string): RGBA {
  const str = input.trim().toLowerCase();

  // Hex: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3 && hex[0] && hex[1] && hex[2]) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 4 && hex[0] && hex[1] && hex[2] && hex[3]) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbaMatch = str.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/,
  );
  if (rgbaMatch && rgbaMatch[1] && rgbaMatch[2] && rgbaMatch[3]) {
    return {
      r: parseFloat(rgbaMatch[1]),
      g: parseFloat(rgbaMatch[2]),
      b: parseFloat(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  throw new Error(`Unsupported color format: "${input}"`);
}

/**
 * Composite a foreground color with alpha over an opaque background color.
 */
export function compositeOver(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };

  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
}

/**
 * Calculate WCAG 2.x relative luminance of an sRGB color.
 * L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 */
export function getRelativeLuminance(color: RGBA): number {
  const toLinear = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(color.r);
  const g = toLinear(color.g);
  const b = toLinear(color.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG 2.x contrast ratio between two colors.
 * If either color has alpha < 1, you can provide an underlying backdrop color (default #fdfbf7).
 */
export function getContrastRatio(
  foreground: string | RGBA,
  background: string | RGBA,
  backdrop: string | RGBA = '#fdfbf7',
): number {
  const backdropRgba = typeof backdrop === 'string' ? parseColor(backdrop) : backdrop;

  let bgRgba = typeof background === 'string' ? parseColor(background) : background;
  if (bgRgba.a < 1) {
    bgRgba = compositeOver(bgRgba, backdropRgba);
  }

  let fgRgba = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  if (fgRgba.a < 1) {
    fgRgba = compositeOver(fgRgba, bgRgba);
  }

  const l1 = getRelativeLuminance(fgRgba);
  const l2 = getRelativeLuminance(bgRgba);

  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (brighter + 0.05) / (darker + 0.05);
}
