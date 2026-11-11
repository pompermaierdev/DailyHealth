import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { caixaBLE, DispositivoBLE } from '../services/ble/bleManager';
import { pedirPermissoesBluetooth } from '../services/ble/permissoes';
import { CMD_LIMPAR, cmdAlarme, cmdHora, cmdNaoTomei, cmdTomei, EventoCaixa } from '../services/ble/protocolo';
import { carregarEventos, registrarEvento } from '../services/storage';
import { reagendarNotificacoes } from '../services/notificacoes';
import { ultimosDias } from '../utils/datas';
import { Medicamento } from '../types';

export type EstadoCaixa = 'desconectada' | 'procurando' | 'conectando' | 'conectada';

interface CaixaCtx {
  estado: EstadoCaixa;
  dispositivos: DispositivoBLE[];
  horaSincronizada: boolean;
  erro: string | null;
  procurar: () => Promise<void>;
  conectar: (id: string) => Promise<void>;
  desconectar: () => Promise<void>;
  enviarHora: () => Promise<void>;
  sincronizarMedicamentos: (meds: Medicamento[]) => Promise<boolean>;
  confirmarTomei: (slot: number, horario: string, data?: string) => Promise<void>;
  confirmarNao: (slot: number, horario: string) => Promise<void>;
}

export const CaixaContext = createContext<CaixaCtx | null>(null);

export function CaixaProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoCaixa>('desconectada');
  const [dispositivos, setDispositivos] = useState<DispositivoBLE[]>([]);
  const [horaSincronizada, setHoraSincronizada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    const offEvento = caixaBLE.aoReceber((e: EventoCaixa) => {
      switch (e.tipo) {
        case 'ALARME': // a caixa avisou: abre a tela "Tomou o remédio?"
          router.push({ pathname: '/confirmar', params: { slot: String(e.slot), horario: e.horario } });
          break;
        case 'TOMOU':
          registrarEvento(e.slot, e.horario, 'tomado').then(() => reagendarNotificacoes());
          break;
        case 'HORA_OK':
          setHoraSincronizada(true);
          break;
        case 'ERRO':
          setErro(`A caixa recusou o comando (${e.motivo}).`);
          break;
        // ADIADO e EXPIROU: nada a fazer. A dose segue "atrasada" até virar "perdida" (6 h).
      }
    });
    const offDesc = caixaBLE.aoDesconectar(() => {
      setEstado('desconectada');
      setHoraSincronizada(false);
    });
    return () => {
      offEvento();
      offDesc();
    };
  }, []);

  const procurar = useCallback(async () => {
    setErro(null);
    setDispositivos([]);
    if (!(await pedirPermissoesBluetooth())) {
      setErro('Permita o Bluetooth nas configurações do celular para achar a caixa.');
      return;
    }
    if (!(await caixaBLE.bluetoothLigado())) {
      setErro('Ligue o Bluetooth do celular.');
      return;
    }
    setEstado('procurando');
    caixaBLE.escanear(
      (d) => setDispositivos((atual) => (atual.some((x) => x.id === d.id) ? atual : [...atual, d])),
      () => {
        if (estadoRef.current === 'procurando') setEstado('desconectada');
      }
    );
  }, []);

  const enviarHora = useCallback(async () => {
    await caixaBLE.enviar(cmdHora());
  }, []);

  // Doses que o usuário confirmou no app enquanto a caixa estava desconectada:
  // avisa a caixa para apagar os LEDs correspondentes.
  const reconciliar = useCallback(async () => {
    try {
      const dias = ultimosDias(2);
      const eventos = await carregarEventos();
      const cmds = eventos
        .filter((e) => e.status === 'tomado' && dias.includes(e.data))
        .map((e) => cmdTomei(e.slot, e.horarioAgendado));
      if (cmds.length) await caixaBLE.enviarVarios(cmds);
    } catch {
      /* sem problema: tentamos de novo na próxima conexão */
    }
  }, []);

  const conectar = useCallback(
    async (id: string) => {
      setErro(null);
      setEstado('conectando');
      try {
        await caixaBLE.conectar(id);
        setEstado('conectada');
        await enviarHora(); // a caixa não tem relógio: mandamos a hora ao conectar
        await reconciliar();
      } catch {
        setEstado('desconectada');
        setErro('Não consegui conectar. Aproxime o celular da caixa e tente de novo.');
      }
    },
    [enviarHora, reconciliar]
  );

  const desconectar = useCallback(async () => {
    await caixaBLE.desconectar();
    setEstado('desconectada');
    setHoraSincronizada(false);
  }, []);

  // Apaga a agenda da caixa e reenvia tudo (limpa + um comando por horário)
  const sincronizarMedicamentos = useCallback(async (meds: Medicamento[]) => {
    if (!caixaBLE.conectado) return false;
    try {
      const cmds = [CMD_LIMPAR];
      meds.forEach((m) => m.horarios.forEach((h) => cmds.push(cmdAlarme(m.compartimento, h, m.quantidadePorDose, m.nome))));
      await caixaBLE.enviarVarios(cmds);
      return true;
    } catch {
      setErro('Falha ao enviar os remédios para a caixa.');
      return false;
    }
  }, []);

  // "Sim, tomei": registra no app na hora e, se a caixa estiver conectada, apaga o LED dela
  const confirmarTomei = useCallback(async (slot: number, horario: string, data?: string) => {
    await registrarEvento(slot, horario, 'tomado', Date.now(), data);
    reagendarNotificacoes(); // cancela os lembretes dessa dose
    if (caixaBLE.conectado) {
      try {
        await caixaBLE.enviar(cmdTomei(slot, horario));
      } catch {
        /* a reconciliação resolve na próxima conexão */
      }
    }
  }, []);

  // "Não tomei ainda": a caixa silencia o buzzer e mantém o LED aceso
  const confirmarNao = useCallback(async (slot: number, horario: string) => {
    if (caixaBLE.conectado) {
      try {
        await caixaBLE.enviar(cmdNaoTomei(slot, horario));
      } catch {
        /* ignora */
      }
    }
  }, []);

  const valor = useMemo(
    () => ({ estado, dispositivos, horaSincronizada, erro, procurar, conectar, desconectar, enviarHora, sincronizarMedicamentos, confirmarTomei, confirmarNao }),
    [estado, dispositivos, horaSincronizada, erro, procurar, conectar, desconectar, enviarHora, sincronizarMedicamentos, confirmarTomei, confirmarNao]
  );

  return <CaixaContext.Provider value={valor}>{children}</CaixaContext.Provider>;
}
