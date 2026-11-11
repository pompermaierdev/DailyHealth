import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonte } from '../theme/typography';

type Props = { pergunta: string; valor: boolean | null; onChange: (v: boolean) => void };

export function SimNao({ pergunta, valor, onChange }: Props) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={fonte.corpo}>{pergunta}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[true, false].map((v) => {
          const sel = valor === v;
          return (
            <Pressable
              key={String(v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              onPress={() => onChange(v)}
              style={[styles.btn, sel && { backgroundColor: v ? colors.azul : colors.rosa, borderColor: v ? colors.azul : colors.rosa }]}
            >
              <Text style={[styles.txt, sel && { color: '#fff' }]}>{v ? 'Sim' : 'Não'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flex: 1, minHeight: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.azulClaro, alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 19, fontWeight: '800', color: colors.azulEscuro },
});
