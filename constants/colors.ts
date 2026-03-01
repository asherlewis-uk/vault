const Colors = {
  bg: '#0a0a0c',
  bgElevated: '#121214',
  bgFloating: '#1a1a1e',
  glass: 'rgba(255,255,255,0.04)',
  glassHover: 'rgba(255,255,255,0.07)',
  glassActive: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderFocus: 'rgba(255,255,255,0.18)',
  glassSpecular: 'rgba(255,255,255,0.16)',
  glassSpecularHeavy: 'rgba(255,255,255,0.22)',
  glassSurface: 'rgba(255,255,255,0.055)',
  glassSheen: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.00)'] as const,
  glassDepth: ['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.22)'] as const,
  text: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.30)',
  accent: '#0a84ff',
  accentDim: 'rgba(10,132,255,0.18)',
  accentGlow: 'rgba(10,132,255,0.35)',
  success: '#30d158',
  warning: '#ffd60a',
  danger: '#ff453a',
  dangerDim: 'rgba(255,69,58,0.15)',
  purple: '#5e5ce6',
  tint: '#0a84ff',
  tabIconDefault: 'rgba(255,255,255,0.40)',
  tabIconSelected: '#0a84ff',
};

export default {
  dark: Colors,
  light: Colors,
};

export { Colors };
