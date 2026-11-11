import React from 'react';
import { Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { CardMedicamento } from '../../src/components/CardMedicamento';
import { Botao } from '../../src/components/Botao';
import { useMedicamentos } from '../../src/hooks/useMedicamentos';
import { useCaixa } from '../../src/hooks/useCaixa';
import { fonte } from '../../src/theme/typography';

export default function Medicamentos() {
  const { medicamentos, remover } = useMedicamentos();
  const { estado, sincronizarMedicamentos } = useCaixa();

  const enviarTudo = async () => {
    if (estado !== 'conectada') {
      Alert.alert('Caixa desconectada', 'Conecte a caixa por Bluetooth para enviar os remédios.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Conectar', onPress: () => router.push('/caixa') },
      ]);
      return;
    }
    const ok = await sincronizarMedicamentos(medicamentos);
    Alert.alert(ok ? 'Pronto!' : 'Ops', ok ? 'Os remédios foram enviados para a caixa.' : 'Não consegui enviar. Tente de novo.');
  };

  const aoTocar = (id: string, nome: string) =>
    Alert.alert(nome, 'O que deseja fazer?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const lista = await remover(id);
          if (estado === 'conectada') await sincronizarMedicamentos(lista);
        },
      },
    ]);

  return (
    <Tela>
      <Text style={fonte.titulo}>Meus remédios</Text>
      {medicamentos.length === 0 && <Text style={fonte.suave}>Você ainda não cadastrou nenhum medicamento.</Text>}
      {medicamentos.map((m) => (
        <CardMedicamento key={m.id} med={m} onPress={() => aoTocar(m.id, m.nome)} />
      ))}
      <Botao titulo="Cadastrar medicamento" icone="add" onPress={() => router.push('/medicamento-novo')} />
      {medicamentos.length > 0 && (
        <Botao titulo="Enviar tudo para a caixa" icone="bluetooth" variante="secundario" onPress={enviarTudo} />
      )}
    </Tela>
  );
}
