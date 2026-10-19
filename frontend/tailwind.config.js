/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

/**
 * PUSULA semantic colour tokens (see src/styles/variables.css and themes.css).
 * Role-specific values (primary, ink, accent, banner, sidebar, ring, chart.emphasis) follow data-role on <body>;
 * everything else is shared by all roles.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: token('--background'),
        foreground: token('--foreground'),
        surface: {
          DEFAULT: token('--surface'),
          muted: token('--surface-muted'),
          elevated: token('--surface-elevated'),
        },
        'muted-foreground': token('--muted-foreground'),
        border: token('--border'),
        input: token('--input'),
        field: token('--field'),
        ring: token('--ring'),
        overlay: token('--overlay'),

        /* Role identity */
        primary: {
          DEFAULT: token('--primary'),
          hover: token('--primary-hover'),
          foreground: token('--primary-foreground'),
        },
        ink: {
          DEFAULT: token('--ink'),
          foreground: token('--ink-foreground'),
          violet: token('--ink-violet'),
          mint: token('--ink-mint'),
          peach: token('--ink-peach'),
          sky: token('--ink-sky'),
          amber: token('--ink-amber'),
        },
        accent: {
          DEFAULT: token('--accent'),
          soft: token('--accent-soft'),
          ink: token('--accent-ink'),
        },
        banner: {
          from: token('--banner-from'),
          to: token('--banner-to'),
          ink: token('--banner-ink'),
        },
        sidebar: {
          DEFAULT: token('--sidebar'),
          2: token('--sidebar-2'),
          foreground: token('--sidebar-foreground'),
          muted: token('--sidebar-muted'),
          hover: token('--sidebar-hover'),
          border: token('--sidebar-border'),
          hill: token('--sidebar-hill'),
        },

        /* Shared highlight */
        lime: {
          DEFAULT: token('--lime'),
          foreground: token('--lime-foreground'),
          soft: token('--lime-soft'),
          ink: token('--lime-ink'),
        },
        tint: {
          violet: token('--tint-violet'),
          mint: token('--tint-mint'),
          peach: token('--tint-peach'),
          sky: token('--tint-sky'),
        },
        achievement: {
          DEFAULT: token('--achievement'),
          ink: token('--achievement-ink'),
          soft: token('--achievement-soft'),
        },
        brand: {
          violet: token('--brand-violet'),
          lime: token('--brand-lime'),
          coral: token('--brand-coral'),
          sky: token('--brand-sky'),
          teal: token('--brand-teal'),
          amber: token('--brand-amber'),
        },
        success: token('--success'),
        warning: token('--warning'),
        info: token('--info'),
        danger: {
          DEFAULT: token('--danger'),
          foreground: token('--danger-foreground'),
        },
        chart: {
          1: token('--chart-1'),
          2: token('--chart-2'),
          3: token('--chart-3'),
          4: token('--chart-4'),
          5: token('--chart-5'),
          emphasis: token('--chart-emphasis'),
          grid: token('--chart-grid'),
          axis: token('--chart-axis'),
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Figtree', 'system-ui', 'sans-serif'],
        hand: ['Caveat', '"Segoe Print"', 'cursive'],
      },
      borderRadius: {
        panel: '20px',
        control: '12px',
        pill: '999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'pop-in': 'pop-in 180ms cubic-bezier(.2,.8,.2,1)',
        'rise-in': 'rise-in 500ms cubic-bezier(.2,.8,.2,1) both',
        float: 'float 7s ease-in-out infinite',
        twinkle: 'twinkle 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
