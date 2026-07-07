import React, { useEffect } from 'react';
import { Animated, Pressable, useAnimatedValue } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows } from '@/theme/tokens';

/** Toggle switch — lime when on with an ink knob (the Lakon signature). */
export function Switch({
  checked = false,
  onChange,
  size = 'md',
  disabled = false,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const dims = size === 'sm' ? { w: 40, h: 24, k: 18 } : { w: 50, h: 30, k: 24 };
  const pad = (dims.h - dims.k) / 2;
  const anim = useAnimatedValue(checked ? 1 : 0);

  useEffect(() => {
    Animated.timing(anim, { toValue: checked ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [checked, anim]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: radius.pill,
        backgroundColor: checked ? c.accent : c.controlTrack,
        opacity: disabled ? 0.45 : 1,
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [pad, dims.w - dims.k - pad],
            }),
            width: dims.k,
            height: dims.k,
            borderRadius: dims.k / 2,
            backgroundColor: checked ? ink[900] : c.surfaceCard,
          },
          shadows.sm,
        ]}
      />
    </Pressable>
  );
}
