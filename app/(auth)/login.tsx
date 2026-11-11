import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Logo } from '../../src/components/Logo';
import { CampoTexto } from '../../src/components/CampoTexto';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { fonte } from '../../src/theme/typography';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const aoEntrar = async () => {
    if (!email.trim() || !senha) return setErro('Preencha o e-mail e a senha.');
    setCarregando(true);
    const msg = await entrar(email, senha);
    setCarregando(false);
    if (msg) setErro(msg);
    else router.replace('/(tabs)');
  };

  return (
    <Tela>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Logo tamanho={120} mostrarSlogan />
      </View>

      <View>
        <Text style={fonte.titulo}>Bem-vindo(a)!</Text>
        <Text style={fonte.suave}>Faça seu login para continuar com o seu cuidado.</Text>
      </View>

      <CampoTexto icone="person-outline" placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <CampoTexto icone="lock-closed-outline" placeholder="Senha" senha value={senha} onChangeText={setSenha} erro={erro} />

      <Pressable onPress={() => setErro('A recuperação de senha chega em uma próxima versão.')} style={{ alignSelf: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.azulEscuro }}>Esqueceu sua senha?</Text>
      </Pressable>

      <Botao titulo="Entrar" icone="arrow-forward" onPress={aoEntrar} carregando={carregando} />

      <View style={styles.ou}>
        <View style={styles.linha} />
        <Text style={fonte.pequeno}>ou</Text>
        <View style={styles.linha} />
      </View>

      <Botao titulo="Criar conta" icone="person-add-outline" variante="secundario" onPress={() => router.push('/(auth)/perfil-uso')} />

      <View style={styles.seguro}>
        <Ionicons name="shield-checkmark-outline" size={28} color={colors.azul} />
        <Text style={[fonte.pequeno, { flex: 1 }]}>Seus dados estão seguros conosco.</Text>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  ou: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linha: { flex: 1, height: 1, backgroundColor: colors.borda },
  seguro: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
