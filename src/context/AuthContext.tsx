import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigurado } from '../services/supabase';
import { carregarUsuario, removerUsuario, salvarUsuario } from '../services/storage';
import { Usuario } from '../types';

// Dados extras (questionário e cuidador) guardados em perfis.extras
export interface Extras {
  nomePaciente?: string;
  relacao?: string;
  codigoConexao?: string;
  usaMedicamentos?: boolean;
  temCaixa?: boolean;
  querConectarFamiliar?: boolean;
}

export interface NovoCadastro {
  perfil: 'proprio' | 'cuidador';
  nome: string;
  nomePreferido?: string;
  email: string;
  senha: string;
  telefone?: string;
  extras?: Extras;
}

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>; // devolve mensagem de erro ou null
  criarConta: (dados: NovoCadastro) => Promise<string | null>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

const SEM_CONFIG = 'O Supabase ainda não foi configurado (arquivo .env). Veja o .env.example.';

function traduzir(e: { message?: string; code?: string }): string {
  const cod = e.code ?? '';
  const msg = (e.message ?? '').toLowerCase();
  if (cod === 'user_already_exists' || msg.includes('already registered')) return 'Esse e-mail já tem cadastro. Tente entrar.';
  if (cod === 'invalid_credentials' || msg.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (cod === 'email_not_confirmed' || msg.includes('not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  if (cod === 'weak_password' || msg.includes('at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (cod === 'over_email_send_rate_limit' || msg.includes('rate limit')) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão com a internet.';
  return e.message ?? 'Algo deu errado. Tente de novo.';
}

// Busca o perfil no banco. Devolve null se não conseguir (ex.: sem internet).
async function carregarPerfil(user: User): Promise<Usuario | null> {
  const { data, error } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle();
  if (error) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, any>;
  const ex = ((data?.extras ?? {}) as Extras) || {};
  return {
    id: user.id,
    email: user.email ?? '',
    nome: data?.nome ?? meta.nome ?? '',
    nomePreferido: data?.nome_preferido ?? meta.nome_preferido ?? undefined,
    telefone: data?.telefone ?? meta.telefone ?? undefined,
    perfil: (data?.perfil ?? meta.perfil ?? 'proprio') as Usuario['perfil'],
    nomePaciente: ex.nomePaciente,
    relacao: ex.relacao,
    codigoConexao: ex.codigoConexao,
    usaMedicamentos: ex.usaMedicamentos,
    temCaixa: ex.temCaixa,
    querConectarFamiliar: ex.querConectarFamiliar,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const criando = useRef(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        if (!supabaseConfigurado) return;
        const cache = await carregarUsuario(); // abre rápido e funciona sem internet
        const { data } = await supabase.auth.getSession();
        if (!ativo) return;
        if (!data.session) {
          setUsuario(null);
          return;
        }
        if (cache && cache.id === data.session.user.id) setUsuario(cache);
        const atual = await carregarPerfil(data.session.user);
        if (!ativo) return;
        if (atual) {
          setUsuario(atual);
          await salvarUsuario(atual);
        }
      } catch {
        /* sem internet: segue com o cache */
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'SIGNED_OUT') {
        setUsuario(null);
        return;
      }
      if (evento === 'SIGNED_IN' && session && !criando.current) {
        // adiado de propósito: não chamar o Supabase direto dentro deste callback
        setTimeout(async () => {
          const p = await carregarPerfil(session.user);
          if (p) {
            setUsuario(p);
            salvarUsuario(p);
          }
        }, 0);
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const entrar = async (email: string, senha: string) => {
    if (!supabaseConfigurado) return SEM_CONFIG;
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) return traduzir(error);
    const p = await carregarPerfil(data.user);
    if (!p) return 'Entrou, mas não consegui carregar seu perfil. Verifique a internet.';
    setUsuario(p);
    await salvarUsuario(p);
    return null;
  };

  const criarConta = async (d: NovoCadastro) => {
    if (!supabaseConfigurado) return SEM_CONFIG;
    criando.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: d.email.trim(),
        password: d.senha,
        // o gatilho do banco usa estes dados para criar a linha em "perfis"
        options: { data: { nome: d.nome, nome_preferido: d.nomePreferido ?? null, telefone: d.telefone ?? null, perfil: d.perfil } },
      });
      if (error) return traduzir(error);
      if (!data.session || !data.user) {
        return 'Conta criada! Enviamos um e-mail de confirmação. Confirme e depois entre pelo login.';
      }
      const extras = d.extras ?? {};
      await supabase.from('perfis').update({ extras }).eq('id', data.user.id);
      const p = await carregarPerfil(data.user);
      const novo: Usuario = {
        ...(p ?? { id: data.user.id, email: d.email.trim(), nome: d.nome, perfil: d.perfil }),
        ...extras,
      };
      setUsuario(novo);
      await salvarUsuario(novo);
      return null;
    } finally {
      criando.current = false;
    }
  };

  const sair = async () => {
    await supabase.auth.signOut();
    await removerUsuario();
    setUsuario(null);
  };

  return <AuthContext.Provider value={{ usuario, carregando, entrar, criarConta, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro do AuthProvider');
  return ctx;
}
