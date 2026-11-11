# DailyHealth (DH) — app da caixa de remédios

## 1. Criar o projeto
```
npx create-expo-app@latest caixa-remedios
cd caixa-remedios
npm run reset-project
```
Depois copie as pastas `app/` e `src/` deste pacote para dentro do projeto (substituindo as do template).

## 2. Bibliotecas
```
npx expo install expo-dev-client react-native-ble-plx react-native-svg @react-native-async-storage/async-storage expo-image-picker expo-notifications expo-status-bar react-native-safe-area-context
npm install base-64
npm install -D @types/base-64
```

## 3. app.json
```json
{
  "expo": {
    "name": "DailyHealth",
    "slug": "dailyhealth",
    "scheme": "dailyhealth",
    "android": { "package": "com.dailyhealth.app" },
    "plugins": [
      "expo-router",
      ["react-native-ble-plx", { "bluetoothAlwaysPermission": "O DailyHealth usa Bluetooth para falar com a sua caixa de remédios." }],
      ["expo-image-picker", { "photosPermission": "Escolher a foto do medicamento", "cameraPermission": "Tirar a foto do medicamento" }],
      ["expo-notifications", { "color": "#FF6B8F" }]
    ]
  }
}
```
Mantenha os outros campos que o template já criou (icon, splash etc.).

## 4. Rodar no celular Android (BLE não funciona no Expo Go)
```
npx expo run:android          # 1ª vez: compila o app de desenvolvimento
npx expo start --dev-client   # nas próximas
```

## 5. Testar o Bluetooth
1. Grave `caixa_remedios.ino` no ESP32 (USE_BLE 1, buzzer no GPIO 23).
2. App: Criar conta, aba Perfil, "Minha caixa", Procurar, Conectar.
3. Cadastre um remédio com horário do próximo minuto. Ele vai para a caixa, o LED acende, a tela "Hora do remédio!" abre no celular e você toca em "Sim, tomei".

## Mensagens entre caixa e app
| Caixa -> app | Significado |
|---|---|
| ALARME;slot;HH:MM | alarme disparou (o app abre a tela de confirmação) |
| TOMOU;slot;HH:MM | confirmado com "Sim, tomei" |
| PERDEU;slot;HH:MM | "Não tomei" ou 2 min sem resposta |

| App -> caixa | Significado |
|---|---|
| T;epoch | acerta a hora (enviado ao conectar) |
| A;slot;H;M;qtd;nome | cadastra horário |
| L | limpa a agenda |
| OK / NAO | confirma / nega a dose |

## Limitações atuais
- Login e dados são locais (AsyncStorage). Cuidador/responsável em outro celular exige Firebase (fase 2, ver src/services/firebase.ts).
- As notificações são locais (agendadas no celular): funcionam com o app fechado, mas o Bluetooth só conversa com a caixa com o app aberto.
