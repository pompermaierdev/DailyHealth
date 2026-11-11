import { EventoAdesao, Medicamento, StatusDose } from '../types';
import { hojeISO } from './datas';

// Passou de 6 h do horário sem confirmar => dose perdida
export const LIMITE_PERDIDO_MS = 6 * 60 * 60 * 1000;

export function dataHoraAgendada(data: string, horario: string): Date {
  const [a, m, d] = data.split('-').map(Number);
  const [h, min] = horario.split(':').map(Number);
  return new Date(a, m - 1, d, h, min, 0, 0);
}

// Data (YYYY-MM-DD) da ocorrência mais recente de um horário (hoje ou ontem)
export function dataDaDose(horario: string, agora: Date = new Date()): string {
  const hoje = hojeISO(agora);
  if (dataHoraAgendada(hoje, horario) <= agora) return hoje;
  const ontem = new Date(agora);
  ontem.setDate(ontem.getDate() - 1);
  return hojeISO(ontem);
}

export const criadoEm = (med: Medicamento): number => med.criadoEm ?? (Number(med.id) || 0);

export function statusDose(med: Medicamento, horario: string, data: string, eventos: EventoAdesao[], agora: Date): StatusDose {
  const ev = eventos.find((e) => e.medicamentoId === med.id && e.horarioAgendado === horario && e.data === data);
  if (ev) return ev.status;
  const diff = agora.getTime() - dataHoraAgendada(data, horario).getTime();
  if (diff < 0) return 'pendente';
  return diff > LIMITE_PERDIDO_MS ? 'perdido' : 'atrasado';
}

export interface DoseDia {
  med: Medicamento;
  horario: string;
  data: string;
  status: StatusDose;
}

export function dosesDoDia(meds: Medicamento[], eventos: EventoAdesao[], data: string, agora: Date = new Date()): DoseDia[] {
  const lista: DoseDia[] = [];
  for (const med of meds) {
    for (const horario of med.horarios) {
      const quando = dataHoraAgendada(data, horario).getTime();
      const status = statusDose(med, horario, data, eventos, agora);
      // dose de antes do cadastro do remédio não conta (a menos que já tenha registro)
      if (quando < criadoEm(med) && status !== 'tomado') continue;
      lista.push({ med, horario, data, status });
    }
  }
  return lista.sort((a, b) => a.horario.localeCompare(b.horario));
}

export function formatarAtraso(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
