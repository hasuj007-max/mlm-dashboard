// Cálculos del negocio: ordenamiento cronológico, % de cambio y tendencia.
// Todos los cálculos comparan contra el mes anterior REGISTRADO (el inmediato
// en orden cronológico), por lo que funcionan aunque falten meses intermedios.

/** CV exacto con el que un distribuidor cuenta como inscripción nueva */
export const CV_INSCRIPCION = 30

/** ¿Este distribuidor es una inscripción nueva? (CV de exactamente 30 pts) */
export function esNuevo(distribuidor) {
  return Number(distribuidor?.volumen) === CV_INSCRIPCION
}

/** Cuántas inscripciones nuevas (30 pts) hay en una lista de distribuidores */
export function contarNuevos(distribuidores) {
  return (distribuidores || []).filter(esNuevo).length
}

/** Identificador cronológico de un mes, ej. "2026-05" */
export function idDeMes(anio, mes) {
  return `${anio}-${String(mes).padStart(2, '0')}`
}

/** Devuelve una copia de los meses ordenada del más antiguo al más reciente */
export function ordenarPorFecha(meses) {
  return [...meses].sort((a, b) =>
    idDeMes(a.anio, a.mes).localeCompare(idDeMes(b.anio, b.mes))
  )
}

/** Último mes registrado (el más reciente) o null si no hay datos */
export function mesMasReciente(meses) {
  const orden = ordenarPorFecha(meses)
  return orden.length ? orden[orden.length - 1] : null
}

/** Mes registrado inmediatamente anterior al dado, o null si es el primero */
export function mesAnterior(meses, registro) {
  if (!registro) return null
  const orden = ordenarPorFecha(meses)
  const indice = orden.findIndex((m) => m.id === registro.id)
  return indice > 0 ? orden[indice - 1] : null
}

/**
 * % de cambio entre dos valores. Devuelve null cuando no se puede calcular
 * (sin mes anterior o división entre cero) para que la UI muestre "—".
 */
