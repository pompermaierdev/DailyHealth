import React from 'react';
import { Alert, Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { useCaixa } from '../../src/hooks/useCaixa';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

export default function Medicamentos() {
  const { medicamentos, dosesDeHoje, remover } = useMedicamentos();
  const { estado, sincronizarMedicamentos } = useCaixa();

  const proxima = dosesDeHoje.find((d) => d.status === 'pendente' || d.status === 'atrasado');
  const amanha = medicamentos
    .flatMap((m) => m.horarios.map((h) => ({ nome: m.nome, h })))
    .sort((a, b) => a.h.localeCompare(b.h))[0];
  const textoProximo = proxima ? `${proxima.med.nome} • ${proxima.horario}` : amanha ? `${amanha.nome} • ${amanha.h} (amanhã)` : '—';

  const enviarTudo = async () => {
    if (estado !== 'conectada') {
      Alert.alert('Caixa desconectada', 'Conecte a caixa por Bluetooth para enviar os remédios.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Conectar', onPress: () => router.push('/caixa') },
      ]);
      return;
    }
    const ok = await sincronizarMedicamentos(medicamentos);
    Alert.alert(ok ? 'Pronto!' : 'Ops', ok ? 'Os remédios foram enviados para a caixa.' : 'Não consegui enviar. Tente de novo.');
  };

  const excluir = (id: string, nome: string) =>
    Alert.alert(`Excluir ${nome}?`, 'Os lembretes desse remédio serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const lista = await remover(id);
          if (estado === 'conectada') await sincronizarMedicamentos(lista);
        },
      },
    ]);

  return (
    <Tela>
      <Text style={fonte.titulo}>Meus medicamentos</Text>

      <View style={styles.resumo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="pill" size={28} color={colors.azul} />
          <Text style={fonte.subtitulo}>
            {medicamentos.length} {medicamentos.length === 1 ? 'medicamento ativo' : 'medicamentos ativos'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="time-outline" size={28} color={colors.azul} />
          <Text style={fonte.corpo}>Próximo: {textoProximo}</Text>
        </View>
      </View>

      {medicamentos.length === 0 && <Text style={fonte.suave}>Você ainda não cadastrou nenhum medicamento.</Text>}

      {medicamentos.map((m) => (
        <View key={m.id} style={styles.card}>
          {m.fotoUri ? (
            <Image source={{ uri: m.fotoUri }} style={styles.icone} />
          ) : (
            <View style={[styles.icone, { backgroundColor: colors.compartimento[m.compartimento] }]}>
              <MaterialCommunityIcons name="pill" size={30} color={colors.navy} />
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.nome} numberOfLines={1}>
                {m.nome}
              </Text>
              <View style={styles.ativo}>
                <Text style={styles.ativoTxt}>Ativo</Text>
              </View>
            </View>
            <Text style={fonte.pequeno}>
              {m.quantidadePorDose} {m.quantidadePorDose === 1 ? 'comprimido' : 'comprimidos'} • compartimento {m.compartimento}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time-outline" size={16} color={colors.azul} />
              <Text style={fonte.pequeno}>{m.horarios.join(' e ') || 'Sem horários'}</Text>
            </View>
          </View>
          <View style={{ gap: 14 }}>
            <Pressable onPress={() => router.push({ pathname: '/medicamento-novo', params: { id: m.id } })} accessibilityLabel={`Editar ${m.nome}`} hitSlop={10}>
              <Ionicons name="create-outline" size={26} color={colors.azul} />
            </Pressable>
            <Pressable onPress={() => excluir(m.id, m.nome)} accessibilityLabel={`Excluir ${m.nome}`} hitSlop={10}>
              <Ionicons name="trash-outline" size={26} color={colors.erro} />
            </Pressable>
          </View>
        </View>
      ))}

      <Botao titulo="Adicionar medicamento" icone="add-circle-outline" onPress={() => router.push('/medicamento-novo')} />
      {medicamentos.length > 0 && <Botao titulo="Enviar tudo para a caixa" icone="bluetooth" variante="secundario" onPress={enviarTudo} />}
    </Tela>
  );
}

const styles = StyleSheet.create({
  resumo: { gap: 10, padding: 16, borderRadius: raio.card, backgroundColor: colors.azulClaro },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.card, backgroundColor: colors.branco, borderWidth: 2, borderColor: colors.borda },
  icone: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 20, fontWeight: '800', color: colors.navy, flexShrink: 1 },
  ativo: { backgroundColor: colors.sucessoClaro, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  ativoTxt: { fontSize: 13, fontWeight: '800', color: colors.sucesso },
});
