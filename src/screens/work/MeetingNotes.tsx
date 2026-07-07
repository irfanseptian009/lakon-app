import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { deleteSandboxFile, persistRecording } from '@/services/media';
import type { ScreenProps } from '@/shell/AppShell';
import { useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, status, white } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState, SectionTitle } from '@/ui/common';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

const WAVE_BARS = [6, 12, 20, 14, 26, 18, 30, 22, 12, 24, 16, 28, 10, 20, 14, 22, 8, 18];

function fmtDur(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, '0')}`;
}

export function MeetingNotes(_: ScreenProps) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { activeProject, memos, minutes, addMemo, deleteMemo, addMinute, deleteMinute } = useWork();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 500);
  const player = useAudioPlayer();
  const [playingId, setPlayingId] = useState<number | null>(null);

  const [saveSheet, setSaveSheet] = useState<{ uri: string; dur: number } | null>(null);
  const [memoTitle, setMemoTitle] = useState('');
  const [minSheet, setMinSheet] = useState(false);
  const [minForm, setMinForm] = useState({ title: '', items: '' });

  const recording = recState.isRecording;
  const elapsedSec = Math.floor((recState.durationMillis ?? 0) / 1000);

  const toggleRecord = async () => {
    if (recording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const finalUri = persistRecording(uri);
        setMemoTitle('');
        setSaveSheet({ uri: finalUri, dur: elapsedSec });
      }
      return;
    }
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      toast(t('meet.micDenied'));
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const saveMemo = () => {
    if (!saveSheet) return;
    addMemo(memoTitle.trim() || `Memo ${new Date().toLocaleTimeString()}`, saveSheet.dur, saveSheet.uri);
    setSaveSheet(null);
  };

  const togglePlay = async (id: number, uri: string | null) => {
    if (!uri) return;
    if (playingId === id) {
      player.pause();
      setPlayingId(null);
      return;
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    player.replace({ uri });
    player.play();
    setPlayingId(id);
  };

  const confirmDeleteMemo = (id: number, title: string) => {
    Alert.alert(title, t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          const memo = deleteMemo(id);
          deleteSandboxFile(memo?.uri);
          if (playingId === id) {
            player.pause();
            setPlayingId(null);
          }
        },
      },
    ]);
  };

  const submitMinutes = () => {
    if (!minForm.title.trim()) return;
    const items = minForm.items.split('\n').map((x) => x.trim()).filter(Boolean);
    addMinute(minForm.title.trim(), items, null);
    setMinForm({ title: '', items: '' });
    setMinSheet(false);
  };

  const dateLabel = (ts: number) => {
    const d = new Date(ts);
    const today = new Date().toDateString() === d.toDateString();
    const time = d.toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return `${today ? t('common.today') : d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} · ${time}`;
  };

  // recorded waveform: bars light up progressively while recording
  const activeBars = recording ? Math.min(WAVE_BARS.length, 1 + (elapsedSec % WAVE_BARS.length)) : 0;

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
          paddingBottom: 14,
        }}
      >
        <View>
          <Txt size={12} weight="bold" color={c.textMuted} caps>
            {t('meet.eyebrow')}
          </Txt>
          <Txt size={24} weight="black" color={c.textStrong} letterSpacing={-0.48}>
            {t('meet.title')}
          </Txt>
        </View>
        <Chip tone="accent" size="sm" icon="briefcase">
          {activeProject?.name?.split(' ').slice(0, 2).join(' ') ?? '—'}
        </Chip>
      </View>

      {/* recorder */}
      <Card tone="dark" pad="lg" radius="xl">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            onPress={toggleRecord}
            accessibilityLabel="Rekam"
            style={[
              {
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: recording ? status.red500 : c.accent,
                alignItems: 'center',
                justifyContent: 'center',
              },
              recording ? {} : shadows.accent,
            ]}
          >
            {recording ? (
              <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: white }} />
            ) : (
              <Icon name="mic" size={24} color={ink[900]} />
            )}
          </Pressable>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 32 }}>
            {WAVE_BARS.map((h, i) => (
              <View
                key={i}
                style={{
                  width: 3,
                  height: h,
                  borderRadius: 2,
                  backgroundColor: recording && i < activeBars ? c.accent : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </View>
          <Txt size={15} weight="monoBold" color={recording ? c.accent : c.textOnDarkMuted}>
            {fmtDur(elapsedSec)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <Icon name="lock" size={13} color={c.textOnDarkMuted} />
          <Txt size={12} color={c.textOnDarkMuted} style={{ flex: 1 }}>
            {t('meet.recHint')}
          </Txt>
        </View>
      </Card>

      {/* memo list */}
      <SectionTitle style={{ marginTop: 22, marginBottom: 12 }}>{t('meet.voiceMemos')}</SectionTitle>
      <View style={{ gap: 10 }}>
        {memos.length === 0 && <EmptyState icon="mic" text={t('meet.emptyMemos')} />}
        {memos.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => togglePlay(m.id, m.uri)}
            onLongPress={() => confirmDeleteMemo(m.id, m.title)}
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c.lime100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={playingId === m.id ? 'pause' : 'play'} size={18} color={c.limeText} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={14} weight="bold" color={c.textStrong} numberOfLines={1}>
                {m.title}
              </Txt>
              <Txt size={11.5} color={c.textMuted} style={{ marginTop: 2 }}>
                {dateLabel(m.createdAt)}
              </Txt>
            </View>
            <Txt size={12.5} weight="mono" color={c.textMuted}>
              {fmtDur(m.durationSec)}
            </Txt>
          </Pressable>
        ))}
      </View>

      {/* linked minutes */}
      <SectionTitle style={{ marginTop: 22, marginBottom: 12 }} action={t('common.add')} onAction={() => setMinSheet(true)}>
        {t('meet.linkedMinutes')}
      </SectionTitle>
      <View style={{ gap: 12 }}>
        {minutes.map((mn) => (
          <Pressable
            key={mn.id}
            onLongPress={() =>
              Alert.alert(mn.title, t('common.confirmDelete'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => deleteMinute(mn.id) },
              ])
            }
          >
            <Card tone="light" pad="lg" radius="lg">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <Icon name="file-text" size={15} color={c.textMuted} />
                <Txt size={13} weight="black" color={c.textStrong} style={{ flexShrink: 1 }}>
                  {mn.title} — {new Date(`${mn.date}T00:00:00`).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                </Txt>
                {mn.linkedTask && <Badge tone="info">→ {mn.linkedTask}</Badge>}
              </View>
              {mn.items.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 3 }}>
                  <Txt size={13.5} color={c.textMuted}>
                    •
                  </Txt>
                  <Txt size={13.5} color={c.textBody} lineHeight={21} style={{ flex: 1 }}>
                    {item}
                  </Txt>
                </View>
              ))}
            </Card>
          </Pressable>
        ))}
      </View>

      {/* save memo sheet */}
      <Sheet visible={!!saveSheet} onClose={() => setSaveSheet(null)} title={t('meet.saveMemo')}>
        <Input label={t('meet.memoTitle')} value={memoTitle} onChangeText={setMemoTitle} autoFocus />
        <View style={{ height: 8 }} />
        <Txt size={12} color={c.textMuted}>
          {fmtDur(saveSheet?.dur ?? 0)} · .m4a
        </Txt>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="check" onPress={saveMemo}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* add minutes sheet */}
      <Sheet visible={minSheet} onClose={() => setMinSheet(false)} title={t('meet.addMinutes')}>
        <Input label={t('meet.minTitle')} value={minForm.title} onChangeText={(v) => setMinForm({ ...minForm, title: v })} autoFocus />
        <View style={{ height: 12 }} />
        <Input
          label={t('meet.minItems')}
          value={minForm.items}
          onChangeText={(v) => setMinForm({ ...minForm, items: v })}
          multiline
        />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitMinutes}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
