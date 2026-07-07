import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { ink } from '@/theme/tokens';
import { Icon, IconName } from './Icon';

export interface NavItem {
  key: string;
  icon: IconName;
  label: string;
}

/** Bottom tab bar — active item gets the signature lime circle. */
export function BottomNav({
  items,
  active,
  onChange,
}: {
  items: NavItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 16,
        backgroundColor: c.surfaceCard,
        borderTopWidth: 1,
        borderTopColor: c.borderSubtle,
      }}
    >
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <Pressable
            key={it.key}
            accessibilityLabel={it.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(it.key)}
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? c.accent : 'transparent',
              }}
            >
              <Icon
                name={it.icon}
                size={23}
                color={isActive ? ink[900] : c.iconMuted}
                strokeWidth={isActive ? 2.4 : 2}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
