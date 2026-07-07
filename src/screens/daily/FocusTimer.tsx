import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useDaily } from '@/stores/dailyStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, shadows, space, status } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { ScreenTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Ring } from '@/ui/Ring';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Txt } from '@/ui/Txt';

type Mode = 'focus' | 'short' | 'long';

const MODE_MINS: Record<Mode, number> = { focus: 25, short: 5, long: 15 };

export function FocusTimer(_: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { focusToday, logFocusSession } = useDaily();
  const [mode, setMode] = useState<Mode>('focus');
  const total = MODE_MINS[mode] * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const modeColor: Record<Mode, string> = {
    focus: c.accent,
    short: status.green500,
    long: status.blue500,
  };
  const modeLabel: Record<Mode, string> = {
    focus: t('focus.label.focus'),
    short: t('focus.label.short'),
    long: t('focus.label.long'),
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    setLeft(MODE_MINS[next] * 60);
    setRunning(false);
  };

  useEffect(() => {
    if (!running) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    interval.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          if (mode === 'focus') logFocusSession('focus', MODE_MINS.focus);
          return MODE_MINS[mode] * 60;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running, mode, logFocusSession]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const pct = ((total - left) / total) * 100;

  const skip = () => {
    setRunning(false);
    if (mode === 'focus' && left < total) logFocusSession('focus', Math.round((total - left) / 60));
    setLeft(total);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: space.screenPad, paddingBottom: 24 }}>
      <ScreenTitle
        eyebrow={t('focus.eyebrow')}
        title={t('focus.title')}
        right={<IconButton icon="more-horizontal" variant="ghost" size={40} accessibilityLabel="Opsi" />}
      />

      <SegmentedControl
        full
        tone="dark"
        options={[
          { value: 'focus', label: t('focus.mode.focus') },
          { value: 'short', label: t('focus.mode.short') },
          { value: 'long', label: t('focus.mode.long') },
        ]}
        value={mode}
        onChange={changeMode}
      />

      {/* current task chip */}
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Chip tone="accent" size="sm" icon="briefcase">
          {t('focus.currentTask')}
        </Chip>
      </View>

      {/* timer */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <Ring value={pct} size={250} thickness={16} color={modeColor[mode]} trackColor={c.controlTrack}>
          <Txt size={56} weight="mono" color={c.textStrong} letterSpacing={-1.12}>
            {mm}:{ss}
          </Txt>
          <Txt size={13} weight="bold" color={c.textMuted} letterSpacing={1.04} style={{ marginTop: 8 }}>
            {modeLabel[mode]}
          </Txt>
        </Ring>

        {/* controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <IconButton
            icon="rotate-ccw"
            variant="ghost"
            size={52}
            onPress={() => {
              setLeft(total);
              setRunning(false);
            }}
            accessibilityLabel="Reset"
          />
          <Pressable
            onPress={() => setRunning((r) => !r)}
            accessibilityLabel={running ? 'Jeda' : 'Mulai'}
            style={[
              {
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: ink[900],
                alignItems: 'center',
                justifyContent: 'center',
              },
              shadows.lg,
            ]}
          >
            <Icon name={running ? 'pause' : 'play'} size={30} color={c.accent} />
          </Pressable>
          <IconButton icon="skip-forward" variant="ghost" size={52} onPress={skip} accessibilityLabel="Lewati" />
        </View>

        {/* session dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt size={13} weight="bold" color={c.textMuted}>
            {t('focus.sessionsDone', { n: focusToday })}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i < focusToday ? c.accent : c.controlTrack,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
