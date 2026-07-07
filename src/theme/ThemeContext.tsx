import React, { createContext, useContext, useMemo } from 'react';
import { useSettings } from '@/stores/appStore';
import { darkColors, lightColors, ThemeColors } from './tokens';

export type ThemeMode = 'light' | 'dark';

interface ThemeValue {
  mode: ThemeMode;
  c: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue>({
  mode: 'light',
  c: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  const value = useMemo<ThemeValue>(
    () => ({
      mode: theme,
      c: theme === 'dark' ? darkColors : lightColors,
      toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
