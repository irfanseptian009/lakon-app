import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { isoDate, addDays } from '@/data/db';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useSettings } from '@/stores/appStore';
import { useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadows, space, status } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { DashedAdd, SectionTitle } from '@/ui/common';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { ProgressBar } from '@/ui/ProgressBar';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

export function WorkDashboard({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const userName = useSettings((s) => s.userName);
  const { projects, activeProject, cards, milestones, sops, loadSop, addProject, setActiveProject } = useWork();
  // snapshot the clock once per mount so render stays pure
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState('');

  const byCol = (col: string) => cards.filter((card) => card.col === col).length;
  const doneN = byCol('done');
  const progress = cards.length ? Math.round((doneN / cards.length) * 100) : 0;

  const daysToDeadline = activeProject?.deadline
    ? Math.ceil((new Date(`${activeProject.deadline}T00:00:00`).getTime() - now) / 86400000)
    : null;

  const submitProject = () => {
    if (!name.trim()) return;
    addProject(name.trim(), isoDate(addDays(new Date(), 30)));
    setName('');
    setAdding(false);
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
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Avatar name={userName} size={48} status="online" />
          <View>
            <Txt size={13} weight="semibold" color={c.textMuted}>
              {t('work.mode')}
            </Txt>
            <Txt size={18} weight="black" color={c.textStrong} letterSpacing={-0.18}>
              {t('work.activeProjects', { n: projects.length })}
            </Txt>
          </View>
        </Pressable>
        <IconButton icon="bell" dot accessibilityLabel="Notifikasi" />
      </View>

      {/* featured project */}
      <Pressable onPress={() => go('board')}>
        <Card tone="dark" pad="lg" radius="xl">
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={13} weight="semibold" color={c.textOnDarkMuted}>
                {t('work.mainProject')}
              </Txt>
              <Txt size={22} weight="black" color={c.textOnDark} style={{ marginTop: 2 }} numberOfLines={1}>
                {activeProject?.name ?? '—'}
              </Txt>
            </View>
            {daysToDeadline != null && daysToDeadline >= 0 && (
              <Badge tone="warning">H-{daysToDeadline}</Badge>
            )}
          </View>
          <View style={{ marginTop: 18 }}>
            <ProgressBar value={progress} onDark label={t('work.taskProgress')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 16 }}>
            <Txt size={12.5} color={c.textOnDarkMuted}>
              <Txt size={12.5} weight="black" color={c.textOnDark}>
                {byCol('todo')}
              </Txt>{' '}
              {t('work.todo')}
            </Txt>
            <Txt size={12.5} color={c.textOnDarkMuted}>
              <Txt size={12.5} weight="black" color={c.accent}>
                {byCol('doing')}
              </Txt>{' '}
              {t('work.doing')}
            </Txt>
            <Txt size={12.5} color={c.textOnDarkMuted}>
              <Txt size={12.5} weight="black" color={c.textOnDark}>
                {byCol('waiting')}
              </Txt>{' '}
              {t('work.waiting')}
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* quick nav tiles */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Pressable
          onPress={() => go('board')}
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
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.sm,
              backgroundColor: c.lime100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="bar-chart" size={20} color={c.limeText} />
          </View>
          <Txt size={15} weight="black" color={c.textStrong} style={{ marginTop: 10 }}>
            {t('work.taskBoard')}
          </Txt>
          <Txt size={12} color={c.textMuted}>
            {t('work.kanbanSub')}
          </Txt>
        </Pressable>
        <Pressable
          onPress={() => go('timeline')}
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
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.sm,
              backgroundColor: c.blue50,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="calendar" size={20} color={status.blue500} />
          </View>
          <Txt size={15} weight="black" color={c.textStrong} style={{ marginTop: 10 }}>
            {t('work.timeline')}
          </Txt>
          <Txt size={12} color={c.textMuted}>
            {t('work.milestonesSub', { n: milestones.length })}
          </Txt>
        </Pressable>
      </View>

      {/* SOP templates */}
      <SectionTitle style={{ marginTop: 24, marginBottom: 12 }}>{t('work.sop')}</SectionTitle>
      <View style={{ gap: 10 }}>
        {sops.map((s) => (
          <View
            key={s.id}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: c.surfaceCard,
                borderWidth: 1,
                borderColor: c.borderSubtle,
                borderRadius: radius.md,
                padding: 12,
              },
              shadows.xs,
            ]}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.sm,
                backgroundColor: c.surfaceSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={s.icon as never} size={20} color={c.textBody} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={14.5} weight="bold" color={c.textStrong}>
                {s.name}
              </Txt>
              <Txt size={12} color={c.textMuted}>
                {t('work.sopItems', { n: s.items.length })}
              </Txt>
            </View>
            <Chip
              tone="accent"
              size="sm"
              icon="plus"
              onPress={() => {
                const loaded = loadSop(s.id);
                if (loaded) toast(t('work.sopLoaded', { name: loaded }));
              }}
            >
              {t('work.load')}
            </Chip>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <DashedAdd label={t('work.newProject')} onPress={() => setAdding(true)} />
      </View>

      {/* project switcher sheet */}
      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title={t('work.mainProject')}>
        <View style={{ gap: 8 }}>
          {projects.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setActiveProject(p.id);
                setPickerOpen(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: radius.md,
                borderWidth: p.id === activeProject?.id ? 2 : 1,
                borderColor: p.id === activeProject?.id ? c.accent : c.borderSubtle,
                backgroundColor: c.surfaceCard,
              }}
            >
              <Icon name="briefcase" size={18} color={c.textStrong} />
              <Txt size={15} weight="bold" color={c.textStrong} style={{ flex: 1 }}>
                {p.name}
              </Txt>
              {p.id === activeProject?.id && <Icon name="check" size={18} color={c.limeText} />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* new project sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('work.newProject')}>
        <Input label={t('work.projectName')} value={name} onChangeText={setName} autoFocus />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitProject}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
