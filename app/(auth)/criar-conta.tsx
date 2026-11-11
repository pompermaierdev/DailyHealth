import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Cabecalho } from '../../src/components/Cabecalho';
import { Progresso } from '../../src/components/Progresso';
import { CampoTexto } from '../../src/components/CampoTexto';
import { Botao } from '../../src/components/Botao';
import { useCadastro } from '../../src/context/CadastroContext';
import { colors } from '../../src/theme/colors';
import { fonte } from '../../src/theme/typography';

export default function SeusDados() {
  const { dados, atualizar } = useCadastro();
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');

  const continuar = () => {
    if (dados.nome.trim().length < 3) return setErro('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(dados.email.trim())) return setErro('Informe um e-mail válido.');
    if (dados.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (dados.senha !== confirmar) return setErro('As senhas não são iguais.');
    setErro('');
    router.push(dados.perfil === 'proprio' ? '/(auth)/questionario' : '/(auth)/sobre-idoso');
  };

  return (
    <Tela>
      <Cabecalho />
      <Progresso etapa={2} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={fonte.titulo}>Seus dados</Text>
        <Text style={[fonte.suave, { textAlign: 'center' }]}>Preencha as informações abaixo para criar sua conta.</Text>
      </View>

      <CampoTexto icone="person-outline" placeholder="Nome completo" value={dados.nome} onChangeText={(v) => atualizar({ nome: v })} />
      {dados.perfil === 'proprio' && (
        <CampoTexto icone="happy-outline" placeholder="Como prefere ser chamado(a)? (opcional)" value={dados.nomePreferido} onChangeText={(v) => atualizar({ nomePreferido: v })} />
      )}
      <CampoTexto icone="mail-outline" placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={dados.email} onChangeText={(v) => atualizar({ email: v })} />
      <CampoTexto icone="call-outline" placeholder="Telefone celular (opcional)" keyboardType="phone-pad" value={dados.telefone} onChangeText={(v) => atualizar({ telefone: v })} />
      <CampoTexto icone="lock-closed-outline" placeholder="Senha" senha value={dados.senha} onChangeText={(v) => atualizar({ senha: v })} />
      <CampoTexto icone="lock-closed-outline" placeholder="Confirmar senha" senha value={confirmar} onChangeText={setConfirmar} />

      {erro !== '' && <Text style={{ color: colors.erro, fontSize: 16, fontWeight: '700' }}>{erro}</Text>}
      <Botao titulo="Continuar" icone="arrow-forward" onPress={continuar} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.textoSuave} />
        <Text style={fonte.pequeno}>Seus dados estão seguros conosco.</Text>
      </View>
    </Tela>
  );
}
