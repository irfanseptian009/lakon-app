import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, white } from '@/theme/tokens';
import { Txt } from './Txt';

/** Segmented control — pill track with ink/lime active segment. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = 'dark',
  size = 'md',
  full = false,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  tone?: 'dark' | 'accent';
  size?: 'sm' | 'md';
  full?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const dims = size === 'sm' ? { h: 36, fs: 13, pad: 4 } : { h: 44, fs: 14, pad: 5 };
  const activeBg = tone === 'accent' ? c.accent : ink[900];
  const activeFg = tone === 'accent' ? ink[900] : white;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 4,
          padding: dims.pad,
          backgroundColor: c.controlTrack,
          borderRadius: radius.pill,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: full ? 1 : undefined,
              height: dims.h,
              paddingHorizontal: 18,
              borderRadius: radius.pill,
              backgroundColor: active ? activeBg : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt size={dims.fs} weight="bold" color={active ? activeFg : c.textMuted} letterSpacing={0.28}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
