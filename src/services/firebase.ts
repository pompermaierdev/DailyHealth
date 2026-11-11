// FASE 2 (nuvem): login real, cuidador vendo a adesão em outro celular.
// Por enquanto o app funciona 100% local (AsyncStorage) para você poder
// demonstrar o Bluetooth sem depender de backend.
//
// Quando for ligar o Firebase:
//   npx expo install firebase
//   crie o projeto em console.firebase.google.com e cole a config abaixo.
//
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// const app = initializeApp({ apiKey: '...', authDomain: '...', projectId: '...' });
// export const auth = getAuth(app);
// export const db = getFirestore(app);
//
// Modelo sugerido no Firestore:
//   usuarios/{uid}                      -> perfil
//   pacientes/{pid}/medicamentos/{id}   -> Medicamento
//   pacientes/{pid}/eventos/{id}        -> EventoAdesao (o celular do idoso grava ao receber TOMOU/PERDEU)
//   pacientes/{pid}/vinculos/{uid}      -> responsáveis e cuidadores com acesso
export {};
