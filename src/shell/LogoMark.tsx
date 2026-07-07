import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { lime } from '@/theme/tokens';

/** Lakon monogram — bold "L" with a lime spark node (assets/logo-mark.svg). */
export function LogoMark({ size = 78 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Rect width={96} height={96} rx={26} fill="#101012" />
      <Path
        d="M35 23 V58 a5 5 0 0 0 5 5 H64"
        fill="none"
        stroke={lime[400]}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={62} cy={31} r={7.5} fill={lime[400]} />
    </Svg>
  );
}
