// Contexto global de la app: datos persistidos en localStorage, navegación
// entre páginas, tema claro/oscuro y notificaciones (toasts).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { idDeMes, ordenarPorFecha } from '../utils/calculos'
import { DATOS_DEMO } from '../data/demo'

const CLAVE_DATOS = 'mlm-dashboard-datos-v1'
const CLAVE_TEMA = 'mlm-dashboard-tema'

const AppContext = createContext(null)

/** Lee los meses guardados; si el almacenamiento está corrupto, empieza vacío */
function cargarMeses() {
  try {
    const crudo = localStorage.getItem(CLAVE_DATOS)
    if (!crudo) return []
    const datos = JSON.parse(crudo)
    return Array.isArray(datos.meses) ? datos.meses : []
  } catch {
    return []
  }
}

export function AppProvider({ children }) {
  const [meses, setMeses] = useState(cargarMeses)
  const [pagina, setPagina] = useState('inicio')
  const [editandoId, setEditandoId] = useState(null) // mes que se edita en Captura
  const [tema, setTema] = useState(() => localStorage.getItem(CLAVE_TEMA) || 'oscuro')
  const [toast, setToast] = useState(null)

  // Persistir datos y tema
  useEffect(() => {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify({ version: 1, meses }))
  }, [meses])

  useEffect(() => {
    localStorage.setItem(CLAVE_TEMA, tema)
    document.documentElement.dataset.tema = tema
  }, [tema])

  /** true mientras no hay datos reales: el dashboard muestra el demo */
  const esDemo = meses.length === 0
  const mesesVisibles = esDemo ? DATOS_DEMO : meses

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
      return ordenarPorFecha([...sinAnterior, { ...registro, id }])
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
    setMeses(ordenarPorFecha(nuevosMeses))
  }

  /** Nombres de distribuidores usados en cualquier mes (para autocompletar) */
  const nombresConocidos = useMemo(() => {
    const nombres = new Set()
    for (const m of meses) for (const d of m.distribuidores || []) nombres.add(d.nombre)
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'))
  }, [meses])

  /** Navega a una página; al ir a Captura se puede pasar un mes a editar */
  function navegar(destino, idAEditar = null) {
    setEditandoId(idAEditar)
    setPagina(destino)
    window.scrollTo(0, 0)
  }

  const valor = {
    meses, mesesVisibles, esDemo,
    pagina, navegar, editandoId,
    tema, setTema,
    toast, avisar,
    guardarMes, existeMes, eliminarMes, reemplazarTodo,
    nombresConocidos,
  }

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
