import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { ItineraryItem, useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, space } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { Txt } from '@/ui/Txt';

function TransitField({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(16,16,18,0.06)',
        borderRadius: radius.sm,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <Txt size={10} weight="bold" color="rgba(16,16,18,0.5)" letterSpacing={0.5}>
        {label}
      </Txt>
      <Txt size={14} weight="monoBold" color={ink[900]}>
        {value}
      </Txt>
    </View>
  );
}

function TimeBlock({
  item,
  isLast,
  onLongPress,
}: {
  item: ItineraryItem;
  isLast: boolean;
  onLongPress: () => void;
}) {
  const { c } = useTheme();
  const { t } = useI18n();
  const accent = item.tone === 'accent';

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {/* time gutter */}
      <View style={{ width: 52, alignItems: 'flex-end', paddingTop: 2 }}>
        <Txt size={14} weight="monoBold" color={c.textStrong}>
          {item.time}
        </Txt>
      </View>
      {/* rail */}
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            marginTop: 4,
            backgroundColor: accent ? c.accent : c.borderStrong,
            borderWidth: 2,
            borderColor: c.surfaceCard,
          }}
        />
        {!isLast && <View style={{ flex: 1, width: 2, backgroundColor: c.borderSubtle, marginTop: 2 }} />}
      </View>
      {/* card */}
      <Pressable onLongPress={onLongPress} style={{ flex: 1, paddingBottom: 16 }}>
        <Card tone={accent ? 'accent' : 'light'} pad="md" radius="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: radius.sm,
                backgroundColor: accent ? 'rgba(16,16,18,0.12)' : c.surfaceSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={item.icon as never} size={18} color={accent ? ink[900] : c.textMuted} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={15.5} weight="black" color={accent ? ink[900] : c.textStrong}>
                {item.title}
              </Txt>
              <Txt size={12.5} weight="semibold" color={accent ? 'rgba(16,16,18,0.6)' : c.textMuted}>
                {item.place}
              </Txt>
            </View>
          </View>
          {(item.pnr || item.gate) && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {item.pnr && <TransitField label={t('itin.pnr')} value={item.pnr} />}
              {item.gate && <TransitField label={t('itin.gateSeat')} value={item.gate} />}
            </View>
          )}
        </Card>
      </Pressable>
    </View>
  );
}

export function ItineraryBuilder(_: ScreenProps) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const { trip, itinerary, dayNotes, addItineraryItem, deleteItineraryItem, setDayNote } = useTravel();
  const [day, setDay] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editNote, setEditNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [form, setForm] = useState({ title: '', place: '', time: '', pnr: '', gate: '', accent: false });

  const days = trip?.days ?? 3;
  const dayOptions = Array.from({ length: days }, (_, i) => ({
    value: String(i + 1),
    label: t('itin.day', { n: i + 1 }),
  }));
  const items = itinerary.filter((i) => i.day === day);
  const note = dayNotes[day];

  const dayDate = trip
    ? new Date(new Date(`${trip.startDate}T00:00:00`).getTime() + (day - 1) * 86400000)
    : new Date();
  const dayLabel = dayDate.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const submit = () => {
    if (!form.title.trim()) return;
    addItineraryItem({
      day,
      time: form.time.trim() || '08:00',
      title: form.title.trim(),
      place: form.place.trim(),
      icon: form.pnr ? 'plane' : 'map-pin',
      tone: form.accent ? 'accent' : 'plain',
      pnr: form.pnr.trim() || null,
      gate: form.gate.trim() || null,
    });
    setForm({ title: '', place: '', time: '', pnr: '', gate: '', accent: false });
    setAdding(false);
  };

  const confirmDelete = (item: ItineraryItem) => {
    Alert.alert(item.title, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteItineraryItem(item.id) },
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
          paddingBottom: 14,
        }}
      >
        <View style={{ width: 44 }} />
        <View style={{ alignItems: 'center' }}>
          <Txt size={17} weight="black" color={c.textStrong}>
            {trip?.name ?? '—'}
          </Txt>
          <Txt size={12} weight="semibold" color={c.textMuted}>
            {trip?.tzLabel ?? ''}
          </Txt>
        </View>
        <IconButton icon="plus" variant="dark" onPress={() => setAdding(true)} accessibilityLabel={t('itin.addActivity')} />
      </View>

      {/* day tabs */}
      {days > 5 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedControl tone="dark" options={dayOptions} value={String(day)} onChange={(v) => setDay(Number(v))} />
        </ScrollView>
      ) : (
        <SegmentedControl
          full
          tone="dark"
          options={dayOptions}
          value={String(day)}
          onChange={(v) => setDay(Number(v))}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 14 }}>
        <Txt size={15} weight="black" color={c.textStrong}>
          {dayLabel}
        </Txt>
        <Badge tone="neutral">{t('itin.activities', { n: items.length })}</Badge>
      </View>

      {/* timeline */}
      {items.length === 0 && <EmptyState icon="calendar" text={t('itin.empty')} />}
      {items.map((item, i) => (
        <TimeBlock key={item.id} item={item} isLast={i === items.length - 1} onLongPress={() => confirmDelete(item)} />
      ))}

      {/* offline routing note */}
      <Pressable
        onPress={() => {
          setNoteDraft(note ?? '');
          setEditNote(true);
        }}
      >
        <Card tone="sunken" pad="md" radius="lg" style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="map" size={16} color={c.textMuted} />
            <Txt size={12} weight="black" color={c.textMuted} caps>
              {t('itin.manualRoute')}
            </Txt>
            <View style={{ flex: 1 }} />
            <Icon name="pencil" size={14} color={c.textMuted} />
          </View>
          <Txt size={13.5} color={c.textBody} lineHeight={20}>
            {note || t('itin.routeNote')}
          </Txt>
        </Card>
      </Pressable>

      {/* add activity sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('itin.addActivity')}>
        <Input label={t('itin.actTitle')} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('itin.actPlace')} value={form.place} onChangeText={(v) => setForm({ ...form, place: v })} />
        <View style={{ height: 12 }} />
        <Input label={t('itin.actTime')} value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} placeholder="08:15" />
        <View style={{ height: 14 }} />
        <Txt size={12} weight="black" color={c.textMuted} caps style={{ marginBottom: 8 }}>
          {t('itin.transit')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            label={t('itin.pnrField')}
            value={form.pnr}
            onChangeText={(v) => setForm({ ...form, pnr: v })}
            autoCapitalize="characters"
            style={{ flex: 1 }}
          />
          <Input
            label={t('itin.gateField')}
            value={form.gate}
            onChangeText={(v) => setForm({ ...form, gate: v })}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={14} weight="semibold" color={c.textStrong}>
            {t('itin.highlight')}
          </Txt>
          <Switch checked={form.accent} onChange={(v) => setForm({ ...form, accent: v })} />
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* edit routing note sheet */}
      <Sheet visible={editNote} onClose={() => setEditNote(false)} title={t('itin.manualRoute')}>
        <Input
          label={t('itin.routeNote')}
          value={noteDraft}
          onChangeText={setNoteDraft}
          multiline
          autoFocus
        />
        <View style={{ height: 16 }} />
        <Button
          variant="primary"
          full
          icon="check"
          onPress={() => {
            setDayNote(day, noteDraft);
            setEditNote(false);
          }}
        >
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
