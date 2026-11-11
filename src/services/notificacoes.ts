import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { carregarEventos, carregarMedicamentos } from './storage';
import { hojeISO } from '../utils/datas';
import { criadoEm, dataHoraAgendada } from '../utils/doses';

// Quando avisar, em minutos depois do horário da dose:
// 0 = na hora; depois de 15 em 15 min por 2 h; depois de hora em hora até 5 h.
// (Aos 6 h a dose vira "perdida" e para de avisar.)
export const LEMBRETES_MIN = [0, 15, 30, 45, 60, 75, 90, 105, 120, 180, 240, 300];

// O iOS aceita no máximo 64 notificações agendadas; usamos o mesmo teto nos dois sistemas.
const MAX_AGENDADAS = 60;
const CANAL = 'doses';

// Mostra o aviso mesmo com o app aberto. Chame uma vez, no arquivo raiz.
export function configurarNotificacoes() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function prepararNotificacoes(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes de remédio',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#FF6B8F',
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

interface Item {
  quando: number;
  principal: boolean;
  titulo: string;
  corpo: string;
  data: { slot: string; horario: string; data: string };
}

async function executar() {
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  const meds = await carregarMedicamentos();
  const eventos = await carregarEventos();
  const agora = Date.now();
  const limite = agora + 36 * 3600 * 1000;
  const dias = [-1, 0, 1].map((delta) => {
    const d = new Date();
    d.setDate(d.getDate() + delta);
    return hojeISO(d);
  });

  const itens: Item[] = [];
  for (const data of dias) {
    for (const med of meds) {
      for (const horario of med.horarios) {
        const base = dataHoraAgendada(data, horario).getTime();
        if (base < criadoEm(med)) continue;
        // dose já tomada (ou perdida): não avisa mais
        if (eventos.some((e) => e.medicamentoId === med.id && e.horarioAgendado === horario && e.data === data)) continue;

        for (const min of LEMBRETES_MIN) {
          const quando = base + min * 60000;
          if (quando <= agora + 5000 || quando > limite) continue;
          const qtd = `${med.quantidadePorDose} ${med.quantidadePorDose === 1 ? 'comprimido' : 'comprimidos'}`;
          itens.push({
            quando,
            principal: min === 0,
            titulo: min === 0 ? 'Hora do remédio' : 'Você já tomou o remédio?',
            corpo:
              min === 0
                ? `${med.nome} · ${qtd} · compartimento ${med.compartimento}`
                : `${med.nome} das ${horario} ainda não foi confirmado. Toque para responder.`,
            data: { slot: String(med.compartimento), horario, data },
          });
        }
      }
    }
  }

  // prioridade: todos os avisos "na hora" primeiro, depois os lembretes mais próximos
  const principais = itens.filter((i) => i.principal).sort((a, b) => a.quando - b.quando);
  const lembretes = itens.filter((i) => !i.principal).sort((a, b) => a.quando - b.quando);
  const escolhidos = [...principais, ...lembretes].slice(0, MAX_AGENDADAS);

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const i of escolhidos) {
    await Notifications.scheduleNotificationAsync({
      content: { title: i.titulo, body: i.corpo, data: i.data, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(i.quando),
        channelId: CANAL,
      },
    });
  }
}

// Fila simples: evita duas reprogramações ao mesmo tempo (o que duplicaria avisos)
let fila: Promise<void> = Promise.resolve();
export function reagendarNotificacoes(): Promise<void> {
  fila = fila.then(executar).catch(() => {});
  return fila;
}
