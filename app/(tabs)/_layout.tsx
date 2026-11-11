import React from 'react';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

const icone = (nome: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={nome} size={size + 2} color={color as string} />
  );

export default function TabsLayout() {
  const { usuario } = useAuth();
  const cuidador = usuario?.perfil === 'cuidador';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rosa,
        tabBarInactiveTintColor: colors.textoSuave,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '800' },
        tabBarStyle: { height: 76, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.branco, borderTopColor: colors.borda },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home-outline') }} />
      <Tabs.Screen name="medicamentos" options={{ title: 'Remédios', tabBarIcon: icone('medkit-outline'), href: cuidador ? null : undefined }} />
      <Tabs.Screen name="relatorio" options={{ title: 'Relatório', tabBarIcon: icone('bar-chart-outline'), href: cuidador ? null : undefined }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('person-outline') }} />
    </Tabs>
  );
}
