import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Tela } from './Tela';
import { Logo } from './Logo';
import { Botao } from './Botao';
import { useAuth } from '../context/AuthContext';
import { vinculosDoCuidador, VinculoCuidador } from '../services/vinculos';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';

// Início de quem acompanha outra pessoa
export function InicioCuidador() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<VinculoCuidador[]>([]);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!usuario) return;
      vinculosDoCuidador(usuario.id)
        .then((l) => {
          setLista(l.filter((v) => v.status !== 'recusado'));
          setErro('');
        })
        .catch(() => setErro('Não consegui carregar. Verifique a internet.'));
    }, [usuario?.id])
  );

  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <Tela>
      <Logo tamanho={40} horizontal />
      <View>
        <Text style={fonte.titulo}>Olá, {primeiroNome}!</Text>
        <Text style={fonte.suave}>Acompanhe a rotina de quem você cuida.</Text>
      </View>

      {erro !== '' && <Text style={{ color: colors.erro, fontSize: 16, fontWeight: '700' }}>{erro}</Text>}

      {lista.length === 0 && erro === '' && (
        <View style={styles.vazio}>
          <Ionicons name="people-outline" size={44} color={colors.azul} />
          <Text style={[fonte.corpo, { textAlign: 'center' }]}>Você ainda não acompanha ninguém.</Text>
          <Text style={[fonte.pequeno, { textAlign: 'center' }]}>Peça o código de conexão para a pessoa e toque no botão abaixo.</Text>
        </View>
      )}

      {lista.map((v) => {
        const ativo = v.status === 'ativo';
        return (
          <Pressable
            key={v.pacienteId}
            disabled={!ativo}
            onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: v.pacienteId, nome: v.nome ?? '' } })}
            style={styles.card}
            accessibilityRole="button"
          >
            <View style={[styles.avatar, { backgroundColor: ativo ? colors.rosa : colors.azulClaro }]}>
              <Ionicons name="person" size={26} color={ativo ? '#fff' : colors.azulEscuro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={fonte.subtitulo}>{v.nome ?? 'Aguardando autorização'}</Text>
              <Text style={fonte.pequeno}>
                {ativo ? `${v.relacao ?? 'Acompanhando'} · toque para ver a rotina` : 'A pessoa precisa aceitar o pedido no app dela'}
              </Text>
            </View>
            {ativo && <Ionicons name="chevron-forward" size={26} color={colors.azul} />}
          </Pressable>
        );
      })}

      <Botao titulo="Conectar a uma pessoa" icone="add" onPress={() => router.push('/conexoes')} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  vazio: { alignItems: 'center', gap: 8, padding: 20, borderRadius: raio.card, backgroundColor: colors.azulClaro },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: raio.card, backgroundColor: colors.branco, borderWidth: 2, borderColor: colors.borda },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
});
