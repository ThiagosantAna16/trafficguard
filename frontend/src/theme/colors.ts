export const colors = {
  // Background — single flat ink, no raised "card" surfaces
  darkBg: '#0A0E13',

  // Borders — hairlines only, no shadows/glow anywhere in this system
  border: 'rgba(255,255,255,0.09)',
  borderMed: 'rgba(255,255,255,0.16)',
  borderStrong: 'rgba(255,255,255,0.20)',

  // Text
  textPrimary: '#EEF1F5',
  textSecondary: '#7D8792',
  textMuted: '#5B646F',
  textDark: '#0A0E13', // used as text color on top of accent-filled buttons

  // Accent — sober, desaturated steel blue (single accent, used sparingly)
  accent: '#74B3DE',

  // Semantic — same lightness/chroma family as accent, only hue varies
  amber: '#D9B06B',
  red: '#D8625C',
  green: '#69B183',

  // Legacy aliases kept for any code that still references them
  primary: '#74B3DE',
  surface: '#0A0E13',
  surfaceRaised: '#0A0E13',
} as const;
