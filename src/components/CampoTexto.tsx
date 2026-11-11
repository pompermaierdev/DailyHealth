import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonte, raio } from '../theme/typography';

type Props = TextInputProps & {
  rotulo?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  senha?: boolean;
  erro?: string;
};

export function CampoTexto({ rotulo, icone, senha, erro, style, ...resto }: Props) {
  const [oculta, setOculta] = useState(!!senha);
  return (
    <View style={{ gap: 6 }}>
      {rotulo && <Text style={styles.rotulo}>{rotulo}</Text>}
      <View style={[styles.caixa, erro ? { borderColor: colors.erro } : null]}>
        {icone && <Ionicons name={icone} size={24} color={colors.azul} />}
        <TextInput
          accessibilityLabel={rotulo ?? resto.placeholder}
          placeholderTextColor={colors.textoSuave}
          secureTextEntry={oculta}
          style={[styles.input, style]}
          {...resto}
        />
        {senha && (
          <Pressable onPress={() => setOculta(!oculta)} accessibilityLabel={oculta ? 'Mostrar senha' : 'Esconder senha'}>
            <Ionicons name={oculta ? 'eye-outline' : 'eye-off-outline'} size={24} color={colors.azul} />
          </Pressable>
        )}
      </View>
      {erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { ...fonte.pequeno, fontSize: 16, color: colors.azulEscuro, fontWeight: '800' },
  caixa: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: raio.campo,
    borderWidth: 2,
    borderColor: colors.borda,
    backgroundColor: colors.branco,
  },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.texto, paddingVertical: 12 },
  erro: { fontSize: 15, fontWeight: '700', color: colors.erro },
});
