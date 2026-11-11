import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { usuario, carregando } = useAuth();
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fundo }}>
        <ActivityIndicator size="large" color={colors.rosa} />
      </View>
    );
  }
  return <Redirect href={usuario ? '/(tabs)' : '/(auth)/login'} />;
}
