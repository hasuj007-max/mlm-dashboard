// Contexto global de la app: datos persistidos en localStorage (meses y
// seguimiento de inactivos), navegación entre páginas, tema claro/oscuro y
// notificaciones (toasts).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNube } from '../nube/useNube'
import { idDeMes, ordenarPorFecha, validarSeguimiento, validarActividad, validarArranque, fechaISO } from '../utils/calculos'

const CLAVE_DATOS = 'mlm-dashboard-datos-v1'
const CLAVE_TEMA = 'mlm-dashboard-tema'
const CLAVE_SEGUIMIENTO = 'mlm-dashboard-seguimiento-v1'
const CLAVE_MENSAJES = 'mlm-dashboard-mensajes-v1'
const CLAVE_ACTIVIDAD = 'mlm-dashboard-actividad-v1' // { 'AAAA-MM-DD': { invitaciones, presentaciones, seguimientos, inscritos } }
const CLAVE_ARRANQUE = 'mlm-dashboard-arranque-v1' // { claveDistribuidor: { inicio, pasos: { id: fecha } } }

/** Mensajes de WhatsApp por tipo de lista; {nombre} se cambia por el primer nombre */
export const MENSAJES_BASE = {
  nuevos: 'Hola {nombre}, ¿cómo te ha ido con tus productos? Quiero ayudarte a sacarles el mayor provecho. ¿Tienes 5 minutos para platicar?',
  caidos: 'Hola {nombre}, ¿cómo estás? Me acordé de ti. ¿Cómo te fue con tus productos? Cuéntame y vemos qué te conviene este mes.',
  casi: 'Hola {nombre}, vi que este mes te quedaste muy cerca de calificar. Te cuento qué te conviene pedir para lograrlo el próximo. ¿Te marco?',
  todos: 'Hola {nombre}, ¿cómo estás?',
}

// Nombres de páginas de versiones anteriores → [página, opción] de hoy
const ALIAS = {
  dashboard: ['resumen'],
  seguimiento: ['gente', 'caidos'],
  distribuidores: ['gente', 'todos'],
  historial: ['mas', 'historial'],
  reporte: ['mas', 'reporte'],
  configuracion: ['mas', 'ajustes'],
}

function cargarMensajes() {
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE_MENSAJES) || '{}')
    const limpios = {}
    for (const k of Object.keys(MENSAJES_BASE)) {
      if (typeof guardados[k] === 'string' && guardados[k].trim()) limpios[k] = guardados[k]
    }
    return { ...MENSAJES_BASE, ...limpios }
  } catch {
    return { ...MENSAJES_BASE }
  }
}

const AppContext = createContext(null)

/** Lee los meses guardados; si el almacenamiento está corrupto, empieza vacío */
function cargarMeses() {
  try {
    const crudo = localStorage.getItem(CLAVE_DATOS)
    if (!crudo) return []
    const datos = JSON.parse(crudo)
    if (!Array.isArray(datos.meses)) return []
    // Normalizar el id por si el respaldo viene de una versión sin él
    return datos.meses.map((m) => ({ ...m, id: m.id || idDeMes(m.anio, m.mes) }))
  } catch {
    return []
  }
}

/** Lee el seguimiento guardado: { claveDistribuidor: { estado, nota, telefono, mes, fecha } } */
function cargarSeguimiento() {
  try {
    return validarSeguimiento(JSON.parse(localStorage.getItem(CLAVE_SEGUIMIENTO) || '{}')) || {}
  } catch {
    return {}
  }
}

/** Lee un objeto guardado y lo pasa por su validador; si falla, empieza vacío */
function cargarObjeto(clave, validar) {
  try {
    return validar(JSON.parse(localStorage.getItem(clave) || '{}')) || {}
  } catch {
    return {}
  }
}

