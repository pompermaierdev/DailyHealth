import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { agendarSync, iniciarSincronizacao, pararSincronizacao } from '../src/services/sincronizacao';
import { CaixaProvider } from '../src/context/CaixaContext';
import { colors } from '../src/theme/colors';
import { configurarNotificacoes, prepararNotificacoes, reagendarNotificacoes } from '../src/services/notificacoes';

configurarNotificacoes();

// Tocar na notificação abre a tela "Tomou o remédio?" daquela dose
function AbrirPorNotificacao() {
  const resposta = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!resposta || resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const d = resposta.notification.request.content.data as { slot?: string; horario?: string; data?: string };
    if (d?.slot && d?.horario) {
      router.push({ pathname: '/confirmar', params: { slot: String(d.slot), horario: d.horario, data: d.data } });
    }
  }, [resposta]);

  return null;
}

// Mantém os dados do celular e do banco em dia enquanto há alguém logado
function Sincronizador() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;
    iniciarSincronizacao(usuario);
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') agendarSync(500);
    });
    return () => {
      sub.remove();
      pararSincronizacao();
    };
  }, [usuario?.id, usuario?.perfil]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    prepararNotificacoes().then((ok) => {
      if (ok) reagendarNotificacoes();
    });
  }, []);

  return (
    <AuthProvider>
      <CaixaProvider>
        <StatusBar style="dark" />
        <AbrirPorNotificacao />
        <Sincronizador />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fundo } }}>
          <Stack.Screen name="confirmar" options={{ presentation: 'modal' }} />
        </Stack>
      </CaixaProvider>
    </AuthProvider>
  );
}
