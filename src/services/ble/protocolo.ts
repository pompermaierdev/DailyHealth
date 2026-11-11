// Espelha o código do ESP32 (caixa_remedios.ino). Se mudar lá, mude aqui.
export const NOME_BLE = 'CaixaRemedios';
export const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
export const RX_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // app -> ESP32
export const TX_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // ESP32 -> app

// ---------- comandos (app -> caixa) ----------
// T;epoch  (epoch em segundos, já no horário LOCAL do celular)
export function cmdHora(d: Date = new Date()): string {
  const epochLocal = Math.floor(d.getTime() / 1000) - d.getTimezoneOffset() * 60;
  return `T;${epochLocal}`;
}

// A;slot;HH;MM;qtd;nome  (o display da caixa não tem acentos, então removemos)
export function limparNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[;\n\r]/g, ' ')
    .trim()
    .slice(0, 15);
}

export function cmdAlarme(slot: number, horario: string, qtd: number, nome: string): string {
  const [h, m] = horario.split(':').map(Number);
  return `A;${slot};${h};${m};${qtd};${limparNome(nome)}`;
}

export const CMD_LIMPAR = 'L';
// OK;slot;HH:MM  -> tomou (apaga o LED daquela dose)
export const cmdTomei = (slot: number, horario: string) => `OK;${slot};${horario}`;
// NAO;slot;HH:MM -> não tomou ainda (silencia o buzzer; o LED continua aceso)
export const cmdNaoTomei = (slot: number, horario: string) => `NAO;${slot};${horario}`;

// ---------- eventos (caixa -> app) ----------
export type EventoCaixa =
  | { tipo: 'ALARME'; slot: number; horario: string }
  | { tipo: 'TOMOU'; slot: number; horario: string }
  | { tipo: 'PERDEU'; slot: number; horario: string }
  | { tipo: 'ADIADO'; slot: number; horario: string }
  | { tipo: 'EXPIROU'; slot: number; horario: string }
  | { tipo: 'HORA_OK' }
  | { tipo: 'ALARME_OK' }
  | { tipo: 'LIMPO' }
  | { tipo: 'ERRO'; motivo: string }
  | { tipo: 'DESCONHECIDO'; bruto: string };

export function parseEvento(texto: string): EventoCaixa {
  const t = texto.trim();
  const p = t.split(';');
  const tipo = p[0];
  switch (tipo) {
    case 'ALARME':
    case 'TOMOU':
    case 'PERDEU':
    case 'ADIADO':
    case 'EXPIROU':
      return { tipo, slot: Number(p[1]), horario: p[2] ?? '' };
    case 'HORA_OK':
    case 'ALARME_OK':
    case 'LIMPO':
      return { tipo };
    case 'ERRO':
      return { tipo: 'ERRO', motivo: p[1] ?? '' };
    default:
      return { tipo: 'DESCONHECIDO', bruto: t };
  }
}