export function AppProvider({ children }) {
  const [meses, setMeses] = useState(cargarMeses)
  const [seguimiento, setSeguimiento] = useState(cargarSeguimiento)
  const [pagina, setPagina] = useState('resumen')
  const [opcion, setOpcion] = useState(null) // pestaña a abrir dentro de la página
  const [mensajes, setMensajes] = useState(cargarMensajes)
  const [actividad, setActividad] = useState(() => cargarObjeto(CLAVE_ACTIVIDAD, validarActividad))
  const [arranque, setArranque] = useState(() => cargarObjeto(CLAVE_ARRANQUE, validarArranque))
  const [editandoId, setEditandoId] = useState(null) // mes que se edita en Captura
  const [tema, setTema] = useState(() => localStorage.getItem(CLAVE_TEMA) || 'oscuro')
  const [toast, setToast] = useState(null)

  // Persistir datos y tema
  useEffect(() => {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify({ version: 1, meses }))
  }, [meses])

  useEffect(() => {
    localStorage.setItem(CLAVE_SEGUIMIENTO, JSON.stringify(seguimiento))
  }, [seguimiento])

  useEffect(() => {
    localStorage.setItem(CLAVE_MENSAJES, JSON.stringify(mensajes))
  }, [mensajes])

  useEffect(() => {
    localStorage.setItem(CLAVE_ACTIVIDAD, JSON.stringify(actividad))
  }, [actividad])

  useEffect(() => {
    localStorage.setItem(CLAVE_ARRANQUE, JSON.stringify(arranque))
  }, [arranque])

  useEffect(() => {
    localStorage.setItem(CLAVE_TEMA, tema)
    document.documentElement.dataset.tema = tema
  }, [tema])

  /** true mientras no se ha capturado ningún mes */
  const sinDatos = meses.length === 0

  /** Muestra una notificación temporal */
  function avisar(mensaje, tipo = 'exito') {
    setToast({ mensaje, tipo, id: Date.now() })
    setTimeout(() => setToast(null), 3500)
  }

  /** Guarda un mes nuevo o reemplaza el que se está editando */
  function guardarMes(registro, idAnterior = null) {
    const id = idDeMes(registro.anio, registro.mes)
    setMeses((previos) => {
      const sinAnterior = previos.filter((m) => m.id !== idAnterior && m.id !== id)
      return ordenarPorFecha([...sinAnterior, { ...registro, id, actualizado: Date.now() }])
    })
  }

  /** ¿Ya existe un registro para ese año/mes? (ignorando el que se edita) */
  function existeMes(anio, mes, ignorarId = null) {
    const id = idDeMes(anio, mes)
    return meses.some((m) => m.id === id && m.id !== ignorarId)
  }

  function eliminarMes(id) {
    setMeses((previos) => previos.filter((m) => m.id !== id))
  }

  /** Reemplaza todos los datos (importación de respaldo ya validada) */
  function reemplazarTodo(nuevosMeses) {
    const ahora = Date.now() // lo importado gana sobre lo que haya en la nube
    setMeses(ordenarPorFecha(nuevosMeses.map((m) => ({ ...m, actualizado: ahora }))))
  }

  /** Cambia el seguimiento de una persona (estado, nota o teléfono) */
  function actualizarSeguimiento(clave, cambios) {
    setSeguimiento((previo) => ({
      ...previo,
      [clave]: { estado: 'pendiente', nota: '', telefono: '', mes: '', fecha: '', ...previo[clave], ...cambios },
    }))
  }

  /** Suma (o resta) uno a un contador de actividad de un día; nunca baja de cero */
  function registrarActividad(campo, delta, fecha = fechaISO()) {
    setActividad((previa) => {
      const dia = { ...previa[fecha] }
      dia[campo] = Math.max(0, (dia[campo] || 0) + delta)
      return { ...previa, [fecha]: dia }
    })
  }

  /** Marca o desmarca un paso del arranque de un nuevo */
  function marcarPaso(clave, paso, hecho) {
    setArranque((previo) => {
      const r = previo[clave] || { inicio: '', pasos: {} }
      const pasos = { ...r.pasos }
      if (hecho) pasos[paso] = fechaISO()
      else delete pasos[paso]
      return { ...previo, [clave]: { ...r, pasos } }
    })
  }

  /** Guarda la fecha en que se inscribió un nuevo (para saber qué día toca cada paso) */
  function fijarInicio(clave, inicio) {
    setArranque((previo) => ({ ...previo, [clave]: { pasos: {}, ...previo[clave], inicio } }))
  }

  // Copia en la nube (solo si hay sesión de Google)
  const nube = useNube({
    meses, setMeses, avisar,
    extras: {
      seguimiento: [seguimiento, setSeguimiento],
      actividad: [actividad, setActividad],
      arranque: [arranque, setArranque],
      mensajes: [mensajes, setMensajes],
    },
  })

  /** Nombres de distribuidores usados en cualquier mes (para autocompletar) */
  const nombresConocidos = useMemo(() => {
    const nombres = new Set()
    for (const m of meses) for (const d of m.distribuidores || []) nombres.add(d.nombre)
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'))
  }, [meses])

  /** Navega a una página; a Captura se le puede pasar un mes a editar y a las demás una pestaña */
  function navegar(destino, idAEditar = null, opcionDestino = null) {
    const [real, opcionAlias] = ALIAS[destino] || [destino]
    setEditandoId(idAEditar)
    setOpcion(opcionDestino || opcionAlias || null)
    setPagina(real)
    window.scrollTo(0, 0)
  }

  const valor = {
    meses, sinDatos,
    pagina, opcion, navegar, editandoId,
    mensajes, guardarMensaje: (tipo, texto) => setMensajes((m) => ({ ...m, [tipo]: texto })),
    tema, setTema,
    toast, avisar,
    guardarMes, existeMes, eliminarMes, reemplazarTodo,
    seguimiento, actualizarSeguimiento, reemplazarSeguimiento: setSeguimiento,
    actividad, registrarActividad, reemplazarActividad: setActividad,
    arranque, marcarPaso, fijarInicio, reemplazarArranque: setArranque,
    reemplazarMensajes: (m) => setMensajes({ ...MENSAJES_BASE, ...m }),
    ...nube,
    nombresConocidos,
  }

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
