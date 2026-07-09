import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { BagKey, useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadows, space } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CheckBox, EmptyState, Eyebrow, SectionTitle } from '@/ui/common';
import { Chip, ChipTone } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { ProgressBar } from '@/ui/ProgressBar';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

const BAG_TONES: Record<BagKey, ChipTone> = { checked: 'info', cabin: 'accent', body: 'warning' };

export function PackingSystem({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const {
    trip, packing, templates, pretrip,
    togglePacking, addPackingItem, deletePackingItem, loadTemplate,
    togglePretrip, addPretrip, deletePretrip,
  } = useTravel();
  const [addingItem, setAddingItem] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [label, setLabel] = useState('');
  const [bag, setBag] = useState<BagKey>('checked');
  const [taskLabel, setTaskLabel] = useState('');

  const bagLabel = (k: BagKey) =>
    ({ checked: t('pack.bag.checked'), cabin: t('pack.bag.cabin'), body: t('pack.bag.body') })[k];

  const done = packing.filter((i) => i.checked).length;
  const pct = packing.length ? Math.round((done / packing.length) * 100) : 0;

  const submitItem = () => {
    if (!label.trim()) return;
    addPackingItem(label.trim(), bag);
    setLabel('');
    setAddingItem(false);
  };

  const submitTask = () => {
    if (!taskLabel.trim()) return;
    addPretrip(taskLabel.trim());
    setTaskLabel('');
    setAddingTask(false);
  };

  const confirmDelete = (name: string, fn: () => void) => {
    Alert.alert(name, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: fn },
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
          paddingBottom: 16,
        }}
      >
        <IconButton icon="chevron-left" variant="white" onPress={() => go('home')} accessibilityLabel={t('common.back')} />
        <IconButton icon="plus" variant="dark" onPress={() => setAddingItem(true)} accessibilityLabel={t('pack.addItem')} />
      </View>

      <View style={{ marginBottom: 6 }}>
        <Eyebrow>{t('pack.eyebrow')}</Eyebrow>
        <Txt size={26} weight="black" color={c.textStrong} letterSpacing={-0.52}>
          {trip?.name ?? '—'}
        </Txt>
      </View>

      {/* progress panel */}
      <Card tone="dark" pad="lg" radius="xl" style={{ marginTop: 12 }}>
        <ProgressBar value={pct} onDark label={t('pack.progress', { done, total: packing.length })} />
      </Card>

      {/* templates */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, marginBottom: 6, flexGrow: 0 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {templates.map((tm, i) => (
            <Chip
              key={tm.id}
              tone={i === 0 ? 'accent' : 'neutral'}
              selected={i === 0}
              icon="package"
              onPress={() => {
                loadTemplate(tm.id);
                toast(t('pack.loadTemplate', { name: tm.name }));
              }}
            >
              {tm.name}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {/* packing checklist */}
      <View style={{ gap: 8, marginTop: 8 }}>
        {packing.length === 0 && <EmptyState icon="package" text={t('pack.empty')} />}
        {packing.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => togglePacking(item.id)}
            onLongPress={() => confirmDelete(item.label, () => deletePackingItem(item.id))}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: c.surfaceCard,
                borderWidth: 1,
                borderColor: c.borderSubtle,
                borderRadius: radius.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
              },
              shadows.xs,
            ]}
          >
            <CheckBox checked={item.checked} />
            <Txt
              size={14.5}
              weight="semibold"
              color={item.checked ? c.textMuted : c.textStrong}
              style={{ flex: 1, textDecorationLine: item.checked ? 'line-through' : 'none' }}
            >
              {item.label}
            </Txt>
            <Chip tone={BAG_TONES[item.bag]} size="sm">
              {bagLabel(item.bag)}
            </Chip>
          </Pressable>
        ))}
      </View>

      {/* pre-trip admin tasks */}
      <SectionTitle style={{ marginTop: 22, marginBottom: 12 }} action={t('common.add')} onAction={() => setAddingTask(true)}>
        {t('pack.preTrip')}
      </SectionTitle>
      <View style={{ gap: 8 }}>
        {pretrip.length === 0 && <EmptyState icon="check" text={t('pack.emptyTasks')} />}
        {pretrip.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => togglePretrip(task.id)}
            onLongPress={() => confirmDelete(task.label, () => deletePretrip(task.id))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 }}
          >
            <CheckBox checked={task.done} shape="round" />
            <Txt
              size={14.5}
              weight="semibold"
              color={task.done ? c.textMuted : c.textStrong}
              style={{ flex: 1, textDecorationLine: task.done ? 'line-through' : 'none' }}
            >
              {task.label}
            </Txt>
          </Pressable>
        ))}
      </View>

      {/* add item sheet */}
      <Sheet visible={addingItem} onClose={() => setAddingItem(false)} title={t('pack.addItem')}>
        <Input label={t('pack.itemName')} value={label} onChangeText={setLabel} autoFocus />
        <View style={{ height: 12 }} />
        <Txt size={13} weight="semibold" color={c.textStrong} style={{ marginBottom: 8 }}>
          {t('pack.bagAlloc')}
        </Txt>
        <SegmentedControl
          full
          tone="dark"
          options={[
            { value: 'checked', label: t('pack.bag.checked') },
            { value: 'cabin', label: t('pack.bag.cabin') },
            { value: 'body', label: t('pack.bag.body') },
          ]}
          value={bag}
          onChange={setBag}
        />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitItem}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* add pre-trip task sheet */}
      <Sheet visible={addingTask} onClose={() => setAddingTask(false)} title={t('pack.addTask')}>
        <Input label={t('pack.taskName')} value={taskLabel} onChangeText={setTaskLabel} autoFocus />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitTask}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
