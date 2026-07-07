import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, white } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

/** Metric tile — label + corner disc, then a big value + small unit. */
export function StatCard({
  label,
  value,
  unit,
  tone = 'plain',
  icon = 'arrow-up-right',
  style,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'plain' | 'accent' | 'dark';
  icon?: IconName;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const tones = {
    plain: {
      bg: c.surfaceCard, fg: c.textStrong, sub: c.textMuted,
      disc: c.controlTrack, discFg: c.textStrong, border: c.borderSubtle,
    },
    accent: {
      bg: c.surfaceAccent, fg: ink[900], sub: 'rgba(16,16,18,0.6)',
      disc: ink[900], discFg: c.accent, border: undefined,
    },
    dark: {
      bg: c.surfaceInverse, fg: white, sub: c.textOnDarkMuted,
      disc: 'rgba(255,255,255,0.12)', discFg: white, border: undefined,
    },
  }[tone];

  return (
    <View
      style={[
        {
          backgroundColor: tones.bg,
          borderRadius: radius.lg,
          padding: space.cardPadLg,
          gap: space.s3,
          borderWidth: tones.border ? 1 : 0,
          borderColor: tones.border,
          flex: 1,
        },
        tone === 'plain' ? shadows.sm : {},
        style ?? {},
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Txt size={13} weight="semibold" color={tones.fg} style={{ flexShrink: 1 }}>
          {label}
        </Txt>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: tones.disc,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={15} color={tones.discFg} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Txt size={34} weight="black" color={tones.fg} letterSpacing={-0.68}>
          {value}
        </Txt>
        {unit && (
          <Txt size={15} weight="medium" color={tones.sub}>
            {unit}
          </Txt>
        )}
      </View>
    </View>
  );
}
