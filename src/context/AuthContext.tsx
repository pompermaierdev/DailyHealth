import React, { createContext, useContext, useEffect, useState } from 'react';
import { Usuario } from '../types';
import { carregarUsuario, removerUsuario, salvarUsuario } from '../services/storage';

type DadosCadastro = Omit<Usuario, 'id'>;

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>; // devolve mensagem de erro ou null
  criarConta: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

// VERSÃO LOCAL (sem backend). Trocar por Firebase Auth na fase 2 (ver services/firebase.ts).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarUsuario().then((u) => {
      setUsuario(u);
      setCarregando(false);
    });
  }, []);

  const entrar = async (email: string, _senha: string) => {
    const salvo = await carregarUsuario();
    if (!salvo || salvo.email.toLowerCase() !== email.trim().toLowerCase()) {
      return 'Conta não encontrada neste celular. Toque em "Criar conta".';
    }
    setUsuario(salvo);
    return null;
  };

  const criarConta = async (dados: DadosCadastro) => {
    const novo: Usuario = { ...dados, id: String(Date.now()) };
    await salvarUsuario(novo);
    setUsuario(novo);
  };

  const sair = async () => {
    // mantém os dados salvos; só encerra a sessão em memória
    setUsuario(null);
  };

  return <AuthContext.Provider value={{ usuario, carregando, entrar, criarConta, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro do AuthProvider');
  return ctx;
}
