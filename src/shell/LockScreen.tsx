import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/useI18n';
import { authenticate } from '@/services/biometric';
import { useTheme } from '@/theme/ThemeContext';
import { ink, shadows } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Txt } from '@/ui/Txt';

/** Full-screen biometric gate shown at launch when the app lock is enabled. */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { c } = useTheme();
  const { t } = useI18n();

  const tryUnlock = async () => {
    const res = await authenticate(t('lock.cta'));
    if (res.ok) onUnlock();
  };

  useEffect(() => {
    // prompt immediately on mount
    tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bgApp,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: 30,
      }}
    >
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
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt size={23} weight="black" color={c.textStrong} letterSpacing={-0.46}>
          {t('lock.title')}
        </Txt>
        <Txt size={14} color={c.textMuted} center style={{ maxWidth: 260 }}>
          {t('lock.sub')}
        </Txt>
      </View>
      <Button variant="primary" size="lg" icon="lock" onPress={tryUnlock}>
        {t('lock.cta')}
      </Button>
    </View>
  );
}
