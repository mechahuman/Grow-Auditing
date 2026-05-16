// Design tokens extracted from ui_inspirations/output_review_screen/image copy 2.png
// Premium dark theme with vibrant gradient accents

export const colors = {
  // Background & Surface
  background: '#0f0f23',
  backgroundAlt: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#0f3460',

  // Primary Gradients (Magenta → Purple)
  gradientPrimaryStart: '#ff1493',
  gradientPrimaryEnd: '#9c27b0',

  // Secondary Gradients (Orange → Coral)
  gradientSecondaryStart: '#ff8c00',
  gradientSecondaryEnd: '#ff6b6b',

  // Accent Colors
  cyan: '#00d9ff',
  teal: '#00e5cc',
  pink: '#ff1493',
  purple: '#9c27b0',
  orange: '#ff8c00',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#b0b0c0',
  textMuted: '#808090',

  // Borders & Dividers
  border: '#2a2a4e',
  borderLight: '#3a3a5e',

  // Status Colors
  success: '#00e5cc',
  warning: '#ff8c00',
  error: '#ff6b6b',
  info: '#00d9ff',
}

export const gradients = {
  // Primary gradient: Magenta to Purple
  primary: `linear-gradient(135deg, ${colors.gradientPrimaryStart} 0%, ${colors.gradientPrimaryEnd} 100%)`,

  // Secondary gradient: Orange to Coral
  secondary: `linear-gradient(135deg, ${colors.gradientSecondaryStart} 0%, ${colors.gradientSecondaryEnd} 100%)`,

  // Tertiary gradient: Cyan to Teal
  tertiary: `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.teal} 100%)`,

  // Background radial gradient
  bgRadial: `radial-gradient(circle at 50% 50%, ${colors.surfaceLight} 0%, ${colors.background} 100%)`,
}

export const shadows = {
  sm: '0 2px 8px rgba(255, 20, 147, 0.1)',
  md: '0 4px 16px rgba(255, 20, 147, 0.15)',
  lg: '0 8px 32px rgba(156, 39, 176, 0.2)',
  glow: '0 0 20px rgba(255, 20, 147, 0.4)',
}
