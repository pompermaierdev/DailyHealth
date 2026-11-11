import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Tela } from '../src/components/Tela';
import { Cabecalho } from '../src/components/Cabecalho';
import { Botao } from '../src/components/Botao';
import { CampoTexto } from '../src/components/CampoTexto';
import { useAuth } from '../src/context/AuthContext';
import {
  codigoAtual,
  conectarPorCodigo,
  consultarCodigo,
  gerarCodigo,
  removerVinculo,
  responderPedido,
  vinculosDoCuidador,
  vinculosDoPaciente,
  VinculoCuidador,
  VinculoPaciente,
} from '../src/services/vinculos';
import { colors } from '../src/theme/colors';
import { fonte, raio } from '../src/theme/typography';

// ---------------- IDOSO: gera o código e aceita pedidos ----------------
function ConexoesPaciente({ uid }: { uid: string }) {
  const [codigo, setCodigo] = useState<{ codigo: string; expiraEm: Date } | null>(null);
  const [vinculos, setVinculos] = useState<VinculoPaciente[]>([]);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCodigo(await codigoAtual());
      setVinculos(await vinculosDoPaciente(uid));
      setErro('');
    } catch {
      setErro('Não consegui carregar. Verifique a internet.');
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const gerar = async () => {
    setErro('');
    setGerando(true);
    try {
      await gerarCodigo();
      setCodigo(await codigoAtual());
    } catch (e: any) {
      setErro(e?.message ?? 'Não consegui gerar o código.');
    } finally {
      setGerando(false);
    }
  };

  const compartilhar = () => {
    if (!codigo) return;
    Share.share({ message: `Use o código ${codigo.codigo} no DailyHealth para acompanhar meus medicamentos. Ele vale por 24 horas.` });
  };

  const responder = async (v: VinculoPaciente, aceitar: boolean) => {
    try {
      await responderPedido(uid, v.cuidadorId, aceitar);
      await carregar();
    } catch {
      setErro('Não consegui responder ao pedido. Tente de novo.');
    }
  };

  const remover = (v: VinculoPaciente) =>
    Alert.alert(`Remover ${v.nome}?`, 'Essa pessoa deixará de ver seus medicamentos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerVinculo(uid, v.cuidadorId);
            await carregar();
          } catch {
            setErro('Não consegui remover.');
          }
        },
      },
    ]);

  const horas = codigo ? Math.max(1, Math.round((codigo.expiraEm.getTime() - Date.now()) / 3600000)) : 0;
  const pedidos = vinculos.filter((v) => v.status === 'pendente');
  const ativos = vinculos.filter((v) => v.status === 'ativo');

  return (
    <>
      <Text style={fonte.titulo}>Familiares e cuidadores</Text>
      <Text style={fonte.suave}>Gere um código e passe para quem vai acompanhar você. Só quem você aceitar vê seus dados.</Text>

      <View style={styles.codigoCard}>
        {codigo ? (
          <>
            <Text style={fonte.pequeno}>Seu código de conexão</Text>
            <Text style={styles.codigo}>{codigo.codigo.split('').join(' ')}</Text>
            <Text style={fonte.pequeno}>Vale por mais ~{horas} h</Text>
            <Botao titulo="Compartilhar código" icone="share-outline" onPress={compartilhar} />
            <Botao titulo="Gerar novo código" variante="fantasma" onPress={gerar} carregando={gerando} />
          </>
        ) : (
          <Botao titulo="Gerar código" icone="key-outline" onPress={gerar} carregando={gerando} />
        )}
      </View>

      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

      {pedidos.length > 0 && <Text style={fonte.subtitulo}>Pedidos de conexão</Text>}
      {pedidos.map((v) => (
        <View key={v.cuidadorId} style={styles.linha}>
          <Text style={fonte.corpo}>
            <Text style={{ fontWeight: '900' }}>{v.nome}</Text>
            {v.relacao ? ` (${v.relacao})` : ''} quer acompanhar você.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Botao titulo="Aceitar" onPress={() => responder(v, true)} estilo={{ flex: 1, minHeight: 50 }} />
            <Botao titulo="Recusar" variante="secundario" onPress={() => responder(v, false)} estilo={{ flex: 1, minHeight: 50 }} />
          </View>
        </View>
      ))}

      <Text style={fonte.subtitulo}>Quem acompanha você</Text>
      {ativos.length === 0 && <Text style={fonte.suave}>Ninguém por enquanto.</Text>}
      {ativos.map((v) => (
        <View key={v.cuidadorId} style={[styles.linha, { flexDirection: 'row', alignItems: 'center' }]}>
          <Ionicons name="person-circle-outline" size={36} color={colors.azul} />
          <View style={{ flex: 1 }}>
            <Text style={fonte.corpo}>{v.nome}</Text>
            {v.relacao && <Text style={fonte.pequeno}>{v.relacao}</Text>}
          </View>
          <Pressable onPress={() => remover(v)} accessibilityLabel={`Remover ${v.nome}`} hitSlop={10}>
            <Ionicons name="trash-outline" size={26} color={colors.erro} />
          </Pressable>
        </View>
      ))}
    </>
  );
}

