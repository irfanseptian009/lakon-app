import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { pickAndCacheImage } from '@/services/media';
import { useSettings } from '@/stores/appStore';
import { useNav } from '@/stores/navStore';
import { SopTemplate, useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, status } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { DashedAdd, EmptyState, SectionTitle } from '@/ui/common';
import { Chip } from '@/ui/Chip';
import { Icon, IconName } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { ProgressBar } from '@/ui/ProgressBar';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

const SOP_ICONS: IconName[] = ['briefcase', 'camera', 'package', 'file-text', 'calendar', 'check', 'star', 'zap'];

export function WorkDashboard({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const userName = useSettings((s) => s.userName);
  const avatarUri = useSettings((s) => s.avatarUri);
  const {
    projects, activeProject, cards, milestones, sops, loadSop, addProject, setActiveProject,
    addSopTemplate, updateSopTemplate, deleteSopTemplate,
  } = useWork();
  // snapshot the clock once per mount so render stays pure
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);

  const [sopManageOpen, setSopManageOpen] = useState(false);
  const [sopFormOpen, setSopFormOpen] = useState(false);
  const [sopForm, setSopForm] = useState<{ id: number | null; name: string; icon: IconName; items: string[] }>({
    id: null, name: '', icon: SOP_ICONS[0], items: [],
  });
  const [sopItemDraft, setSopItemDraft] = useState('');

  const byCol = (col: string) => cards.filter((card) => card.col === col).length;
  const doneN = byCol('done');
  const progress = cards.length ? Math.round((doneN / cards.length) * 100) : 0;

  const daysToDeadline = activeProject?.deadline
    ? Math.ceil((new Date(`${activeProject.deadline}T00:00:00`).getTime() - now) / 86400000)
    : null;

  const submitProject = () => {
    if (!name.trim()) return;
    addProject(name.trim(), deadline.trim() || null, coverUri);
    setName('');
    setDeadline('');
    setCoverUri(null);
    setAdding(false);
  };

  const pickCover = async () => {
    const uri = await pickAndCacheImage('projects');
    if (uri) setCoverUri(uri);
  };

  const openNewSop = () => {
    setSopForm({ id: null, name: '', icon: SOP_ICONS[0], items: [] });
    setSopItemDraft('');
    setSopManageOpen(false);
    setSopFormOpen(true);
  };

  const openEditSop = (s: SopTemplate) => {
    setSopForm({ id: s.id, name: s.name, icon: s.icon as IconName, items: [...s.items] });
    setSopItemDraft('');
    setSopManageOpen(false);
    setSopFormOpen(true);
  };

  const addSopItem = () => {
    const v = sopItemDraft.trim();
    if (!v) return;
    setSopForm((f) => ({ ...f, items: [...f.items, v] }));
    setSopItemDraft('');
  };

  const removeSopItem = (idx: number) => {
    setSopForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const submitSop = () => {
    const nm = sopForm.name.trim();
    if (!nm || sopForm.items.length === 0) return;
    if (sopForm.id != null) updateSopTemplate(sopForm.id, nm, sopForm.icon, sopForm.items);
    else addSopTemplate(nm, sopForm.icon, sopForm.items);
    setSopFormOpen(false);
  };

  const confirmDeleteSop = (s: SopTemplate) => {
    Alert.alert(s.name, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteSopTemplate(s.id) },
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
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Avatar name={userName} uri={avatarUri} size={48} status="online" />
          <View>
            <Txt size={13} weight="semibold" color={c.textMuted}>
              {t('work.mode')}
            </Txt>
            <Txt size={18} weight="black" color={c.textStrong} letterSpacing={-0.18}>
              {t('work.activeProjects', { n: projects.length })}
            </Txt>
          </View>
        </Pressable>
        <IconButton
          icon="bell"
          onPress={() => useNav.getState().openSettings()}
          accessibilityLabel={t('common.notifications')}
        />
      </View>

      {/* featured project */}
      <Pressable onPress={() => go('board')}>
        <Card tone="dark" pad="lg" radius="xl" bgImageUri={activeProject?.coverUri}>
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
      <SectionTitle
        action={t('work.manage')}
        onAction={() => setSopManageOpen(true)}
        style={{ marginTop: 24, marginBottom: 12 }}
      >
        {t('work.sop')}
      </SectionTitle>
      {sops.length === 0 && <EmptyState icon="briefcase" text={t('work.sopEmpty')} />}
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
              {p.coverUri ? (
                <Image
                  source={{ uri: p.coverUri }}
                  contentFit="cover"
                  style={{ width: 36, height: 36, borderRadius: radius.sm }}
                />
              ) : (
                <View
                  style={{
                    width: 36, height: 36, borderRadius: radius.sm,
                    backgroundColor: c.surfaceSunken, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name="briefcase" size={18} color={c.textStrong} />
                </View>
              )}
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
        <View style={{ height: 12 }} />
        <Input label={t('work.deadline')} value={deadline} onChangeText={setDeadline} placeholder="2026-08-20" />
        <View style={{ height: 12 }} />
        <Pressable onPress={pickCover} style={{ height: 96, borderRadius: radius.md, overflow: 'hidden' }}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
          ) : (
            <View
              style={{
                flex: 1,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: c.borderStrong,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="camera" size={20} color={c.textMuted} />
              <Txt size={13} weight="bold" color={c.textMuted}>
                {t('work.projectCover')}
              </Txt>
            </View>
          )}
        </Pressable>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitProject}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* SOP manage sheet */}
      <Sheet visible={sopManageOpen} onClose={() => setSopManageOpen(false)} title={t('work.sopManageTitle')}>
        {sops.length === 0 ? (
          <EmptyState icon="briefcase" text={t('work.sopEmpty')} />
        ) : (
          <View style={{ gap: 8 }}>
            {sops.map((s) => (
              <View
                key={s.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 12, borderRadius: radius.md, backgroundColor: c.surfaceSunken,
                }}
              >
                <Icon name={s.icon as never} size={18} color={c.textBody} />
                <Txt size={14} weight="bold" color={c.textStrong} style={{ flex: 1 }} numberOfLines={1}>
                  {s.name}
                </Txt>
                <IconButton
                  icon="pencil" size={34} variant="ghost"
                  onPress={() => openEditSop(s)}
                  accessibilityLabel={t('common.edit')}
                />
                <IconButton
                  icon="trash" size={34} variant="ghost"
                  onPress={() => confirmDeleteSop(s)}
                  accessibilityLabel={t('common.delete')}
                />
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 12 }} />
        <DashedAdd label={t('work.sopNew')} onPress={openNewSop} />
      </Sheet>

      {/* SOP create/edit sheet */}
      <Sheet
        visible={sopFormOpen}
        onClose={() => setSopFormOpen(false)}
        title={sopForm.id != null ? t('work.sopEdit') : t('work.sopNew')}
      >
        <Input label={t('work.sopName')} value={sopForm.name} onChangeText={(v) => setSopForm((f) => ({ ...f, name: v }))} autoFocus />
        <View style={{ height: 14 }} />
        <Txt size={12} weight="black" color={c.textMuted} caps style={{ marginBottom: 8 }}>
          {t('work.sopIcon')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {SOP_ICONS.map((ic) => (
            <Pressable
              key={ic}
              onPress={() => setSopForm((f) => ({ ...f, icon: ic }))}
              style={{
                width: 44, height: 44, borderRadius: radius.sm,
                backgroundColor: ic === sopForm.icon ? c.accent : c.surfaceSunken,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name={ic} size={20} color={ic === sopForm.icon ? ink[900] : c.textMuted} />
            </Pressable>
          ))}
        </View>
        <View style={{ height: 16 }} />
        <Txt size={12} weight="black" color={c.textMuted} caps style={{ marginBottom: 8 }}>
          {t('work.sopItemsLabel')}
        </Txt>
        <View style={{ gap: 8 }}>
          {sopForm.items.map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                padding: 10, borderRadius: radius.sm, backgroundColor: c.surfaceSunken,
              }}
            >
              <Txt size={13.5} color={c.textStrong} style={{ flex: 1 }}>
                {item}
              </Txt>
              <IconButton icon="trash" size={30} variant="ghost" onPress={() => removeSopItem(idx)} accessibilityLabel={t('common.delete')} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder={t('work.sopItemPlaceholder')}
                value={sopItemDraft}
                onChangeText={setSopItemDraft}
                onSubmitEditing={addSopItem}
              />
            </View>
            <IconButton icon="plus" size={44} variant="lime" onPress={addSopItem} accessibilityLabel={t('common.add')} />
          </View>
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="check" onPress={submitSop}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
