import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Barra de etapas do cadastro: (1)---(2)---(3)
export function Progresso({ etapa, total = 3 }: { etapa: number; total?: number }) {
  return (
    <View style={styles.linha} accessibilityLabel={`Etapa ${etapa} de ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const feito = n < etapa;
        const atual = n === etapa;
        return (
          <React.Fragment key={n}>
            <View style={[styles.bola, (feito || atual) && styles.bolaAtiva]}>
              {feito ? (
                <Ionicons name="checkmark" size={20} color="#fff" />
              ) : (
                <Text style={[styles.num, atual && { color: '#fff' }]}>{n}</Text>
              )}
            </View>
            {n < total && <View style={[styles.trilho, feito && styles.trilhoAtivo]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: '70%' },
  bola: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.azulClaro, alignItems: 'center', justifyContent: 'center' },
  bolaAtiva: { backgroundColor: colors.rosa },
  num: { fontSize: 16, fontWeight: '800', color: colors.textoSuave },
  trilho: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.azulClaro },
  trilhoAtivo: { backgroundColor: colors.rosa },
});
