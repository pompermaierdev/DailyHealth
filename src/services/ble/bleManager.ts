import { BleManager, Device } from 'react-native-ble-plx';
import { encode, decode } from 'base-64';
import { NOME_BLE, SERVICE_UUID, RX_UUID, TX_UUID, parseEvento, EventoCaixa } from './protocolo';

export interface DispositivoBLE {
  id: string;
  nome: string;
  rssi?: number | null;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

class CaixaBLE {
  private manager: BleManager | null = null;
  private device: Device | null = null;
  private ouvintesEvento = new Set<(e: EventoCaixa) => void>();
  private ouvintesDesconexao = new Set<() => void>();
  private timerScan: ReturnType<typeof setTimeout> | null = null;

  private get m(): BleManager {
    if (!this.manager) this.manager = new BleManager();
    return this.manager;
  }

  get conectado() {
    return this.device !== null;
  }

  aoReceber(fn: (e: EventoCaixa) => void) {
    this.ouvintesEvento.add(fn);
    return () => this.ouvintesEvento.delete(fn);
  }

  aoDesconectar(fn: () => void) {
    this.ouvintesDesconexao.add(fn);
    return () => this.ouvintesDesconexao.delete(fn);
  }

  async bluetoothLigado(): Promise<boolean> {
    const estado = await this.m.state();
    if (estado === 'PoweredOn') return true;
    return new Promise((resolve) => {
      const sub = this.m.onStateChange((s) => {
        if (s === 'PoweredOn') {
          sub.remove();
          resolve(true);
        }
      }, true);
      setTimeout(() => {
        sub.remove();
        resolve(false);
      }, 8000);
    });
  }

  escanear(aoAchar: (d: DispositivoBLE) => void, aoTerminar: () => void, duracaoMs = 10000) {
    this.pararScan();
    this.m.startDeviceScan(null, { allowDuplicates: false }, (erro, d) => {
      if (erro) {
        this.pararScan();
        aoTerminar();
        return;
      }
      if (!d) return;
      const nome = d.name ?? d.localName ?? '';
      const temServico = d.serviceUUIDs?.some((u) => u.toLowerCase() === SERVICE_UUID.toLowerCase());
      if (nome === NOME_BLE || temServico) aoAchar({ id: d.id, nome: nome || NOME_BLE, rssi: d.rssi });
    });
    this.timerScan = setTimeout(() => {
      this.pararScan();
      aoTerminar();
    }, duracaoMs);
  }

  pararScan() {
    if (this.timerScan) clearTimeout(this.timerScan);
    this.timerScan = null;
    this.m.stopDeviceScan();
  }

  async conectar(id: string) {
    this.pararScan();
    let d = await this.m.connectToDevice(id, { timeout: 10000 });
    d = await d.discoverAllServicesAndCharacteristics();
    try {
      d = await d.requestMTU(185); // comandos maiores que 20 bytes
    } catch {
      /* iOS ignora */
    }
    this.device = d;

    d.monitorCharacteristicForService(SERVICE_UUID, TX_UUID, (erro, c) => {
      if (erro || !c?.value) return;
      const texto = decode(c.value);
      this.ouvintesEvento.forEach((f) => f(parseEvento(texto)));
    });

    d.onDisconnected(() => {
      this.device = null;
      this.ouvintesDesconexao.forEach((f) => f());
    });
  }

  async enviar(texto: string) {
    if (!this.device) throw new Error('Caixa não conectada');
    await this.device.writeCharacteristicWithResponseForService(SERVICE_UUID, RX_UUID, encode(texto));
  }

  async enviarVarios(textos: string[], intervaloMs = 200) {
    for (const t of textos) {
      await this.enviar(t);
      await esperar(intervaloMs);
    }
  }

  async desconectar() {
    if (this.device) {
      try {
        await this.device.cancelConnection();
      } catch {
        /* já desconectou */
      }
      this.device = null;
    }
  }
}

export const caixaBLE = new CaixaBLE();
