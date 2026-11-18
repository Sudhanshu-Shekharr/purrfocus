/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          focus: 'var(--accent-focus)',
        },
        blush: {
          strong: 'var(--blush-strong)',
        },
        surface: 'var(--surface)',
        glass: {
          DEFAULT: 'var(--glass-bg)',
          strong: 'var(--glass-bg-strong)',
          border: 'var(--glass-border)',
        },
        success: {
          DEFAULT: 'var(--success)',
          surface: 'var(--success-surface)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          surface: 'var(--warning-surface)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          surface: 'var(--danger-surface)',
        },
      },
      borderRadius: {
        card: 'var(--r-card)',
        tile: 'var(--r-tile)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        pop: 'var(--shadow-pop)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: [
          '"DM Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        display: ['clamp(3rem, 6vw, 5.25rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        hero: ['var(--fs-hero)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        title: ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        small: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.18em' }],
        timer: [
          'clamp(6rem, 12vw, 10rem)',
          { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '300' },
        ],
      },
      transitionTimingFunction: {
        soft: 'var(--ease-soft)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      zIndex: {
        base: 'var(--z-base)',
        card: 'var(--z-card)',
        header: 'var(--z-header)',
        popover: 'var(--z-popover)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
};
