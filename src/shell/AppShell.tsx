import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n/useI18n';
import { DailyToday } from '@/screens/daily/DailyToday';
import { FocusTimer } from '@/screens/daily/FocusTimer';
import { HabitTracker } from '@/screens/daily/HabitTracker';
import { QuickNotes } from '@/screens/daily/QuickNotes';
import { SettingsScreen } from '@/screens/Settings';
import { ComparisonBoard } from '@/screens/travel/ComparisonBoard';
import { DocVault } from '@/screens/travel/DocVault';
import { FinanceTracker } from '@/screens/travel/FinanceTracker';
import { ItineraryBuilder } from '@/screens/travel/ItineraryBuilder';
import { PackingSystem } from '@/screens/travel/PackingSystem';
import { TripDashboard } from '@/screens/travel/TripDashboard';
import { Directory } from '@/screens/work/Directory';
import { KanbanBoard } from '@/screens/work/KanbanBoard';
import { MeetingNotes } from '@/screens/work/MeetingNotes';
import { Timeline } from '@/screens/work/Timeline';
import { WorkDashboard } from '@/screens/work/WorkDashboard';
import { useSettings } from '@/stores/appStore';
import { useNav, Workspace, WS_START } from '@/stores/navStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows } from '@/theme/tokens';
import { BottomNav, NavItem } from '@/ui/BottomNav';
import { Icon, IconName } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Txt } from '@/ui/Txt';
import { LockScreen } from './LockScreen';
import { Onboarding } from './Onboarding';

export interface ScreenProps {
  go: (tab: string) => void;
}

const SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  today: DailyToday,
  habits: HabitTracker,
  focus: FocusTimer,
  inbox: QuickNotes,
  home: TripDashboard,
  plan: ComparisonBoard,
  trips: ItineraryBuilder,
  money: FinanceTracker,
  docs: DocVault,
  pack: PackingSystem,
  whome: WorkDashboard,
  board: KanbanBoard,
  timeline: Timeline,
  dir: Directory,
  wnotes: MeetingNotes,
};

function useNavItems(ws: Workspace): NavItem[] {
  const { t } = useI18n();
  switch (ws) {
    case 'daily':
      return [
        { key: 'today', icon: 'home', label: t('nav.today') },
        { key: 'habits', icon: 'flame', label: t('nav.habits') },
        { key: 'focus', icon: 'clock', label: t('nav.focus') },
        { key: 'inbox', icon: 'file-text', label: t('nav.inbox') },
      ];
    case 'travel':
      return [
        { key: 'home', icon: 'home', label: t('nav.home') },
        { key: 'plan', icon: 'search', label: t('nav.research') },
        { key: 'trips', icon: 'calendar', label: t('nav.schedule') },
        { key: 'money', icon: 'wallet', label: t('nav.budget') },
        { key: 'docs', icon: 'lock', label: t('nav.vault') },
      ];
    case 'work':
      return [
        { key: 'whome', icon: 'briefcase', label: t('nav.projects') },
        { key: 'board', icon: 'bar-chart', label: t('nav.board') },
        { key: 'timeline', icon: 'calendar', label: t('nav.timeline') },
        { key: 'dir', icon: 'user', label: t('nav.contacts') },
        { key: 'wnotes', icon: 'file-text', label: t('nav.notes') },
      ];
  }
}

function WsButton({
  active,
  ws,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  ws: Workspace;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  // active tints per workspace: daily=lime, travel=white card, work=ink+lime
  const bg = !active ? 'transparent' : ws === 'daily' ? c.accent : ws === 'work' ? ink[900] : c.surfaceCard;
  const fg = !active ? c.textMuted : ws === 'daily' ? ink[900] : ws === 'work' ? c.accent : c.textStrong;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          height: 32,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: bg,
        },
        active ? shadows.xs : {},
      ]}
    >
      <Icon name={icon} size={15} color={fg} />
      <Txt size={12.5} weight="black" color={fg} letterSpacing={0.13}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function AppShell() {
  const { c, mode, toggle } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const onboarded = useSettings((s) => s.onboarded);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const biometric = useSettings((s) => s.biometric);
  const { ws, tab, settingsOpen, setWs, setTab, openSettings, closeSettings } = useNav();
  const [locked, setLocked] = useState(biometric);
  const backgroundedAt = useRef<number | null>(null);

  // auto-lock: returning from >60s in background re-locks the app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active' && backgroundedAt.current != null) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (useSettings.getState().biometric && useSettings.getState().autoLock && away > 60000) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const navItems = useNavItems(ws);
  const Screen = SCREENS[tab] ?? SCREENS[WS_START[ws]];

  // Android hardware back: close settings → return to workspace home → default (exit)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const state = useNav.getState();
      if (state.settingsOpen) {
        state.closeSettings();
        return true;
      }
      if (state.tab !== WS_START[state.ws]) {
        state.setTab(WS_START[state.ws]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  if (!onboarded) {
    return (
      <>
        <StatusBar style="light" />
        <Onboarding onStart={() => setOnboarded(true)} />
      </>
    );
  }

  if (locked) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <LockScreen onUnlock={() => setLocked(false)} />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bgApp, paddingTop: insets.top }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* util bar: workspace switcher + theme / settings */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 10,
          gap: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 2,
            padding: 4,
            borderRadius: radius.pill,
            backgroundColor: c.controlTrack,
          }}
        >
          <WsButton active={ws === 'daily'} ws="daily" icon="flame" label={t('ws.daily')} onPress={() => setWs('daily')} />
          <WsButton active={ws === 'travel'} ws="travel" icon="map-pin" label={t('ws.travel')} onPress={() => setWs('travel')} />
          <WsButton active={ws === 'work'} ws="work" icon="briefcase" label={t('ws.work')} onPress={() => setWs('work')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton
            icon={mode === 'light' ? 'moon' : 'sun'}
            variant="ghost"
            size={40}
            onPress={toggle}
            accessibilityLabel="Ganti tema"
          />
          <IconButton
            icon="settings"
            variant="ghost"
            size={40}
            onPress={openSettings}
            accessibilityLabel={t('set.title')}
          />
        </View>
      </View>

      {/* screen */}
      <View style={{ flex: 1 }}>
        {settingsOpen ? (
          <SettingsScreen onClose={closeSettings} onLock={() => setLocked(true)} />
        ) : (
          <Screen go={setTab} />
        )}
      </View>

      {/* bottom nav */}
      {!settingsOpen && <BottomNav items={navItems} active={tab} onChange={setTab} />}
    </View>
  );
}
