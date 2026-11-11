import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { EventoAdesao, Medicamento } from '../types';
import { carregarEventos, carregarMedicamentos, fecharDosesVencidas, removerMedicamento, salvarMedicamento } from '../services/storage';
import { hojeISO } from '../utils/datas';
import { DoseDia, dosesDoDia } from '../utils/doses';
import { reagendarNotificacoes } from '../services/notificacoes';

export type { DoseDia };

export function useMedicamentos() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [eventos, setEventos] = useState<EventoAdesao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [agora, setAgora] = useState(new Date());

  const recarregar = useCallback(async () => {
    await fecharDosesVencidas(); // aplica a regra das 6 h
    setMedicamentos(await carregarMedicamentos());
    setEventos(await carregarEventos());
    setAgora(new Date());
    setCarregado(true);
    reagendarNotificacoes(); // mantém os avisos em dia com os remédios e confirmações
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // recarrega sempre que a tela volta ao foco
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );

  // atualiza os status (pendente -> atrasado) a cada minuto
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const salvar = async (m: Medicamento) => {
    const lista = await salvarMedicamento(m);
    setMedicamentos(lista);
    return lista;
  };

  const remover = async (id: string) => {
    const lista = await removerMedicamento(id);
    setMedicamentos(lista);
    return lista;
  };

  const ontem = new Date(agora);
  ontem.setDate(ontem.getDate() - 1);

  const dosesDeHoje: DoseDia[] = dosesDoDia(medicamentos, eventos, hojeISO(agora), agora);
  // inclui o fim de noite de ontem (ex.: dose das 22h confirmada à 1h)
  const dosesAtrasadas: DoseDia[] = [...dosesDoDia(medicamentos, eventos, hojeISO(ontem), agora), ...dosesDeHoje].filter(
    (d) => d.status === 'atrasado'
  );

  return { medicamentos, eventos, dosesDeHoje, dosesAtrasadas, carregado, salvar, remover, recarregar };
}
