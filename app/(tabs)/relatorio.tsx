import React, { useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tela } from '../../src/components/Tela';
import { Botao } from '../../src/components/Botao';
import { AnelAdesao } from '../../src/components/AnelAdesao';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { useCaixa } from '../../src/hooks/useCaixa';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';
import { letraDoDia } from '../../src/utils/datas';
import { sugerirAjustes } from '../../src/utils/iaRotina';
import { calcularRelatorio } from '../../src/utils/relatorio';

export default function Relatorio() {
  const { medicamentos, eventos, salvar } = useMedicamentos();
  const { estado, sincronizarMedicamentos } = useCaixa();
  const [filtro, setFiltro] = useState<string | null>(null); // null = todos os remédios

  const meds = filtro ? medicamentos.filter((m) => m.id === filtro) : medicamentos;
  const r = calcularRelatorio(meds, eventos);
  const sugestao = sugerirAjustes(eventos.filter((e) => !filtro || e.medicamentoId === filtro))[0];

  const aplicar = async (medId: string, de: string, para: string) => {
    const med = medicamentos.find((m) => m.id === medId);
    if (!med) return;
    const lista = await salvar({ ...med, horarios: med.horarios.map((h) => (h === de ? para : h)) });
    if (estado === 'conectada') await sincronizarMedicamentos(lista);
    Alert.alert('Horário ajustado', `${med.nome} agora toca às ${para}.`);
  };

  return (
    <Tela>
      <View>
        <Text style={fonte.titulo}>Relatório de adesão</Text>
        <Text style={fonte.suave}>Acompanhe sua rotina de tratamento</Text>
      </View>

      <View style={styles.periodo}>
        <Ionicons name="calendar-outline" size={22} color={colors.azul} />
        <Text style={fonte.corpo}>Últimos 7 dias</Text>
      </View>

      <View style={styles.geral}>
        <View style={{ flex: 1 }}>
          <Text style={fonte.pequeno}>Adesão geral</Text>
          <Text style={styles.pct}>{r.pct === null ? '—' : `${r.pct}%`}</Text>
          {r.pct === null && <Text style={fonte.pequeno}>Ainda sem doses vencidas</Text>}
        </View>
        <AnelAdesao pct={r.pct} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.mini, { borderColor: colors.azul }]}>
          <Ionicons name="time-outline" size={26} color={colors.azul} />
          <Text style={fonte.pequeno}>No horário</Text>
          <Text style={styles.miniNum}>{r.noHorario} doses</Text>
        </View>
        <View style={[styles.mini, { borderColor: colors.alerta }]}>
          <Ionicons name="time-outline" size={26} color={colors.alerta} />
          <Text style={fonte.pequeno}>Com atraso</Text>
          <Text style={[styles.miniNum, { color: '#B26A00' }]}>{r.comAtraso} doses</Text>
        </View>
      </View>

      <View style={styles.cartao}>
        <Text style={fonte.subtitulo}>Histórico de doses</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Legenda cor={colors.rosa} texto="No horário" />
          <Legenda cor={colors.azul} texto="Com atraso" />
        </View>
        <View style={{ flexDirection: 'row', height: 150, gap: 8 }}>
          <View style={{ justifyContent: 'space-between', paddingBottom: 22 }}>
            <Text style={styles.eixo}>100%</Text>
            <Text style={styles.eixo}>50%</Text>
            <Text style={styles.eixo}>0%</Text>
          </View>
          {r.porDia.map((d) => (
            <View key={d.dia} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={styles.trilho}>
                {d.devidas > 0 && (
                  <>
                    <View style={{ height: `${(d.comAtraso / d.devidas) * 100}%`, backgroundColor: colors.azul }} />
                    <View style={{ height: `${(d.noHorario / d.devidas) * 100}%`, backgroundColor: colors.rosa }} />
                  </>
                )}
              </View>
              <Text style={fonte.pequeno}>{letraDoDia(d.dia)}</Text>
            </View>
          ))}
        </View>
      </View>

      <Linha
        icone="alert-circle-outline"
        cor={colors.erro}
        titulo="Atrasos identificados"
        texto={r.comAtraso > 0 ? `${r.comAtraso} doses • atraso médio de ${r.atrasoMedioMin} min` : 'Nenhum atraso nos últimos 7 dias'}
      />
      <Linha
        icone="happy-outline"
        cor={colors.azul}
        titulo="Melhor horário de adesão"
        texto={r.melhorPeriodo ? `${r.melhorPeriodo.nome} • ${r.melhorPeriodo.pct}%` : 'Disponível quando houver doses registradas'}
      />

      <View style={[styles.cartao, { borderColor: colors.azul }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="sparkles" size={22} color={colors.azul} />
          <Text style={fonte.subtitulo}>Sugestão inteligente</Text>
        </View>
        {sugestao ? (
          <>
            <Text style={fonte.corpo}>
              Você costuma tomar {sugestao.nome} {Math.abs(sugestao.atrasoMedioMin)} min {sugestao.atrasoMedioMin > 0 ? 'depois' : 'antes'} das {sugestao.horarioAtual}. Ajustar o alerta para {sugestao.horarioSugerido}?
            </Text>
            <Botao titulo={`Ajustar para ${sugestao.horarioSugerido}`} variante="escuro" onPress={() => aplicar(sugestao.medicamentoId, sugestao.horarioAtual, sugestao.horarioSugerido)} />
          </>
        ) : (
          <Text style={fonte.suave}>Quando você atrasar de forma parecida em vários dias, sugerimos um novo horário para o lembrete.</Text>
        )}
      </View>

      <Text style={fonte.subtitulo}>Relatório por medicamento</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Chip texto="Todos" ativo={filtro === null} onPress={() => setFiltro(null)} />
        {medicamentos.map((m) => (
          <Chip key={m.id} texto={m.nome} ativo={filtro === m.id} onPress={() => setFiltro(m.id)} />
        ))}
      </View>
    </Tela>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: cor }} />
      <Text style={fonte.pequeno}>{texto}</Text>
    </View>
  );
}

function Linha({ icone, cor, titulo, texto }: { icone: keyof typeof Ionicons.glyphMap; cor: string; titulo: string; texto: string }) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone} size={30} color={cor} />
      <View style={{ flex: 1 }}>
        <Text style={fonte.subtitulo}>{titulo}</Text>
        <Text style={fonte.suave}>{texto}</Text>
      </View>
    </View>
  );
}

function Chip({ texto, ativo, onPress }: { texto: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, ativo && { backgroundColor: colors.azul, borderColor: colors.azul }]}>
      <Text style={[styles.chipTxt, ativo && { color: '#fff' }]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  periodo: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  geral: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: raio.card, backgroundColor: colors.rosaClaro },
  pct: { fontSize: 54, fontWeight: '900', color: colors.rosaEscuro, lineHeight: 60 },
  mini: { flex: 1, gap: 2, padding: 14, borderRadius: raio.card, borderWidth: 2, backgroundColor: colors.branco },
  miniNum: { fontSize: 22, fontWeight: '900', color: colors.navy },
  cartao: { gap: 10, padding: 16, borderRadius: raio.card, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  eixo: { fontSize: 12, fontWeight: '700', color: colors.textoSuave },
  trilho: { flex: 1, width: '100%', borderRadius: 10, backgroundColor: colors.azulClaro, justifyContent: 'flex-end', overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.card, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  chipTxt: { fontSize: 16, fontWeight: '800', color: colors.azulEscuro },
});
