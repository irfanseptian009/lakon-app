import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { Note, useDaily } from '@/stores/dailyStore';
import { useTheme } from '@/theme/ThemeContext';
import { font, ink, radius, shadows, space } from '@/theme/tokens';
import { Card } from '@/ui/Card';
import { Chip, ChipTone } from '@/ui/Chip';
import { EmptyState, ScreenTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Txt } from '@/ui/Txt';

const CAT_TONES: Record<Note['cat'], ChipTone> = {
  idea: 'accent',
  todo: 'info',
  buy: 'warning',
  note: 'neutral',
};

export function QuickNotes(_: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { notes, addNote, deleteNote } = useDaily();
  const [val, setVal] = useState('');
  const [cat, setCat] = useState<Note['cat']>('idea');
  // snapshot the clock once per mount so render stays pure
  const [now] = useState(() => Date.now());

  const catLabel = (k: Note['cat']) =>
    ({ idea: t('notes.cat.idea'), todo: t('notes.cat.todo'), buy: t('notes.cat.buy'), note: t('notes.cat.note') })[k];

  const timeAgo = (ts: number) => {
    const mins = Math.round((now - ts) / 60000);
    if (mins < 2) return t('common.justNow');
    if (mins < 60) return `${mins} ${t('common.minutesAgo')}`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} ${t('common.hoursAgo')}`;
    const days = Math.round(hours / 24);
    if (days === 1) return t('common.yesterday');
    return `${days} ${t('common.daysAgo')}`;
  };

  const submit = () => {
    const text = val.trim();
    if (!text) return;
    addNote(text, cat);
    setVal('');
  };

  const confirmDelete = (id: number) => {
    Alert.alert(t('common.delete'), t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle
        eyebrow={t('notes.eyebrow')}
        title={t('notes.title')}
        right={
          <Chip tone="neutral" size="sm">
            {t('notes.count', { n: notes.length })}
          </Chip>
        }
      />

      {/* composer */}
      <Card tone="light" pad="md" radius="lg">
        <TextInput
          value={val}
          onChangeText={setVal}
          placeholder={t('notes.placeholder')}
          placeholderTextColor={c.textMuted}
          multiline
          style={{
            fontFamily: font.medium,
            fontSize: 15,
            color: c.textStrong,
            minHeight: 48,
            textAlignVertical: 'top',
            padding: 0,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 8,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(Object.keys(CAT_TONES) as Note['cat'][]).map((k) => (
                <Chip key={k} tone={CAT_TONES[k]} size="sm" selected={cat === k} onPress={() => setCat(k)}>
                  {catLabel(k)}
                </Chip>
              ))}
            </View>
          </ScrollView>
          <Pressable
            onPress={submit}
            accessibilityLabel={t('common.save')}
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c.accent,
                alignItems: 'center',
                justifyContent: 'center',
              },
              shadows.accent,
            ]}
          >
            <Icon name="plus" size={20} color={ink[900]} />
          </Pressable>
        </View>
      </Card>

      {/* notes */}
      <View style={{ gap: 10, marginTop: 18 }}>
        {notes.length === 0 && <EmptyState icon="file-text" text={t('notes.empty')} />}
        {notes.map((n) => (
          <View
            key={n.id}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: c.surfaceCard,
                borderWidth: 1,
                borderColor: c.borderSubtle,
                borderRadius: radius.md,
                paddingVertical: 13,
                paddingHorizontal: 14,
              },
              shadows.xs,
            ]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={14.5} weight="semibold" color={c.textStrong} lineHeight={20}>
                {n.text}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Chip tone={CAT_TONES[n.cat]} size="sm">
                  {catLabel(n.cat)}
                </Chip>
                <Txt size={11.5} color={c.textMuted}>
                  {timeAgo(n.createdAt)}
                </Txt>
              </View>
            </View>
            <IconButton
              icon="trash"
              size={34}
              variant="ghost"
              onPress={() => confirmDelete(n.id)}
              accessibilityLabel={t('common.delete')}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
