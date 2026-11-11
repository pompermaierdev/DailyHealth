export type PerfilUso = 'proprio' | 'responsavel' | 'cuidador';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUso;
  idade?: number;
  telefoneResponsavel?: string; // obrigatório se menor de idade
  nomePaciente?: string; // responsável/cuidador: quem é acompanhado
  emailResponsavel?: string; // cuidador: quem é o responsável
  nomePreferido?: string; // como a pessoa gosta de ser chamada
  telefone?: string;
  relacao?: string; // cuidador: relação com a pessoa acompanhada
  codigoConexao?: string; // cuidador: código gerado pelo idoso
  usaMedicamentos?: boolean; // questionário (uso próprio)
  temCaixa?: boolean;
  querConectarFamiliar?: boolean;
}

export type Compartimento = 1 | 2 | 3 | 4;

export interface Medicamento {
  id: string;
  nome: string;
  quantidadePorDose: number;
  compartimento: Compartimento;
  horarios: string[]; // "HH:MM"
  totalComprimidos: number;
  fotoUri?: string;
  criadoEm?: number; // epoch ms; doses anteriores a isso não contam como perdidas
}

// pendente: ainda não chegou a hora | atrasado: passou da hora (até 6 h) | perdido: passou de 6 h
export type StatusDose = 'tomado' | 'perdido' | 'pendente' | 'atrasado';

export interface EventoAdesao {
  id: string;
  medicamentoId: string;
  nome: string;
  slot: number;
  horarioAgendado: string; // "HH:MM"
  data: string; // "YYYY-MM-DD"
  status: 'tomado' | 'perdido';
  registradoEm: number; // epoch ms (horário real)
}
