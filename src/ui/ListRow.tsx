import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadows, space } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { PressScale } from './PressScale';
import { Txt } from './Txt';

/** List row — tinted icon thumb + title + meta-stat triplet + chevron. */
export function ListRow({
  thumbIcon,
  title,
  subtitle,
  stats = [],
  chevron = true,
  onPress,
  onLongPress,
  style,
}: {
  thumbIcon?: IconName;
  title: string;
  subtitle?: string;
  stats?: { value: string; label: string }[];
  chevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}) {
  const { c } = useTheme();

  return (
    <PressScale
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: space.s3,
          borderRadius: radius.md,
          backgroundColor: c.surfaceCard,
          borderWidth: 1,
          borderColor: c.borderSubtle,
        },
        shadows.xs,
        style ?? {},
      ]}
    >
      {thumbIcon && (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.sm,
            backgroundColor: c.lime100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={thumbIcon} size={24} color={c.limeText} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Txt size={17} weight="bold" color={c.textStrong} numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Txt>
          {chevron && <Icon name="chevron-right" size={18} color={c.textMuted} />}
        </View>
        {subtitle && (
          <Txt size={13} color={c.textMuted} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        )}
        {stats.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
            {stats.slice(0, 3).map((s, i) => (
              <View key={i}>
                <Txt size={15} weight="bold" color={c.textStrong}>
                  {s.value}
                </Txt>
                <Txt size={12} color={c.textMuted}>
                  {s.label}
                </Txt>
              </View>
            ))}
          </View>
        )}
      </View>
    </PressScale>
  );
}
