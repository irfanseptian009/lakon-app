import { Image } from 'expo-image';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { radius as r, shadows, space } from '@/theme/tokens';

/** Base surface card. tone: light (white) | sunken | dark (ink) | accent (lime). */
export function Card({
  children,
  tone = 'light',
  pad = 'md',
  radius = 'lg',
  style,
  bgImageUri,
}: {
  children: React.ReactNode;
  tone?: 'light' | 'sunken' | 'dark' | 'accent';
  pad?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle | ViewStyle[];
  /** Optional cover photo rendered as an absolute-fill background with a scrim, behind children. */
  bgImageUri?: string | null;
}) {
  const { c } = useTheme();
  const bg = {
    light: c.surfaceCard,
    sunken: c.surfaceSunken,
    dark: c.surfaceInverse,
    accent: c.surfaceAccent,
  }[tone];
  const padding = { none: 0, sm: space.s3, md: space.cardPad, lg: space.cardPadLg }[pad];
  const br = { sm: r.sm, md: r.md, lg: r.lg, xl: r.xl }[radius];

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: br,
          padding,
          borderWidth: tone === 'light' ? 1 : 0,
          borderColor: tone === 'light' ? c.borderSubtle : undefined,
          overflow: bgImageUri ? 'hidden' : undefined,
        },
        tone === 'light' ? shadows.sm : tone === 'dark' ? shadows.md : {},
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {bgImageUri && (
        <Image
          source={{ uri: bgImageUri }}
          contentFit="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      {bgImageUri && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim }} />
      )}
      {children}
    </View>
  );
}
