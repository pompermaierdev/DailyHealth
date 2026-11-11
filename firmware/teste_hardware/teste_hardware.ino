/*
 * TESTE DE HARDWARE - Caixa de Remédios (ESP32)
 * Testa: scanner I2C, display OLED, 4 LEDs e buzzer passivo.
 *
 * Bibliotecas: Adafruit SSD1306 e Adafruit GFX
 * Placa: "ESP32 Dev Module"  |  Monitor Serial: 115200
 *
 * Ligações:
 *   LED 1..4  -> GPIO 21, 18, 19, 5  (cada um com resistor, cátodo no GND)
 *   Buzzer S  -> GPIO 23 (VCC no 3V3, GND no GND)
 *   OLED SDA  -> GPIO 25
 *   OLED SCL  -> GPIO 33
 *   OLED VCC  -> 3V3, GND -> GND
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const uint8_t PIN_LED[4] = {21, 18, 19, 5};
const uint8_t PIN_BUZZER = 23;
const uint8_t PIN_SDA = 25;
const uint8_t PIN_SCL = 33;

#define OLED_W 128
#define OLED_H 64
Adafruit_SSD1306 display(OLED_W, OLED_H, &Wire, -1);

bool displayOk = false;
uint8_t enderecoOled = 0x3C;

// ---------- utilidades ----------
void tela(const char *linha1, const char *linha2 = "", const char *linha3 = "") {
  Serial.print("[TELA] ");
  Serial.print(linha1);
  Serial.print(" | ");
  Serial.print(linha2);
  Serial.print(" | ");
  Serial.println(linha3);
  if (!displayOk) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 0);
  display.print(linha1);
  display.setTextSize(1);
  display.setCursor(0, 28);
  display.print(linha2);
  display.setCursor(0, 44);
  display.print(linha3);
  display.display();
}

void apagarLeds() {
  for (int i = 0; i < 4; i++) digitalWrite(PIN_LED[i], LOW);
}

// Procura dispositivos I2C e devolve o endereço do primeiro encontrado (0 se nenhum)
uint8_t scannerI2C() {
  Serial.println("Procurando dispositivos I2C...");
  uint8_t primeiro = 0;
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      Serial.print("  Achei dispositivo em 0x");
      Serial.println(a, HEX);
      if (!primeiro) primeiro = a;
    }
  }
  if (!primeiro) Serial.println("  NENHUM dispositivo I2C encontrado (confira SDA/SCL/VCC/GND).");
  return primeiro;
}

// ---------- testes ----------
void testeLeds() {
  Serial.println("== TESTE DOS LEDS ==");
  for (int i = 0; i < 4; i++) {
    apagarLeds();
    digitalWrite(PIN_LED[i], HIGH);
    char nome[16];
    snprintf(nome, sizeof(nome), "LED %d", i + 1);
    char pino[24];
    snprintf(pino, sizeof(pino), "GPIO %d aceso", PIN_LED[i]);
    tela(nome, pino, "Acendeu mesmo?");
    delay(1200);
  }
  apagarLeds();

  tela("LEDs", "Todos juntos", "");
  for (int v = 0; v < 3; v++) {
    for (int i = 0; i < 4; i++) digitalWrite(PIN_LED[i], HIGH);
    delay(300);
    apagarLeds();
    delay(300);
  }
}

void testeBuzzer() {
  Serial.println("== TESTE DO BUZZER ==");
  tela("BUZZER", "Notas subindo", "Ouviu?");
  const int notas[] = {523, 587, 659, 698, 784, 880, 988, 1047};  // Do ao Do
  for (int i = 0; i < 8; i++) {
    tone(PIN_BUZZER, notas[i]);
    delay(250);
  }
  noTone(PIN_BUZZER);
  delay(400);

  tela("BUZZER", "Alarme: bip bip", "");
  for (int i = 0; i < 4; i++) {
    tone(PIN_BUZZER, 1000);
    delay(300);
    noTone(PIN_BUZZER);
    delay(300);
  }
}

void testeDisplay() {
  Serial.println("== TESTE DO DISPLAY ==");
  if (!displayOk) {
    Serial.println("Display nao iniciou, pulando.");
    return;
  }
  // tela cheia (pixels todos acesos) para achar pixels mortos
  display.clearDisplay();
  display.fillRect(0, 0, OLED_W, OLED_H, SSD1306_WHITE);
  display.display();
  delay(800);

  // moldura + texto
  display.clearDisplay();
  display.drawRect(0, 0, OLED_W, OLED_H, SSD1306_WHITE);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(10, 8);
  display.print("DailyHealth");
  display.setTextSize(1);
  display.setCursor(10, 32);
  display.print("Display OK!");
  display.setCursor(10, 46);
  display.print("Linha 3 de texto");
  display.display();
  delay(1500);

  // tamanhos de fonte (o que vai aparecer pro idoso)
  display.clearDisplay();
  display.setTextSize(3);
  display.setCursor(10, 8);
  display.print("08:30");
  display.setTextSize(1);
  display.setCursor(0, 48);
  display.print("Prox 08:30 C1 x2");
  display.display();
  delay(1500);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== TESTE DE HARDWARE - CAIXA DE REMEDIOS ===");

  for (int i = 0; i < 4; i++) {
    pinMode(PIN_LED[i], OUTPUT);
    digitalWrite(PIN_LED[i], LOW);
  }
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  Wire.begin(PIN_SDA, PIN_SCL);
  uint8_t achado = scannerI2C();
  if (achado) enderecoOled = achado;

  displayOk = display.begin(SSD1306_SWITCHCAPVCC, enderecoOled);
  if (displayOk) {
    Serial.print("Display iniciado no endereco 0x");
    Serial.println(enderecoOled, HEX);
  } else {
    Serial.println("FALHA ao iniciar o display.");
  }
}

void loop() {
  testeDisplay();
  testeLeds();
  testeBuzzer();

  tela("Fim do ciclo", "Repetindo em 3 s", "");
  delay(3000);
}
