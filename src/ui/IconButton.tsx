import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, shadows, white } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { PressScale } from './PressScale';

/** Circular icon button — bell, back, plus, theme toggle. Optional lime dot. */
export function IconButton({
  icon,
  size = 44,
  variant = 'white',
  dot = false,
  onPress,
  style,
  accessibilityLabel,
}: {
  icon: IconName;
  size?: number;
  variant?: 'white' | 'dark' | 'lime' | 'ghost';
  dot?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const palette = {
    white: { bg: c.surfaceCard, fg: c.textStrong, shadow: shadows.sm, border: undefined },
    dark: { bg: ink[900], fg: white, shadow: shadows.md, border: undefined },
    lime: { bg: c.accent, fg: ink[900], shadow: shadows.sm, border: undefined },
    ghost: { bg: 'transparent', fg: c.textStrong, shadow: undefined, border: c.borderStrong },
  }[variant];

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        palette.shadow ?? {},
        style ?? {},
      ]}
    >
      <Icon name={icon} size={size * 0.45} color={palette.fg} />
      {dot && (
        <View
          style={{
            position: 'absolute',
            top: size * 0.18,
            right: size * 0.18,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: c.accent,
            borderWidth: 2,
            borderColor: c.surfaceCard,
          }}
        />
      )}
    </PressScale>
  );
}
