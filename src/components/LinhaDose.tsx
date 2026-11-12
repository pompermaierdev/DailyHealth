import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { StatusChip } from './StatusChip';
import { DoseDia } from '../utils/doses';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';

export function LinhaDose({ dose, onConfirmar }: { dose: DoseDia; onConfirmar?: () => void }) {
  const q = dose.med.quantidadePorDose;
  return (
    <View style={styles.linha} accessibilityLabel={`${dose.horario} ${dose.med.nome}`}>
      <View style={styles.hora}>
        <Text style={styles.horaTxt}>{dose.horario}</Text>
      </View>
      <View style={styles.sep} />
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={1}>
          {dose.med.nome}
        </Text>
        <Text style={fonte.pequeno}>
          {q} {q === 1 ? 'comprimido' : 'comprimidos'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <StatusChip status={dose.status} />
        {onConfirmar && (
          <Pressable onPress={onConfirmar} accessibilityRole="button" style={styles.btn}>
            <Text style={styles.btnTxt}>Confirmar dose</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: raio.card, backgroundColor: colors.branco, borderWidth: 2, borderColor: colors.borda },
  hora: { minWidth: 72, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.azulClaro, alignItems: 'center' },
  horaTxt: { fontSize: 18, fontWeight: '900', color: colors.navy },
  sep: { width: 2, alignSelf: 'stretch', backgroundColor: colors.borda, borderRadius: 1 },
  nome: { fontSize: 19, fontWeight: '800', color: colors.navy },
  btn: { backgroundColor: colors.rosa, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
