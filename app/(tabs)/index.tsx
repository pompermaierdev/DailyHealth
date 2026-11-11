import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Logo } from '../../src/components/Logo';
import { StatusBluetooth } from '../../src/components/StatusBluetooth';
import { CardMedicamento } from '../../src/components/CardMedicamento';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/AuthContext';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';
import { nomeDoDiaExtenso } from '../../src/utils/datas';
import { useAvisosIniciais } from '../../src/hooks/useAvisosIniciais';
import { DoseDia } from '../../src/utils/doses';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Inicio() {
  const { usuario } = useAuth();
  const { dosesDeHoje, dosesAtrasadas, carregado } = useMedicamentos();
  useAvisosIniciais(carregado, dosesAtrasadas);

  const total = dosesDeHoje.length;
  const tomadas = dosesDeHoje.filter((d) => d.status === 'tomado').length;
  const aberta = (d: DoseDia) => d.status === 'pendente' || d.status === 'atrasado';
  const proxima = dosesDeHoje.find(aberta);
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <Tela>
      <Logo tamanho={40} horizontal />
      <View>
        <Text style={fonte.titulo}>
          {saudacao()}, {primeiroNome}!
        </Text>
        <Text style={[fonte.suave, { textTransform: 'capitalize' }]}>{nomeDoDiaExtenso()}</Text>
      </View>

      <StatusBluetooth />

      <View style={styles.progresso}>
        <Text style={fonte.subtitulo}>
          {total === 0 ? 'Nenhum remédio cadastrado' : `${tomadas} de ${total} tomados hoje`}
        </Text>
        <View style={styles.barraFundo}>
          <View style={[styles.barra, { width: total ? `${(tomadas / total) * 100}%` : '0%' }]} />
        </View>
      </View>

      {total === 0 ? (
        <Botao titulo="Cadastrar medicamento" icone="add" onPress={() => router.push('/medicamento-novo')} />
      ) : (
        dosesDeHoje.map((d) => (
          <CardMedicamento
            key={`${d.med.id}-${d.horario}`}
            med={d.med}
            horario={d.horario}
            status={d.status}
            destaque={proxima?.med.id === d.med.id && proxima.horario === d.horario}
          />
        ))
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  progresso: { backgroundColor: colors.rosaClaro, borderRadius: raio.card, padding: 18, gap: 12 },
  barraFundo: { height: 16, borderRadius: 8, backgroundColor: colors.branco },
  barra: { height: 16, borderRadius: 8, backgroundColor: colors.rosa },
});
