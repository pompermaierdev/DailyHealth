import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventoAdesao, Medicamento, Usuario } from '../types';
import { ultimosDias } from '../utils/datas';
import { criadoEm, dataDaDose, dataHoraAgendada, LIMITE_PERDIDO_MS } from '../utils/doses';

const K = { usuario: '@dh/usuario', meds: '@dh/medicamentos', eventos: '@dh/eventos' };

async function ler<T>(chave: string, padrao: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
}
const gravar = (chave: string, valor: unknown) => AsyncStorage.setItem(chave, JSON.stringify(valor));

// ---- usuário ----
export const carregarUsuario = () => ler<Usuario | null>(K.usuario, null);
export const salvarUsuario = (u: Usuario) => gravar(K.usuario, u);
export const removerUsuario = () => AsyncStorage.removeItem(K.usuario);

// ---- medicamentos ----
export const carregarMedicamentos = () => ler<Medicamento[]>(K.meds, []);
export async function salvarMedicamento(m: Medicamento) {
  const lista = await carregarMedicamentos();
  const i = lista.findIndex((x) => x.id === m.id);
  if (i >= 0) lista[i] = m;
  else lista.push(m);
  await gravar(K.meds, lista);
  return lista;
}
export async function removerMedicamento(id: string) {
  const lista = (await carregarMedicamentos()).filter((m) => m.id !== id);
  await gravar(K.meds, lista);
  return lista;
}

// ---- eventos de adesão ----
export const carregarEventos = () => ler<EventoAdesao[]>(K.eventos, []);

// `data` é o dia da dose (YYYY-MM-DD). Se não vier, usamos a ocorrência mais recente do horário.
export async function registrarEvento(
  slot: number,
  horario: string,
  status: 'tomado' | 'perdido',
  quando = Date.now(),
  data?: string
) {
  const meds = await carregarMedicamentos();
  const med = meds.find((m) => m.compartimento === slot && m.horarios.includes(horario)) ?? meds.find((m) => m.compartimento === slot);
  if (!med) return;
  const dia = data ?? dataDaDose(horario, new Date(quando));
  const eventos = await carregarEventos();
  if (eventos.some((e) => e.medicamentoId === med.id && e.horarioAgendado === horario && e.data === dia)) return;
  eventos.push({
    id: `${med.id}-${dia}-${horario}`,
    medicamentoId: med.id,
    nome: med.nome,
    slot,
    horarioAgendado: horario,
    data: dia,
    status,
    registradoEm: quando,
  });
  await gravar(K.eventos, eventos);

  if (status === 'tomado' && med.totalComprimidos > 0) {
    med.totalComprimidos = Math.max(0, med.totalComprimidos - med.quantidadePorDose);
    await salvarMedicamento(med);
  }
}

// Regra das 6 h: dose sem confirmação há mais de 6 h vira "perdido" (gravado no histórico).
export async function fecharDosesVencidas(agora: Date = new Date()) {
  const meds = await carregarMedicamentos();
  if (meds.length === 0) return;
  const eventos = await carregarEventos();
  let mudou = false;
  for (const data of ultimosDias(7)) {
    for (const med of meds) {
      for (const horario of med.horarios) {
        const quando = dataHoraAgendada(data, horario).getTime();
        if (quando < criadoEm(med)) continue;
        if (agora.getTime() - quando <= LIMITE_PERDIDO_MS) continue;
        if (eventos.some((e) => e.medicamentoId === med.id && e.horarioAgendado === horario && e.data === data)) continue;
        eventos.push({
          id: `${med.id}-${data}-${horario}`,
          medicamentoId: med.id,
          nome: med.nome,
          slot: med.compartimento,
          horarioAgendado: horario,
          data,
          status: 'perdido',
          registradoEm: quando + LIMITE_PERDIDO_MS,
        });
        mudou = true;
      }
    }
  }
  if (mudou) await gravar(K.eventos, eventos);
}
