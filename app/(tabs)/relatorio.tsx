import React from 'react';
import { Alert, Text, View, StyleSheet } from 'react-native';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { useCaixa } from '../../src/hooks/useCaixa';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';
import { letraDoDia, ultimosDias } from '../../src/utils/datas';
import { sugerirAjustes } from '../../src/utils/iaRotina';

export default function Relatorio() {
  const { medicamentos, eventos, salvar } = useMedicamentos();
  const { estado, sincronizarMedicamentos } = useCaixa();

  const dias = ultimosDias(7);
  const dosesPorDia = medicamentos.reduce((s, m) => s + m.horarios.length, 0);
  const porDia = dias.map((d) => {
    const tomados = eventos.filter((e) => e.data === d && e.status === 'tomado').length;
    return { dia: d, pct: dosesPorDia ? Math.min(1, tomados / dosesPorDia) : 0 };
  });
  const totalTomados = eventos.filter((e) => dias.includes(e.data) && e.status === 'tomado').length;
  const geral = dosesPorDia ? Math.round((totalTomados / (dosesPorDia * 7)) * 100) : 0;
  const ultimos = [...eventos].sort((a, b) => b.registradoEm - a.registradoEm).slice(0, 6);
  const sugestoes = sugerirAjustes(eventos);

  const aplicar = async (medId: string, de: string, para: string) => {
    const med = medicamentos.find((m) => m.id === medId);
    if (!med) return;
    const atualizado = { ...med, horarios: med.horarios.map((h) => (h === de ? para : h)) };
    const lista = await salvar(atualizado);
    if (estado === 'conectada') await sincronizarMedicamentos(lista);
    Alert.alert('Horário ajustado', `${med.nome} agora toca às ${para}.`);
  };

  return (
    <Tela>
      <Text style={fonte.titulo}>Relatório de adesão</Text>

      <View style={styles.destaque}>
        <Text style={styles.pct}>{geral}%</Text>
        <Text style={[fonte.corpo, { color: '#fff' }]}>dos remédios tomados nos últimos 7 dias</Text>
      </View>

      <View style={styles.grafico}>
        {porDia.map((p) => (
          <View key={p.dia} style={styles.coluna}>
            <View style={styles.trilho}>
              <View style={[styles.barra, { height: `${Math.max(p.pct * 100, 4)}%` }]} />
            </View>
            <Text style={fonte.pequeno}>{letraDoDia(p.dia)}</Text>
          </View>
        ))}
      </View>

      {sugestoes.map((s) => (
        <View key={`${s.medicamentoId}${s.horarioAtual}`} style={styles.dica}>
          <Text style={fonte.pequeno}>Dica da caixa</Text>
          <Text style={fonte.corpo}>
            Você costuma tomar {s.nome} {Math.abs(s.atrasoMedioMin)} min {s.atrasoMedioMin > 0 ? 'depois' : 'antes'} das{' '}
            {s.horarioAtual}. Ajustar o alerta para {s.horarioSugerido}?
          </Text>
          <Botao
            titulo={`Ajustar para ${s.horarioSugerido}`}
            variante="escuro"
            onPress={() => aplicar(s.medicamentoId, s.horarioAtual, s.horarioSugerido)}
          />
        </View>
      ))}

      <Text style={fonte.subtitulo}>Últimos registros</Text>
      {ultimos.length === 0 && (
        <Text style={fonte.suave}>Quando a caixa avisar e você confirmar, os registros aparecem aqui.</Text>
      )}
      {ultimos.map((e) => (
        <View key={e.id} style={styles.linha}>
          <View style={{ flex: 1 }}>
            <Text style={fonte.corpo}>{e.nome}</Text>
            <Text style={fonte.pequeno}>
              {e.data.split('-').reverse().join('/')} · agendado {e.horarioAgendado}
              {e.status === 'tomado' ? ` · tomou às ${new Date(e.registradoEm).toTimeString().slice(0, 5)}` : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: e.status === 'tomado' ? colors.sucesso : colors.erro }}>
            {e.status === 'tomado' ? 'Tomado' : 'Perdido'}
          </Text>
        </View>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  destaque: { backgroundColor: colors.azul, borderRadius: raio.card, padding: 20 },
  pct: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 62 },
  grafico: { flexDirection: 'row', gap: 10, height: 150, alignItems: 'flex-end' },
  coluna: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  trilho: { flex: 1, width: '100%', backgroundColor: colors.azulClaro, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  barra: { width: '100%', backgroundColor: colors.rosa, borderRadius: 12 },
  dica: { backgroundColor: colors.branco, borderRadius: raio.card, borderWidth: 3, borderColor: colors.azul, padding: 16, gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.branco, borderRadius: 18, padding: 14, borderWidth: 2, borderColor: colors.borda },
});
