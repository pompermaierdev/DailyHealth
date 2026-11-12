import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Logo } from '../../src/components/Logo';
import { StatusBluetooth } from '../../src/components/StatusBluetooth';
import { AvisoPedidos } from '../../src/components/AvisoPedidos';
import { InicioCuidador } from '../../src/components/InicioCuidador';
import { LinhaDose } from '../../src/components/LinhaDose';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/AuthContext';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { useAvisosIniciais } from '../../src/hooks/useAvisosIniciais';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';
import { nomeDoDiaExtenso } from '../../src/utils/datas';
import { DoseDia } from '../../src/utils/doses';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function Contador({ icone, cor, valor, rotulo }: { icone: keyof typeof Ionicons.glyphMap; cor: string; valor: number; rotulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Ionicons name={icone} size={28} color={cor} />
      <Text style={styles.num}>{valor}</Text>
      <Text style={fonte.pequeno}>{rotulo}</Text>
    </View>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const { dosesDeHoje, dosesAtrasadas, carregado } = useMedicamentos();
  useAvisosIniciais(carregado && usuario?.perfil !== 'cuidador', dosesAtrasadas);

  if (usuario?.perfil === 'cuidador') return <InicioCuidador />;

  const tomadas = dosesDeHoje.filter((d) => d.status === 'tomado').length;
  const pendentes = dosesDeHoje.filter((d) => d.status === 'pendente' || d.status === 'atrasado').length;
  const perdidas = dosesDeHoje.filter((d) => d.status === 'perdido').length;
  const primeiroNome = (usuario?.nomePreferido || usuario?.nome || '').split(' ')[0];

  const confirmar = (d: DoseDia) =>
    router.push({ pathname: '/confirmar', params: { slot: String(d.med.compartimento), horario: d.horario, data: d.data } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.fundo }}>
      <Tela>
        <View style={styles.topo}>
          <Logo tamanho={40} horizontal />
          <Pressable onPress={() => router.push('/(tabs)/perfil')} accessibilityLabel="Meu perfil" hitSlop={10}>
            <Ionicons name="person-circle-outline" size={38} color={colors.azul} />
          </Pressable>
        </View>

        <View>
          <Text style={styles.ola}>
            {saudacao()}
            {primeiroNome ? `, ${primeiroNome}` : ''}!
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={20} color={colors.azul} />
            <Text style={[fonte.suave, { textTransform: 'capitalize' }]}>Hoje, {nomeDoDiaExtenso()}</Text>
          </View>
        </View>

        <StatusBluetooth />
        <AvisoPedidos />

        <Pressable onPress={() => router.push('/(tabs)/relatorio')} style={styles.rotina} accessibilityRole="button">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={fonte.subtitulo}>Rotina de hoje</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.azul} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Contador icone="checkmark-circle" cor={colors.sucesso} valor={tomadas} rotulo={tomadas === 1 ? 'tomado' : 'tomados'} />
            <View style={styles.sep} />
            <Contador icone="time-outline" cor={colors.alerta} valor={pendentes} rotulo={pendentes === 1 ? 'pendente' : 'pendentes'} />
            <View style={styles.sep} />
            <Contador icone="alert-circle" cor={colors.erro} valor={perdidas} rotulo={perdidas === 1 ? 'perdido' : 'perdidos'} />
          </View>
        </Pressable>

        {dosesDeHoje.length === 0 ? (
          <Botao titulo="Cadastrar medicamento" icone="add" onPress={() => router.push('/medicamento-novo')} />
        ) : (
          dosesDeHoje.map((d) => (
            <LinhaDose key={`${d.med.id}-${d.horario}`} dose={d} onConfirmar={d.status === 'atrasado' ? () => confirmar(d) : undefined} />
          ))
        )}
        <View style={{ height: 70 }} />
      </Tela>

      <Pressable onPress={() => router.push('/medicamento-novo')} accessibilityRole="button" accessibilityLabel="Adicionar medicamento" style={styles.fab}>
        <Ionicons name="add" size={36} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ola: { fontSize: 34, fontWeight: '900', color: colors.navy },
  rotina: { backgroundColor: colors.azulClaro, borderRadius: raio.card, padding: 16, gap: 12 },
  sep: { width: 2, backgroundColor: colors.borda },
  num: { fontSize: 30, fontWeight: '900', color: colors.navy },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.rosa, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
});