// ---------------- CUIDADOR: digita o código ----------------
function ConexoesCuidador({ uid, relacaoPadrao, codigoInicial }: { uid: string; relacaoPadrao?: string; codigoInicial?: string }) {
  const [codigo, setCodigo] = useState((codigoInicial ?? '').toUpperCase());
  const [lista, setLista] = useState<VinculoCuidador[]>([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista((await vinculosDoCuidador(uid)).filter((v) => v.status !== 'recusado'));
    } catch {
      setErro('Não consegui carregar. Verifique a internet.');
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const conectar = async () => {
    if (codigo.trim().length < 6) return setErro('Digite o código de 6 caracteres.');
    setErro('');
    setAviso('');
    setOcupado(true);
    try {
      const nome = await consultarCodigo(codigo);
      if (!nome) {
        setErro('Código inválido ou expirado. Peça um código novo para a pessoa.');
        return;
      }
      Alert.alert(`Conectar ao perfil de ${nome}?`, 'Você poderá acompanhar os medicamentos e os registros de adesão dessa pessoa.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar solicitação',
          onPress: async () => {
            try {
              await conectarPorCodigo(codigo, relacaoPadrao);
              setCodigo('');
              setAviso(`Solicitação enviada! Agora ${nome} precisa aceitar no app dela.`);
              await carregar();
            } catch (e: any) {
              setErro(e?.message ?? 'Não consegui enviar a solicitação.');
            }
          },
        },
      ]);
    } catch (e: any) {
      setErro(e?.message ?? 'Não consegui verificar o código.');
    } finally {
      setOcupado(false);
    }
  };

  // veio do cadastro com o código já preenchido: já confere
  useEffect(() => {
    if (codigo.length === 6) conectar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remover = (v: VinculoCuidador) =>
    Alert.alert('Parar de acompanhar?', v.nome ? `Você deixará de ver os dados de ${v.nome}.` : 'Cancelar este pedido?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerVinculo(v.pacienteId, uid);
            await carregar();
          } catch {
            setErro('Não consegui remover.');
          }
        },
      },
    ]);

  return (
    <>
      <Text style={fonte.titulo}>Pessoas que eu acompanho</Text>
      <Text style={fonte.suave}>Digite o código que a pessoa gerou no app dela.</Text>

      <CampoTexto
        icone="key-outline"
        placeholder="Código de conexão (6 caracteres)"
        autoCapitalize="characters"
        maxLength={6}
        value={codigo}
        onChangeText={(v) => setCodigo(v.toUpperCase())}
      />
      <Botao titulo="Conectar" icone="link-outline" onPress={conectar} carregando={ocupado} />

      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      {aviso !== '' && <Text style={{ color: colors.sucesso, fontSize: 17, fontWeight: '800' }}>{aviso}</Text>}

      {lista.length > 0 && <Text style={fonte.subtitulo}>Conexões</Text>}
      {lista.map((v) => {
        const ativo = v.status === 'ativo';
        return (
          <View key={v.pacienteId} style={[styles.linha, { flexDirection: 'row', alignItems: 'center' }]}>
            <Pressable
              disabled={!ativo}
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: v.pacienteId, nome: v.nome ?? '' } })}
            >
              <Text style={fonte.corpo}>{v.nome ?? 'Aguardando autorização'}</Text>
              <Text style={fonte.pequeno}>{ativo ? 'Conectado · toque para ver' : 'Pedido enviado'}</Text>
            </Pressable>
            <Pressable onPress={() => remover(v)} accessibilityLabel="Remover conexão" hitSlop={10}>
              <Ionicons name="close-circle-outline" size={28} color={colors.textoSuave} />
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

export default function Conexoes() {
  const { usuario } = useAuth();
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  if (!usuario) return null;

  return (
    <Tela>
      <Cabecalho />
      {usuario.perfil === 'cuidador' ? (
        <ConexoesCuidador uid={usuario.id} relacaoPadrao={usuario.relacao} codigoInicial={codigo} />
      ) : (
        <ConexoesPaciente uid={usuario.id} />
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  codigoCard: { alignItems: 'center', gap: 10, padding: 18, borderRadius: raio.card, backgroundColor: colors.azulClaro },
  codigo: { fontSize: 44, fontWeight: '900', color: colors.navy, letterSpacing: 2 },
  linha: { gap: 10, padding: 14, borderRadius: raio.card, backgroundColor: colors.branco, borderWidth: 2, borderColor: colors.borda },
  erro: { color: colors.erro, fontSize: 16, fontWeight: '700' },
});
