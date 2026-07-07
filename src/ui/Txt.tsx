import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { font } from '@/theme/tokens';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'black' | 'mono' | 'monoBold';

interface TxtProps extends TextProps {
  size?: number;
  weight?: Weight;
  color?: string;
  caps?: boolean;
  center?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
}

/** Themed text shorthand — keeps screens terse and typography consistent. */
export function Txt({
  size = 15,
  weight = 'regular',
  color = '#101012',
  caps = false,
  center = false,
  lineHeight,
  letterSpacing,
  style,
  children,
  ...rest
}: TxtProps) {
  const s: TextStyle = {
    fontFamily: font[weight],
    fontSize: size,
    color,
    ...(caps ? { textTransform: 'uppercase', letterSpacing: size * 0.06 } : {}),
    ...(center ? { textAlign: 'center' } : {}),
    ...(lineHeight != null ? { lineHeight } : {}),
    ...(letterSpacing != null ? { letterSpacing } : {}),
  };
  return (
    <Text style={[s, style]} {...rest}>
      {children}
    </Text>
  );
}
