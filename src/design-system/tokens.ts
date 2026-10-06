/**
 * LAKNES Design Tokens
 * 
 * Strict visual parameters inspired by Stripe, Linear, Notion, and modern financial platforms:
 * - Pure white background (#ffffff)
 * - Near-black content (#09090b)
 * - Minimal hairline borders (neutral-200)
 * - Zero static pill enclosures (anti-slop rule)
 * - Tabular numerals for all quantitative & blockchain displays
 */

export const TOKENS = {
  colors: {
    // Primary Canvas & Surfaces
    canvas: '#ffffff',
    surfaceSubtle: '#fafafa',
    surfaceMuted: '#f4f4f5',
    surfaceElevated: '#ffffff',

    // Hairline Borders
    borderSubtle: '#e4e4e7',
    borderMuted: '#f4f4f5',
    borderStrong: '#a1a1aa',

    // Typography
    textPrimary: '#09090b',
    textSecondary: '#52525b',
    textTertiary: '#71717a',
    textDisabled: '#a1a1aa',

    // Brand Accent (Restrained, used strictly for high-intent actions)
    accent: '#09090b',
    accentHover: '#27272a',
    accentForeground: '#ffffff',

    // Semantic Status (Strictly functional, never neon)
    success: '#15803d', // accessible green 700
    successBg: '#f0fdf4',
    successBorder: '#bbf7d0',

    warning: '#b45309', // amber 700
    warningBg: '#fffbeb',
    warningBorder: '#fde68a',

    danger: '#b91c1c', // red 700
    dangerBg: '#fef2f2',
    dangerBorder: '#fecaca',

    info: '#0369a1', // sky 700
    infoBg: '#f0f9ff',
    infoBorder: '#bae6fd',

    // Official LAKNES Brand Kit (derived from uploaded logo)
    brandIris: '#6366F1',
    brandViolet: '#7C3AED',
    brandCyan: '#38BDF8',
    brandIndigo: '#4F46E5',
    brandGradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #38BDF8 100%)',
    brandSoftWash: 'rgba(99, 102, 241, 0.05)',
  },

  typography: {
    fontSans: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
    fontMono: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontBrand: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
    scale: {
      display: 'text-3xl font-semibold tracking-tight sm:text-4xl text-neutral-900',
      titleLarge: 'text-2xl font-semibold tracking-tight text-neutral-900',
      titleMedium: 'text-xl font-medium tracking-tight text-neutral-900',
      titleSmall: 'text-base font-semibold text-neutral-900',
      bodyLarge: 'text-base leading-relaxed text-neutral-600',
      body: 'text-sm leading-normal text-neutral-600',
      caption: 'text-xs text-neutral-500',
      label: 'text-xs font-medium text-neutral-700',
    },
  },

  layout: {
    container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
    containerWide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    containerNarrow: 'max-w-3xl mx-auto px-4 sm:px-6',
    sectionSpacing: 'py-12 sm:py-16 lg:py-20',
  },

  transitions: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
  },
} as const;
