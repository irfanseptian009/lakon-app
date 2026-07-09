import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useNav } from '@/stores/navStore';
import { useSettings } from '@/stores/appStore';
import { AgendaItem, useDaily } from '@/stores/dailyStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, status, white } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Card } from '@/ui/Card';
import { DashedAdd, EmptyState, SectionTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Ring } from '@/ui/Ring';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Sheet } from '@/ui/Sheet';
import { Txt } from '@/ui/Txt';
import { Button } from '@/ui/Button';

const AREA_META = {
  daily: { label: 'Harian', fgKey: 'limeText' as const, bgKey: 'lime100' as const },
  work: { label: 'Work', fgKey: 'infoFg' as const, bgKey: 'blue50' as const },
  travel: { label: 'Travel', fgKey: 'warningFg' as const, bgKey: 'amber50' as const },
};

export function DailyToday({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const userName = useSettings((s) => s.userName);
  const avatarUri = useSettings((s) => s.avatarUri);
  const { habits, agenda, toggleAgenda, deleteAgenda, addAgenda } = useDaily();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [area, setArea] = useState<AgendaItem['area']>('daily');

  const doneAgenda = agenda.filter((a) => a.done).length;
  const doneHabits = habits.filter((h) => h.today).length;
  const totalUnits = agenda.length + habits.length;
  const score = totalUnits === 0 ? 0 : Math.round(((doneAgenda + doneHabits) / totalUnits) * 100);
  const habitsLeft = habits.length - doneHabits;

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? t('daily.goodMorning') : hour < 15 ? t('daily.goodAfternoon') : hour < 19 ? t('daily.goodEvening') : t('daily.goodNight');
  const dateLabel = new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const nowIdx = agenda.findIndex((a) => !a.done);
  const firstName = userName.split(' ')[0];
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const miniRingColors = [status.blue500, status.green500, status.amber500];

  const submit = () => {
    const tt = title.trim();
    if (!tt) return;
    addAgenda(tt, time.trim() || '09:00', area);
    setTitle('');
    setTime('');
    setAdding(false);
  };

  const confirmDelete = (id: number) => {
    Alert.alert(t('common.delete'), t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteAgenda(id) },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 18,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar name={userName} uri={avatarUri} size={48} status="accent" />
          <View>
            <Txt size={13} weight="semibold" color={c.textMuted}>
              {dateLabel}
            </Txt>
            <Txt size={18} weight="black" color={c.textStrong} letterSpacing={-0.18}>
              {greeting}, {firstName}
            </Txt>
          </View>
        </View>
        <IconButton
          icon="bell"
          onPress={() => useNav.getState().openSettings()}
          accessibilityLabel={t('common.notifications')}
        />
      </View>

      {/* daily score + habit rings */}
      <Card tone="dark" pad="lg" radius="xl">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Ring value={score} size={104} thickness={11} color={c.accent} trackColor="rgba(255,255,255,0.12)">
            <Txt size={26} weight="black" color={white}>
              {score}%
            </Txt>
            <Txt size={10.5} color={c.textOnDarkMuted} style={{ marginTop: 2 }}>
              {t('daily.todayRing')}
            </Txt>
          </Ring>
          <View style={{ flex: 1 }}>
            <Txt size={16} weight="black" color={white}>
              {t('daily.onTrack')}
            </Txt>
            <Txt size={12.5} color={c.textOnDarkMuted} lineHeight={17.5} style={{ marginTop: 3 }}>
              {t('daily.summary', { done: doneAgenda, total: agenda.length, habits: habitsLeft })}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 14 }}>
              {habits.slice(0, 3).map((h, i) => {
                const weekPct = Math.round((h.week.reduce((a, b) => a + b, 0) / 7) * 100);
                return (
                  <View key={h.id} style={{ alignItems: 'center', gap: 5 }}>
                    <Ring
                      value={weekPct}
                      size={40}
                      thickness={5}
                      color={miniRingColors[i % 3]}
                      trackColor="rgba(255,255,255,0.12)"
                    >
                      <Txt size={9} weight="black" color={white}>
                        {weekPct}
                      </Txt>
                    </Ring>
                    <Txt size={10} weight="semibold" color={c.textOnDarkMuted}>
                      {h.name.split(' ')[0]}
                    </Txt>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Card>

      {/* quick actions */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Pressable
          onPress={() => go('focus')}
          style={{ flex: 1, backgroundColor: c.surfaceAccent, borderRadius: radius.lg, padding: 16 }}
        >
          <Icon name="clock" size={22} color={ink[900]} />
          <Txt size={15} weight="black" color={ink[900]} style={{ marginTop: 10 }}>
            {t('daily.startFocus')}
          </Txt>
          <Txt size={12} color="rgba(16,16,18,0.6)">
            {t('daily.focusSub')}
          </Txt>
        </Pressable>
        <Pressable
          onPress={() => go('habits')}
          style={[
            {
              flex: 1,
              backgroundColor: c.surfaceCard,
              borderWidth: 1,
              borderColor: c.borderSubtle,
              borderRadius: radius.lg,
              padding: 16,
            },
            shadows.sm,
          ]}
        >
          <Icon name="flame" size={22} color={c.textStrong} />
          <Txt size={15} weight="black" color={c.textStrong} style={{ marginTop: 10 }}>
            {t('daily.habits')}
          </Txt>
          <Txt size={12} color={c.textMuted}>
            {t('daily.streakSub', { n: bestStreak })}
          </Txt>
        </Pressable>
      </View>

      {/* agenda timeline */}
      <SectionTitle style={{ marginTop: 24, marginBottom: 14 }}>{t('daily.agendaToday')}</SectionTitle>
      {agenda.length === 0 && <EmptyState icon="calendar" text={t('daily.emptyAgenda')} />}
      {agenda.map((a, i) => {
        const isNow = i === nowIdx && !a.done;
        const meta = AREA_META[a.area];
        return (
          <View key={a.id} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: 46, alignItems: 'flex-end', paddingTop: 1 }}>
              <Txt size={13} weight="monoBold" color={isNow ? c.limeText : c.textMuted}>
                {a.time}
              </Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  marginTop: 3,
                  backgroundColor: a.done ? status.green500 : isNow ? c.accent : c.surfaceCard,
                  borderWidth: a.done || isNow ? 3 : 2,
                  borderColor: a.done || isNow ? c.surfaceCard : c.borderStrong,
                }}
              />
              {i < agenda.length - 1 && (
                <View style={{ flex: 1, width: 2, backgroundColor: c.borderSubtle, marginTop: 2 }} />
              )}
            </View>
            <Pressable
              onPress={() => toggleAgenda(a.id)}
              onLongPress={() => confirmDelete(a.id)}
              style={{ flex: 1, paddingBottom: 16 }}
            >
              <View
                style={[
                  isNow
                    ? {
                        backgroundColor: c.surfaceCard,
                        borderWidth: 1,
                        borderColor: c.accent,
                        borderRadius: radius.md,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                      }
                    : {},
                  isNow ? shadows.sm : {},
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <Txt
                    size={14.5}
                    weight="bold"
                    color={a.done ? c.textMuted : c.textStrong}
                    style={{
                      flex: 1,
                      textDecorationLine: a.done ? 'line-through' : 'none',
                    }}
                  >
                    {a.title}
                  </Txt>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.pill,
                      backgroundColor: c[meta.bgKey],
                    }}
                  >
                    <Txt size={10.5} weight="black" color={c[meta.fgKey]}>
                      {meta.label}
                    </Txt>
                  </View>
                </View>
                {isNow && (
                  <Txt size={11.5} weight="bold" color={c.limeText} style={{ marginTop: 4 }}>
                    {t('daily.inProgress')}
                  </Txt>
                )}
              </View>
            </Pressable>
          </View>
        );
      })}

      <DashedAdd label={t('daily.addAgenda')} onPress={() => setAdding(true)} />

      {/* add agenda sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('daily.addAgenda')}>
        <Input label={t('daily.agendaTitle')} value={title} onChangeText={setTitle} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('daily.time')} value={time} onChangeText={setTime} placeholder="07:00" />
        <View style={{ height: 12 }} />
        <Txt size={13} weight="semibold" color={c.textStrong} style={{ marginBottom: 8 }}>
          {t('daily.area')}
        </Txt>
        <SegmentedControl
          full
          tone="dark"
          options={[
            { value: 'daily', label: t('ws.daily') },
            { value: 'travel', label: t('ws.travel') },
            { value: 'work', label: t('ws.work') },
          ]}
          value={area}
          onChange={setArea}
        />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
