import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Coracao } from './Logo';
import { colors } from '../theme/colors';

// Anel de progresso com o coração no meio
export function AnelAdesao({ pct, tamanho = 110 }: { pct: number | null; tamanho?: number }) {
  const traco = 12;
  const r = (tamanho - traco) / 2;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.min(100, Math.max(0, pct)) / 100;
  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute' }}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke="#FFFFFF" strokeWidth={traco} fill="none" />
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={colors.rosa}
          strokeWidth={traco}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          rotation={-90}
          origin={`${tamanho / 2}, ${tamanho / 2}`}
        />
      </Svg>
      <Coracao tamanho={tamanho * 0.42} />
    </View>
  );
}
