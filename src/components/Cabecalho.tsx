import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { Logo } from './Logo';

export function Cabecalho({ voltar = true }: { voltar?: boolean }) {
  return (
    <View style={styles.linha}>
      {voltar ? (
        <Pressable onPress={() => router.back()} accessibilityLabel="Voltar" style={styles.btn}>
          <Ionicons name="chevron-back" size={30} color={colors.rosa} />
        </Pressable>
      ) : (
        <View style={styles.btn} />
      )}
      <Logo tamanho={36} horizontal />
      <View style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
