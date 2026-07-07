import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { status } from '@/theme/tokens';
import { Txt } from './Txt';

/** Initials avatar with optional presence/status dot. */
export function Avatar({
  name = '',
  size = 44,
  status: statusKind,
  style,
}: {
  name?: string;
  size?: number;
  status?: 'online' | 'accent';
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const dotColor = statusKind === 'online' ? status.green500 : c.accent;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.controlTrack,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt size={size * 0.36} weight="bold" color={c.textMuted}>
          {initials}
        </Txt>
      </View>
      {statusKind && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: dotColor,
            borderWidth: 2,
            borderColor: c.surfaceCard,
          }}
        />
      )}
    </View>
  );
}
