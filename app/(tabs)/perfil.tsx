import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { StatusBluetooth } from '../../src/components/StatusBluetooth';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

const ROTULO = { proprio: 'Uso próprio', responsavel: 'Cuidador / Responsável', cuidador: 'Cuidador / Responsável' } as const;

export default function Perfil() {
  const { usuario, sair } = useAuth();
  if (!usuario) return null;
  const cuidador = usuario.perfil === 'cuidador';

  const dados: [string, string | undefined][] = [
    ['Nome', usuario.nome],
    ['Como prefere ser chamado(a)', usuario.nomePreferido],
    ['E-mail', usuario.email],
    ['Telefone', usuario.telefone],
    ['Perfil', ROTULO[usuario.perfil]],
    ['Pessoa cuidada', usuario.nomePaciente],
  ];

  return (
    <Tela>
      <Text style={fonte.titulo}>Perfil</Text>
      <View style={styles.card}>
        {dados
          .filter(([, v]) => !!v)
          .map(([k, v]) => (
            <View key={k}>
              <Text style={fonte.pequeno}>{k}</Text>
              <Text style={fonte.corpo}>{v}</Text>
            </View>
          ))}
      </View>

      {!cuidador && <StatusBluetooth />}
      {!cuidador && <Botao titulo="Minha caixa" icone="bluetooth" variante="secundario" onPress={() => router.push('/caixa')} />}
      <Botao
        titulo={cuidador ? 'Pessoas que acompanho' : 'Familiares e cuidadores'}
        icone="people-outline"
        variante="secundario"
        onPress={() => router.push('/conexoes')}
      />
      <Botao
        titulo="Sair"
        variante="fantasma"
        onPress={async () => {
          await sair();
          router.replace('/(auth)/login');
        }}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.branco, borderRadius: raio.card, borderWidth: 2, borderColor: colors.borda, padding: 18, gap: 12 },
});
