import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Cabecalho } from '../../src/components/Cabecalho';
import { CardMedicamento } from '../../src/components/CardMedicamento';
import { acompanharPaciente, dadosDoPaciente } from '../../src/services/vinculos';
import { EventoAdesao, Medicamento } from '../../src/types';
import { hojeISO, ultimosDias } from '../../src/utils/datas';
import { dosesDoDia } from '../../src/utils/doses';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

// Rotina e adesão da pessoa acompanhada (atualiza sozinha quando ela confirma uma dose)
export default function PacienteDetalhe() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const [dados, setDados] = useState<{ medicamentos: Medicamento[]; eventos: EventoAdesao[] } | null>(null);
  const [erro, setErro] = useState('');
  const [agora, setAgora] = useState(new Date());

  const carregar = useCallback(async () => {
    try {
      setDados(await dadosDoPaciente(id));
      setAgora(new Date());
      setErro('');
    } catch {
      setErro('Não consegui carregar. Verifique a internet.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
      return acompanharPaciente(id, carregar);
    }, [id, carregar])
  );

  // mantém "pendente/atrasado" em dia com o relógio
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const meds = dados?.medicamentos ?? [];
  const eventos = dados?.eventos ?? [];
  const hoje = dosesDoDia(meds, eventos, hojeISO(agora), agora);

  let devidas = 0;
  let tomadas = 0;
  let perdidas = 0;
  ultimosDias(7).forEach((d) =>
    dosesDoDia(meds, eventos, d, agora).forEach((x) => {
      if (x.status === 'pendente') return;
      devidas++;
      if (x.status === 'tomado') tomadas++;
      if (x.status === 'perdido') perdidas++;
    })
  );
  const pct = devidas ? Math.round((tomadas / devidas) * 100) : null;

  return (
    <Tela>
      <Cabecalho />
      <Text style={fonte.titulo}>{nome || 'Pessoa acompanhada'}</Text>

      {erro !== '' && <Text style={{ color: colors.erro, fontSize: 16, fontWeight: '700' }}>{erro}</Text>}

      <View style={styles.resumo}>
        <Text style={styles.pct}>{pct === null ? '—' : `${pct}%`}</Text>
        <Text style={[fonte.corpo, { color: '#fff' }]}>de adesão nos últimos 7 dias</Text>
        <Text style={[fonte.pequeno, { color: '#E8EDFF' }]}>
          {tomadas} tomadas · {perdidas} perdidas
        </Text>
      </View>

      <Text style={fonte.subtitulo}>Rotina de hoje</Text>
      {dados && hoje.length === 0 && <Text style={fonte.suave}>Nenhuma dose para hoje.</Text>}
      {hoje.map((d) => (
        <CardMedicamento key={`${d.med.id}-${d.horario}`} med={d.med} horario={d.horario} status={d.status} />
      ))}

      <Text style={fonte.subtitulo}>Remédios cadastrados</Text>
      {dados && meds.length === 0 && <Text style={fonte.suave}>Essa pessoa ainda não cadastrou remédios.</Text>}
      {meds.map((m) => (
        <CardMedicamento key={m.id} med={m} />
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  resumo: { backgroundColor: colors.azul, borderRadius: raio.card, padding: 20, gap: 2 },
  pct: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 62 },
});
