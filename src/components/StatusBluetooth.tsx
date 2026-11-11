import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { useCaixa } from '../hooks/useCaixa';

export function StatusBluetooth() {
  const { estado } = useCaixa();
  const conectada = estado === 'conectada';
  const ocupada = estado === 'procurando' || estado === 'conectando';
  const texto = conectada ? 'Caixa conectada' : ocupada ? 'Conectando…' : 'Caixa desconectada';
  const cor = conectada ? colors.sucesso : ocupada ? colors.alerta : colors.textoSuave;
  const bg = conectada ? colors.sucessoClaro : ocupada ? colors.alertaClaro : colors.azulClaro;

  return (
    <Pressable
      onPress={() => router.push('/caixa')}
      accessibilityRole="button"
      accessibilityLabel={`${texto}. Toque para abrir a tela da caixa`}
      style={[styles.pill, { backgroundColor: bg }]}
    >
      <Ionicons name="bluetooth" size={22} color={cor} />
      <Text style={[styles.txt, { color: cor }]}>{texto}</Text>
      <View style={[styles.dot, { backgroundColor: cor }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, alignSelf: 'flex-start' },
  txt: { fontSize: 16, fontWeight: '800' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
