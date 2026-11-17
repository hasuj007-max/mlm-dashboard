// Sincronización con la nube. La app sigue funcionando con localStorage como
// siempre; este hook, cuando hay sesión de Google, mantiene una copia en
// Firestore y la fusiona con la de otros dispositivos.
//
// Seguridad de los datos (son 8 años de negocio reales):
// - Al entrar se LEE la nube antes de subir nada, siempre del servidor.
// - Si la lectura falla (sin internet), no se toca nada local ni remoto.
// - Un dispositivo vacío nunca borra la nube: solo baja.
// - Firebase se carga aparte (import dinámico) para no frenar el arranque.

import { useEffect, useRef, useState } from 'react'
import { fusionarMeses, fusionarObjeto } from './fusion'

const CLAVE_META = 'mlm-dashboard-sync-v1' // { uid, conocidos: [ids], tiempos: { extra: ms } }
const NOMBRES = ['seguimiento', 'actividad', 'arranque', 'mensajes']

function leerMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_META) || '{}')
    return { uid: m.uid || '', conocidos: Array.isArray(m.conocidos) ? m.conocidos : [], tiempos: m.tiempos || {} }
  } catch {
    return { uid: '', conocidos: [], tiempos: {} }
  }
}

/**
 * @param meses, setMeses        estado de los meses
 * @param extras                 { nombre: [valor, setValor] } de los 4 objetos
 * @param avisar                 toast de la app
 */
