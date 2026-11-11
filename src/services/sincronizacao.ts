import { supabase, supabaseConfigurado } from './supabase';
import { EventoAdesao, Medicamento, Usuario } from '../types';
import {
  aoMudarDados,
  carregarEventos,
  carregarMedicamentos,
  gravarDono,
  lerDono,
  limparDadosLocais,
  limparRemocoes,
  listarRemocoes,
  notificarSincronizado,
  substituirEventos,
  substituirMedicamentos,
} from './storage';
import { criadoEm } from '../utils/doses';
import { ehUuid, novoId } from '../utils/id';
import { ultimosDias } from '../utils/datas';

// O celular é a fonte principal (funciona sem internet). A nuvem guarda uma cópia
// ligada à conta, que o cuidador poderá ler. Só quem usa a caixa ("proprio") envia dados.

let usuarioAtual: Usuario | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let rodando = false;
let pediuDeNovo = false;
let desinscrever: (() => void) | null = null;

export function iniciarSincronizacao(u: Usuario) {
  usuarioAtual = u;
  desinscrever?.();
  desinscrever = aoMudarDados(() => agendarSync());
  agendarSync(0);
}

export function pararSincronizacao() {
  desinscrever?.();
  desinscrever = null;
  if (timer) clearTimeout(timer);
  timer = null;
  usuarioAtual = null;
}

// espera um pouquinho para juntar várias mudanças seguidas em um só envio
export function agendarSync(atrasoMs = 1500) {
  if (!usuarioAtual) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    sincronizarAgora();
  }, atrasoMs);
}

export async function sincronizarAgora(): Promise<void> {
  if (!usuarioAtual || !supabaseConfigurado) return;
  if (rodando) {
    pediuDeNovo = true;
    return;
  }
  rodando = true;
  try {
    await executar(usuarioAtual);
  } catch {
    /* sem internet ou erro: tentamos de novo na próxima mudança */
  } finally {
    rodando = false;
    if (pediuDeNovo) {
      pediuDeNovo = false;
      agendarSync(1000);
    }
  }
}

// remédios criados antes do login têm id numérico; o banco exige uuid
async function garantirUuids() {
  const meds = await carregarMedicamentos();
  if (meds.every((m) => ehUuid(m.id))) return;
  const mapa = new Map<string, string>();
  const novas = meds.map((m) => {
    if (ehUuid(m.id)) return m;
    const id = novoId();
    mapa.set(m.id, id);
    return { ...m, id, criadoEm: criadoEm(m) };
  });
  await substituirMedicamentos(novas);
  const eventos = await carregarEventos();
  await substituirEventos(
    eventos.map((e) => {
      const id = mapa.get(e.medicamentoId);
      return id ? { ...e, medicamentoId: id, id: `${id}-${e.data}-${e.horarioAgendado}` } : e;
    })
  );
}

const paraLocal = (r: any): Medicamento => ({
  id: r.id,
  nome: r.nome,
  quantidadePorDose: r.quantidade_por_dose,
  compartimento: r.compartimento,
  horarios: r.horarios ?? [],
  totalComprimidos: r.total_comprimidos ?? 0,
  criadoEm: Date.parse(r.criado_em) || Date.now(),
});

const paraLinha = (m: Medicamento, pacienteId: string) => ({
  id: m.id,
  paciente_id: pacienteId,
  nome: m.nome,
  quantidade_por_dose: m.quantidadePorDose,
  compartimento: m.compartimento,
  horarios: m.horarios,
  total_comprimidos: m.totalComprimidos,
  ativo: true,
  criado_em: new Date(criadoEm(m)).toISOString(),
});

const paraEventoLocal = (r: any): EventoAdesao => ({
  id: `${r.medicamento_id}-${r.data}-${r.horario_agendado}`,
  medicamentoId: r.medicamento_id,
  nome: r.nome,
  slot: r.slot,
  horarioAgendado: r.horario_agendado,
  data: r.data,
  status: r.status,
  registradoEm: Date.parse(r.registrado_em) || Date.now(),
});

async function executar(u: Usuario) {
  // 1) dados guardados aqui são de outra pessoa? então apaga antes de continuar
  const dono = await lerDono();
  if (dono && dono !== u.id) await limparDadosLocais();
  await gravarDono(u.id);

  // quem acompanha (cuidador) não envia nada: só lê, e isso virá na tela do cuidador
  if (u.perfil !== 'proprio') return;

  await garantirUuids();

  // 2) remédios apagados aqui: apaga também na nuvem
  const pendentes = (await listarRemocoes()).filter(ehUuid);
  if (pendentes.length) {
    const { error } = await supabase.from('medicamentos').delete().in('id', pendentes).eq('paciente_id', u.id);
    if (!error) await limparRemocoes();
  }
  const aindaPendentes = new Set(await listarRemocoes());

  // 3) traz da nuvem os remédios que este celular ainda não tem (ex.: celular novo)
  const { data: remotos, error: erroMeds } = await supabase.from('medicamentos').select('*').eq('paciente_id', u.id);
  if (erroMeds) throw erroMeds;
  const locais = await carregarMedicamentos();
  const idsLocais = new Set(locais.map((m) => m.id));
  const novos = (remotos ?? []).filter((r) => !idsLocais.has(r.id) && !aindaPendentes.has(r.id)).map(paraLocal);
  const todos = [...locais, ...novos];
  if (novos.length) await substituirMedicamentos(todos);

  // 4) envia os remédios deste celular
  if (todos.length) {
    const { error } = await supabase.from('medicamentos').upsert(
      todos.map((m) => paraLinha(m, u.id)),
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  // 5) histórico dos últimos 30 dias: traz o que falta e envia o que falta
  const desde = ultimosDias(30)[0];
  const { data: evRemotos, error: erroEv } = await supabase.from('eventos').select('*').eq('paciente_id', u.id).gte('data', desde);
  if (erroEv) throw erroEv;
  const eventos = await carregarEventos();
  const chave = (med: string, data: string, hora: string) => `${med}|${data}|${hora}`;
  const chavesLocais = new Set(eventos.map((e) => chave(e.medicamentoId, e.data, e.horarioAgendado)));
  const idsMeds = new Set(todos.map((m) => m.id));

  const novosEv = (evRemotos ?? [])
    .filter((r) => r.medicamento_id && idsMeds.has(r.medicamento_id) && !chavesLocais.has(chave(r.medicamento_id, r.data, r.horario_agendado)))
    .map(paraEventoLocal);
  if (novosEv.length) await substituirEventos([...eventos, ...novosEv]);

  const enviar = eventos
    .filter((e) => idsMeds.has(e.medicamentoId) && e.data >= desde)
    .map((e) => ({
      paciente_id: u.id,
      medicamento_id: e.medicamentoId,
      nome: e.nome,
      slot: e.slot,
      horario_agendado: e.horarioAgendado,
      data: e.data,
      status: e.status,
      registrado_em: new Date(e.registradoEm).toISOString(),
    }));
  if (enviar.length) {
    const { error } = await supabase
      .from('eventos')
      .upsert(enviar, { onConflict: 'paciente_id,medicamento_id,data,horario_agendado', ignoreDuplicates: true });
    if (error) throw error;
  }

  if (novos.length || novosEv.length) notificarSincronizado(); // as telas recarregam
}
