import React from 'react';
import { Alert, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tela } from '../src/components/Tela';
import { Cabecalho } from '../src/components/Cabecalho';
import { Botao } from '../src/components/Botao';
import { useCaixa } from '../src/hooks/useCaixa';
import { useMedicamentos } from '../src/hooks/useMedicamentos';
import { colors } from '../src/theme/colors';
import { fonte, raio } from '../src/theme/typography';

export default function Caixa() {
  const { estado, dispositivos, horaSincronizada, erro, procurar, conectar, desconectar, enviarHora, sincronizarMedicamentos } = useCaixa();
  const { medicamentos } = useMedicamentos();
  const conectada = estado === 'conectada';

  const textoEstado = { desconectada: 'Desconectada', procurando: 'Procurando…', conectando: 'Conectando…', conectada: 'Conectada' }[estado];
  const corDot = conectada ? '#7BDC8C' : estado === 'desconectada' ? '#9AA5C8' : '#FFC857';

  return (
    <Tela>
      <Cabecalho />
      <Text style={fonte.titulo}>Minha caixa</Text>

      <View style={styles.card}>
        <Text style={{ color: '#C9D1F2', fontSize: 15, fontWeight: '800' }}>Bluetooth</Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>CaixaRemedios</Text>
        <View style={styles.linha}>
          <View style={[styles.dot, { backgroundColor: corDot }]} />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{textoEstado}</Text>
        </View>
        {conectada && (
          <Text style={{ color: '#C9D1F2', fontSize: 16, fontWeight: '600' }}>
            {horaSincronizada ? 'Hora sincronizada com o celular' : 'Sincronizando a hora…'}
          </Text>
        )}
      </View>

      {erro && <Text style={{ color: colors.erro, fontSize: 17, fontWeight: '700' }}>{erro}</Text>}

      {!conectada && (
        <>
          <Botao
            titulo={estado === 'procurando' ? 'Procurando…' : 'Procurar a caixa'}
            icone="search"
            onPress={procurar}
            carregando={estado === 'procurando' || estado === 'conectando'}
          />
          {dispositivos.map((d) => (
            <View key={d.id} style={styles.disp}>
              <Ionicons name="cube-outline" size={30} color={colors.azul} />
              <View style={{ flex: 1 }}>
                <Text style={fonte.subtitulo}>{d.nome}</Text>
                <Text style={fonte.pequeno}>Sinal: {d.rssi ?? '—'} dBm</Text>
              </View>
              <Botao titulo="Conectar" onPress={() => conectar(d.id)} estilo={{ minHeight: 48, paddingHorizontal: 18 }} />
            </View>
          ))}
          {estado === 'desconectada' && dispositivos.length === 0 && (
            <Text style={fonte.suave}>Ligue a caixa, deixe o celular perto dela e toque em “Procurar a caixa”.</Text>
          )}
        </>
      )}

      {conectada && (
        <>
          <Botao
            titulo="Enviar remédios para a caixa"
            icone="cloud-upload-outline"
            desabilitado={medicamentos.length === 0}
            onPress={async () => {
              const ok = await sincronizarMedicamentos(medicamentos);
              Alert.alert(ok ? 'Pronto!' : 'Ops', ok ? 'Agenda enviada para a caixa.' : 'Não consegui enviar.');
            }}
          />
          <Botao titulo="Atualizar hora da caixa" icone="time-outline" variante="secundario" onPress={enviarHora} />
          <Botao titulo="Desconectar" variante="fantasma" onPress={desconectar} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: raio.card, padding: 20, gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  disp: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.branco, borderRadius: raio.card, padding: 14, borderWidth: 2, borderColor: colors.borda },
});
