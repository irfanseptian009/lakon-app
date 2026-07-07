import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useDaily } from '@/stores/dailyStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, status, white } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ScreenTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Ring } from '@/ui/Ring';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { Txt } from '@/ui/Txt';

const DAY_LETTERS_ID = ['S', 'S', 'R', 'K', 'J', 'S', 'M']; // Sen..Min
const DAY_LETTERS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HABIT_COLORS = [status.blue500, status.green500, status.amber500, '#93B814', status.red500];
const HABIT_ICONS = ['zap', 'flame', 'file-text', 'moon', 'heart', 'star'] as const;

export function HabitTracker(_: ScreenProps) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const { habits, toggleHabitToday, addHabit, deleteHabit } = useDaily();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [iconIdx, setIconIdx] = useState(0);

  const doneToday = habits.filter((h) => h.today).length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  // week arrays run Mon..Sun visually; store returns last-7-days ending today.
  // Show as-is with today at the correct weekday position:
  const jsDay = new Date().getDay(); // 0=Sun
  const todayIdx = (jsDay + 6) % 7; // 0=Mon
  const letters = lang === 'id' ? DAY_LETTERS_ID : DAY_LETTERS_EN;

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    addHabit(n, HABIT_ICONS[iconIdx % HABIT_ICONS.length], HABIT_COLORS[habits.length % HABIT_COLORS.length]);
    setName('');
    setAdding(false);
  };

  const confirmDelete = (id: number, habitName: string) => {
    Alert.alert(habitName, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        eyebrow={t('habits.eyebrow')}
        title={t('habits.title')}
        right={<IconButton icon="plus" variant="dark" onPress={() => setAdding(true)} accessibilityLabel={t('habits.addHabit')} />}
      />

      {/* today summary — lime hero card */}
      <Card tone="accent" pad="lg" radius="xl">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Ring
            value={habits.length ? (doneToday / habits.length) * 100 : 0}
            size={72}
            thickness={9}
            color={ink[900]}
            trackColor="rgba(16,16,18,0.15)"
          >
            <Txt size={19} weight="black" color={ink[900]}>
              {doneToday}/{habits.length}
            </Txt>
          </Ring>
          <View>
            <Txt size={17} weight="black" color={ink[900]} letterSpacing={-0.17}>
              {t('habits.todayCard')}
            </Txt>
            <Txt size={13} weight="semibold" color="rgba(16,16,18,0.65)" style={{ marginTop: 2 }}>
              {t('habits.longestStreak')}{' '}
              <Txt size={13} weight="black" color={ink[900]}>
                {bestStreak} {t('common.day')}
              </Txt>
            </Txt>
          </View>
        </View>
      </Card>

      {/* habit cards */}
      <View style={{ gap: 10, marginTop: 16 }}>
        {habits.map((h) => {
          // rotate week (last 7 days ending today) so it displays Mon..Sun
          const display: (0 | 1 | null)[] = Array(7).fill(null);
          h.week.forEach((v, i) => {
            const pos = (todayIdx - (6 - i) + 7) % 7;
            display[pos] = v as 0 | 1;
          });
          return (
            <Pressable
              key={h.id}
              onLongPress={() => confirmDelete(h.id, h.name)}
              style={[
                {
                  backgroundColor: c.surfaceCard,
                  borderWidth: 1,
                  borderColor: c.borderSubtle,
                  borderRadius: radius.lg,
                  padding: 14,
                },
                shadows.xs,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: c.surfaceSunken,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={h.icon} size={20} color={h.color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={14.5} weight="bold" color={c.textStrong}>
                    {h.name}
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Icon name="flame" size={12} color={h.streak > 0 ? status.amber500 : c.textMuted} />
                    <Txt size={12} color={c.textMuted}>
                      {t('habits.streakDays', { n: h.streak })}
                    </Txt>
                  </View>
                </View>
                <Switch checked={h.today} onChange={() => toggleHabitToday(h.id)} />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingLeft: 2,
                }}
              >
                {display.map((d, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 5 }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: d ? h.color : c.controlTrack,
                        borderWidth: 2,
                        borderColor: i === todayIdx ? c.textStrong : 'transparent',
                      }}
                    >
                      {d ? <Icon name="check" size={13} color={white} strokeWidth={3} /> : null}
                    </View>
                    <Txt size={10} weight="bold" color={i === todayIdx ? c.textStrong : c.textMuted}>
                      {letters[i]}
                    </Txt>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* add habit */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('habits.addHabit')}>
        <Input label={t('habits.habitName')} value={name} onChangeText={setName} autoFocus />
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {HABIT_ICONS.map((ic, i) => (
            <Pressable
              key={ic}
              onPress={() => setIconIdx(i)}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                backgroundColor: i === iconIdx ? c.accent : c.surfaceSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={ic} size={20} color={i === iconIdx ? ink[900] : c.textMuted} />
            </Pressable>
          ))}
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
