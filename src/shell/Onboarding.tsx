import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n/useI18n';
import { ink, lime } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Txt } from '@/ui/Txt';
import { LogoMark } from './LogoMark';

/** Onboarding splash — ink hero, lime glow, display headline, primary CTA. */
export function Onboarding({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: ink[900] }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 30,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 24) + 8,
          justifyContent: 'flex-end',
        }}
      >
        {/* lime radial glow behind the logo */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 70, left: 0, right: 0, alignItems: 'center' }}
        >
          <View
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: lime[400],
              opacity: 0.16,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 45,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: lime[400],
              opacity: 0.22,
            }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 130, left: 0, right: 0, alignItems: 'center' }}
        >
          <LogoMark size={82} />
        </View>

        <View>
          <Txt size={42} weight="black" color="#FFFFFF" letterSpacing={-1.26} lineHeight={44}>
            {t('ob.title1')}
            {'\n'}
            {t('ob.title2')}
            {'\n'}
            <Txt size={42} weight="black" color={lime[400]} letterSpacing={-1.26}>
              {t('ob.title3')}
            </Txt>
          </Txt>
          <Txt size={15.5} color="#9AA0AA" lineHeight={23} style={{ marginTop: 16, maxWidth: 310 }}>
            {t('ob.sub')}
          </Txt>
          <View style={{ marginTop: 26 }}>
            <Button variant="primary" size="lg" full icon="arrow-right" onPress={onStart}>
              {t('ob.cta')}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
