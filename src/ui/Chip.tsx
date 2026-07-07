import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, status, white } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { PressScale } from './PressScale';
import { Txt } from './Txt';

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** Chip / tag — facility tags, filters, bag-allocation, selectable pills. */
export function Chip({
  children,
  tone = 'neutral',
  selected = false,
  icon,
  size = 'md',
  onPress,
  style,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  selected?: boolean;
  icon?: IconName;
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const tones = {
    neutral: { bg: c.controlTrack, fg: c.textBody, sel: ink[900], selFg: white },
    accent: { bg: c.lime100, fg: c.limeText, sel: c.accent, selFg: ink[900] },
    success: { bg: c.green50, fg: c.successFg, sel: status.green500, selFg: white },
    warning: { bg: c.amber50, fg: c.warningFg, sel: status.amber500, selFg: ink[900] },
    danger: { bg: c.red50, fg: c.dangerFg, sel: status.red500, selFg: white },
    info: { bg: c.blue50, fg: c.infoFg, sel: status.blue500, selFg: white },
  }[tone];
  const dims = size === 'sm' ? { h: 26, px: 10, fs: 12 } : { h: 32, px: 14, fs: 13 };
  const bg = selected ? tones.sel : tones.bg;
  const fg = selected ? tones.selFg : tones.fg;

  const inner = (
    <>
      {icon && <Icon name={icon} size={dims.fs + 2} color={fg} />}
      <Txt size={dims.fs} weight="semibold" color={fg}>
        {children}
      </Txt>
    </>
  );

  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: dims.h,
    paddingHorizontal: dims.px,
    borderRadius: radius.pill,
    backgroundColor: bg,
    alignSelf: 'flex-start',
  };

  if (onPress) {
    return (
      <PressScale onPress={onPress} style={[base, selected ? shadows.xs : {}, style ?? {}]}>
        {inner}
      </PressScale>
    );
  }
  return <View style={[base, selected ? shadows.xs : {}, style]}>{inner}</View>;
}
