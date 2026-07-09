import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { addDays, isoDate } from '@/data/db';
import { useI18n } from '@/i18n/useI18n';
import { cancelReminders, scheduleHMinusReminders } from '@/services/notifications';
import type { ScreenProps } from '@/shell/AppShell';
import { useSettings } from '@/stores/appStore';
import { Milestone, useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { space, status as st, white } from '@/theme/tokens';
import { Badge, BadgeTone } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState, Eyebrow, ScreenTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

export function Timeline({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const notifEnabled = useSettings((s) => s.notif);
  const { activeProject, milestones, addMilestone, setMilestoneStatus, deleteMilestone } = useWork();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(isoDate(addDays(new Date(), 14)));

  if (!activeProject) {
    return (
      <View style={{ flex: 1, paddingHorizontal: space.screenPad, paddingTop: 20 }}>
        <Eyebrow>{t('tl.eyebrow')}</Eyebrow>
        <EmptyState icon="calendar" text={t('work.needProject')} />
        <Button variant="primary" full icon="briefcase" onPress={() => go('whome')}>
          {t('work.goToProjects')}
        </Button>
      </View>
    );
  }

  const statusMeta: Record<Milestone['status'], { dot: string; bar: string; label: string; tone: BadgeTone }> = {
    done: { dot: st.green500, bar: st.green500, label: t('tl.status.done'), tone: 'success' },
    active: { dot: c.accent, bar: c.accent, label: t('tl.status.active'), tone: 'accent' },
    todo: { dot: c.borderStrong, bar: c.controlTrack, label: t('tl.status.todo'), tone: 'neutral' },
  };

  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });

  // month range label for the gantt card
  const dates = milestones.map((m) => new Date(`${m.date}T00:00:00`));
  const rangeLabel =
    dates.length > 0
      ? `${dates[0].toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short' })} — ${dates[dates.length - 1].toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' })}`
      : '';

  const submit = async () => {
    if (!title.trim() || !date.trim()) return;
    let notifIds: string[] | null = null;
    if (notifEnabled) {
      notifIds = await scheduleHMinusReminders(title.trim(), date.trim(), {
        h3: `H-3: ${title.trim()} — ${fmtDate(date.trim())}`,
        h1: `H-1: ${title.trim()} — ${fmtDate(date.trim())}`,
      });
      if (notifIds.length > 0) toast(t('tl.notifScheduled'));
    }
    addMilestone(title.trim(), date.trim(), notifIds);
    setTitle('');
    setAdding(false);
  };

  const cycleStatus = (m: Milestone) => {
    const next: Milestone['status'] = m.status === 'todo' ? 'active' : m.status === 'active' ? 'done' : 'todo';
    setMilestoneStatus(m.id, next);
  };

  const confirmDelete = (m: Milestone) => {
    Alert.alert(m.title, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          cancelReminders(m.notifIds);
          deleteMilestone(m.id);
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        eyebrow={t('tl.eyebrow')}
        title={activeProject.name}
        right={<IconButton icon="plus" variant="dark" onPress={() => setAdding(true)} accessibilityLabel={t('tl.addMilestone')} />}
      />

      {milestones.length > 0 && (
        <Txt size={11.5} color={c.textMuted} style={{ marginBottom: 10 }}>
          {t('common.holdToDelete')}
        </Txt>
      )}

      {/* mini gantt */}
      <Card tone="dark" pad="lg" radius="xl">
        <Txt size={12} weight="bold" color={c.textOnDarkMuted} style={{ marginBottom: 14 }}>
          {rangeLabel}
        </Txt>
        <View style={{ gap: 12 }}>
          {milestones.map((m) => (
            <View
              key={m.id}
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: `${m.barStart}%`,
                  width: `${m.barEnd - m.barStart}%`,
                  top: 0,
                  bottom: 0,
                  backgroundColor: m.status === 'todo' ? 'rgba(255,255,255,0.18)' : statusMeta[m.status].bar,
                  borderRadius: 6,
                }}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* milestone list */}
      <View style={{ marginTop: 22 }}>
        {milestones.length === 0 && <EmptyState icon="calendar" text={t('tl.empty')} />}
        {milestones.map((m, i) => {
          const meta = statusMeta[m.status];
          return (
            <View key={m.id} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ width: 22, alignItems: 'center' }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: meta.dot,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  {m.status === 'done' && <Icon name="check" size={11} color={white} strokeWidth={3} />}
                </View>
                {i < milestones.length - 1 && (
                  <View style={{ flex: 1, width: 2, backgroundColor: c.borderStrong }} />
                )}
              </View>
              <Pressable
                onPress={() => cycleStatus(m)}
                onLongPress={() => confirmDelete(m)}
                style={{ flex: 1, paddingBottom: 18 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Txt size={15} weight="black" color={c.textStrong} style={{ flex: 1 }}>
                    {m.title}
                  </Txt>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name="calendar" size={13} color={c.textMuted} />
                    <Txt size={12.5} weight="semibold" color={c.textMuted}>
                      {fmtDate(m.date)}
                    </Txt>
                  </View>
                  {!!m.notifIds?.length && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon name="bell" size={13} color={st.amber500} />
                      <Txt size={12} weight="bold" color={c.warningFg}>
                        {t('tl.notif', { n: 'H-3 / H-1' })}
                      </Txt>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* add milestone sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('tl.addMilestone')}>
        <Input label={t('tl.msTitle')} value={title} onChangeText={setTitle} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('tl.msDate')} value={date} onChangeText={setDate} placeholder="2026-07-20" />
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="bell" size={14} color={c.textMuted} />
          <Txt size={12} color={c.textMuted}>
            {t('set.notifSub')}
          </Txt>
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
