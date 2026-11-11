import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';
import { Medicamento, StatusDose } from '../types';

type Props = {
  med: Medicamento;
  horario?: string; // mostra um horário específico (tela Início)
  status?: StatusDose;
  destaque?: boolean;
  onPress?: () => void;
};

const ROTULO: Record<StatusDose, string> = { tomado: 'Tomado', perdido: 'Perdido', pendente: 'Pendente', atrasado: 'Atrasado' };
const CORES: Record<StatusDose, { bg: string; txt: string }> = {
  tomado: { bg: colors.sucessoClaro, txt: colors.sucesso },
  perdido: { bg: '#FDE3E8', txt: colors.erro },
  pendente: { bg: colors.azulClaro, txt: colors.azulEscuro },
  atrasado: { bg: colors.alertaClaro, txt: '#B26A00' },
};

export function CardMedicamento({ med, horario, status, destaque, onPress }: Props) {
  const corComp = colors.compartimento[med.compartimento];
  const chipBg = status ? CORES[status].bg : colors.azulClaro;
  const chipTxt = status ? CORES[status].txt : colors.azulEscuro;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, destaque && { borderColor: colors.rosa, borderWidth: 3 }]}
      accessibilityLabel={`${horario ?? ''} ${med.nome}, ${med.quantidadePorDose} por dose, compartimento ${med.compartimento}`}
    >
      {med.fotoUri ? (
        <Image source={{ uri: med.fotoUri }} style={styles.foto} />
      ) : (
        <View style={[styles.bolinha, { backgroundColor: corComp }]}>
          <Text style={styles.num}>{med.compartimento}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {horario && <Text style={styles.hora}>{horario}</Text>}
        <Text style={horario ? fonte.corpo : styles.nome}>{med.nome}</Text>
        <Text style={fonte.pequeno}>
          {med.quantidadePorDose} por dose · compartimento {med.compartimento}
        </Text>
        {!horario && <Text style={fonte.pequeno}>{med.horarios.join(' · ') || 'Sem horários'}</Text>}
      </View>
      {status && (
        <View style={[styles.chip, { backgroundColor: chipBg }]}>
          <Text style={[styles.chipTxt, { color: chipTxt }]}>{ROTULO[status]}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: raio.card,
    backgroundColor: colors.branco,
    borderWidth: 2,
    borderColor: colors.borda,
  },
  bolinha: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  foto: { width: 54, height: 54, borderRadius: 27 },
  num: { fontSize: 24, fontWeight: '900', color: colors.navy },
  hora: { fontSize: 24, fontWeight: '900', color: colors.navy },
  nome: { fontSize: 20, fontWeight: '800', color: colors.navy },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  chipTxt: { fontSize: 15, fontWeight: '800' },
});
