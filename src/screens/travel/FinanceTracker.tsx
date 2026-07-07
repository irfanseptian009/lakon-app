import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useI18n } from '@/i18n/useI18n';
import type { ScreenProps } from '@/shell/AppShell';
import { BudgetCat, useTravel } from '@/stores/travelStore';
import { useTheme } from '@/theme/ThemeContext';
import { ink, radius, shadows, space, white } from '@/theme/tokens';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Eyebrow, SectionTitle } from '@/ui/common';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Input';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Sheet } from '@/ui/Sheet';
import { Txt } from '@/ui/Txt';

const fmt = (n: number) => 'Rp ' + (n / 1000000).toFixed(1).replace('.', ',') + 'jt';

/** Locally-rendered donut — stroked SVG segments, no chart lib. */
function Donut({ cats, useActual, size = 120 }: { cats: BudgetCat[]; useActual: boolean; size?: number }) {
  const thickness = 16;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = cats.reduce((s, cat) => s + (useActual ? cat.actual : cat.est), 0) || 1;

  // precompute segments with a plain loop (render-pure, compiler-friendly)
  const segments: { id: number; color: string; dash: number; offset: number }[] = [];
  let acc = 0;
  for (const cat of cats) {
    const frac = (useActual ? cat.actual : cat.est) / total;
    segments.push({ id: cat.id, color: cat.color, dash: frac * circ, offset: -acc * circ });
    acc += frac;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => (
        <Circle
          key={seg.id}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
    </Svg>
  );
}

export function FinanceTracker(_: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { trip, cats, fxRate, addExpense, setCatEst, setFxRate } = useTravel();
  const [view, setView] = useState<'estimated' | 'actual'>('actual');
  const [addingExp, setAddingExp] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [editingCat, setEditingCat] = useState<BudgetCat | null>(null);
  const [expForm, setExpForm] = useState({ name: '', amount: '', catId: 0, currency: 'IDR' });
  const [rateForm, setRateForm] = useState({ code: fxRate.code, rate: String(fxRate.rate) });
  const [estDraft, setEstDraft] = useState('');

  const useActual = view === 'actual';
  const total = cats.reduce((s, cat) => s + (useActual ? cat.actual : cat.est), 0);

  const submitExpense = () => {
    const amount = Number(expForm.amount.replace(/[^\d.]/g, ''));
    const catId = expForm.catId || cats[0]?.id;
    if (!expForm.name.trim() || !amount || !catId) return;
    const isFx = expForm.currency !== 'IDR';
    addExpense(catId, expForm.name.trim(), amount, expForm.currency, isFx ? fxRate.rate : 1);
    setExpForm({ name: '', amount: '', catId: 0, currency: 'IDR' });
    setAddingExp(false);
  };

  const submitRate = () => {
    const r = Number(rateForm.rate.replace(/[^\d.]/g, ''));
    if (!rateForm.code.trim() || !r) return;
    setFxRate(rateForm.code.trim().toUpperCase(), r);
    setEditingRate(false);
  };

  const submitEst = () => {
    if (!editingCat) return;
    const v = Number(estDraft.replace(/[^\d]/g, ''));
    if (v > 0) setCatEst(editingCat.id, v);
    setEditingCat(null);
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
        <View>
          <Eyebrow>{t('fin.eyebrow')}</Eyebrow>
          <Txt size={26} weight="black" color={c.textStrong} letterSpacing={-0.52}>
            {trip?.name ?? '—'}
          </Txt>
        </View>
        <IconButton icon="plus" variant="dark" onPress={() => setAddingExp(true)} accessibilityLabel={t('fin.addExpense')} />
      </View>

      <SegmentedControl
        full
        tone="accent"
        options={[
          { value: 'estimated', label: t('fin.estimated') },
          { value: 'actual', label: t('fin.actual') },
        ]}
        value={view}
        onChange={setView}
      />

      {/* donut + legend */}
      <Card tone="dark" pad="lg" radius="xl" style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
          <View style={{ width: 120, height: 120 }}>
            <Donut cats={cats} useActual={useActual} />
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={10} weight="bold" color={c.textOnDarkMuted}>
                {useActual ? t('fin.spent') : t('fin.planned')}
              </Txt>
              <Txt size={19} weight="black" color={white}>
                {fmt(total)}
              </Txt>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {cats.map((cat) => {
              const v = useActual ? cat.actual : cat.est;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return (
                <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cat.color }} />
                  <Txt size={12.5} weight="semibold" color={c.textOnDark} style={{ flex: 1 }}>
                    {cat.name}
                  </Txt>
                  <Txt size={12} weight="mono" color={c.textOnDarkMuted}>
                    {pct}%
                  </Txt>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      {/* est vs actual matrix */}
      <SectionTitle style={{ marginTop: 22, marginBottom: 12 }}>{t('fin.estVsAct')}</SectionTitle>
      <View style={{ gap: 10 }}>
        {cats.map((cat) => {
          const over = cat.actual > cat.est;
          const diff = Math.abs(cat.actual - cat.est);
          return (
            <Pressable
              key={cat.id}
              onLongPress={() => {
                setEstDraft(String(cat.est));
                setEditingCat(cat);
              }}
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
                  borderRadius: radius.sm,
                  backgroundColor: c.surfaceSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={cat.icon as never} size={19} color={c.textBody} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={14.5} weight="bold" color={c.textStrong}>
                  {cat.name}
                </Txt>
                <Txt size={12} color={c.textMuted}>
                  {t('fin.est', { v: fmt(cat.est) })} · {t('fin.act', { v: fmt(cat.actual) })}
                </Txt>
              </View>
              <Badge tone={over ? 'danger' : 'success'}>
                {over ? '+' : '−'}
                {fmt(diff)}
              </Badge>
            </Pressable>
          );
        })}
      </View>

      {/* manual exchange rate */}
      <Pressable onPress={() => {
        setRateForm({ code: fxRate.code, rate: String(fxRate.rate) });
        setEditingRate(true);
      }}>
        <Card tone="sunken" pad="md" radius="lg" style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="wallet" size={18} color={c.textMuted} />
            <View style={{ flex: 1 }}>
              <Txt size={12.5} weight="bold" color={c.textStrong}>
                {t('fin.manualRate')}
              </Txt>
              <Txt size={11.5} color={c.textMuted}>
                {t('fin.rateSub')}
              </Txt>
            </View>
            <Txt size={13} weight="monoBold" color={c.textStrong}>
              1 {fxRate.code} = {fxRate.rate.toLocaleString('id-ID')}
            </Txt>
          </View>
        </Card>
      </Pressable>

      {/* add expense sheet */}
      <Sheet visible={addingExp} onClose={() => setAddingExp(false)} title={t('fin.addExpense')}>
        <Input label={t('fin.expenseName')} value={expForm.name} onChangeText={(v) => setExpForm({ ...expForm, name: v })} autoFocus />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            label={t('fin.amount')}
            prefix={expForm.currency === 'IDR' ? 'Rp' : expForm.currency}
            value={expForm.amount}
            onChangeText={(v) => setExpForm({ ...expForm, amount: v })}
            keyboardType="numeric"
            style={{ flex: 2 }}
          />
          <Pressable
            onPress={() => setExpForm({ ...expForm, currency: expForm.currency === 'IDR' ? fxRate.code : 'IDR' })}
            style={{ flex: 1 }}
          >
            <Txt size={13} weight="semibold" color={c.textStrong} style={{ marginBottom: 8 }}>
              {t('fin.currency')}
            </Txt>
            <View
              style={{
                height: 50,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: c.borderStrong,
                backgroundColor: c.controlBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={15} weight="monoBold" color={c.textStrong}>
                {expForm.currency}
              </Txt>
            </View>
          </Pressable>
        </View>
        <View style={{ height: 14 }} />
        <Txt size={13} weight="semibold" color={c.textStrong} style={{ marginBottom: 8 }}>
          {t('fin.category')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {cats.map((cat) => {
            const active = (expForm.catId || cats[0]?.id) === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setExpForm({ ...expForm, catId: cat.id })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: radius.pill,
                  backgroundColor: active ? ink[900] : c.controlTrack,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: cat.color }} />
                <Txt size={13} weight="bold" color={active ? white : c.textBody}>
                  {cat.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="plus" onPress={submitExpense}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* edit rate sheet */}
      <Sheet visible={editingRate} onClose={() => setEditingRate(false)} title={t('fin.editRate')}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            label={t('fin.currency')}
            value={rateForm.code}
            onChangeText={(v) => setRateForm({ ...rateForm, code: v })}
            autoCapitalize="characters"
            style={{ flex: 1 }}
          />
          <Input
            label="Rate (IDR)"
            value={rateForm.rate}
            onChangeText={(v) => setRateForm({ ...rateForm, rate: v })}
            keyboardType="numeric"
            style={{ flex: 2 }}
          />
        </View>
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="check" onPress={submitRate}>
          {t('common.save')}
        </Button>
      </Sheet>

      {/* edit category estimate sheet */}
      <Sheet visible={!!editingCat} onClose={() => setEditingCat(null)} title={t('fin.setEst')}>
        <Input
          label={editingCat?.name ?? ''}
          prefix="Rp"
          value={estDraft}
          onChangeText={setEstDraft}
          keyboardType="number-pad"
          autoFocus
        />
        <View style={{ height: 16 }} />
        <Button variant="primary" full icon="check" onPress={submitEst}>
          {t('common.save')}
        </Button>
      </Sheet>
    </ScrollView>
  );
}
