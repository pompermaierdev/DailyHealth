import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

export function Coracao({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="gradCoracao" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF9DB5" />
          <Stop offset="1" stopColor="#FF4F80" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#gradCoracao)"
      />
      {/* batimento */}
      <Path
        d="M3.6 11.6h4l1.8-3.4 2.6 6.2 1.9-2.8h2.2"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* cruz */}
      <Path d="M18.4 8.2v3.6M16.6 10h3.6" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

type Props = {
  tamanho?: number; // tamanho do coração
  mostrarSlogan?: boolean;
  compacto?: boolean; // versão "DH" para idosos
  horizontal?: boolean; // coração ao lado do nome (cabeçalhos)
};

export function Logo({ tamanho = 96, mostrarSlogan = false, compacto = false, horizontal = false }: Props) {
  const fonteNome = Math.round(tamanho * 0.42);

  const nome = compacto ? (
    <Text style={[styles.nome, { fontSize: fonteNome * 1.3 }]}>
      <Text style={{ color: colors.azul }}>D</Text>
      <Text style={{ color: colors.rosa }}>H</Text>
    </Text>
  ) : (
    <Text style={[styles.nome, { fontSize: fonteNome }]}>
      <Text style={{ color: colors.azul }}>Daily</Text>
      <Text style={{ color: colors.rosa }}>Health</Text>
    </Text>
  );

  return (
    <View style={[styles.base, horizontal && styles.horizontal]} accessibilityLabel="DailyHealth">
      <Coracao tamanho={tamanho} />
      {nome}
      {mostrarSlogan && !horizontal && <Text style={styles.slogan}>Mais cuidado, todos os dias.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center' },
  horizontal: { flexDirection: 'row', gap: 8 },
  nome: { fontWeight: '900', letterSpacing: -0.5 },
  slogan: { marginTop: 4, fontSize: 17, fontWeight: '600', color: colors.azulEscuro },
});
