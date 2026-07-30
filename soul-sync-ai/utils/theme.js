// Visual theme system for SoulSync AI (Matches the warm orange-yellow web auth design)
export const THEME = {
  colors: {
    // Warm cream and peach light mode base
    background: '#FAF6F0',
    cardBackground: 'rgba(255, 255, 255, 0.78)',
    cardBackgroundSolid: '#FFFFFF',
    
    // Core brand gradients and accents
    primary: '#FF8A3D',     // Warm orange
    secondary: '#FFD54A',   // Sunshine yellow
    accent: '#FFA86B',      // Peach orange
    success: '#10B981',     // Healing emerald
    warning: '#F59E0B',     // Amber
    danger: '#EF4444',      // Red
    
    // Gradients definitions
    primaryGradient: ['#FF8A3D', '#FFD54A'],
    accentGradient: ['#FF8A3D', '#FFEAD2'],
    darkGradient: ['#FAF6F0', '#FFEAD2'],
    wellnessGradient: ['#FF8A3D', '#FFA86B'],

    // Text hierarchy (dark slate for light background contrast)
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Structural
    border: 'rgba(0, 0, 0, 0.06)',
    borderActive: '#FF8A3D',
    overlay: 'rgba(30, 41, 59, 0.4)',
  },

  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },

  sizes: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    radiusSm: 8,
    radiusMd: 16,
    radiusLg: 24,
    radiusRound: 9999,
  },

  // Glassmorphic helper styling
  glassStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 24,
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  glassStyleLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  }
};
