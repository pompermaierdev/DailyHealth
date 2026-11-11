import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Cabecalho } from '../../src/components/Cabecalho';
import { Progresso } from '../../src/components/Progresso';
import { Botao } from '../../src/components/Botao';
import { useCadastro } from '../../src/context/CadastroContext';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

const OPCOES = [
  { id: 'proprio', titulo: 'Uso próprio', desc: 'Quero cuidar dos meus medicamentos.', icone: 'person-outline' },
  { id: 'cuidador', titulo: 'Cuidador / Responsável', desc: 'Quero acompanhar os medicamentos de outra pessoa.', icone: 'people-outline' },
] as const;

export default function PerfilUso() {
  const { dados, atualizar } = useCadastro();

  return (
    <Tela>
      <Cabecalho />
      <Progresso etapa={1} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={[fonte.titulo, { textAlign: 'center' }]}>Como você vai usar o DailyHealth?</Text>
        <Text style={[fonte.suave, { textAlign: 'center' }]}>Escolha o perfil que melhor representa você.</Text>
      </View>

      {OPCOES.map((o) => {
        const sel = dados.perfil === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => atualizar({ perfil: o.id })}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            style={[styles.card, sel && { backgroundColor: colors.rosaClaro, borderColor: colors.rosa }]}
          >
            <View style={[styles.icone, { backgroundColor: sel ? colors.rosa : colors.azulClaro }]}>
              <Ionicons name={o.icone} size={30} color={sel ? '#fff' : colors.azulEscuro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={fonte.subtitulo}>{o.titulo}</Text>
              <Text style={fonte.pequeno}>{o.desc}</Text>
            </View>
            <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={28} color={sel ? colors.rosa : colors.borda} />
          </Pressable>
        );
      })}

      <Botao titulo="Continuar" icone="arrow-forward" onPress={() => router.push('/(auth)/criar-conta')} />
      <Text style={[fonte.pequeno, { textAlign: 'center' }]}>DailyHealth · Mais cuidado, todos os dias.</Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: raio.card, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  icone: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
