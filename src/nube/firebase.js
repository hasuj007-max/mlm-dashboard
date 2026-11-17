// Conexión con Firebase (proyecto "Mi Red"). Estos valores identifican al
// proyecto y son públicos por diseño: lo que protege los datos son las reglas
// de Firestore (firestore.rules), no esta configuración.

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyAsrMAQbPz1b1fZ2O2-NHcLKrrEzPPSmag',
  authDomain: 'mi-red-hasuj.firebaseapp.com',
  projectId: 'mi-red-hasuj',
  storageBucket: 'mi-red-hasuj.firebasestorage.app',
  messagingSenderId: '31970600013',
  appId: '1:31970600013:web:9cf6ff838bea112d16e804',
})

export const auth = getAuth(app)
export const proveedorGoogle = new GoogleAuthProvider()

// Caché persistente: lo que se guarda sin internet se sube solo al volver la señal
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
