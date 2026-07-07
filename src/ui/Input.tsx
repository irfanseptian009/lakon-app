import React, { useState } from 'react';
import { TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { font, radius as r } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

/** Text input — subtle border, lime focus ring, optional icon/prefix/label. */
export function Input({
  label,
  icon,
  prefix,
  shape = 'rect',
  hint,
  style,
  multiline,
  ...rest
}: TextInputProps & {
  label?: string;
  icon?: IconName;
  prefix?: string;
  shape?: 'rect' | 'pill';
  hint?: string;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Txt size={13} weight="semibold" color={c.textStrong} style={{ marginBottom: 8 }}>
          {label}
        </Txt>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 10,
          minHeight: 50,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 12 : 0,
          borderRadius: shape === 'pill' ? r.pill : r.md,
          backgroundColor: c.controlBg,
          borderWidth: 1.5,
          borderColor: focused ? c.focusRing : c.borderStrong,
        }}
      >
        {icon && <Icon name={icon} size={18} color={c.textMuted} />}
        {prefix && (
          <Txt size={15} weight="semibold" color={c.textMuted}>
            {prefix}
          </Txt>
        )}
        <TextInput
          {...rest}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: font.medium,
            fontSize: 15,
            color: c.textStrong,
            paddingVertical: multiline ? 0 : 12,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 64 : undefined,
          }}
        />
      </View>
      {hint && (
        <Txt size={12} color={c.textMuted} style={{ marginTop: 6 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}
