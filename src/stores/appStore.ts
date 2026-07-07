import { create } from 'zustand';
import { getSetting, setSetting } from '@/data/db';
import type { Lang } from '@/i18n/translations';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  hydrated: boolean;
  theme: ThemeMode;
  lang: Lang;
  userName: string;
  biometric: boolean;
  autoLock: boolean;
  notif: boolean;
  onboarded: boolean;
  backupAt: string | null;
  hydrate: () => void;
  setTheme: (t: ThemeMode) => void;
  setLang: (l: Lang) => void;
  setUserName: (n: string) => void;
  setBiometric: (v: boolean) => void;
  setAutoLock: (v: boolean) => void;
  setNotif: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  setBackupAt: (t: string) => void;
}

export const useSettings = create<SettingsState>((set) => {
  const persist = (key: string, value: string) => setSetting(key, value);

  return {
    hydrated: false,
    theme: 'light',
    lang: 'id',
    userName: 'Sari Wijaya',
    biometric: false,
    autoLock: false,
    notif: true,
    onboarded: false,
    backupAt: null,

    hydrate: () =>
      set({
        hydrated: true,
        theme: (getSetting('theme') as ThemeMode) || 'light',
        lang: (getSetting('lang') as Lang) || 'id',
        userName: getSetting('userName') || 'Sari Wijaya',
        biometric: getSetting('biometric') === '1',
        autoLock: getSetting('autoLock') === '1',
        notif: getSetting('notif') !== '0',
        onboarded: getSetting('onboarded') === '1',
        backupAt: getSetting('backupAt'),
      }),

    setTheme: (theme) => {
      persist('theme', theme);
      set({ theme });
    },
    setLang: (lang) => {
      persist('lang', lang);
      set({ lang });
    },
    setUserName: (userName) => {
      persist('userName', userName);
      set({ userName });
    },
    setBiometric: (v) => {
      persist('biometric', v ? '1' : '0');
      set({ biometric: v });
    },
    setAutoLock: (v) => {
      persist('autoLock', v ? '1' : '0');
      set({ autoLock: v });
    },
    setNotif: (v) => {
      persist('notif', v ? '1' : '0');
      set({ notif: v });
    },
    setOnboarded: (v) => {
      persist('onboarded', v ? '1' : '0');
      set({ onboarded: v });
    },
    setBackupAt: (t) => {
      persist('backupAt', t);
      set({ backupAt: t });
    },
  };
});
