import { EventoAdesao, Medicamento } from '../types';
import { ultimosDias } from './datas';
import { dataHoraAgendada, dosesDoDia } from './doses';

// Tomou até 15 min depois do horário = "no horário". Depois disso = "com atraso".
export const TOLERANCIA_MIN = 15;

export interface DiaRelatorio {
  dia: string;
  devidas: number;
  noHorario: number;
  comAtraso: number;
  perdidas: number;
}

export interface Relatorio {
  pct: number | null; // adesão geral (tomadas / doses que já venceram)
  devidas: number;
  noHorario: number;
  comAtraso: number;
  perdidas: number;
  atrasoMedioMin: number | null;
  porDia: DiaRelatorio[];
  melhorPeriodo: { nome: string; pct: number } | null;
}

const periodoDe = (horario: string) => {
  const h = Number(horario.split(':')[0]);
  return h < 5 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
};

export function calcularRelatorio(meds: Medicamento[], eventos: EventoAdesao[], agora: Date = new Date(), dias = 7): Relatorio {
  const periodos = new Map<string, { devidas: number; tomadas: number }>();
  const atrasos: number[] = [];

  const porDia: DiaRelatorio[] = ultimosDias(dias).map((dia) => {
    let devidas = 0;
    let noHorario = 0;
    let comAtraso = 0;
    let perdidas = 0;
    for (const d of dosesDoDia(meds, eventos, dia, agora)) {
      if (d.status === 'pendente') continue; // ainda não venceu
      devidas++;
      const nomePeriodo = periodoDe(d.horario);
      const per = periodos.get(nomePeriodo) ?? { devidas: 0, tomadas: 0 };
      per.devidas++;
      if (d.status === 'tomado') {
        const ev = eventos.find((e) => e.medicamentoId === d.med.id && e.horarioAgendado === d.horario && e.data === dia);
        const atraso = ev ? Math.max(0, (ev.registradoEm - dataHoraAgendada(dia, d.horario).getTime()) / 60000) : 0;
        if (atraso <= TOLERANCIA_MIN) noHorario++;
        else {
          comAtraso++;
          atrasos.push(atraso);
        }
        per.tomadas++;
      } else if (d.status === 'perdido') {
        perdidas++;
      }
      periodos.set(nomePeriodo, per);
    }
    return { dia, devidas, noHorario, comAtraso, perdidas };
  });

  const soma = (f: (d: DiaRelatorio) => number) => porDia.reduce((s, d) => s + f(d), 0);
  const devidas = soma((d) => d.devidas);
  const noHorario = soma((d) => d.noHorario);
  const comAtraso = soma((d) => d.comAtraso);
  const perdidas = soma((d) => d.perdidas);

  let melhorPeriodo: Relatorio['melhorPeriodo'] = null;
  periodos.forEach((v, nome) => {
    const pct = Math.round((v.tomadas / v.devidas) * 100);
    if (!melhorPeriodo || pct > melhorPeriodo.pct) melhorPeriodo = { nome, pct };
  });

  return {
    pct: devidas ? Math.round(((noHorario + comAtraso) / devidas) * 100) : null,
    devidas,
    noHorario,
    comAtraso,
    perdidas,
    atrasoMedioMin: atrasos.length ? Math.round(atrasos.reduce((a, b) => a + b, 0) / atrasos.length) : null,
    porDia,
    melhorPeriodo,
  };
}
