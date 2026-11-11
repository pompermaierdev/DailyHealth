import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { acompanharPedidos, contarPedidos } from '../services/vinculos';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';

// Cartão que aparece no Início do idoso quando alguém pede para acompanhá-lo
export function AvisoPedidos() {
  const { usuario } = useAuth();
  const [qtd, setQtd] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!usuario || usuario.perfil !== 'proprio') return;
      const atualizar = () => {
        contarPedidos(usuario.id).then(setQtd).catch(() => {});
      };
      atualizar();
      return acompanharPedidos(usuario.id, atualizar);
    }, [usuario?.id, usuario?.perfil])
  );

  if (!qtd) return null;
  return (
    <Pressable onPress={() => router.push('/conexoes')} accessibilityRole="button" style={styles.card}>
      <Ionicons name="people" size={30} color={colors.rosaEscuro} />
      <View style={{ flex: 1 }}>
        <Text style={fonte.subtitulo}>{qtd === 1 ? '1 pedido de conexão' : `${qtd} pedidos de conexão`}</Text>
        <Text style={fonte.pequeno}>Alguém quer acompanhar seus medicamentos. Toque para ver.</Text>
      </View>
      <Ionicons name="chevron-forward" size={26} color={colors.rosaEscuro} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: raio.card, backgroundColor: colors.rosaClaro, borderWidth: 2, borderColor: colors.rosa },
});
