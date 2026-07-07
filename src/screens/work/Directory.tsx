import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { Contact, useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadows, space } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Chip, ChipTone } from '@/ui/Chip';
import { EmptyState, Eyebrow } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { Txt } from '@/ui/Txt';

const TONES: ChipTone[] = ['accent', 'info', 'warning', 'neutral'];

export function Directory(_: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { activeProject, contacts, addContact, deleteContact } = useWork();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', note: '' });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? contacts.filter((x) => x.name.toLowerCase().includes(q) || x.role.toLowerCase().includes(q))
    : contacts;

  const submit = () => {
    if (!form.name.trim()) return;
    addContact({
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      note: form.note.trim(),
      tone: TONES[contacts.length % TONES.length] as Contact['tone'],
    });
    setForm({ name: '', role: '', phone: '', note: '' });
    setAdding(false);
  };

  const confirmDelete = (contact: Contact) => {
    Alert.alert(contact.name, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteContact(contact.id) },
    ]);
  };

  const call = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 14,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>
            {t('dir.eyebrow')} · {activeProject?.name ?? '—'}
          </Eyebrow>
          <Txt size={24} weight="black" color={c.textStrong} letterSpacing={-0.48}>
            {t('dir.title')}
          </Txt>
        </View>
        <IconButton icon="plus" variant="dark" onPress={() => setAdding(true)} accessibilityLabel={t('dir.addContact')} />
      </View>

      <Input icon="search" shape="pill" placeholder={t('dir.search')} value={query} onChangeText={setQuery} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 14 }}>
        <Icon name="lock" size={13} color={c.textMuted} />
        <Txt size={12} weight="semibold" color={c.textMuted}>
          {t('dir.isolated')}
        </Txt>
      </View>

      <View style={{ gap: 10 }}>
        {filtered.length === 0 && <EmptyState icon="user" text={t('dir.empty')} />}
        {filtered.map((contact) => (
          <Pressable
            key={contact.id}
            onLongPress={() => confirmDelete(contact)}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: c.surfaceCard,
                borderWidth: 1,
                borderColor: c.borderSubtle,
                borderRadius: radius.lg,
                padding: 14,
              },
              shadows.xs,
            ]}
          >
            <Avatar name={contact.name} size={46} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Txt size={15.5} weight="black" color={c.textStrong}>
                  {contact.name}
                </Txt>
                {!!contact.role && (
                  <Chip tone={contact.tone} size="sm">
                    {contact.role}
                  </Chip>
                )}
              </View>
              {!!contact.phone && (
                <Txt size={13} weight="mono" color={c.textBody} style={{ marginTop: 5 }}>
                  {contact.phone}
                </Txt>
              )}
              {!!contact.note && (
                <Txt size={12.5} color={c.textMuted} lineHeight={17.5} style={{ marginTop: 5 }}>
                  {contact.note}
                </Txt>
              )}
            </View>
            <IconButton
              icon="phone"
              size={36}
              variant="ghost"
              onPress={() => call(contact.phone)}
              accessibilityLabel="Hubungi"
            />
          </Pressable>
        ))}
      </View>

      {/* add contact sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('dir.addContact')}>
        <Input label={t('common.name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('dir.role')} value={form.role} onChangeText={(v) => setForm({ ...form, role: v })} />
        <View style={{ height: 12 }} />
        <Input label={t('dir.phone')} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <View style={{ height: 12 }} />
        <Input label={t('dir.note')} value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
