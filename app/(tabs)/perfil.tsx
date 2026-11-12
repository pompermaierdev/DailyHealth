import React from 'react';
import { Linking, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/AuthContext';
import { useCaixa } from '../../src/hooks/useCaixa';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

const ROTULO = { proprio: 'Uso próprio', responsavel: 'Cuidador / Responsável', cuidador: 'Cuidador / Responsável' } as const;

function Dado({ icone, rotulo, valor }: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <View style={styles.dado}>
      <Ionicons name={icone} size={26} color={colors.azul} />
      <View style={{ flex: 1 }}>
        <Text style={fonte.pequeno}>{rotulo}</Text>
        <Text style={fonte.corpo}>{valor}</Text>
      </View>
    </View>
  );
}

export default function Perfil() {
  const { usuario, sair } = useAuth();
  const { estado, horaSincronizada } = useCaixa();
  if (!usuario) return null;

  const cuidador = usuario.perfil === 'cuidador';
  const conectada = estado === 'conectada';

  return (
    <Tela>
      <View>
        <Text style={fonte.titulo}>Meu perfil</Text>
        <Text style={fonte.suave}>Gerencie suas informações e preferências</Text>
      </View>

      <View style={styles.cartao}>
        <Text style={fonte.subtitulo}>Informações pessoais</Text>
        <Dado icone="person-outline" rotulo="Nome completo" valor={usuario.nome} />
        <Dado icone="happy-outline" rotulo="Como prefere ser chamado(a)" valor={usuario.nomePreferido} />
        <Dado icone="mail-outline" rotulo="E-mail" valor={usuario.email} />
        <Dado icone="call-outline" rotulo="Telefone" valor={usuario.telefone} />
        <Dado icone="people-outline" rotulo="Perfil" valor={ROTULO[usuario.perfil]} />
        <Dado icone="heart-outline" rotulo="Pessoa cuidada" valor={usuario.nomePaciente} />
      </View>

      {!cuidador && (
        <View style={styles.cartao}>
          <Text style={fonte.subtitulo}>Conexão com a caixa inteligente</Text>
          <View style={[styles.caixa, { backgroundColor: conectada ? colors.sucessoClaro : colors.azulClaro }]}>
            <Ionicons name="bluetooth" size={30} color={conectada ? colors.sucesso : colors.textoSuave} />
            <View style={{ flex: 1 }}>
              <Text style={[fonte.corpo, { fontWeight: '800', color: conectada ? colors.sucesso : colors.navy }]}>
                {conectada ? 'Caixa conectada' : 'Caixa desconectada'}
              </Text>
              <Text style={fonte.pequeno}>
                {conectada ? (horaSincronizada ? 'Conectada via Bluetooth • hora sincronizada' : 'Conectada via Bluetooth') : 'Toque em conectar para procurar a caixa'}
              </Text>
            </View>
          </View>
          <Botao titulo={conectada ? 'Reconectar' : 'Conectar'} icone="refresh" variante="secundario" onPress={() => router.push('/caixa')} />
          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={22} color={colors.azulEscuro} />
            <Text style={[fonte.pequeno, { flex: 1 }]}>A caixa apita e acende a luz do compartimento correspondente quando for a hora do medicamento.</Text>
          </View>
        </View>
      )}

      <View style={styles.cartao}>
        <Text style={fonte.subtitulo}>Preferências</Text>
        <Pressable onPress={() => router.push('/conexoes')} style={styles.pref} accessibilityRole="button">
          <Ionicons name="people-outline" size={26} color={colors.azul} />
          <View style={{ flex: 1 }}>
            <Text style={fonte.corpo}>{cuidador ? 'Pessoas que acompanho' : 'Familiares e cuidadores'}</Text>
            <Text style={fonte.pequeno}>{cuidador ? 'Conectar com um código' : 'Gerar código e aceitar pedidos'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.azul} />
        </Pressable>
        {!cuidador && (
          <Pressable onPress={() => Linking.openSettings()} style={styles.pref} accessibilityRole="button">
            <Ionicons name="notifications-outline" size={26} color={colors.azul} />
            <View style={{ flex: 1 }}>
              <Text style={fonte.corpo}>Lembretes</Text>
              <Text style={fonte.pequeno}>Gerenciar notificações do app</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.azul} />
          </Pressable>
        )}
      </View>

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
  cartao: { gap: 14, padding: 16, borderRadius: raio.card, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  dado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caixa: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.campo },
  info: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: raio.campo, backgroundColor: colors.azulClaro },
  pref: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
});
