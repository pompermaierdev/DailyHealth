import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = { children: React.ReactNode; fundo?: string; rolavel?: boolean; estilo?: ViewStyle };

export function Tela({ children, fundo = colors.fundo, rolavel = true, estilo }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: fundo }} edges={['top', 'left', 'right']}>
      {rolavel ? (
        <ScrollView contentContainerStyle={[styles.conteudo, estilo]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.conteudo, { flex: 1 }, estilo]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ conteudo: { padding: 20, gap: 16, paddingBottom: 40 } });
