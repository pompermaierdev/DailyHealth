import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Cabecalho } from '../../src/components/Cabecalho';
import { Progresso } from '../../src/components/Progresso';
import { SimNao } from '../../src/components/SimNao';
import { Botao } from '../../src/components/Botao';
import { useCadastro } from '../../src/context/CadastroContext';
import { useAuth } from '../../src/context/AuthContext';
import { fonte } from '../../src/theme/typography';

export default function Questionario() {
  const { dados, atualizar } = useCadastro();
  const { criarConta } = useAuth();
  const [carregando, setCarregando] = useState(false);

  // As respostas NÃO bloqueiam o acesso: dá para continuar sem responder.
  const concluir = async () => {
    setCarregando(true);
    await criarConta({
      perfil: 'proprio',
      nome: dados.nome.trim(),
      nomePreferido: dados.nomePreferido.trim() || undefined,
      email: dados.email.trim(),
      telefone: dados.telefone.trim() || undefined,
      usaMedicamentos: dados.usaMedicamentos ?? undefined,
      temCaixa: dados.temCaixa ?? undefined,
      querConectarFamiliar: dados.querConectarFamiliar ?? undefined,
    });
    setCarregando(false);
    router.replace('/(auth)/pronto');
  };

  return (
    <Tela>
      <Cabecalho />
      <Progresso etapa={3} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={fonte.titulo}>Algumas perguntas</Text>
        <Text style={[fonte.suave, { textAlign: 'center' }]}>São rápidas, e você pode mudar tudo depois.</Text>
      </View>

      <SimNao pergunta="Você utiliza medicamentos diariamente?" valor={dados.usaMedicamentos} onChange={(v) => atualizar({ usaMedicamentos: v })} />
      <SimNao pergunta="Você já possui uma caixa DailyHealth?" valor={dados.temCaixa} onChange={(v) => atualizar({ temCaixa: v })} />
      <SimNao pergunta="Você deseja conectar sua conta a um familiar ou cuidador?" valor={dados.querConectarFamiliar} onChange={(v) => atualizar({ querConectarFamiliar: v })} />

      <Botao titulo="Concluir cadastro" icone="checkmark" onPress={concluir} carregando={carregando} />
    </Tela>
  );
}
