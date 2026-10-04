export const colors = {
  light: {
    background: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F5F5F4',
    surfaceActive: '#EAEAEA',
    border: '#E7E5E4',
    borderStrong: '#D6D3D1',
    borderFocus: '#0891B2',
    textPrimary: '#0C0A09',
    textSecondary: '#57534E',
    textTertiary: '#78716C',
    textInverse: '#FAFAF9',
    textLink: '#0891B2',
    textLinkHover: '#0E7490',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryActive: '#3730A3',
    primaryLight: '#EEF2FF',
    primaryForeground: '#FFFFFF',
    secondary: '#0891B2',
    secondaryHover: '#0E7490',
    secondaryLight: '#ECFEFF',
    secondaryForeground: '#FFFFFF',
    accent: '#6366F1',
    accentLight: '#EEF2FF',
    destructive: '#DC2626',
    destructiveHover: '#B91C1C',
    destructiveLight: '#FEF2F2',
    destructiveForeground: '#FFFFFF',
    success: '#16A34A',
    successLight: '#F0FDF4',
    successForeground: '#FFFFFF',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    warningForeground: '#FFFFFF',
    overlay: 'rgba(12,10,9,0.5)',
    overlayStrong: 'rgba(12,10,9,0.75)',
    ambientLight: 'rgba(8,145,178,0.06)',
    ambientGlow: 'rgba(79,70,229,0.04)',
    deepShadow: 'rgba(12,10,9,0.06)',
    surfaceShadow: 'rgba(12,10,9,0.08)',
    skeletonBase: '#E7E5E4',
    skeletonHighlight: '#F5F5F4',
    online: '#16A34A',
    onlineLight: '#DCFCE7',
    away: '#D97706',
    busy: '#DC2626',
  },
  dark: {
    background: '#0A0A0B',
    surface: '#131316',
    surfaceElevated: '#1C1C21',
    surfaceHover: '#25252B',
    surfaceActive: '#2E2E36',
    border: '#27272A',
    borderStrong: '#3A3A44',
    borderFocus: '#22D3EE',
    textPrimary: '#FAFAF9',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    textInverse: '#0A0A0B',
    textLink: '#67E8F9',
    textLinkHover: '#A5F3FC',
    primary: '#6366F1',
    primaryHover: '#818CF8',
    primaryActive: '#4F46E5',
    primaryLight: '#1E1B4B',
    primaryForeground: '#FFFFFF',
    secondary: '#06B6D4',
    secondaryHover: '#22D3EE',
    secondaryLight: '#0C2D3D',
    secondaryForeground: '#FFFFFF',
    accent: '#8B5CF6',
    accentLight: '#1E1040',
    destructive: '#EF4444',
    destructiveHover: '#F87171',
    destructiveLight: '#2D1515',
    destructiveForeground: '#FFFFFF',
    success: '#22C55E',
    successLight: '#0D2E1A',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningLight: '#2D2010',
    warningForeground: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.7)',
    overlayStrong: 'rgba(0,0,0,0.85)',
    ambientLight: 'rgba(6,182,212,0.06)',
    ambientGlow: 'rgba(99,102,241,0.04)',
    deepShadow: 'rgba(0,0,0,0.5)',
    surfaceShadow: 'rgba(0,0,0,0.4)',
    skeletonBase: '#27272A',
    skeletonHighlight: '#3A3A44',
    online: '#22C55E',
    onlineLight: '#0D2E1A',
    away: '#F59E0B',
    busy: '#EF4444',
  },
};

export const spacing = { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px' };

export const typography = {
  fontFamily: {
    sans: '"Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
    sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
    base: ['0.9375rem', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
    lg: ['1.0625rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
    xl: ['1.1875rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
    '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
    '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
    '4xl': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
    '5xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
    display: ['clamp(3rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
  },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { tight: '1.1', normal: '1.5', relaxed: '1.7' },
  letterSpacing: { tight: '-0.025em', normal: '0', wide: '0.04em', wider: '0.08em' },
};

export const radius = { none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px', full: '9999px' };

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 10px 24px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
  xl: '0 20px 48px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.04)',
  deep: '0 32px 64px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.06)',
  glow: '0 0 40px rgba(99,102,241,0.15)',
  glowStrong: '0 0 60px rgba(99,102,241,0.25)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.04)',
  surface: '0 8px 32px rgba(0,0,0,0.08)',
};

export const motion = {
  duration: { instant: '0ms', micro: '100ms', standard: '200ms', complex: '350ms', macro: '600ms' },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    springGentle: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
    cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

export const zIndex = { base: 0, dropdown: 100, sticky: 200, fixed: 300, modalBackdrop: 400, modal: 500, popover: 600, tooltip: 700, toast: 800, radarOverlay: 900 };
export const breakpoints = { sm: '375px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' };
export const transitions = {
  micro: `all 100ms ease-out`,
  standard: `all 200ms ease-out`,
  complex: `all 350ms ease-in-out`,
  colors: `color 100ms ease-out, background-color 100ms ease-out, border-color 100ms ease-out`,
  transform: `transform 200ms ease-out`,
  opacity: `opacity 100ms ease-out`,
  spring: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
  cinematic: `all 350ms cubic-bezier(0.22, 1, 0.36, 1)`,
};

export const tokens = { colors, spacing, typography, radius, shadows, motion, zIndex, breakpoints, transitions };

export type ColorTheme = 'light' | 'dark';
export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type ShadowKey = keyof typeof shadows;
export type MotionDurationKey = keyof typeof motion.duration;
export type MotionEasingKey = keyof typeof motion.easing;
export type BreakpointKey = keyof typeof breakpoints;
