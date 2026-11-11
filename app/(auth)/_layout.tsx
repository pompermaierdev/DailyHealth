import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { CadastroProvider } from '../../src/context/CadastroContext';

export default function AuthLayout() {
  return (
    <CadastroProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fundo } }} />
    </CadastroProvider>
  );
}
