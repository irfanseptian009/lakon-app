import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { wipeAll } from '@/data/seed';
import { createBackup, restoreBackup } from '@/services/backup';
import { biometricAvailable } from '@/services/biometric';
import { generateReport, shareFile } from '@/services/pdf';
import { useSettings } from '@/stores/appStore';
import { useDaily } from '@/stores/dailyStore';
import { useTravel } from '@/stores/travelStore';
import { useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Icon, IconName } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Txt size={12} weight="black" color={c.textMuted} caps style={{ marginHorizontal: 4, marginBottom: 10 }}>
        {title}
      </Txt>
      <View
        style={[
          {
            backgroundColor: c.surfaceCard,
            borderWidth: 1,
            borderColor: c.borderSubtle,
            borderRadius: radius.lg,
            overflow: 'hidden',
          },
          shadows.xs,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  tint,
  title,
  sub,
  trailing,
  onPress,
  last,
}: {
  icon: IconName;
  tint?: string;
  title: string;
  sub?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.borderSubtle,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          backgroundColor: tint ?? c.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={19} color={c.textStrong} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={14.5} weight="bold" color={c.textStrong}>
          {title}
        </Txt>
        {sub && (
          <Txt size={12} color={c.textMuted} style={{ marginTop: 1 }}>
            {sub}
          </Txt>
        )}
      </View>
      {trailing}
    </Pressable>
  );
}

export function SettingsScreen({ onClose, onLock }: { onClose: () => void; onLock: () => void }) {
  const { c, mode, toggle } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const s = useSettings();
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(s.userName);
  const [busy, setBusy] = useState(false);

  const initials = s.userName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toggleBiometric = async (v: boolean) => {
    if (v && !(await biometricAvailable())) {
      toast(t('set.biometricUnavailable'));
      return;
    }
    s.setBiometric(v);
  };

  const doBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await createBackup();
      const stamp = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      s.setBackupAt(stamp);
      toast(t('set.backupDone'));
    } finally {
      setBusy(false);
    }
  };

  const reloadStores = () => {
    useDaily.getState().load();
    useTravel.getState().load();
    useWork.getState().load();
    useSettings.getState().hydrate();
  };

  const doRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await restoreBackup();
      if (ok) {
        reloadStores();
        toast(t('set.restoreDone'));
      } else {
        toast(t('set.restoreFail'));
      }
    } catch {
      toast(t('set.restoreFail'));
    } finally {
      setBusy(false);
    }
  };

  const doPdf = async () => {
    if (busy) return;
    setBusy(true);
    toast(t('set.pdfPreparing'));
    try {
      const uri = await generateReport(s.userName);
      await shareFile(uri);
    } finally {
      setBusy(false);
    }
  };

  const doClearData = () => {
    Alert.alert(t('set.clearData'), t('set.clearDataConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('set.clearData'),
        style: 'destructive',
        onPress: () => {
          wipeAll();
          reloadStores();
          toast(t('set.clearDataDone'));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 40 }}
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
        <IconButton icon="chevron-left" variant="white" onPress={onClose} accessibilityLabel={t('common.back')} />
        <Txt size={17} weight="black" color={c.textStrong}>
          {t('set.title')}
        </Txt>
        <View style={{ width: 44 }} />
      </View>

      {/* profile card */}
      <Pressable
        onPress={() => {
          setNameDraft(s.userName);
          setEditName(true);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: c.surfaceInverse,
          borderRadius: radius.xl,
          padding: 18,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt size={22} weight="black" color={ink[900]}>
            {initials}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={17} weight="black" color={c.textOnDark}>
            {s.userName}
          </Txt>
          <Txt size={12.5} color={c.textOnDarkMuted} style={{ marginTop: 2 }}>
            {t('set.localAccount')}
          </Txt>
        </View>
        <Badge tone="success" icon="lock">
          {t('set.private')}
        </Badge>
      </Pressable>

      <Group title={t('set.privacy')}>
        <Row
          icon="lock"
          tint={c.lime100}
          title={t('set.biometric')}
          sub={t('set.biometricSub')}
          trailing={<Switch checked={s.biometric} onChange={toggleBiometric} />}
        />
        <Row
          icon="user"
          title={t('set.autoLock')}
          sub={t('set.autoLockSub')}
          trailing={<Switch checked={s.autoLock} onChange={s.setAutoLock} />}
          last
        />
      </Group>

      <Group title={t('set.localData')}>
        <Row
          icon="share"
          tint={c.blue50}
          title={t('set.backup')}
          sub={s.backupAt ? t('set.backupLast', { t: s.backupAt }) : t('set.backupNever')}
          onPress={doBackup}
          trailing={<Icon name="chevron-right" size={18} color={c.textMuted} />}
        />
        <Row
          icon="package"
          title={t('set.restore')}
          sub={t('set.restoreSub')}
          onPress={doRestore}
          trailing={<Icon name="chevron-right" size={18} color={c.textMuted} />}
        />
        <Row
          icon="file-text"
          title={t('set.exportPdf')}
          sub={t('set.exportPdfSub')}
          onPress={doPdf}
          trailing={<Icon name="chevron-right" size={18} color={c.textMuted} />}
        />
        <Row
          icon="trash"
          title={t('set.clearData')}
          sub={t('set.clearDataSub')}
          onPress={doClearData}
          trailing={<Icon name="chevron-right" size={18} color={c.textMuted} />}
          last
        />
      </Group>

      <Group title={t('set.appearance')}>
        <Row
          icon={mode === 'dark' ? 'moon' : 'sun'}
          tint={c.amber50}
          title={t('set.darkMode')}
          sub={t('set.darkModeSub')}
          trailing={<Switch checked={mode === 'dark'} onChange={toggle} />}
        />
        <Row
          icon="bell"
          title={t('set.notif')}
          sub={t('set.notifSub')}
          trailing={<Switch checked={s.notif} onChange={s.setNotif} />}
        />
        <Row
          icon="languages"
          title={t('set.lang')}
          sub={s.lang === 'id' ? 'Bahasa Indonesia' : 'English'}
          onPress={() => s.setLang(s.lang === 'id' ? 'en' : 'id')}
          trailing={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt size={13} weight="bold" color={c.textMuted}>
                {s.lang.toUpperCase()}
              </Txt>
              <Icon name="chevron-right" size={16} color={c.textMuted} />
            </View>
          }
          last
        />
      </Group>

      <Group title={t('set.about')}>
        <Row
          icon="zap"
          tint={c.lime100}
          title="Lakon"
          sub={t('set.version')}
          trailing={
            <Txt size={12} weight="mono" color={c.textMuted}>
              v1.0.0
            </Txt>
          }
          last
        />
      </Group>

      <Txt size={12} color={c.textMuted} center lineHeight={18} style={{ marginTop: 22 }}>
        {t('set.footer')}
      </Txt>

      {/* edit profile name */}
      <Sheet visible={editName} onClose={() => setEditName(false)} title={t('set.editProfile')}>
        <Input
          label={t('set.profileName')}
          value={nameDraft}
          onChangeText={setNameDraft}
          autoFocus
          onSubmitEditing={() => {
            if (nameDraft.trim()) s.setUserName(nameDraft.trim());
            setEditName(false);
          }}
          returnKeyType="done"
        />
        <View style={{ height: 14 }} />
        <Pressable
          onPress={() => {
            if (nameDraft.trim()) s.setUserName(nameDraft.trim());
            setEditName(false);
          }}
          style={{
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt size={16} weight="bold" color={ink[900]}>
            {t('common.save')}
          </Txt>
        </Pressable>
      </Sheet>
    </ScrollView>
  );
}
