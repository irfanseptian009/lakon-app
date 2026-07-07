import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, white } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'dark';

/** Small status label pill, optionally with leading dot or icon. */
export function Badge({
  children,
  tone = 'neutral',
  icon,
  dot = false,
  style,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  dot?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const tones = {
    neutral: { bg: c.surfaceSunken, fg: c.textBody },
    success: { bg: c.green50, fg: c.successFg },
    warning: { bg: c.amber50, fg: c.warningFg },
    danger: { bg: c.red50, fg: c.dangerFg },
    info: { bg: c.blue50, fg: c.infoFg },
    accent: { bg: c.lime100, fg: c.limeText },
    dark: { bg: ink[900], fg: white },
  }[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 24,
          paddingHorizontal: 10,
          borderRadius: radius.pill,
          backgroundColor: tones.bg,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tones.fg }} />}
      {icon && <Icon name={icon} size={13} color={tones.fg} />}
      <Txt size={12} weight="bold" color={tones.fg} letterSpacing={0.24}>
        {children}
      </Txt>
    </View>
  );
}
