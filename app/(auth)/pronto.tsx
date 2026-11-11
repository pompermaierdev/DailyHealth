import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/AuthContext';
import { useCadastro } from '../../src/context/CadastroContext';
import { colors } from '../../src/theme/colors';
import { fonte } from '../../src/theme/typography';

export default function Pronto() {
  const { usuario } = useAuth();
  const { dados, limpar } = useCadastro();
  const proprio = dados.perfil === 'proprio';
  const nome = (usuario?.nomePreferido || usuario?.nome || '').split(' ')[0];

  const entrar = (destino: '/(tabs)/medicamentos' | '/(tabs)' | '/caixa') => {
    limpar();
    if (destino === '/caixa') {
      router.replace('/(tabs)');
      router.push('/caixa');
    } else {
      router.replace(destino);
    }
  };

  return (
    <Tela rolavel={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Ionicons name="checkmark-circle" size={120} color={colors.sucesso} />
        <Text style={[fonte.titulo, { textAlign: 'center' }]}>Tudo pronto{nome ? `, ${nome}` : ''}!</Text>
        <Text style={[fonte.subtitulo, { textAlign: 'center' }]}>Seja bem-vindo(a) ao DailyHealth.</Text>
        <Text style={[fonte.suave, { textAlign: 'center' }]}>
          {proprio
            ? 'Agora você pode organizar seus medicamentos e receber lembretes para cuidar da sua saúde.'
            : 'Agora você pode acompanhar a rotina de medicamentos da pessoa que você cuida.'}
        </Text>
      </View>

      <View style={{ gap: 12, paddingBottom: 20 }}>
        {proprio && dados.temCaixa === true && (
          <Botao titulo="Conectar minha caixa" icone="bluetooth" variante="secundario" onPress={() => entrar('/caixa')} />
        )}
        <Botao
          titulo={proprio ? 'Ir para meus medicamentos' : 'Ir para o início'}
          icone="arrow-forward"
          onPress={() => entrar(proprio ? '/(tabs)/medicamentos' : '/(tabs)')}
        />
      </View>
    </Tela>
  );
}
