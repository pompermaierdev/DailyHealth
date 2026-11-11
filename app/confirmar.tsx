import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Tela } from '../src/components/Tela';
import { Botao } from '../src/components/Botao';
import { useCaixa } from '../src/hooks/useCaixa';
import { useMedicamentos } from '../src/hooks/useMedicamentos';
import { colors } from '../src/theme/colors';
import { raio } from '../src/theme/typography';
import { dataDaDose, dataHoraAgendada, formatarAtraso } from '../src/utils/doses';

export default function Confirmar() {
  const { slot, horario, data } = useLocalSearchParams<{ slot: string; horario: string; data?: string }>();
  const { confirmarTomei, confirmarNao } = useCaixa();
  const { medicamentos } = useMedicamentos();

  const fechar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!slot || !horario) return null;

  const slotNum = Number(slot);
  const dia = data ?? dataDaDose(horario);
  const atrasoMin = Math.max(0, Math.round((Date.now() - dataHoraAgendada(dia, horario).getTime()) / 60000));
  const atrasado = atrasoMin >= 5;

  const med =
    medicamentos.find((m) => m.compartimento === slotNum && m.horarios.includes(horario)) ??
    medicamentos.find((m) => m.compartimento === slotNum);
  const fundo = colors.compartimento[slotNum] ?? colors.rosa;
  const qtd = med?.quantidadePorDose ?? 1;

  return (
    <Tela fundo={fundo} rolavel={false}>
      <Text style={styles.hora}>{horario}</Text>
      <Text style={styles.titulo}>{atrasado ? 'Hora do remédio passou!' : 'Hora do remédio!'}</Text>
      {atrasado && <Text style={styles.aviso}>Passou há {formatarAtraso(atrasoMin)}</Text>}

      <View style={styles.circulo}>
        <Text style={styles.num}>{slotNum}</Text>
        <Text style={styles.compart}>compartimento</Text>
      </View>
      <Text style={styles.aviso}>A luz da caixa está acesa</Text>

      <View style={styles.card}>
        <Text style={styles.nome}>{med?.nome ?? 'Seu remédio'}</Text>
        <Text style={styles.qtd}>
          Tome {qtd} {qtd === 1 ? 'comprimido' : 'comprimidos'}
        </Text>
      </View>

      <View style={{ marginTop: 'auto', gap: 12 }}>
        <Botao
          titulo="Sim, tomei"
          variante="escuro"
          icone="checkmark"
          estilo={{ minHeight: 72 }}
          onPress={async () => {
            await confirmarTomei(slotNum, horario, dia);
            fechar();
          }}
        />
        <Botao
          titulo="Não tomei ainda"
          variante="secundario"
          onPress={async () => {
            await confirmarNao(slotNum, horario);
            fechar();
          }}
        />
        <Text style={[styles.aviso, { fontSize: 15 }]}>Se ainda não tomou, a luz continua acesa e avisamos de novo.</Text>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  hora: { textAlign: 'center', fontSize: 22, fontWeight: '900', color: colors.navy },
  titulo: { textAlign: 'center', fontSize: 36, fontWeight: '900', color: colors.navy, lineHeight: 40 },
  circulo: { alignSelf: 'center', width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 66, fontWeight: '900', color: colors.navy, lineHeight: 72 },
  compart: { fontSize: 16, fontWeight: '800', color: colors.navy },
  aviso: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.navy },
  card: { backgroundColor: '#fff', borderRadius: raio.card, padding: 20, alignItems: 'center', gap: 4 },
  nome: { fontSize: 30, fontWeight: '900', color: colors.navy },
  qtd: { fontSize: 22, fontWeight: '700', color: colors.navy },
});
