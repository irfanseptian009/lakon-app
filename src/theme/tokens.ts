/**
 * LAKON — design tokens, ported 1:1 from the Singgah Design System handoff
 * (tokens/colors.css, theme-dark.css, typography.css, radius.css, spacing.css).
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

/* --- Base ramps (identical in light & dark) --- */
export const lime = {
  50: '#F7FCE3',
  100: '#ECFAC0',
  200: '#DEF68A',
  300: '#D2F35C',
  400: '#C8F03C', // primary brand accent
  500: '#B6E11F',
  600: '#93B814',
  700: '#6E8A12',
};

export const ink = {
  900: '#101012',
  800: '#1A1B1E',
  700: '#26282C',
  600: '#3A3D43',
  500: '#565A62',
  400: '#797E88',
  300: '#A9ADB6',
  200: '#D2D5DB',
  150: '#E3E5E9',
  100: '#EEF0F3',
  50: '#F4F5F7',
};

export const white = '#FFFFFF';

export const status = {
  green500: '#2FD25A',
  amber500: '#FFB020',
  red500: '#FF4D4F',
  blue500: '#2F8DFF',
};

export interface ThemeColors {
  // backgrounds & surfaces
  bgApp: string;
  surfaceCard: string;
  surfaceSunken: string;
  surfaceInverse: string;
  surfaceInverse2: string;
  surfaceAccent: string;
  surfaceRaised: string;
  // text
  textStrong: string;
  textBody: string;
  textMuted: string;
  textOnAccent: string;
  textOnDark: string;
  textOnDarkMuted: string;
  // lines
  borderSubtle: string;
  borderStrong: string;
  borderOnDark: string;
  // interactive
  accent: string;
  accentHover: string;
  accentPress: string;
  focusRing: string;
  controlBg: string;
  controlTrack: string;
  discBg: string;
  discFg: string;
  iconMuted: string;
  scrim: string;
  shadowColor: string;
  // status tints (wash backgrounds flip translucent in dark)
  green50: string;
  amber50: string;
  red50: string;
  blue50: string;
  lime100: string;
  // status foregrounds (brighten in dark so they read on washes)
  successFg: string;
  warningFg: string;
  dangerFg: string;
  infoFg: string;
  limeText: string; // --lime-700 alias: lime "text" reads as full lime on dark
}

export const lightColors: ThemeColors = {
  bgApp: ink[50],
  surfaceCard: white,
  surfaceSunken: ink[100],
  surfaceInverse: ink[900],
  surfaceInverse2: ink[800],
  surfaceAccent: lime[400],
  surfaceRaised: white,
  textStrong: ink[900],
  textBody: '#2C2E33',
  textMuted: ink[400],
  textOnAccent: ink[900],
  textOnDark: white,
  textOnDarkMuted: ink[300],
  borderSubtle: ink[150],
  borderStrong: ink[200],
  borderOnDark: 'rgba(255,255,255,0.10)',
  accent: lime[400],
  accentHover: lime[300],
  accentPress: lime[500],
  focusRing: lime[500],
  controlBg: white,
  controlTrack: ink[100],
  discBg: ink[900],
  discFg: white,
  iconMuted: ink[400],
  scrim: 'rgba(16,16,18,0.45)',
  shadowColor: 'rgba(16,16,18,0.08)',
  green50: '#E4FBEC',
  amber50: '#FFF4DE',
  red50: '#FFE9E9',
  blue50: '#E6F1FF',
  lime100: lime[100],
  successFg: '#1B9C42',
  warningFg: '#B6790A',
  dangerFg: '#D63638',
  infoFg: '#1F6FD6',
  limeText: lime[700],
};

export const darkColors: ThemeColors = {
  bgApp: '#0E0F11',
  surfaceCard: '#17191C',
  surfaceSunken: '#202327',
  surfaceInverse: '#23262B',
  surfaceInverse2: '#2A2E33',
  surfaceAccent: lime[400],
  surfaceRaised: '#23262B',
  textStrong: '#F4F6F8',
  textBody: '#C9CDD4',
  textMuted: '#8A8F99',
  textOnAccent: ink[900],
  textOnDark: '#F4F6F8',
  textOnDarkMuted: '#9AA0AA',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderOnDark: 'rgba(255,255,255,0.10)',
  accent: lime[400],
  accentHover: lime[300],
  accentPress: lime[500],
  focusRing: lime[500],
  controlBg: '#202327',
  controlTrack: 'rgba(255,255,255,0.10)',
  discBg: '#F4F6F8',
  discFg: '#17191C',
  iconMuted: '#6E747E',
  scrim: 'rgba(0,0,0,0.6)',
  shadowColor: 'rgba(0,0,0,0.5)',
  green50: 'rgba(47,210,90,0.14)',
  amber50: 'rgba(255,176,32,0.16)',
  red50: 'rgba(255,77,79,0.15)',
  blue50: 'rgba(47,141,255,0.16)',
  lime100: 'rgba(200,240,60,0.16)',
  successFg: '#3EDC6C',
  warningFg: '#FFC24D',
  dangerFg: '#FF7375',
  infoFg: '#5CA8FF',
  limeText: lime[400],
};

/* --- Spacing (4px grid) --- */
export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 28,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  screenPad: 20,
  cardPad: 16,
  cardPadLg: 20,
  gapList: 12,
  tapMin: 44,
};

/* --- Radii --- */
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
};

/* --- Typography --- */
export const font = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semibold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  black: 'HankenGrotesk_800ExtraBold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const fs = {
  display: 40,
  h1: 30,
  h2: 24,
  h3: 20,
  title: 17,
  body: 15,
  label: 13,
  caption: 12,
  micro: 11,
  stat: 34,
};

/* --- Shadows (soft, diffuse — approximated per-platform) --- */
function shadow(opacity: number, radiusPx: number, y: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation, shadowColor: '#101012' },
    default: {
      shadowColor: '#101012',
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: y },
    },
  })!;
}

export const shadows = {
  xs: shadow(0.05, 2, 1, 1),
  sm: shadow(0.06, 8, 2, 3),
  md: shadow(0.08, 20, 6, 6),
  lg: shadow(0.12, 40, 14, 12),
  accent: Platform.select<ViewStyle>({
    android: { elevation: 6, shadowColor: '#B4E11F' },
    default: {
      shadowColor: '#B4E11F',
      shadowOpacity: 0.35,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 8 },
    },
  })!,
};

/* --- Common text style builders --- */
export const caps: TextStyle = {
  textTransform: 'uppercase',
  letterSpacing: 0.72, // 0.06em at 12px
};
