import { useContext } from 'react';
import { CaixaContext } from '../context/CaixaContext';

export function useCaixa() {
  const ctx = useContext(CaixaContext);
  if (!ctx) throw new Error('useCaixa precisa estar dentro do CaixaProvider');
  return ctx;
}
