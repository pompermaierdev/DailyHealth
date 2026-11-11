import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Tela } from '../src/components/Tela';
import { Cabecalho } from '../src/components/Cabecalho';
import { CampoTexto } from '../src/components/CampoTexto';
import { Botao } from '../src/components/Botao';
import { useMedicamentos } from '../src/hooks/useMedicamentos';
import { useCaixa } from '../src/hooks/useCaixa';
import { colors } from '../src/theme/colors';
import { fonte, raio } from '../src/theme/typography';
import { normalizarHorario } from '../src/utils/datas';
import { Compartimento } from '../src/types';

export default function MedicamentoNovo() {
  const { salvar } = useMedicamentos();
  const { estado, sincronizarMedicamentos } = useCaixa();

  const [foto, setFoto] = useState<string | undefined>();
  const [nome, setNome] = useState('');
  const [qtd, setQtd] = useState('1');
  const [total, setTotal] = useState('30');
  const [comp, setComp] = useState<Compartimento>(1);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [novoHorario, setNovoHorario] = useState('');
  const [erro, setErro] = useState('');

  const tirarFoto = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return Alert.alert('Permita o uso da câmera para tirar a foto.');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled) setFoto(r.assets[0].uri);
  };
  const escolherGaleria = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled) setFoto(r.assets[0].uri);
  };

  const addHorario = () => {
    const h = normalizarHorario(novoHorario);
    if (!h) return setErro('Horário inválido. Use o formato 08:30.');
    if (horarios.includes(h)) return setErro('Esse horário já foi adicionado.');
    setHorarios([...horarios, h].sort());
    setNovoHorario('');
    setErro('');
  };

  const aoSalvar = async () => {
    if (nome.trim().length < 2) return setErro('Informe o nome do medicamento.');
    if (!Number(qtd) || Number(qtd) < 1) return setErro('Informe a quantidade por dose.');
    if (horarios.length === 0) return setErro('Adicione pelo menos um horário.');
    const lista = await salvar({
      id: String(Date.now()),
      criadoEm: Date.now(),
      nome: nome.trim(),
      quantidadePorDose: Number(qtd),
      totalComprimidos: Number(total) || 0,
      compartimento: comp,
      horarios,
      fotoUri: foto,
    });
    if (estado === 'conectada') await sincronizarMedicamentos(lista);
    else Alert.alert('Salvo!', 'Conecte a caixa e use “Enviar tudo para a caixa” para ela passar a avisar.');
    router.back();
  };

  return (
    <Tela>
      <Cabecalho />
      <Text style={fonte.titulo}>Cadastrar medicamento</Text>

      <View style={styles.fotoCard}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.foto} />
        ) : (
          <View style={styles.fotoVazia}>
            <Ionicons name="medical" size={40} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={fonte.subtitulo}>Foto do medicamento</Text>
          <Text style={fonte.pequeno}>Ajuda a identificar a caixinha.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Botao titulo="Câmera" variante="secundario" onPress={tirarFoto} estilo={{ flex: 1, minHeight: 46, paddingHorizontal: 8 }} />
            <Botao titulo="Galeria" variante="secundario" onPress={escolherGaleria} estilo={{ flex: 1, minHeight: 46, paddingHorizontal: 8 }} />
          </View>
        </View>
      </View>

      <CampoTexto rotulo="Nome do medicamento" icone="medkit-outline" placeholder="Ex.: Losartana" value={nome} onChangeText={setNome} />
      <CampoTexto rotulo="Quantidade por dose" icone="ellipse-outline" placeholder="Ex.: 1" keyboardType="number-pad" value={qtd} onChangeText={setQtd} />

      <Text style={styles.rotulo}>Compartimento da caixa</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {([1, 2, 3, 4] as Compartimento[]).map((n) => (
          <Pressable
            key={n}
            onPress={() => setComp(n)}
            accessibilityLabel={`Compartimento ${n}`}
            style={[styles.comp, { backgroundColor: colors.compartimento[n] }, comp === n && styles.compSel]}
          >
            <Text style={styles.compNum}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.rotulo}>Horário(s) de uso</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {horarios.map((h) => (
          <Pressable key={h} onPress={() => setHorarios(horarios.filter((x) => x !== h))} style={styles.chip} accessibilityLabel={`Remover horário ${h}`}>
            <Text style={styles.chipTxt}>{h}</Text>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <CampoTexto icone="time-outline" placeholder="08:30" keyboardType="number-pad" maxLength={5} value={novoHorario} onChangeText={setNovoHorario} />
        </View>
        <Botao titulo="Adicionar" onPress={addHorario} variante="secundario" estilo={{ minHeight: 60 }} />
      </View>

      <CampoTexto rotulo="Total de comprimidos" icone="cube-outline" placeholder="Ex.: 30" keyboardType="number-pad" value={total} onChangeText={setTotal} />

      {erro !== '' && <Text style={{ color: colors.erro, fontSize: 17, fontWeight: '700' }}>{erro}</Text>}
      <Botao titulo="Salvar" icone="checkmark" onPress={aoSalvar} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  fotoCard: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.rosaClaro, borderRadius: raio.card, padding: 16 },
  foto: { width: 84, height: 84, borderRadius: 42 },
  fotoVazia: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.rosa, alignItems: 'center', justifyContent: 'center' },
  rotulo: { fontSize: 16, fontWeight: '800', color: colors.azulEscuro },
  comp: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  compSel: { borderColor: colors.navy, borderWidth: 5 },
  compNum: { fontSize: 28, fontWeight: '900', color: colors.navy },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.azul, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 },
  chipTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
});
