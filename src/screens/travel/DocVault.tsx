import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { authenticate } from '@/services/biometric';
import { deleteSandboxFile, pickAndCacheDocument } from '@/services/media';
import { generateReport, shareFile } from '@/services/pdf';
import type { ScreenProps } from '@/shell/AppShell';
import { useSettings } from '@/stores/appStore';
import { useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { DashedAdd, EmptyState, Eyebrow } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

export function DocVault({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const userName = useSettings((s) => s.userName);
  const { trip, docs, addDoc, deleteDoc } = useTravel();
  const [locked, setLocked] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; meta: string; uri: string | null }>({
    name: '', meta: '', uri: null,
  });
  const [busy, setBusy] = useState(false);
  const [lastPdf, setLastPdf] = useState<string | null>(null);

  const unlock = async () => {
    const res = await authenticate(t('vault.unlock'));
    if (res.ok) {
      if (!res.available) toast(t('vault.noBiometric'));
      setLocked(false);
    }
  };

  if (locked) {
    return (
      <View style={{ flex: 1, paddingHorizontal: space.screenPad }}>
        <View style={{ paddingTop: 8 }}>
          <IconButton icon="chevron-left" variant="white" onPress={() => go('home')} accessibilityLabel={t('common.back')} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingBottom: 60 }}>
          <View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: ink[900],
                alignItems: 'center',
                justifyContent: 'center',
              },
              shadows.lg,
            ]}
          >
            <Icon name="lock" size={40} color={c.accent} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt size={23} weight="black" color={c.textStrong} letterSpacing={-0.46}>
              {t('vault.locked.title')}
            </Txt>
            <Txt size={14} color={c.textMuted} center style={{ marginTop: 6, maxWidth: 260 }}>
              {t('vault.locked.sub')}
            </Txt>
          </View>
          <Button variant="primary" size="lg" icon="lock" onPress={unlock}>
            {t('vault.unlock')}
          </Button>
        </View>
      </View>
    );
  }

  const pickFile = async () => {
    const res = await pickAndCacheDocument('vault');
    if (res) {
      setForm({ ...form, uri: res.uri, name: form.name || res.name });
      toast(t('vault.filePicked'));
    }
  };

  const submit = () => {
    if (!form.name.trim()) return;
    addDoc(form.name.trim(), form.meta.trim(), 'file-text', form.uri);
    setForm({ name: '', meta: '', uri: null });
    setAdding(false);
  };

  const confirmDelete = (id: number, name: string, uri: string | null) => {
    Alert.alert(name, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSandboxFile(uri);
          deleteDoc(id);
        },
      },
    ]);
  };

  const doGenerate = async () => {
    if (busy) return;
    setBusy(true);
    toast(t('set.pdfPreparing'));
    try {
      const uri = await generateReport(userName);
      setLastPdf(uri);
      toast(t('vault.pdfReady'));
      await shareFile(uri);
    } finally {
      setBusy(false);
    }
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
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <IconButton icon="chevron-left" variant="white" onPress={() => setLocked(true)} accessibilityLabel={t('common.back')} />
        <Badge tone="success" icon="lock-open">
          {t('vault.unlocked')}
        </Badge>
      </View>

      <View style={{ marginBottom: 18 }}>
        <Eyebrow>{t('vault.eyebrow')}</Eyebrow>
        <Txt size={28} weight="black" color={c.textStrong} letterSpacing={-0.56}>
          {trip?.name ?? 'Lakon'}
        </Txt>
      </View>

      {/* documents */}
      <View style={{ gap: 10 }}>
        {docs.length === 0 && <EmptyState icon="lock" text={t('vault.empty')} />}
        {docs.map((d) => (
          <Pressable
            key={d.id}
            onLongPress={() => confirmDelete(d.id, d.name, d.uri)}
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
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                backgroundColor: ink[900],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={d.icon as never} size={20} color={c.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={14.5} weight="bold" color={c.textStrong}>
                {d.name}
              </Txt>
              <Txt size={12} color={c.textMuted}>
                {d.meta}
              </Txt>
            </View>
            <Icon name="lock" size={15} color={c.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        <DashedAdd label={t('vault.addDoc')} onPress={() => setAdding(true)} />
      </View>

      {/* PDF report generator */}
      <Card tone="dark" pad="lg" radius="xl" style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="file-text" size={22} color={ink[900]} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={16} weight="black" color={c.textOnDark}>
              {t('vault.pdf.title')}
            </Txt>
            <Txt size={12.5} color={c.textOnDarkMuted}>
              {t('vault.pdf.sub')}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button variant="primary" icon="file-text" onPress={doGenerate} style={{ flex: 1 }}>
            {t('vault.generate')}
          </Button>
          <Button
            variant="white"
            onPress={async () => {
              if (lastPdf) await shareFile(lastPdf);
              else await doGenerate();
            }}
          >
            {t('vault.share')}
          </Button>
        </View>
      </Card>

      {/* add doc sheet */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title={t('vault.addDoc')}>
        <Input label={t('vault.docName')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoFocus />
        <View style={{ height: 12 }} />
        <Input label={t('vault.docMeta')} value={form.meta} onChangeText={(v) => setForm({ ...form, meta: v })} />
        <View style={{ height: 14 }} />
        <Pressable
          onPress={pickFile}
          style={{
            height: 52,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: form.uri ? c.accent : c.borderStrong,
            borderRadius: radius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name={form.uri ? 'check' : 'plus'} size={18} color={form.uri ? c.limeText : c.textMuted} />
          <Txt size={14} weight="bold" color={form.uri ? c.limeText : c.textMuted}>
            {form.uri ? t('vault.filePicked') : t('vault.pickFile')}
          </Txt>
        </Pressable>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submit}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
