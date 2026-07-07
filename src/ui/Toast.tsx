import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, useAnimatedValue, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, white } from '@/theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** Ink pill toast with a lime check — floats above the bottom nav. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const [msg, setMsg] = useState<string | null>(null);
  const opacity = useAnimatedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg(text);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setMsg(null)
        );
      }, 2000);
    },
    [opacity]
  );

  return (
    <ToastContext.Provider value={show}>
      <View style={{ flex: 1 }}>
        {children}
        {msg && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                bottom: 108,
                alignSelf: 'center',
                backgroundColor: ink[900],
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderRadius: radius.pill,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                maxWidth: 320,
                opacity,
              },
              shadows.lg,
            ]}
          >
            <Icon name="check" size={16} color={c.accent} />
            <Txt size={13.5} weight="semibold" color={white}>
              {msg}
            </Txt>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}
