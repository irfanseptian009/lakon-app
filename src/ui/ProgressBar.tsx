import React, { useEffect } from 'react';
import { Animated, useAnimatedValue, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, status } from '@/theme/tokens';
import { Txt } from './Txt';

/** Progress bar — lime fill on a sunken track, pill-capped, animated fill. */
export function ProgressBar({
  value = 0,
  label,
  showValue = true,
  tone = 'accent',
  height = 10,
  onDark = false,
  style,
}: {
  value?: number;
  label?: string;
  showValue?: boolean;
  tone?: 'accent' | 'dark' | 'success';
  height?: number;
  onDark?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  const anim = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 320, useNativeDriver: false }).start();
  }, [pct, anim]);

  const fill = { accent: c.accent, dark: ink[900], success: status.green500 }[tone];
  const track = onDark ? 'rgba(255,255,255,0.14)' : c.controlTrack;

  return (
    <View style={style}>
      {(label || showValue) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          {label ? (
            <Txt size={13} weight="semibold" color={onDark ? c.textOnDark : c.textStrong}>
              {label}
            </Txt>
          ) : (
            <View />
          )}
          {showValue && (
            <Txt size={13} weight="bold" color={onDark ? c.textOnDarkMuted : c.textMuted}>
              {Math.round(pct)}%
            </Txt>
          )}
        </View>
      )}
      <View style={{ height, borderRadius: radius.pill, backgroundColor: track, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            height: '100%',
            backgroundColor: fill,
            borderRadius: radius.pill,
          }}
        />
      </View>
    </View>
  );
}
