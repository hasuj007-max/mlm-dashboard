// Entrada/salida con Firebase: sesión de Google y lectura/escritura en
// Firestore. Sin lógica de negocio: la fusión vive en fusion.js y quien decide
// qué subir es AppContext.
//
// Estructura en la nube:
//   usuarios/{uid}/meses/{AAAA-MM}   → el mes tal cual (con `actualizado`)
//   usuarios/{uid}/extras/{nombre}   → { json, actualizado, reinicio }
//     nombre = seguimiento | actividad | arranque | mensajes

import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth'
import {
  collection, doc, getDocsFromServer, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore'
import { auth, db, proveedorGoogle } from './firebase'

export const EXTRAS = ['seguimiento', 'actividad', 'arranque', 'mensajes']

/** Avisa cada vez que cambia la sesión: cb(usuario | null) */
export function escucharSesion(cb) {
  getRedirectResult(auth).catch(() => {}) // completa un login por redirección, si lo hubo
  return onAuthStateChanged(auth, (u) =>
    cb(u ? { uid: u.uid, nombre: u.displayName || '', correo: u.email || '' } : null)
  )
}

/**
 * Abre el login de Google. Debe llamarse directo desde el toque, sin esperas
 * antes, o el navegador bloquea la ventana. Si la bloquea, usa redirección.
 */
export async function entrar() {
  try {
    await signInWithPopup(auth, proveedorGoogle)
  } catch (e) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, proveedorGoogle)
      return
    }
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return
    throw e
  }
}

export function salir() {
  return signOut(auth)
}

/** Sin campos undefined (Firestore los rechaza) */
const limpio = (obj) => JSON.parse(JSON.stringify(obj))

/**
 * Lee TODO del servidor (nunca de la caché: si no hay internet, falla y no se
 * toca nada). Devuelve { meses, extras: { nombre: { datos, actualizado, reinicio } } }.
 */
export async function leerNube(uid) {
  const [snapMeses, snapExtras] = await Promise.all([
    getDocsFromServer(collection(db, 'usuarios', uid, 'meses')),
    getDocsFromServer(collection(db, 'usuarios', uid, 'extras')),
  ])
  const meses = snapMeses.docs.map((d) => ({ ...d.data(), id: d.id }))
  const extras = {}
  for (const d of snapExtras.docs) {
    const v = d.data()
    let datos = {}
    try { datos = JSON.parse(v.json || '{}') } catch { datos = {} }
    extras[d.id] = { datos, actualizado: v.actualizado || 0, reinicio: v.reinicio || 0 }
  }
  return { meses, extras }
}

/** Sube varios meses y borra otros, en lotes (Firestore admite 500 por lote) */
export async function escribirMeses(uid, subir, borrar = []) {
  const ops = [
    ...subir.map((m) => ['set', m.id, limpio(m)]),
    ...borrar.map((id) => ['del', id]),
  ]
  for (let i = 0; i < ops.length; i += 400) {
    const lote = writeBatch(db)
    for (const [tipo, id, datos] of ops.slice(i, i + 400)) {
      const ref = doc(db, 'usuarios', uid, 'meses', id)
      if (tipo === 'set') lote.set(ref, datos)
      else lote.delete(ref)
    }
    await lote.commit()
  }
}

export function subirMes(uid, mes) {
  return setDoc(doc(db, 'usuarios', uid, 'meses', mes.id), limpio(mes))
}

export function borrarMes(uid, id) {
  return deleteDoc(doc(db, 'usuarios', uid, 'meses', id))
}

export function subirExtra(uid, nombre, datos, actualizado, reinicio = 0) {
  return setDoc(doc(db, 'usuarios', uid, 'extras', nombre), {
    json: JSON.stringify(datos || {}), actualizado, reinicio,
  })
}