export function cambioPct(actual, anterior) {
  if (anterior == null || anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

/**
 * Tendencia de los últimos 3 meses registrados según las ganancias:
 * 'creciendo' | 'estable' | 'descenso' | null (si hay menos de 2 meses).
 */
export function tendencia(meses) {
  const ultimos = ordenarPorFecha(meses).slice(-3)
  if (ultimos.length < 2) return null
  const primero = ultimos[0].ganancias
  const ultimo = ultimos[ultimos.length - 1].ganancias
  if (primero === 0) return ultimo > 0 ? 'creciendo' : 'estable'
  const pct = ((ultimo - primero) / primero) * 100
  if (pct > 3) return 'creciendo'
  if (pct < -3) return 'descenso'
  return 'estable'
}

/** Últimos N meses registrados en orden cronológico (para gráficas) */
export function ultimosMeses(meses, n) {
  return ordenarPorFecha(meses).slice(-n)
}

/** Distribuidores de un mes ordenados de mayor a menor volumen (ranking) */
export function ranking(registro) {
  if (!registro?.distribuidores) return []
  return [...registro.distribuidores].sort((a, b) => b.volumen - a.volumen)
}

/**
 * Clave única de un distribuidor: por ID si lo tiene, si no por nombre.
 * Permite agrupar a la misma persona a lo largo de los meses.
 */
export function claveDistribuidor(d) {
  const id = String(d.id ?? '').trim()
  return id ? `id:${id.toLowerCase()}` : `n:${d.nombre.trim().toLocaleLowerCase('es')}`
}

/** Conjunto de claves de distribuidores ACTIVOS (volumen > 0) en un mes */
function clavesActivas(registro) {
  const set = new Set()
  for (const d of registro?.distribuidores || []) {
    if (d.volumen > 0) set.add(claveDistribuidor(d))
  }
  return set
}

/**
 * Directorio histórico de distribuidores: agrupa todos los meses por
 * distribuidor (por ID si lo tiene, si no por nombre) y acumula su volumen
 * total. Devuelve la lista ordenada de mayor a menor volumen histórico.
 */
export function directorioDistribuidores(meses) {
  const mapa = new Map()
  for (const m of ordenarPorFecha(meses)) {
    for (const d of m.distribuidores || []) {
      const clave = claveDistribuidor(d)
      const id = String(d.id ?? '').trim()
      if (!mapa.has(clave)) {
        mapa.set(clave, { clave, id, nombre: d.nombre, total: 0, meses: [] })
      }
      const reg = mapa.get(clave)
      reg.nombre = d.nombre // siempre el nombre más reciente
      if (id) reg.id = id
      reg.total += d.volumen
      reg.meses.push({ anio: m.anio, mes: m.mes, volumen: d.volumen })
    }
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total)
}

/**
 * Actividad de la red mes a mes. Para cada mes calcula:
 * - activos: distribuidores con volumen > 0 ese mes
 * - nuevos: claves que aparecen activas por primera vez en la historia
 * - perdidos: claves que estaban activas el mes anterior y este mes ya no
 * - retenidos: claves activas que también lo estaban el mes anterior
 * - tasaRetencion: % de los activos del mes previo que siguen activos
 */
export function actividadPorMes(meses) {
  const orden = ordenarPorFecha(meses)
  const vistos = new Set()
  let previo = new Set()
  const resultado = []

  for (const m of orden) {
    const activos = clavesActivas(m)
    let nuevos = 0
    for (const k of activos) if (!vistos.has(k)) nuevos++
    let perdidos = 0
    for (const k of previo) if (!activos.has(k)) perdidos++
    let retenidos = 0
    for (const k of activos) if (previo.has(k)) retenidos++

    resultado.push({
      id: m.id, anio: m.anio, mes: m.mes,
      activos: activos.size,
      nuevos,
      perdidos,
      retenidos,
      tasaRetencion: previo.size ? (retenidos / previo.size) * 100 : null,
    })

    for (const k of activos) vistos.add(k)
    previo = activos
  }
  return resultado
}

/**
 * Distribuidores EN RIESGO: estuvieron activos en alguno de los últimos
 * `ventana` meses previos, pero NO en el último mes registrado.
 * Devuelve a quién reactivar, con su último volumen y mes activo.
 */
export function distribuidoresEnRiesgo(meses, ventana = 3) {
  const orden = ordenarPorFecha(meses)
  if (orden.length < 2) return []

  const ultimo = orden[orden.length - 1]
  const activosUltimo = clavesActivas(ultimo)
  const recientes = orden.slice(Math.max(0, orden.length - 1 - ventana), orden.length - 1)

  const mapa = new Map()
  for (const m of recientes) {
    for (const d of m.distribuidores || []) {
      if (d.volumen <= 0) continue
      const clave = claveDistribuidor(d)
      if (activosUltimo.has(clave)) continue // sigue activo, no está en riesgo
      const reg = mapa.get(clave) || {
        clave, id: String(d.id ?? ''), nombre: d.nombre,
        ultimoVolumen: 0, ultimoAnio: m.anio, ultimoMes: m.mes, mesesActivo: 0,
      }
      reg.nombre = d.nombre
      if (d.id) reg.id = String(d.id)
      reg.ultimoVolumen = d.volumen
      reg.ultimoAnio = m.anio
      reg.ultimoMes = m.mes
      reg.mesesActivo++
      mapa.set(clave, reg)
    }
  }
  return [...mapa.values()].sort((a, b) => b.ultimoVolumen - a.ultimoVolumen)
}

/** Serie de volumen de un distribuidor (por clave) en todos los meses, con ceros */
export function serieDistribuidor(meses, clave) {
  return ordenarPorFecha(meses).map((m) => {
    const d = (m.distribuidores || []).find((x) => claveDistribuidor(x) === clave)
    return { anio: m.anio, mes: m.mes, volumen: d ? d.volumen : 0 }
  })
}

/**
 * Comparativa entre dos meses. Toma a los distribuidores con volumen >= minimo
 * en el mes base (anterior) y reporta cómo les fue en el mes objetivo (actual):
 * si subieron, se mantuvieron, bajaron o se cayeron (inactivos).
 */
export function comparativaMeses(meses, baseId, objetivoId, minimo = 40) {
  const orden = ordenarPorFecha(meses)
  const base = orden.find((m) => m.id === baseId)
  const objetivo = orden.find((m) => m.id === objetivoId)
  if (!base || !objetivo) return null

  // Volumen de cada distribuidor en el mes objetivo
  const volObjetivo = new Map()
  for (const d of objetivo.distribuidores || []) {
    volObjetivo.set(claveDistribuidor(d), d.volumen)
  }

  const prioridad = { inactivo: 0, bajo: 1, igual: 2, subio: 3 }
  const filas = []
  for (const d of base.distribuidores || []) {
    if (d.volumen < minimo) continue
    const clave = claveDistribuidor(d)
    const actual = volObjetivo.get(clave) ?? 0
    let estado
    if (actual <= 0) estado = 'inactivo'
    else if (actual > d.volumen) estado = 'subio'
    else if (actual < d.volumen) estado = 'bajo'
    else estado = 'igual'
    filas.push({
      clave, id: String(d.id ?? ''), nombre: d.nombre,
      volumenBase: d.volumen, volumenActual: actual,
      cambio: actual - d.volumen, estado,
    })
  }

  // Los que hay que atender primero: inactivos, luego los que bajaron
  filas.sort((a, b) =>
    prioridad[a.estado] - prioridad[b.estado] || b.volumenBase - a.volumenBase
  )

  const resumen = {
    total: filas.length,
    activos: filas.filter((f) => f.estado !== 'inactivo').length,
    inactivos: filas.filter((f) => f.estado === 'inactivo').length,
    subieron: filas.filter((f) => f.estado === 'subio').length,
    bajaron: filas.filter((f) => f.estado === 'bajo').length,
    igual: filas.filter((f) => f.estado === 'igual').length,
  }
  resumen.continuidad = resumen.total ? (resumen.activos / resumen.total) * 100 : null

  return { base, objetivo, minimo, filas, resumen }
}

/** Estadísticas de ganancias: promedio, mejor y peor mes */
export function estadisticasGanancias(meses) {
  const orden = ordenarPorFecha(meses)
  if (orden.length === 0) return null
  const ganancias = orden.map((m) => m.ganancias)
  const total = ganancias.reduce((s, g) => s + g, 0)
  let mejor = orden[0]
  let peor = orden[0]
  for (const m of orden) {
    if (m.ganancias > mejor.ganancias) mejor = m
    if (m.ganancias < peor.ganancias) peor = m
  }
  return {
    promedio: total / orden.length,
    total,
    mejor,
    peor,
    promedio3: orden.slice(-3).reduce((s, m) => s + m.ganancias, 0) / Math.min(3, orden.length),
  }
}

/**
 * Valida la estructura de datos importada desde un JSON de respaldo.
 * Devuelve { valido, error, meses } sin lanzar excepciones.
 */
export function validarImportacion(obj) {
  try {
    const meses = Array.isArray(obj) ? obj : obj?.meses
    if (!Array.isArray(meses)) {
      return { valido: false, error: 'El archivo no contiene una lista de meses.' }
    }
    for (const m of meses) {
      const numeros = [m.volumenRed, m.ganancias, m.nuevosInicios, m.activos, m.metaGanancias]
      const numerosValidos = numeros.every((v) => typeof v === 'number' && v >= 0 && isFinite(v))
      const fechaValida =
        Number.isInteger(m.anio) && Number.isInteger(m.mes) && m.mes >= 1 && m.mes <= 12
      const distValidos =
        Array.isArray(m.distribuidores) &&
        m.distribuidores.every(
          (d) =>
            typeof d.nombre === 'string' && d.nombre.trim() &&
            // el volumen puede ser negativo (devoluciones del back office)
            typeof d.volumen === 'number' && isFinite(d.volumen) &&
            (d.id == null || typeof d.id === 'string' || typeof d.id === 'number')
        )
      if (!numerosValidos || !fechaValida || !distValidos) {
        return { valido: false, error: 'El archivo tiene un formato inválido o datos corruptos.' }
      }
    }
    // Detectar meses duplicados dentro del propio archivo
    const ids = meses.map((m) => idDeMes(m.anio, m.mes))
    if (new Set(ids).size !== ids.length) {
      return { valido: false, error: 'El archivo contiene meses duplicados.' }
    }
    // Normalizar: asegurar id y tipos limpios
    const limpios = meses.map((m) => ({
      id: idDeMes(m.anio, m.mes),
      anio: m.anio,
      mes: m.mes,
      volumenRed: m.volumenRed,
      ganancias: m.ganancias,
      nuevosInicios: m.nuevosInicios,
      activos: m.activos,
      metaGanancias: m.metaGanancias,
      distribuidores: m.distribuidores.map((d) => ({
        id: String(d.id ?? '').trim(),
        nombre: d.nombre.trim(),
        volumen: d.volumen,
      })),
    }))
    return { valido: true, meses: limpios }
  } catch {
    return { valido: false, error: 'No se pudo leer el archivo.' }
  }
}
