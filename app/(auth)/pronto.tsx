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
  const codigoSalvo = usuario?.codigoConexao;

  const concluir = (extra?: 'caixa' | 'gerar' | 'conectar') => {
    const base = proprio ? '/(tabs)/medicamentos' : '/(tabs)';
    limpar();
    router.replace(base);
    if (extra === 'caixa') router.push('/caixa');
    if (extra === 'gerar') router.push('/conexoes');
    if (extra === 'conectar') router.push({ pathname: '/conexoes', params: { codigo: codigoSalvo } });
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
          <Botao titulo="Conectar minha caixa" icone="bluetooth" variante="secundario" onPress={() => concluir('caixa')} />
        )}
        {proprio && dados.querConectarFamiliar === true && (
          <Botao titulo="Gerar código para um familiar" icone="key-outline" variante="secundario" onPress={() => concluir('gerar')} />
        )}
        {!proprio && !!codigoSalvo && (
          <Botao titulo="Conectar à pessoa agora" icone="link-outline" variante="secundario" onPress={() => concluir('conectar')} />
        )}
        <Botao
          titulo={proprio ? 'Ir para meus medicamentos' : 'Ir para o início'}
          icone="arrow-forward"
          onPress={() => concluir()}
        />
      </View>
    </Tela>
  );
}
