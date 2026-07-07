import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';

/**
 * Pressable with the signature Lakon press behavior: scale down to 0.97.
 * "Hover: lift · Press: scale 0.97 · quick eased motion, no bounces."
 */
export function PressScale({
  style,
  scaleTo = 0.97,
  children,
  ...rest
}: PressableProps & { style?: ViewStyle | ViewStyle[]; scaleTo?: number; children?: React.ReactNode }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        ...(Array.isArray(style) ? style : style ? [style] : []),
        { transform: [{ scale: pressed ? scaleTo : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
