/**
 * Eco-Precision Enterprise Design System Tokens
 * Source of truth: DESIGN.md & design_guidelines.json
 */

export const colors = {
  // Surfaces
  surface: '#f9f9ff',
  surfaceDim: '#cedaf3',
  surfaceBright: '#f9f9ff',
  surfaceMist: '#F8FAFC',
  surfaceCard: '#FFFFFF',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainer: '#e7eeff',
  surfaceContainerHigh: '#dee8ff',
  surfaceContainerHighest: '#d7e3fb',
  
  // Content & Text
  onSurface: '#101c2d',
  onSurfaceVariant: '#404753',
  textNavy: '#010B1C',
  textSlate: '#334155',
  textMuted: '#707785',
  
  // Borders & Accents
  borderSubtle: '#E2E8F0',
  pillFillIce: '#EBF5FA',
  
  // Primary, Secondary, Tertiary
  primary: '#0091FF',
  primaryDark: '#005da7',
  primaryContainer: '#0076d1',
  primaryGradient: 'linear-gradient(135deg, #3195C9 0%, #0091FF 100%)',
  primaryGradientHero: 'linear-gradient(135deg, #5AAAD4 0%, #3195C9 52%, #0091FF 100%)',
  
  secondary: '#98CAE4',
  secondaryDark: '#31647b',
  tertiary: '#5AAAD4',
  tertiaryDark: '#006386',
  
  // Semantic Indicators
  semantic: {
    recycledEmerald: '#10B981',
    timberAmber: '#D97706',
    processCyan: '#0091FF',
    alertCrimson: '#EF4444',
    esgIndigo: '#4F46E5',
  },
};

export const typography = {
  fontHead: "'Plus Jakarta Sans', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

export const shadows = {
  cardAmbient: '0 4px 20px -2px rgba(0, 145, 255, 0.06), 0 2px 6px -1px rgba(1, 11, 28, 0.03)',
  modalElevation: '0 20px 40px -10px rgba(1, 11, 28, 0.08), 0 8px 16px -4px rgba(0, 145, 255, 0.08)',
  primaryGlow: '0 4px 14px rgba(0, 145, 255, 0.35)',
};

export const radius = {
  sm: '0.25rem', // 4px
  md: '0.5rem',  // 8px - Buttons & Inputs
  lg: '0.75rem', // 12px
  xl: '1rem',    // 16px - Cards & Containers
  '2xl': '1.25rem', // 20px
  full: '9999px', // Badges & Pills
};

export default {
  colors,
  typography,
  shadows,
  radius,
};
