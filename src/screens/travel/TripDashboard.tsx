import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { addDays, db, isoDate } from '@/data/db';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useSettings } from '@/stores/appStore';
import { useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, space } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { DashedAdd, EmptyState, SectionTitle } from '@/ui/common';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { ListRow } from '@/ui/ListRow';
import { ProgressBar } from '@/ui/ProgressBar';
import { Sheet } from '@/ui/Sheet';
import { StatCard } from '@/ui/StatCard';
import { Txt } from '@/ui/Txt';

/** Weekly prep bars — real activity: habit logs + agenda done + focus sessions per day. */
function useWeekBars() {
  return useMemo(() => {
    const today = new Date();
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = isoDate(addDays(today, -i));
      const habitN = db.getFirstSync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM habit_logs WHERE date = ?', day
      )!.n;
      const focusN = db.getFirstSync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM focus_sessions WHERE date = ?', day
      )!.n;
      const agendaN = db.getFirstSync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM agenda WHERE date = ? AND done = 1', day
      )!.n;
      counts.push(habitN + focusN + agendaN);
    }
    const max = Math.max(1, ...counts);
    const labelsId = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const jsDay = new Date().getDay();
    const todayIdx = (jsDay + 6) % 7;
    return counts.map((v, i) => {
      const weekdayIdx = (todayIdx - (6 - i) + 7) % 7;
      return {
        label: labelsId[weekdayIdx],
        pct: Math.max(10, Math.round((v / max) * 100)),
        hot: v === max && v > 0,
      };
    });
  }, []);
}

function WeekBars() {
  const { c } = useTheme();
  const bars = useWeekBars();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 150, marginTop: 18 }}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8, height: '100%' }}>
          <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
            <View
              style={{
                width: '100%',
                height: `${b.pct}%`,
                minHeight: 8,
                backgroundColor: b.hot ? c.accent : ink[700],
                borderRadius: radius.pill,
              }}
            />
          </View>
          <Txt size={11} weight="semibold" color={c.textOnDarkMuted}>
            {b.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function TripDashboard({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const userName = useSettings((s) => s.userName);
  const { trip, packing, pretrip, itinerary, addTrip } = useTravel();
  // snapshot the clock once per mount so render stays pure
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [dest, setDest] = useState('');
  const [start, setStart] = useState(isoDate(addDays(new Date(), 7)));
  const [days, setDays] = useState('3');
  const [budget, setBudget] = useState('10000000');

  const packDone = packing.filter((p) => p.checked).length;
  const packPct = packing.length ? Math.round((packDone / packing.length) * 100) : 0;
  const checkDone = packDone + pretrip.filter((x) => x.done).length;
  const checkTotal = packing.length + pretrip.length;

  const daysLeft = trip
    ? Math.ceil((new Date(`${trip.startDate}T00:00:00`).getTime() - now) / 86400000)
    : 0;

  const budgetJt = trip ? (trip.budgetTotal / 1000000).toFixed(1).replace('.', ',') : '0';

  const upcoming = itinerary.slice(0, 2);
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? t('daily.goodMorning') : hour < 15 ? t('daily.goodAfternoon') : hour < 19 ? t('daily.goodEvening') : t('daily.goodNight');

  const submitTrip = () => {
    if (!name.trim()) return;
    addTrip(name.trim(), dest.trim(), start.trim(), Math.max(1, Number(days) || 3), Number(budget) || 0);
    setAdding(false);
    setName('');
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
          <Avatar name={userName} size={48} status="accent" />
          <View>
            <Txt size={13} weight="semibold" color={c.textMuted}>
              {greeting}
            </Txt>
            <Txt size={18} weight="black" color={c.textStrong} letterSpacing={-0.18}>
              {userName}
            </Txt>
          </View>
        </View>
        <IconButton icon="bell" dot accessibilityLabel="Notifikasi" />
      </View>

      {trip ? (
        <>
          {/* countdown + prep chart */}
          <Card tone="dark" pad="lg" radius="xl">
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View>
                <Txt size={13} weight="semibold" color={c.textOnDarkMuted}>
                  {t('trip.prepThisWeek')}
                </Txt>
                <Txt size={22} weight="black" color={c.textOnDark} style={{ marginTop: 2 }}>
                  {trip.name}
                </Txt>
              </View>
              <Badge tone="accent">
                {daysLeft > 0 ? t('trip.daysLeft', { n: daysLeft }) : t('trip.departed')}
              </Badge>
            </View>
            <WeekBars />
            <Pressable onPress={() => go('pack')} style={{ marginTop: 18 }}>
              <ProgressBar value={packPct} onDark label={t('trip.packing')} />
            </Pressable>
          </Card>

          {/* stat tiles */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <StatCard label={t('trip.totalBudget')} value={budgetJt} unit="jt" tone="accent" icon="wallet" />
            <Pressable onPress={() => go('pack')} style={{ flex: 1 }}>
              <StatCard
                label={t('trip.checklist')}
                value={`${checkDone}/${checkTotal}`}
                tone="plain"
                icon="check"
                style={{ flex: 1 }}
              />
            </Pressable>
          </View>

          {/* upcoming */}
          <SectionTitle
            action={t('common.seeAll')}
            onAction={() => go('trips')}
            style={{ marginTop: 24, marginBottom: 12 }}
          >
            {t('trip.upcoming')}
          </SectionTitle>
          <View style={{ gap: 12 }}>
            {upcoming.length === 0 && <EmptyState icon="calendar" text={t('trip.emptyUpcoming')} />}
            {upcoming.map((it) => (
              <ListRow
                key={it.id}
                thumbIcon={it.icon as never}
                title={it.title}
                subtitle={it.place}
                onPress={() => go('trips')}
                stats={
                  it.pnr
                    ? [
                        { value: it.time, label: 'Boarding' },
                        { value: it.gate ?? '—', label: 'Gate · Kursi' },
                        { value: `H${it.day}`, label: t('itin.day', { n: it.day }) },
                      ]
                    : [
                        { value: it.time, label: 'Jam' },
                        { value: `H${it.day}`, label: t('itin.day', { n: it.day }) },
                      ]
                }
              />
            ))}
          </View>
        </>
      ) : (
        <EmptyState icon="plane" text={t('trip.emptyUpcoming')} />
      )}

      <View style={{ marginTop: 16 }}>
        <DashedAdd label={t('trip.newTrip')} onPress={() => setAdding(true)} />
      </View>

      {/* new trip sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('trip.newTrip')}>
        <Input label={t('trip.tripName')} value={name} onChangeText={setName} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('trip.destination')} value={dest} onChangeText={setDest} />
        <View style={{ height: 12 }} />
        <Input label={t('trip.startDate')} value={start} onChangeText={setStart} placeholder="2026-07-20" />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            label={t('trip.days')}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            style={{ flex: 1 }}
          />
          <Input
            label={t('trip.budget')}
            value={budget}
            onChangeText={setBudget}
            keyboardType="number-pad"
            style={{ flex: 2 }}
          />
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="arrow-right" onPress={submitTrip}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
