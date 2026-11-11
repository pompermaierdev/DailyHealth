import { TextStyle } from 'react-native';
import { colors } from './colors';

// Tamanhos pensados para idosos: nada abaixo de 15.
export const fonte = {
  titulo: { fontSize: 30, fontWeight: '800', color: colors.navy } as TextStyle,
  subtitulo: { fontSize: 21, fontWeight: '700', color: colors.navy } as TextStyle,
  corpo: { fontSize: 18, fontWeight: '500', color: colors.texto } as TextStyle,
  suave: { fontSize: 17, fontWeight: '500', color: colors.textoSuave } as TextStyle,
  pequeno: { fontSize: 15, fontWeight: '600', color: colors.textoSuave } as TextStyle,
  botao: { fontSize: 20, fontWeight: '800' } as TextStyle,
};

export const raio = { campo: 18, card: 24, botao: 30 };
