import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, white } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { PressScale } from './PressScale';
import { Txt } from './Txt';

/**
 * Lakon pill button. Signature pattern: circular contrast icon-disc tucked at
 * the left end, label centered. Variants: primary (lime) | dark | white | ghost.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  icon,
  disabled = false,
  onPress,
  style,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'dark' | 'white' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  icon?: IconName;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const dims = {
    sm: { h: 40, px: 16, fs: 14, disc: 28 },
    md: { h: 52, px: 22, fs: 16, disc: 36 },
    lg: { h: 60, px: 26, fs: 17, disc: 42 },
  }[size];

  const palette = {
    primary: { bg: c.accent, fg: c.textOnAccent, disc: ink[900], discFg: c.accent, shadow: shadows.accent, border: undefined },
    dark: { bg: ink[900], fg: white, disc: c.accent, discFg: ink[900], shadow: shadows.md, border: undefined },
    white: { bg: c.surfaceCard, fg: c.textStrong, disc: c.discBg, discFg: c.discFg, shadow: shadows.sm, border: c.borderStrong },
    ghost: { bg: 'transparent', fg: c.textStrong, disc: c.controlTrack, discFg: c.textStrong, shadow: undefined, border: undefined },
  }[variant];

  return (
    <PressScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: icon ? 'space-between' : 'center',
          alignSelf: full ? 'stretch' : 'flex-start',
          height: dims.h,
          paddingLeft: icon ? 6 : dims.px,
          paddingRight: dims.px,
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
        },
        !disabled && palette.shadow ? palette.shadow : {},
        style ?? {},
      ]}
    >
      {icon && (
        <View
          style={{
            width: dims.disc,
            height: dims.disc,
            borderRadius: dims.disc / 2,
            backgroundColor: palette.disc,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={dims.disc * 0.5} color={palette.discFg} />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: icon ? 8 : 0 }}>
        <Txt size={dims.fs} weight="bold" color={palette.fg} letterSpacing={0.3}>
          {children}
        </Txt>
      </View>
      {icon && <View style={{ width: dims.disc }} />}
    </PressScale>
  );
}
