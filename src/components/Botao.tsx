import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'escuro' | 'fantasma';
  icone?: keyof typeof Ionicons.glyphMap;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
};

export function Botao({ titulo, onPress, variante = 'primario', icone, carregando, desabilitado, estilo }: Props) {
  const cor = {
    primario: { bg: colors.rosa, txt: '#fff', borda: colors.rosa },
    secundario: { bg: colors.branco, txt: colors.azulEscuro, borda: colors.azul },
    escuro: { bg: colors.navy, txt: '#fff', borda: colors.navy },
    fantasma: { bg: 'transparent', txt: colors.azulEscuro, borda: 'transparent' },
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: cor.bg, borderColor: cor.borda, opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1 },
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cor.txt} />
      ) : (
        <>
          <Text style={[fonte.botao, { color: cor.txt }]}>{titulo}</Text>
          {icone && <Ionicons name={icone} size={24} color={cor.txt} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: raio.botao,
    borderWidth: 2,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
