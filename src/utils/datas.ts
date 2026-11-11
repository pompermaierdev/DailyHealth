export function hojeISO(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function dePorMinutos(min: number): string {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export function horarioValido(txt: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(txt);
}

// Aceita "8", "830", "8:30" e devolve "08:30" (ou null)
export function normalizarHorario(txt: string): string | null {
  const so = txt.replace(/[^\d]/g, '');
  if (so.length < 3 || so.length > 4) return null;
  const f = so.length === 3 ? `0${so[0]}:${so.slice(1)}` : `${so.slice(0, 2)}:${so.slice(2)}`;
  return horarioValido(f) ? f : null;
}

export function ultimosDias(qtd: number): string[] {
  const out: string[] = [];
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(hojeISO(d));
  }
  return out;
}

export const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export function letraDoDia(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return DIAS_SEMANA[new Date(a, m - 1, d).getDay()];
}

export function nomeDoDiaExtenso(d = new Date()): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