export function useNube({ meses, setMeses, extras, avisar }) {
  const [usuario, setUsuario] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | sin-sesion | sincronizando | al-dia | sin-conexion | error
  const [ultimaSync, setUltimaSync] = useState(null)

  const motor = useRef(null)
  const meta = useRef(leerMeta())
  const listo = useRef(false) // true cuando ya se fusionó con la nube en esta sesión
  const subidos = useRef(new Map()) // id de mes → `actualizado` que hay en la nube
  const jsonPrevio = useRef(Object.fromEntries(NOMBRES.map((n) => [n, JSON.stringify(extras[n][0])])))
  // Marca de "borrar todo" por objeto: evita que otro dispositivo resucite lo borrado.
  // Es pegajosa: se conserva en cada subida posterior.
  const reinicio = useRef({})
  const sincronizando = useRef(false)
  const vivo = useRef({ meses, extras })
  vivo.current = { meses, extras }

  const guardarMeta = () => localStorage.setItem(CLAVE_META, JSON.stringify(meta.current))
  const fallo = (e) => {
    console.error('[nube]', e)
    setEstado(e?.code === 'unavailable' || !navigator.onLine ? 'sin-conexion' : 'error')
  }

  /** Lee la nube, fusiona con lo local y deja los dos lados iguales */
  async function sincronizar(uid) {
    if (!motor.current || sincronizando.current) return
    sincronizando.current = true
    setEstado('sincronizando')
    try {
      const nube = await motor.current.leerNube(uid)
      const mismoUsuario = meta.current.uid === uid
      const local = vivo.current

      // Meses
      const f = fusionarMeses(local.meses, nube.meses, mismoUsuario ? meta.current.conocidos : [])
      await motor.current.escribirMeses(uid, f.subir, f.borrarEnNube)

      // Seguimiento, actividad, arranque y mensajes
      const aplicar = []
      for (const n of NOMBRES) {
        const [valor, setValor] = local.extras[n]
        const remoto = nube.extras[n]
        const tLocal = mismoUsuario ? meta.current.tiempos[n] || 0 : 0
        let res
        if (remoto && remoto.reinicio > tLocal) {
          // Se hizo "borrar todo" en otro dispositivo después de mi último cambio
          res = { datos: remoto.datos, cambioLocal: JSON.stringify(remoto.datos) !== JSON.stringify(valor), cambioNube: false }
        } else {
          res = fusionarObjeto(valor, tLocal, remoto?.datos, remoto?.actualizado)
        }
        const t = Math.max(tLocal, remoto?.actualizado || 0) || Date.now()
        reinicio.current[n] = Math.max(reinicio.current[n] || 0, remoto?.reinicio || 0)
        if (res.cambioNube) await motor.current.subirExtra(uid, n, res.datos, t, reinicio.current[n])
        meta.current.tiempos[n] = t
        if (res.cambioLocal) aplicar.push([n, setValor, res.datos])
      }

      // Aplicar a la app sin que eso dispare otra subida
      subidos.current = new Map(f.meses.map((m) => [m.id, m.actualizado || 0]))
      meta.current.uid = uid
      meta.current.conocidos = f.meses.map((m) => m.id)
      guardarMeta()
      for (const [n, setValor, datos] of aplicar) {
        jsonPrevio.current[n] = JSON.stringify(datos)
        setValor(datos)
      }
      const cambiaronMeses = JSON.stringify(f.meses) !== JSON.stringify(local.meses)
      if (cambiaronMeses) setMeses(f.meses)

      listo.current = true
      setUltimaSync(new Date())
      setEstado('al-dia')
      return { bajados: f.meses.length - local.meses.length, subidos: f.subir.length }
    } catch (e) {
      fallo(e)
      return null
    } finally {
      sincronizando.current = false
    }
  }

  // Cargar Firebase y escuchar la sesión
  useEffect(() => {
    let cancelar = () => {}
    let activo = true
    import('./motor.js')
      .then((m) => {
        if (!activo) return
        motor.current = m
        cancelar = m.escucharSesion(async (u) => {
          listo.current = false
          setUsuario(u)
          if (!u) { setEstado('sin-sesion'); return }
          const antes = vivo.current.meses.length
          const r = await sincronizar(u.uid)
          if (r && antes === 0 && r.bajados > 0) avisar(`✓ Se bajaron ${r.bajados} meses de tu nube`)
          else if (r && r.subidos > 0) avisar(`✓ ${r.subidos} ${r.subidos === 1 ? 'mes subido' : 'meses subidos'} a tu nube`)
        })
      })
      .catch((e) => { console.error('[nube]', e); if (activo) setEstado('error') })
    return () => { activo = false; cancelar() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al volver a la app o recuperar internet, volver a fusionar
  useEffect(() => {
    if (!usuario) return
    let ultima = Date.now()
    const revisar = () => {
      if (document.visibilityState !== 'visible' || Date.now() - ultima < 60000) return
      ultima = Date.now()
      sincronizar(usuario.uid)
    }
    const alConectar = () => { ultima = Date.now(); sincronizar(usuario.uid) }
    document.addEventListener('visibilitychange', revisar)
    window.addEventListener('online', alConectar)
    return () => {
      document.removeEventListener('visibilitychange', revisar)
      window.removeEventListener('online', alConectar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  // Subir los meses que cambian (ya fusionado con la nube)
  useEffect(() => {
    if (!listo.current || !usuario || !motor.current) return
    const ids = new Set(meses.map((m) => m.id))
    const subir = meses.filter((m) => subidos.current.get(m.id) !== (m.actualizado || 0))
    const borrar = [...subidos.current.keys()].filter((id) => !ids.has(id))
    if (subir.length === 0 && borrar.length === 0) return
    subidos.current = new Map(meses.map((m) => [m.id, m.actualizado || 0]))
    meta.current.conocidos = [...ids]
    guardarMeta()
    motor.current.escribirMeses(usuario.uid, subir, borrar).catch(fallo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meses, usuario])

  // Subir seguimiento, actividad, arranque y mensajes cuando cambian aquí
  const valores = NOMBRES.map((n) => extras[n][0])
  useEffect(() => {
    NOMBRES.forEach((n, i) => {
      const json = JSON.stringify(valores[i])
      if (json === jsonPrevio.current[n]) return
      jsonPrevio.current[n] = json
      const t = Date.now()
      meta.current.tiempos[n] = t
      guardarMeta()
      if (listo.current && usuario && motor.current) {
        motor.current.subirExtra(usuario.uid, n, valores[i], t, reinicio.current[n] || 0).catch(fallo)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, valores.concat(usuario))

  return {
    usuario,
    estadoNube: estado,
    ultimaSync,
    entrarConGoogle: () => {
      if (!motor.current) { avisar('Aún se está cargando la conexión. Intenta de nuevo.', 'error'); return }
      motor.current.entrar().catch((e) => {
        console.error('[nube]', e)
        avisar(e?.code === 'auth/unauthorized-domain'
          ? 'Esta dirección no está autorizada para entrar con Google.'
          : 'No se pudo entrar con Google. Intenta de nuevo.', 'error')
      })
    },
    salirDeNube: () => motor.current?.salir(),
    sincronizarAhora: () => usuario && sincronizar(usuario.uid),
    /** Llamar justo antes de "borrar todo" para que el borrado se respete en los demás dispositivos */
    marcarReinicio: () => { const t = Date.now(); for (const n of NOMBRES) reinicio.current[n] = t },
  }
}
