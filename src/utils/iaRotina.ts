import { EventoAdesao } from '../types';
import { dePorMinutos, paraMinutos } from './datas';

export interface SugestaoAjuste {
  medicamentoId: string;
  nome: string;
  horarioAtual: string;
  horarioSugerido: string;
  atrasoMedioMin: number;
  amostras: number;
}

// "IA" de rotina: compara o horário agendado com o horário real em que a pessoa
// confirmou. Se ela atrasa de forma consistente, sugere mover o alerta.
export function sugerirAjustes(eventos: EventoAdesao[], minAmostras = 3, limiarMin = 20): SugestaoAjuste[] {
  const grupos = new Map<string, EventoAdesao[]>();
  eventos
    .filter((e) => e.status === 'tomado')
    .forEach((e) => {
      const k = `${e.medicamentoId}|${e.horarioAgendado}`;
      grupos.set(k, [...(grupos.get(k) ?? []), e]);
    });

  const sugestoes: SugestaoAjuste[] = [];
  grupos.forEach((lista, k) => {
    const recentes = lista.sort((a, b) => b.registradoEm - a.registradoEm).slice(0, 7);
    if (recentes.length < minAmostras) return;
    const atrasos = recentes.map((e) => {
      const d = new Date(e.registradoEm);
      return d.getHours() * 60 + d.getMinutes() - paraMinutos(e.horarioAgendado);
    });
    const media = Math.round(atrasos.reduce((a, b) => a + b, 0) / atrasos.length);
    if (Math.abs(media) >= limiarMin && Math.abs(media) <= 180) {
      const [medId, horario] = k.split('|');
      sugestoes.push({
        medicamentoId: medId,
        nome: recentes[0].nome,
        horarioAtual: horario,
        horarioSugerido: dePorMinutos(paraMinutos(horario) + media),
        atrasoMedioMin: media,
        amostras: recentes.length,
      });
    }
  });
  return sugestoes;
}
