import React, { createContext, useContext, useState } from 'react';

// Guarda o que a pessoa já preencheu enquanto passa pelas 3 etapas do cadastro.
export interface Rascunho {
  perfil: 'proprio' | 'cuidador';
  nome: string;
  nomePreferido: string;
  email: string;
  telefone: string;
  senha: string;
  // uso próprio
  usaMedicamentos: boolean | null;
  temCaixa: boolean | null;
  querConectarFamiliar: boolean | null;
  // cuidador / responsável
  nomeIdoso: string;
  relacao: string;
  idosoTemConta: boolean | null;
  codigo: string;
}

const vazio: Rascunho = {
  perfil: 'proprio',
  nome: '',
  nomePreferido: '',
  email: '',
  telefone: '',
  senha: '',
  usaMedicamentos: null,
  temCaixa: null,
  querConectarFamiliar: null,
  nomeIdoso: '',
  relacao: '',
  idosoTemConta: null,
  codigo: '',
};

interface Ctx {
  dados: Rascunho;
  atualizar: (parcial: Partial<Rascunho>) => void;
  limpar: () => void;
}

const CadastroContext = createContext<Ctx | null>(null);

export function CadastroProvider({ children }: { children: React.ReactNode }) {
  const [dados, setDados] = useState<Rascunho>(vazio);
  const atualizar = (parcial: Partial<Rascunho>) => setDados((d) => ({ ...d, ...parcial }));
  const limpar = () => setDados(vazio);
  return <CadastroContext.Provider value={{ dados, atualizar, limpar }}>{children}</CadastroContext.Provider>;
}

export function useCadastro() {
  const ctx = useContext(CadastroContext);
  if (!ctx) throw new Error('useCadastro precisa estar dentro do CadastroProvider');
  return ctx;
}
