import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { useSettings } from '@/stores/appStore';
import { ColKey, KanbanCard, useWork } from '@/stores/workStore';
import { useTheme } from '@/theme/ThemeContext';
import { font, ink, radius, shadows, space, status } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { EmptyState, Eyebrow } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { Sheet } from '@/ui/Sheet';
import { Txt } from '@/ui/Txt';

const LABEL_META: Record<string, { text: string; bgKey: 'lime100' | 'blue50' | 'amber50'; fgKey: 'limeText' | 'infoFg' | 'warningFg' } | { text: string; neutral: true }> = {
  venue: { text: 'Venue', bgKey: 'lime100', fgKey: 'limeText' },
  editing: { text: 'Editing', bgKey: 'blue50', fgKey: 'infoFg' },
  client: { text: 'Klien', bgKey: 'amber50', fgKey: 'warningFg' },
  decor: { text: 'Dekorasi', bgKey: 'lime100', fgKey: 'limeText' },
  budget: { text: 'Budget', neutral: true },
};

function CardLabel({ k }: { k: string }) {
  const { c } = useTheme();
  const meta = LABEL_META[k];
  if (!meta) return null;
  const isNeutral = 'neutral' in meta;
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: isNeutral ? c.controlTrack : c[meta.bgKey],
      }}
    >
      <Txt size={11} weight="bold" color={isNeutral ? c.textBody : c[meta.fgKey]}>
        {meta.text}
      </Txt>
    </View>
  );
}

function BoardCard({ card, onTap, onHold }: { card: KanbanCard; onTap: () => void; onHold: () => void }) {
  const { c } = useTheme();
  const prioColor = { high: status.red500, med: status.amber500, low: c.borderStrong }[card.prio];
  const checkPct =
    card.checkTotal != null && card.checkDone != null && card.checkTotal > 0
      ? Math.round((card.checkDone / card.checkTotal) * 100)
      : null;

  return (
    <Pressable
      onPress={onTap}
      onLongPress={onHold}
      style={[
        {
          backgroundColor: c.surfaceCard,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingLeft: 14,
          paddingRight: 13,
          gap: 9,
          overflow: 'hidden',
        },
        shadows.xs,
      ]}
    >
      {/* priority spine */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 4,
          borderRadius: 2,
          backgroundColor: prioColor,
        }}
      />
      {card.labels.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {card.labels.map((k) => (
            <CardLabel key={k} k={k} />
          ))}
        </View>
      )}
      <Txt size={14} weight="bold" color={c.textStrong} lineHeight={18}>
        {card.title}
      </Txt>

      {checkPct != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={13} color={checkPct === 100 ? status.green500 : c.textMuted} />
          <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: c.controlTrack, overflow: 'hidden' }}>
            <View
              style={{
                width: `${checkPct}%`,
                height: '100%',
                backgroundColor: checkPct === 100 ? status.green500 : c.accent,
                borderRadius: 3,
              }}
            />
          </View>
          <Txt size={11} weight="mono" color={c.textMuted}>
            {card.checkDone}/{card.checkTotal}
          </Txt>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={13} color={card.overdue ? status.red500 : c.textMuted} />
          <Txt size={11.5} weight="semibold" color={card.overdue ? status.red500 : c.textMuted}>
            {card.due ?? '—'}
          </Txt>
        </View>
        {!!card.who && <Avatar name={card.who} size={26} />}
      </View>
    </Pressable>
  );
}

function AddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 8 }}
      >
        <Icon name="plus" size={16} color={c.textMuted} />
        <Txt size={13} weight="bold" color={c.textMuted}>
          {t('kanban.addCard')}
        </Txt>
      </Pressable>
    );
  }
  return (
    <View
      style={{
        backgroundColor: c.surfaceCard,
        borderWidth: 1.5,
        borderColor: c.focusRing,
        borderRadius: radius.md,
        padding: 10,
      }}
    >
      <TextInput
        autoFocus
        value={val}
        onChangeText={setVal}
        placeholder={t('kanban.cardTitle')}
        placeholderTextColor={c.textMuted}
        multiline
        style={{ fontFamily: font.semibold, fontSize: 13.5, color: c.textStrong, minHeight: 40, padding: 0 }}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <Pressable
          onPress={() => {
            const title = val.trim();
            if (title) onAdd(title);
            setVal('');
            setOpen(false);
          }}
          style={{
            flex: 1,
            height: 34,
            borderRadius: radius.sm,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt size={13} weight="black" color={ink[900]}>
            {t('common.add')}
          </Txt>
        </Pressable>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.sm,
            backgroundColor: c.controlTrack,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={15} color={c.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

export function KanbanBoard({ go }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const userName = useSettings((s) => s.userName);
  const { activeProject, cards, advanceCard, moveCard, addCard, deleteCard } = useWork();
  const [held, setHeld] = useState<KanbanCard | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const COLS: { key: ColKey; label: string; accent: string; wip: number | null }[] = [
    { key: 'todo', label: t('kanban.col.todo'), accent: c.borderStrong, wip: null },
    { key: 'doing', label: t('kanban.col.doing'), accent: c.accent, wip: 3 },
    { key: 'waiting', label: t('kanban.col.waiting'), accent: status.amber500, wip: null },
    { key: 'done', label: t('kanban.col.done'), accent: status.green500, wip: null },
  ];

  if (!activeProject) {
    return (
      <View style={{ flex: 1, paddingHorizontal: space.screenPad, paddingTop: 20 }}>
        <Eyebrow>{t('kanban.eyebrow')}</Eyebrow>
        <EmptyState icon="bar-chart" text={t('work.needProject')} />
        <Button variant="primary" full icon="briefcase" onPress={() => go('whome')}>
          {t('work.goToProjects')}
        </Button>
      </View>
    );
  }

  const q = query.trim().toLowerCase();
  const filteredCards = q ? cards.filter((card) => card.title.toLowerCase().includes(q)) : cards;

  return (
    <View style={{ flex: 1 }}>
      {/* header */}
      <View style={{ paddingHorizontal: space.screenPad, paddingTop: 6, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>{t('kanban.eyebrow')}</Eyebrow>
            <Txt size={23} weight="black" color={c.textStrong} letterSpacing={-0.46} numberOfLines={1}>
              {activeProject?.name ?? '—'}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon={searching ? 'x' : 'search'}
              variant="ghost"
              size={40}
              onPress={() => {
                setSearching((s) => !s);
                setQuery('');
              }}
              accessibilityLabel={t('kanban.searchPlaceholder')}
            />
          </View>
        </View>
        {searching ? (
          <View style={{ marginTop: 10 }}>
            <Input icon="search" shape="pill" placeholder={t('kanban.searchPlaceholder')} value={query} onChangeText={setQuery} autoFocus />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Icon name="zap" size={13} color={c.limeText} />
            <Txt size={11.5} color={c.textMuted} style={{ flex: 1 }}>
              {t('kanban.hint')}
            </Txt>
          </View>
        )}
      </View>

      {q && filteredCards.length === 0 && <EmptyState icon="search" text={t('kanban.noResults')} />}

      {/* columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.screenPad, paddingBottom: 20, gap: 12 }}
      >
        {COLS.map((col) => {
          const list = filteredCards.filter((card) => card.col === col.key);
          const wipHit = col.wip != null && list.length > col.wip;
          return (
            <View key={col.key} style={{ width: 240 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 10 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: col.accent }} />
                <Txt size={13} weight="black" color={c.textStrong}>
                  {col.label}
                </Txt>
                <Txt size={12} weight="mono" color={wipHit ? status.red500 : c.textMuted}>
                  {list.length}
                  {col.wip != null ? `/${col.wip}` : ''}
                </Txt>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{
                  backgroundColor: c.surfaceSunken,
                  borderRadius: radius.lg,
                }}
                contentContainerStyle={{ padding: 10, gap: 10, minHeight: 120 }}
              >
                {list.map((card) => (
                  <BoardCard
                    key={card.id}
                    card={card}
                    onTap={() => advanceCard(card.id)}
                    onHold={() => setHeld(card)}
                  />
                ))}
                {!searching && <AddCard onAdd={(title) => addCard(col.key, title, userName)} />}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* move / delete sheet (long-press) */}
      <Sheet visible={!!held} onClose={() => setHeld(null)} title={held?.title ?? ''}>
        <Txt size={12} weight="black" color={c.textMuted} caps style={{ marginBottom: 10 }}>
          {t('kanban.moveTo')}
        </Txt>
        <View style={{ gap: 8 }}>
          {COLS.map((col) => (
            <Pressable
              key={col.key}
              onPress={() => {
                if (held) moveCard(held.id, col.key);
                setHeld(null);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: radius.md,
                backgroundColor: held?.col === col.key ? c.lime100 : c.surfaceSunken,
              }}
            >
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: col.accent }} />
              <Txt size={14.5} weight="bold" color={c.textStrong} style={{ flex: 1 }}>
                {col.label}
              </Txt>
              {held?.col === col.key && <Icon name="check" size={16} color={c.limeText} />}
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              if (held) deleteCard(held.id);
              setHeld(null);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              borderRadius: radius.md,
              backgroundColor: c.red50,
            }}
          >
            <Icon name="trash" size={16} color={c.dangerFg} />
            <Txt size={14.5} weight="bold" color={c.dangerFg}>
              {t('common.delete')}
            </Txt>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}
