/** Small shared patterns: screen header (eyebrow + display title), empty state, checkbox. */
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Txt size={12} weight="bold" color={c.textMuted} caps>
      {children}
    </Txt>
  );
}

export function ScreenTitle({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 16,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Txt size={25} weight="black" color={c.textStrong} letterSpacing={-0.5} numberOfLines={1}>
          {title}
        </Txt>
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  children,
  action,
  onAction,
  style,
}: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        style,
      ]}
    >
      <Txt size={16} weight="black" color={c.textStrong} letterSpacing={-0.16}>
        {children}
      </Txt>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Txt size={13} weight="bold" color={c.limeText}>
            {action}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={c.textMuted} />
      </View>
      <Txt size={14} weight="medium" color={c.textMuted} center style={{ maxWidth: 260 }}>
        {text}
      </Txt>
    </View>
  );
}

/** Square lime checkbox (packing style) or round ink checkbox (task style). */
export function CheckBox({
  checked,
  shape = 'square',
  onPress,
}: {
  checked: boolean;
  shape?: 'square' | 'round';
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const round = shape === 'round';
  const box = (
    <View
      style={{
        width: round ? 22 : 24,
        height: round ? 22 : 24,
        borderRadius: round ? 11 : radius.xs,
        borderWidth: checked ? 0 : 2,
        borderColor: c.borderStrong,
        backgroundColor: checked ? (round ? ink[900] : c.accent) : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Icon name="check" size={round ? 13 : 15} color={round ? c.accent : ink[900]} strokeWidth={3} />
      )}
    </View>
  );
  if (!onPress) return box;
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      {box}
    </Pressable>
  );
}

/** Dashed "+ Tambah" outline button (comparison board pattern). */
export function DashedAdd({ label, onPress }: { label: string; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 56,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: c.borderStrong,
        borderRadius: radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Icon name="plus" size={18} color={c.textMuted} />
      <Txt size={15} weight="bold" color={c.textMuted}>
        {label}
      </Txt>
    </Pressable>
  );
}
