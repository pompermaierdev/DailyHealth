import { supabase } from './supabase';
import { EventoAdesao, Medicamento } from '../types';
import { paraEventoLocal, paraLocal } from './sincronizacao';
import { ultimosDias } from '../utils/datas';

export type StatusVinculo = 'pendente' | 'ativo' | 'recusado';

// visto pelo idoso: quem pediu para acompanhá-lo
export interface VinculoPaciente {
  cuidadorId: string;
  nome: string;
  relacao?: string;
  status: StatusVinculo;
}

// visto pelo cuidador: quem ele acompanha
export interface VinculoCuidador {
  pacienteId: string;
  nome?: string; // só aparece depois que o idoso aceita
  relacao?: string;
  status: StatusVinculo;
}

// ---------- código de conexão ----------
export async function gerarCodigo(): Promise<string> {
  const { data, error } = await supabase.rpc('gerar_codigo_conexao');
  if (error) throw error;
  return data as string;
}

export async function codigoAtual(): Promise<{ codigo: string; expiraEm: Date } | null> {
  const { data, error } = await supabase
    .from('codigos_conexao')
    .select('codigo, expira_em')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  return { codigo: data.codigo, expiraEm: new Date(data.expira_em) };
}

// devolve só o NOME de quem gerou o código (ou null se for inválido/expirado)
export async function consultarCodigo(codigo: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('consultar_codigo', { p_codigo: codigo });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function conectarPorCodigo(codigo: string, relacao?: string) {
  const { data, error } = await supabase.rpc('conectar_por_codigo', { p_codigo: codigo, p_relacao: relacao ?? null });
  if (error) throw error;
  return data as { paciente_id: string; nome: string };
}

// ---------- vínculos ----------
export async function vinculosDoPaciente(uid: string): Promise<VinculoPaciente[]> {
  const { data, error } = await supabase
    .from('vinculos')
    .select('cuidador_id, relacao, status, cuidador:perfis!cuidador_id(nome)')
    .eq('paciente_id', uid)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    cuidadorId: r.cuidador_id,
    nome: r.cuidador?.nome ?? 'Cuidador',
    relacao: r.relacao ?? undefined,
    status: r.status,
  }));
}

export async function vinculosDoCuidador(uid: string): Promise<VinculoCuidador[]> {
  const { data, error } = await supabase
    .from('vinculos')
    .select('paciente_id, relacao, status, paciente:perfis!paciente_id(nome)')
    .eq('cuidador_id', uid)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    pacienteId: r.paciente_id,
    nome: r.paciente?.nome ?? undefined,
    relacao: r.relacao ?? undefined,
    status: r.status,
  }));
}

export async function contarPedidos(uid: string): Promise<number> {
  const { count, error } = await supabase
    .from('vinculos')
    .select('cuidador_id', { count: 'exact', head: true })
    .eq('paciente_id', uid)
    .eq('status', 'pendente');
  if (error) throw error;
  return count ?? 0;
}

export async function responderPedido(pacienteId: string, cuidadorId: string, aceitar: boolean) {
  const { error } = await supabase
    .from('vinculos')
    .update({ status: aceitar ? 'ativo' : 'recusado' })
    .eq('paciente_id', pacienteId)
    .eq('cuidador_id', cuidadorId);
  if (error) throw error;
}

export async function removerVinculo(pacienteId: string, cuidadorId: string) {
  const { error } = await supabase.from('vinculos').delete().eq('paciente_id', pacienteId).eq('cuidador_id', cuidadorId);
  if (error) throw error;
}

// ---------- dados do idoso, lidos pelo cuidador ----------
export async function dadosDoPaciente(pacienteId: string): Promise<{ medicamentos: Medicamento[]; eventos: EventoAdesao[] }> {
  const desde = ultimosDias(7)[0];
  const [m, e] = await Promise.all([
    supabase.from('medicamentos').select('*').eq('paciente_id', pacienteId),
    supabase.from('eventos').select('*').eq('paciente_id', pacienteId).gte('data', desde),
  ]);
  if (m.error) throw m.error;
  if (e.error) throw e.error;
  return {
    medicamentos: (m.data ?? []).map(paraLocal),
    eventos: (e.data ?? []).filter((r: any) => r.medicamento_id).map(paraEventoLocal),
  };
}

// avisa em tempo real quando o idoso confirma uma dose ou muda um remédio
export function acompanharPaciente(pacienteId: string, aoMudar: () => void) {
  const filtro = `paciente_id=eq.${pacienteId}`;
  const canal = supabase
    .channel(`paciente-${pacienteId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos', filter: filtro }, aoMudar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'medicamentos', filter: filtro }, aoMudar)
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

// avisa o idoso quando chega (ou muda) um pedido de conexão
export function acompanharPedidos(uid: string, aoMudar: () => void) {
  const canal = supabase
    .channel(`pedidos-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vinculos', filter: `paciente_id=eq.${uid}` }, aoMudar)
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}
