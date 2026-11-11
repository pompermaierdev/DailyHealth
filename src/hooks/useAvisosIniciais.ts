import { useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useCaixa } from './useCaixa';
import { DoseDia } from '../utils/doses';

// Roda uma vez por abertura do app:
// 1) se a caixa não está conectada, avisa (OK / Conectar);
// 2) se há dose atrasada, abre a tela "Tomou o remédio?".
let jaAvisou = false;

export function useAvisosIniciais(carregado: boolean, atrasadas: DoseDia[]) {
  const { estado } = useCaixa();

  useEffect(() => {
    if (!carregado || jaAvisou) return;
    jaAvisou = true;

    const abrirPendencia = () => {
      const d = atrasadas[0];
      if (d) {
        router.push({
          pathname: '/confirmar',
          params: { slot: String(d.med.compartimento), horario: d.horario, data: d.data },
        });
      }
    };

    if (estado !== 'conectada') {
      Alert.alert(
        'Caixa desconectada',
        'Sua caixa DailyHealth não está conectada. Conecte para receber os avisos na hora do remédio.',
        [
          { text: 'OK', style: 'cancel', onPress: abrirPendencia },
          { text: 'Conectar', onPress: () => router.push('/caixa') },
        ]
      );
    } else {
      abrirPendencia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregado]);
}
