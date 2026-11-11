import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// As duas variáveis vêm do arquivo .env (veja .env.example).
// A chave "publishable" pode ficar no app: quem protege os dados é o RLS do banco.
// NUNCA coloque a chave "secret"/"service_role" nem a senha do banco aqui.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// false enquanto o arquivo .env não estiver preenchido (evita o app quebrar ao abrir)
export const supabaseConfigurado = Boolean(url && chave);

export const supabase = createClient(url || 'https://sem-configuracao.supabase.co', chave || 'sem-chave', {
  auth: {
    storage: AsyncStorage, // mantém o login depois de fechar o app
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// só renova o login com o app aberto (recomendado no React Native)
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// Teste rápido: confirma que o .env está certo e que as tabelas existem.
export async function testarConexao(): Promise<{ ok: boolean; detalhe: string }> {
  if (!url || !chave) return { ok: false, detalhe: 'Faltam as variáveis no arquivo .env' };
  const { error } = await supabase.from('perfis').select('id', { count: 'exact', head: true });
  if (error) return { ok: false, detalhe: error.message };
  return { ok: true, detalhe: 'Conectado e tabelas encontradas' };
}
