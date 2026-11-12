import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { StatusDose } from '../types';

const CFG: Record<StatusDose, { rot: string; bg: string; fg: string; icone: keyof typeof Ionicons.glyphMap }> = {
  tomado: { rot: 'Tomado', bg: colors.sucessoClaro, fg: colors.sucesso, icone: 'checkmark-circle' },
  pendente: { rot: 'Pendente', bg: colors.alertaClaro, fg: '#B26A00', icone: 'time-outline' },
  atrasado: { rot: 'Atrasado', bg: colors.alertaClaro, fg: '#B26A00', icone: 'time-outline' },
  perdido: { rot: 'Perdido', bg: '#FDE3E8', fg: colors.erro, icone: 'alert-circle' },
};

export function StatusChip({ status }: { status: StatusDose }) {
  const c = CFG[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icone} size={16} color={c.fg} />
      <Text style={[styles.txt, { color: c.fg }]}>{c.rot}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14 },
  txt: { fontSize: 14, fontWeight: '800' },
});
