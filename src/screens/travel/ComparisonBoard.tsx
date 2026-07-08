import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { pickAndCacheImage } from '@/services/media';
import type { ScreenProps } from '@/shell/AppShell';
import { CompOption, useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { radius, space } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { DashedAdd, EmptyState, Eyebrow } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
      <View style={{ flex: 1, backgroundColor: c.green50, borderRadius: radius.md, padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Txt size={12} weight="monoBold" color={c.successFg}>
            +
          </Txt>
          <Txt size={12} weight="black" color={c.successFg}>
            {t('comp.plus')}
          </Txt>
        </View>
        {pros.map((p) => (
          <Txt key={p} size={12.5} color={c.textBody} style={{ marginBottom: 3 }}>
            {p}
          </Txt>
        ))}
      </View>
      <View style={{ flex: 1, backgroundColor: c.red50, borderRadius: radius.md, padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Txt size={12} weight="monoBold" color={c.dangerFg}>
            −
          </Txt>
          <Txt size={12} weight="black" color={c.dangerFg}>
            {t('comp.minus')}
          </Txt>
        </View>
        {cons.map((p) => (
          <Txt key={p} size={12.5} color={c.textBody} style={{ marginBottom: 3 }}>
            {p}
          </Txt>
        ))}
      </View>
    </View>
  );
}

function OptionCard({
  opt,
  onSelect,
  onAddMedia,
  onDelete,
}: {
  opt: CompOption;
  onSelect: () => void;
  onAddMedia: () => void;
  onDelete: () => void;
}) {
  const { c } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable onLongPress={onDelete}>
      <Card
        tone="light"
        pad="lg"
        radius="xl"
        style={{
          borderWidth: opt.selected ? 2 : 1,
          borderColor: opt.selected ? c.accent : c.borderSubtle,
        }}
      >
        {opt.selected && (
          <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
            <Badge tone="accent" icon="check">
              {t('comp.selected')}
            </Badge>
          </View>
        )}
        <Txt size={18} weight="black" color={c.textStrong} letterSpacing={-0.18}>
          {opt.name}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Txt size={26} weight="black" color={c.textStrong}>
            {opt.price}
          </Txt>
          <Txt size={13} weight="semibold" color={c.textMuted}>
            {opt.unit}
          </Txt>
        </View>

        {/* facility chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {opt.facilities.map((f) => (
            <Chip key={f} tone="accent" size="sm">
              {f}
            </Chip>
          ))}
        </View>

        <ProsCons pros={opt.pros} cons={opt.cons} />

        {/* offline media cache */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
          {opt.media.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {opt.media.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{ width: 44, height: 44, borderRadius: radius.sm }}
                    contentFit="cover"
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.sm,
                backgroundColor: c.surfaceSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={12} weight="black" color={c.textMuted}>
                {opt.media.length}
              </Txt>
            </View>
          )}
          <Pressable onPress={onAddMedia} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="camera" size={15} color={c.textMuted} />
            <Txt size={12} weight="semibold" color={c.textMuted}>
              {opt.media.length > 0 ? t('comp.mediaSaved') : t('comp.addPhoto')}
            </Txt>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button
            variant={opt.selected ? 'white' : 'primary'}
            full
            icon={opt.selected ? 'check' : 'arrow-right'}
            onPress={onSelect}
          >
            {opt.selected ? t('comp.alreadySelected') : t('comp.markSelected')}
          </Button>
        </View>
      </Card>
    </Pressable>
  );
}

export function ComparisonBoard(_: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { groups, addGroup, selectOption, addOption, deleteOption, addOptionMedia, promoteSelected } = useTravel();
  const [groupIdx, setGroupIdx] = useState(0);
  const group = groups[Math.min(groupIdx, Math.max(groups.length - 1, 0))];
  const [adding, setAdding] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', unit: '/bulan', fac: '', pros: '', cons: '' });
  const [groupForm, setGroupForm] = useState({ title: '', location: '' });

  const submitGroup = () => {
    if (!groupForm.title.trim()) return;
    addGroup(groupForm.title.trim(), groupForm.location.trim());
    setGroupForm({ title: '', location: '' });
    setAddingGroup(false);
    setGroupIdx(0); // newest group sorts first
  };

  const submit = () => {
    if (!group || !form.name.trim()) return;
    const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    addOption(group.id, {
      name: form.name.trim(),
      price: form.price.trim() || '—',
      unit: form.unit.trim(),
      facilities: split(form.fac),
      pros: split(form.pros),
      cons: split(form.cons),
    });
    setForm({ name: '', price: '', unit: '/bulan', fac: '', pros: '', cons: '' });
    setAdding(false);
  };

  const handleSelect = (opt: CompOption) => {
    if (!group) return;
    if (!opt.selected) {
      selectOption(group.id, opt.id);
      promoteSelected(opt);
      toast(t('comp.toBudget'));
    }
  };

  const handleMedia = async (opt: CompOption) => {
    const uri = await pickAndCacheImage('comparison');
    if (uri) {
      addOptionMedia(opt.id, uri);
      toast(t('vault.filePicked'));
    }
  };

  const confirmDelete = (opt: CompOption) => {
    Alert.alert(opt.name, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteOption(opt.id) },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        {groups.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {groups.map((g, i) => (
                <Chip key={g.id} tone={i === groupIdx ? 'accent' : 'neutral'} size="sm" onPress={() => setGroupIdx(i)}>
                  {g.title}
                </Chip>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <IconButton icon="plus" variant="dark" onPress={() => setAddingGroup(true)} accessibilityLabel={t('comp.newGroup')} />
      </View>

      {group ? (
        <>
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <Eyebrow>{t('comp.eyebrow')}</Eyebrow>
            <Txt size={28} weight="black" color={c.textStrong} letterSpacing={-0.56} lineHeight={31} style={{ marginTop: 4 }}>
              {group.title}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
              {!!group.location && (
                <Chip tone="neutral" icon="map-pin" size="sm">
                  {group.location}
                </Chip>
              )}
              <Chip tone="neutral" size="sm">
                {t('comp.options', { n: group.options.length })}
              </Chip>
            </View>
          </View>

          <View style={{ gap: 16, marginTop: 18 }}>
            {group.options.length === 0 && <EmptyState icon="search" text={t('comp.empty')} />}
            {group.options.map((o) => (
              <OptionCard
                key={o.id}
                opt={o}
                onSelect={() => handleSelect(o)}
                onAddMedia={() => handleMedia(o)}
                onDelete={() => confirmDelete(o)}
              />
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <DashedAdd label={t('comp.addOption')} onPress={() => setAdding(true)} />
          </View>
        </>
      ) : (
        <>
          <EmptyState icon="search" text={t('comp.noGroup')} />
          <DashedAdd label={t('comp.newGroup')} onPress={() => setAddingGroup(true)} />
        </>
      )}

      {/* new comparison group sheet */}
      <Sheet visible={addingGroup} onClose={() => setAddingGroup(false)} title={t('comp.newGroup')}>
        <Input label={t('comp.groupTitle')} value={groupForm.title} onChangeText={(v) => setGroupForm({ ...groupForm, title: v })} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('comp.groupLocation')} value={groupForm.location} onChangeText={(v) => setGroupForm({ ...groupForm, location: v })} />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitGroup}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* add option sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('comp.addOption')}>
        <Input label={t('comp.optionName')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoFocus />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            label={t('comp.price')}
            value={form.price}
            onChangeText={(v) => setForm({ ...form, price: v })}
            style={{ flex: 3 }}
          />
          <Input
            label={t('comp.priceUnit')}
            value={form.unit}
            onChangeText={(v) => setForm({ ...form, unit: v })}
            style={{ flex: 2 }}
          />
        </View>
        <View style={{ height: 12 }} />
        <Input label={t('comp.facilities')} value={form.fac} onChangeText={(v) => setForm({ ...form, fac: v })} placeholder="WiFi, AC, Dapur" />
        <View style={{ height: 12 }} />
        <Input label={t('comp.pros')} value={form.pros} onChangeText={(v) => setForm({ ...form, pros: v })} />
        <View style={{ height: 12 }} />
        <Input label={t('comp.cons')} value={form.cons} onChangeText={(v) => setForm({ ...form, cons: v })} />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
