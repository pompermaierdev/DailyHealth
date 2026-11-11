import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tela } from '../../src/components/Tela';
import { Cabecalho } from '../../src/components/Cabecalho';
import { Progresso } from '../../src/components/Progresso';
import { CampoTexto } from '../../src/components/CampoTexto';
import { SimNao } from '../../src/components/SimNao';
import { Botao } from '../../src/components/Botao';
import { useCadastro } from '../../src/context/CadastroContext';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { fonte, raio } from '../../src/theme/typography';

const RELACOES = ['Filho(a)', 'Neto(a)', 'Cônjuge', 'Irmão(ã)', 'Cuidador(a) profissional', 'Outro'];

export default function SobreIdoso() {
  const { dados, atualizar } = useCadastro();
  const { criarConta } = useAuth();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const concluir = async () => {
    if (dados.nomeIdoso.trim().length < 3) return setErro('Informe o nome completo da pessoa que você acompanha.');
    if (!dados.relacao) return setErro('Escolha qual é a sua relação com essa pessoa.');
    if (dados.idosoTemConta === null) return setErro('Responda se essa pessoa já possui conta.');
    if (dados.idosoTemConta && dados.codigo.trim().length < 6) return setErro('Digite o código de conexão de 6 caracteres.');
    setErro('');
    setCarregando(true);
    const msg = await criarConta({
      perfil: 'cuidador',
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      senha: dados.senha,
      telefone: dados.telefone.trim() || undefined,
      extras: {
        nomePaciente: dados.nomeIdoso.trim(),
        relacao: dados.relacao,
        codigoConexao: dados.idosoTemConta ? dados.codigo.trim().toUpperCase() : undefined,
      },
    });
    setCarregando(false);
    if (msg) return setErro(msg);
    router.replace('/(auth)/pronto');
  };

  return (
    <Tela>
      <Cabecalho />
      <Progresso etapa={3} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={[fonte.titulo, { textAlign: 'center' }]}>Sobre a pessoa que você acompanha</Text>
        <Text style={[fonte.suave, { textAlign: 'center' }]}>Precisamos de algumas informações para identificá-la.</Text>
      </View>

      <CampoTexto icone="person-outline" placeholder="Nome completo do idoso" value={dados.nomeIdoso} onChangeText={(v) => atualizar({ nomeIdoso: v })} />

      <Text style={fonte.corpo}>Qual é a sua relação?</Text>
      <View style={styles.chips}>
        {RELACOES.map((r) => {
          const sel = dados.relacao === r;
          return (
            <Pressable key={r} onPress={() => atualizar({ relacao: r })} accessibilityRole="radio" accessibilityState={{ selected: sel }} style={[styles.chip, sel && styles.chipSel]}>
              <Text style={[styles.chipTxt, sel && { color: '#fff' }]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>

      <SimNao pergunta="Essa pessoa já possui uma conta no DailyHealth?" valor={dados.idosoTemConta} onChange={(v) => atualizar({ idosoTemConta: v })} />

      {dados.idosoTemConta === true && (
        <>
          <CampoTexto
            icone="key-outline"
            placeholder="Código de conexão (6 caracteres)"
            autoCapitalize="characters"
            maxLength={6}
            value={dados.codigo}
            onChangeText={(v) => atualizar({ codigo: v.toUpperCase() })}
          />
          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={24} color={colors.azulEscuro} />
            <Text style={[fonte.pequeno, { flex: 1 }]}>
              Você poderá acompanhar os medicamentos e os registros de adesão dessa pessoa, depois que ela autorizar a conexão.
            </Text>
          </View>
        </>
      )}

      {dados.idosoTemConta === false && (
        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={24} color={colors.azulEscuro} />
          <Text style={[fonte.pequeno, { flex: 1 }]}>
            Peça para a pessoa criar a conta dela no DailyHealth e gerar o código de conexão. Depois, volte aqui e informe o código para conectar.
          </Text>
        </View>
      )}

      {erro !== '' && <Text style={{ color: colors.erro, fontSize: 16, fontWeight: '700' }}>{erro}</Text>}
      <Botao titulo="Concluir cadastro" icone="checkmark" onPress={concluir} carregando={carregando} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 22, borderWidth: 2, borderColor: colors.borda, backgroundColor: colors.branco },
  chipSel: { backgroundColor: colors.azul, borderColor: colors.azul },
  chipTxt: { fontSize: 16, fontWeight: '800', color: colors.azulEscuro },
  info: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.azulClaro, borderRadius: raio.campo, padding: 14 },
});
