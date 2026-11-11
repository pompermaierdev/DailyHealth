/*
 * CAIXA DE REMÉDIOS INTELIGENTE - ESP32
 * - 4 compartimentos (1 LED cada), buzzer passivo, display OLED SSD1306 (I2C)
 * - Bluetooth BLE (serviço UART tipo Nordic) para falar com o app
 * - Agenda salva na flash (Preferences); a hora vem do app (sem RTC)
 *
 * COMPORTAMENTO DO ALARME (por dose):
 *   hora certa -> LED do compartimento acende + buzzer toca por 5 min
 *   depois de 5 min -> buzzer para, LED continua aceso
 *   se em 2 h ninguém confirmar no app -> LED apaga e envia EXPIROU
 *   "Sim, tomei"  (OK)  -> LED apaga na hora
 *   "Não tomei ainda" (NAO) -> buzzer para, LED continua aceso
 *
 * No Wokwi: USE_BLE 0 e digite os comandos no Monitor Serial.
 *
 * Comandos (texto, separado por ';'):
 *   T;epoch                      -> define hora (epoch já no horário local)
 *   A;slot;HH;MM;qtd;nome        -> cadastra alarme (slot 1..4)
 *   L                            -> limpa a agenda
 *   OK[;slot;HH:MM]              -> tomou (sem parâmetros: a dose pendente mais antiga)
 *   NAO[;slot;HH:MM]             -> não tomou ainda (silencia o buzzer)
 * Eventos enviados ao app:
 *   ALARME;slot;HH:MM | TOMOU;slot;HH:MM | ADIADO;slot;HH:MM | EXPIROU;slot;HH:MM
 *   HORA_OK | ALARME_OK | LIMPO | ERRO;motivo
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Preferences.h>
#include <time.h>
#include <sys/time.h>

#define USE_BLE 1   // 0 no Wokwi, 1 na placa real

#if USE_BLE
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#endif

// ======== PINOS ========
const uint8_t PIN_LED[4] = {21, 18, 19, 5};
const uint8_t PIN_BUZZER = 23;
const uint8_t PIN_SDA    = 25;
const uint8_t PIN_SCL    = 33;
// =======================

#define OLED_W 128
#define OLED_H 64
#define OLED_ADDR 0x3C
Adafruit_SSD1306 display(OLED_W, OLED_H, &Wire, -1);

#define NOME_BLE "CaixaRemedios"
#define SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define RX_UUID      "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"  // app -> ESP32
#define TX_UUID      "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // ESP32 -> app

#define MAX_ALARMES 16
#define MAX_PEND 8
#define TEMPO_BUZZER_MS (5UL * 60UL * 1000UL)          // som por 5 min
#define TEMPO_LED_MS    (2UL * 60UL * 60UL * 1000UL)   // LED por até 2 h

struct Alarme {
  uint8_t ativo;
  uint8_t slot;    // 1..4
  uint8_t hora;
  uint8_t minuto;
  uint8_t qtd;
  char nome[16];
};

// dose que já disparou e ainda espera confirmação (guarda cópia dos dados)
struct Pend {
  bool ativa;
  bool buzzer;
  unsigned long inicio;
  uint8_t slot, hora, minuto, qtd;
  char nome[16];
};

Alarme alarmes[MAX_ALARMES];
long ultimoDisparo[MAX_ALARMES];
Pend pend[MAX_PEND];
Preferences prefs;

bool horaValida = false;
bool bleConectado = false;
bool buzzerLigado = false;

unsigned long ultimoDisplay = 0;
unsigned long ultimoCheck = 0;

#if USE_BLE
BLECharacteristic *txChar = nullptr;
#endif

// ---------- utilidades ----------
void enviar(const String &s) {
  Serial.println(s);
#if USE_BLE
  if (bleConectado && txChar) {
    txChar->setValue((uint8_t *)s.c_str(), s.length());
    txChar->notify();
  }
#endif
}

String hhmm(int h, int m) {
  char b[6];
  snprintf(b, sizeof(b), "%02d:%02d", h, m);
  return String(b);
}

void salvarAlarmes() { prefs.putBytes("alarmes", alarmes, sizeof(alarmes)); }

void carregarAlarmes() {
  memset(alarmes, 0, sizeof(alarmes));
  if (prefs.isKey("alarmes")) prefs.getBytes("alarmes", alarmes, sizeof(alarmes));
  for (int i = 0; i < MAX_ALARMES; i++) ultimoDisparo[i] = -1;
}

bool pegarHora(struct tm &t) {
  if (!horaValida) return false;
  time_t agora = time(nullptr);
  gmtime_r(&agora, &t);  // o app já manda o horário local
  return true;
}

// ---------- doses pendentes ----------
int pendenteMaisAntiga() {
  int idx = -1;
  unsigned long maior = 0;
  for (int i = 0; i < MAX_PEND; i++) {
    if (!pend[i].ativa) continue;
    unsigned long dec = millis() - pend[i].inicio;
    if (idx < 0 || dec >= maior) { idx = i; maior = dec; }
  }
  return idx;
}

int contarPendentes() {
  int n = 0;
  for (int i = 0; i < MAX_PEND; i++) if (pend[i].ativa) n++;
  return n;
}

int acharPendente(const String &pSlot, const String &pHora, bool temParams) {
  if (!temParams) return pendenteMaisAntiga();
  int slot = pSlot.toInt();
  for (int i = 0; i < MAX_PEND; i++) {
    if (pend[i].ativa && pend[i].slot == slot && hhmm(pend[i].hora, pend[i].minuto) == pHora) return i;
  }
  return -1;
}

// liga/desliga LEDs e buzzer conforme as doses pendentes
void atualizarSaidas() {
  bool ledOn[4] = {false, false, false, false};
  bool som = false;
  for (int i = 0; i < MAX_PEND; i++) {
    if (!pend[i].ativa) continue;
    if (pend[i].slot >= 1 && pend[i].slot <= 4) ledOn[pend[i].slot - 1] = true;
    if (pend[i].buzzer) som = true;
  }
  for (int s = 0; s < 4; s++) digitalWrite(PIN_LED[s], ledOn[s] ? HIGH : LOW);

  if (som) {
    bool ligar = ((millis() / 300) % 2) == 0;  // bip 300 ms / pausa 300 ms
    if (ligar != buzzerLigado) {
      buzzerLigado = ligar;
      if (ligar) tone(PIN_BUZZER, 1000);
      else noTone(PIN_BUZZER);
    }
  } else if (buzzerLigado) {
    noTone(PIN_BUZZER);
    buzzerLigado = false;
  }
}

// após 5 min o som para; após 2 h o LED apaga
void atualizarTimers() {
  for (int i = 0; i < MAX_PEND; i++) {
    if (!pend[i].ativa) continue;
    unsigned long dec = millis() - pend[i].inicio;
    if (pend[i].buzzer && dec > TEMPO_BUZZER_MS) pend[i].buzzer = false;
    if (dec > TEMPO_LED_MS) {
      enviar("EXPIROU;" + String(pend[i].slot) + ";" + hhmm(pend[i].hora, pend[i].minuto));
      pend[i].ativa = false;
    }
  }
}

void verificarAlarmes() {
  struct tm t;
  if (!pegarHora(t)) return;
  long chave = (long)t.tm_yday * 1440L + t.tm_hour * 60 + t.tm_min;

  for (int i = 0; i < MAX_ALARMES; i++) {
    Alarme &a = alarmes[i];
    if (!a.ativo || a.hora != t.tm_hour || a.minuto != t.tm_min || ultimoDisparo[i] == chave) continue;
    ultimoDisparo[i] = chave;

    int livre = -1;
    bool dup = false;
    for (int p = 0; p < MAX_PEND; p++) {
      if (!pend[p].ativa && livre < 0) livre = p;
      if (pend[p].ativa && pend[p].slot == a.slot && pend[p].hora == a.hora && pend[p].minuto == a.minuto) dup = true;
    }
    if (livre < 0 || dup) continue;

    Pend &q = pend[livre];
    q.ativa = true;
    q.buzzer = true;
    q.inicio = millis();
    q.slot = a.slot; q.hora = a.hora; q.minuto = a.minuto; q.qtd = a.qtd;
    memcpy(q.nome, a.nome, sizeof(q.nome));
    enviar("ALARME;" + String(a.slot) + ";" + hhmm(a.hora, a.minuto));
  }
}

// ---------- comandos (serial ou BLE) ----------
void processar(String s) {
  s.trim();
  if (s.length() == 0) return;

  String p[6];
  int n = 0, ini = 0;
  for (int i = 0; i <= (int)s.length() && n < 6; i++) {
    if (i == (int)s.length() || s[i] == ';') {
      p[n++] = s.substring(ini, i);
      ini = i + 1;
    }
  }
  String cmd = p[0];
  cmd.toUpperCase();

  if (cmd == "T" && n >= 2) {
    struct timeval tv;
    tv.tv_sec = (time_t)strtoul(p[1].c_str(), nullptr, 10);
    tv.tv_usec = 0;
    settimeofday(&tv, nullptr);
    horaValida = true;
    enviar("HORA_OK");

  } else if (cmd == "A" && n >= 5) {
    int slot = p[1].toInt(), h = p[2].toInt(), m = p[3].toInt(), q = p[4].toInt();
    if (slot < 1 || slot > 4 || h < 0 || h > 23 || m < 0 || m > 59) { enviar("ERRO;dados"); return; }
    int livre = -1;
    for (int i = 0; i < MAX_ALARMES; i++) if (!alarmes[i].ativo) { livre = i; break; }
    if (livre < 0) { enviar("ERRO;lotado"); return; }
    alarmes[livre].ativo = 1;
    alarmes[livre].slot = slot;
    alarmes[livre].hora = h;
    alarmes[livre].minuto = m;
    alarmes[livre].qtd = q;
    String nome = (n >= 6) ? p[5] : String("Remedio");
    memset(alarmes[livre].nome, 0, sizeof(alarmes[livre].nome));
    strncpy(alarmes[livre].nome, nome.c_str(), sizeof(alarmes[livre].nome) - 1);
    ultimoDisparo[livre] = -1;
    salvarAlarmes();
    enviar("ALARME_OK");

  } else if (cmd == "L") {
    memset(alarmes, 0, sizeof(alarmes));  // limpa só a agenda; doses pendentes continuam
    salvarAlarmes();
    enviar("LIMPO");

  } else if (cmd == "OK" || cmd == "TOMEI") {
    int i = acharPendente(p[1], p[2], n >= 3);
    if (i >= 0) {
      enviar("TOMOU;" + String(pend[i].slot) + ";" + hhmm(pend[i].hora, pend[i].minuto));
      pend[i].ativa = false;
      atualizarSaidas();
    }

  } else if (cmd == "NAO") {
    int i = acharPendente(p[1], p[2], n >= 3);
    if (i >= 0) {
      pend[i].buzzer = false;  // silencia; o LED continua aceso
      enviar("ADIADO;" + String(pend[i].slot) + ";" + hhmm(pend[i].hora, pend[i].minuto));
      atualizarSaidas();
    }

  } else {
    enviar("ERRO;comando");
  }
}

// ---------- BLE ----------
#if USE_BLE
class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer *s) { bleConectado = true; }
  void onDisconnect(BLEServer *s) {
    bleConectado = false;
    BLEDevice::startAdvertising();
  }
};

class RxCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) {
    auto v = c->getValue();
    String s = String(v.c_str());
    processar(s);
  }
};

void iniciarBLE() {
  BLEDevice::init(NOME_BLE);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  BLEService *svc = server->createService(SERVICE_UUID);

  txChar = svc->createCharacteristic(TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  txChar->addDescriptor(new BLE2902());

  BLECharacteristic *rx = svc->createCharacteristic(
      RX_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  rx->setCallbacks(new RxCB());

  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
}
#endif

// ---------- display ----------
void desenharDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  int idx = pendenteMaisAntiga();
  if (idx >= 0) {
    Pend &a = pend[idx];
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.print("TOME AGORA");
    display.setTextSize(1);
    display.setCursor(0, 24);
    display.print("Compartimento: ");
    display.print(a.slot);
    display.setCursor(0, 36);
    display.print("Quantidade: ");
    display.print(a.qtd);
    display.setCursor(0, 48);
    display.print(a.nome);
    int extra = contarPendentes() - 1;
    if (extra > 0) {
      display.setCursor(104, 48);
      display.print("+");
      display.print(extra);
    }
    display.display();
    return;
  }

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(bleConectado ? "BT: CONECTADO" : "BT: aguardando");

  struct tm t;
  if (!pegarHora(t)) {
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.print("Sem hora");
    display.setTextSize(1);
    display.setCursor(0, 44);
    display.print("Abra o app");
    display.display();
    return;
  }

  display.setTextSize(3);
  display.setCursor(10, 16);
  display.print(hhmm(t.tm_hour, t.tm_min));

  int agoraMin = t.tm_hour * 60 + t.tm_min;
  int melhor = -1, melhorDif = 99999;
  for (int i = 0; i < MAX_ALARMES; i++) {
    if (!alarmes[i].ativo) continue;
    int dif = alarmes[i].hora * 60 + alarmes[i].minuto - agoraMin;
    if (dif <= 0) dif += 1440;
    if (dif < melhorDif) { melhorDif = dif; melhor = i; }
  }
  display.setTextSize(1);
  display.setCursor(0, 48);
  if (melhor >= 0) {
    display.print("Prox ");
    display.print(hhmm(alarmes[melhor].hora, alarmes[melhor].minuto));
    display.print(" C");
    display.print(alarmes[melhor].slot);
    display.print(" x");
    display.print(alarmes[melhor].qtd);
  } else {
    display.print("Sem alarmes");
  }
  display.display();
}

// ---------- setup / loop ----------
void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) {
    pinMode(PIN_LED[i], OUTPUT);
    digitalWrite(PIN_LED[i], LOW);
  }
  pinMode(PIN_BUZZER, OUTPUT);
  memset(pend, 0, sizeof(pend));

  Wire.begin(PIN_SDA, PIN_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) Serial.println("Display nao encontrado");
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Iniciando...");
  display.display();

  prefs.begin("caixa", false);
  carregarAlarmes();

#if USE_BLE
  iniciarBLE();
#endif

  for (int i = 0; i < 4; i++) {  // teste rápido dos LEDs e do buzzer
    digitalWrite(PIN_LED[i], HIGH);
    delay(150);
    digitalWrite(PIN_LED[i], LOW);
  }
  tone(PIN_BUZZER, 1500, 150);

  Serial.println("Caixa pronta. Comandos: T;epoch | A;slot;HH;MM;qtd;nome | L | OK | NAO");
}

void loop() {
  if (Serial.available()) {
    String linha = Serial.readStringUntil('\n');
    processar(linha);
  }

  if (millis() - ultimoCheck >= 1000) {
    ultimoCheck = millis();
    verificarAlarmes();
    atualizarTimers();
  }

  atualizarSaidas();

  if (millis() - ultimoDisplay >= 500) {
    ultimoDisplay = millis();
    desenharDisplay();
  }
}
