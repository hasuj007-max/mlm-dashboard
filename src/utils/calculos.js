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

/** Cuántos distribuidores compraron (volumen mayor a 0) en una lista */
export function contarActivos(distribuidores) {
  return (distribuidores || []).filter((d) => Number(d.volumen) > 0).length
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

/** Meses de calendario de un id "AAAA-MM" a otro (positivo si b es posterior) */
export function mesesEntre(idA, idB) {
  const [a1, m1] = idA.split('-').map(Number)
  const [a2, m2] = idB.split('-').map(Number)
  return (a2 - a1) * 12 + (m2 - m1)
}

/** Estados del seguimiento de una persona inactiva, en orden de avance */
export const ESTADOS_SEGUIMIENTO = ['pendiente', 'contactado', 'regresara', 'descartado']

/**
 * A quién hay que reactivar: personas con volumen en alguno de los 12 meses
 * anteriores al último mes cargado que NO compraron en ese último mes.
 * La lista de cada mes solo trae a quien compró, así que "no aparecer" = inactivo.
 *
 * Devuelve { ultimo, penultimo, desde, personas } con las que se cayeron más
 * recientemente primero (son las más fáciles de recuperar) y, a igualdad,
 * las de más volumen. `cayoEsteMes` marca a las activas en el penúltimo mes.
 */
/** Desde cuántos meses con compra (en toda la historia) alguien cuenta como cliente constante */
export const MESES_CONSTANTE = 3

/**
 * Grupos de inactivos según qué tan frío está cada quien (meses desde su última
 * compra hasta el último mes cargado). Cada uno pide una forma distinta de hablarle.
 */
export const GRUPOS_INACTIVOS = [
  { id: 'este', texto: 'Este mes', corto: 'Este mes', desde: 1, hasta: 1,
    consejo: 'Compraron el mes anterior y este no. Llamada personal esta semana: son los más fáciles de recuperar.' },
  { id: 'tibios', texto: 'Tibios', corto: '2–3 meses', desde: 2, hasta: 3,
    consejo: 'Llevan 2 o 3 meses sin comprar. Llamada o WhatsApp personal: todavía se acuerdan de ti.' },
  { id: 'frios', texto: 'Fríos', corto: '4–6 meses', desde: 4, hasta: 6,
    consejo: 'Llevan de 4 a 6 meses sin comprar. Escríbeles con un motivo concreto: una promoción, un producto nuevo o un evento.' },
  { id: 'dormidos', texto: 'Dormidos', corto: '7–12 meses', desde: 7, hasta: 12,
    consejo: 'Llevan de 7 a 12 meses sin comprar. Un mensaje general de vez en cuando basta; no inviertas llamadas una por una.' },
]

export function porReactivar(meses) {
  const conListas = ordenarPorFecha(meses).filter((m) => (m.distribuidores || []).length > 0)
  if (conListas.length < 2) return null

  const ultimo = conListas[conListas.length - 1]
  const penultimo = conListas[conListas.length - 2]
  const ventana = conListas.slice(-13, -1)
  const activasUltimo = new Set(
    ultimo.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor)
  )

  const mapa = new Map()
  for (const m of ventana) {
    for (const d of m.distribuidores) {
      if (d.volumen <= 0) continue
      const clave = claveDistribuidor(d)
      if (activasUltimo.has(clave)) continue
      if (!mapa.has(clave)) {
        mapa.set(clave, { clave, id: '', nombre: d.nombre, mesesActivo: 0, volumenTotal: 0 })
      }
      const p = mapa.get(clave)
      p.nombre = d.nombre // siempre el nombre más reciente
      const id = String(d.id ?? '').trim()
      if (id) p.id = id
      p.mesesActivo++
      p.volumenTotal += d.volumen
      p.ultimoMes = m
      p.volumenUltimo = d.volumen
    }
  }

  // Meses con volumen en toda la historia: detecta a quien solo se inscribió
  const historia = new Map()
  for (const m of conListas) {
    for (const d of m.distribuidores) {
      const clave = claveDistribuidor(d)
      if (!mapa.has(clave) || d.volumen <= 0) continue
      const h = historia.get(clave) || { meses: 0, volumen: 0 }
      h.meses++
      h.volumen = d.volumen
      historia.set(clave, h)
    }
  }

  const personas = [...mapa.values()].map((p) => {
    const h = historia.get(p.clave)
    return {
      ...p,
      mesesSinComprar: mesesEntre(p.ultimoMes.id, ultimo.id),
      cayoEsteMes: p.ultimoMes.id === penultimo.id,
      soloInscripcion: h.meses === 1 && h.volumen === CV_INSCRIPCION,
      mesesConCompra: h.meses, // en toda la historia con lista
      constante: h.meses >= MESES_CONSTANTE,
    }
  })
  personas.sort((a, b) => a.mesesSinComprar - b.mesesSinComprar || b.volumenTotal - a.volumenTotal)

  return { ultimo, penultimo, desde: ventana[0], personas }
}

/**
 * Quién volvió a comprar después de que lo contactaste: una persona con
 * seguimiento (no pendiente) que tiene volumen en un mes posterior al mes que
 * estaba cargado cuando registraste el contacto. Devuelve Map clave → regreso.
 */
export function regresosTrasContacto(meses, seguimiento) {
  const regresos = new Map()
  const conContacto = Object.entries(seguimiento).filter(
    ([, s]) => s.estado && s.estado !== 'pendiente' && s.mes
  )
  if (conContacto.length === 0) return regresos

  const orden = ordenarPorFecha(meses)
  for (const [clave, s] of conContacto) {
    for (const m of orden) {
      if (m.id <= s.mes) continue
      const d = (m.distribuidores || []).find((x) => claveDistribuidor(x) === clave)
      if (d && d.volumen > 0) {
        regresos.set(clave, {
          clave, nombre: d.nombre, id: String(d.id ?? '').trim(),
          mes: m, volumen: d.volumen, fechaContacto: s.fecha,
        })
        break
      }
    }
  }
  return regresos
}

/**
 * Valida el seguimiento de un respaldo importado. Devuelve un objeto limpio
 * { clave: { estado, nota, telefono, mes, fecha } } o null si viene dañado.
 */
export function validarSeguimiento(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return null
  const limpio = {}
  for (const [clave, s] of Object.entries(obj)) {
    if (!s || typeof s !== 'object') return null
    if (s.estado != null && !ESTADOS_SEGUIMIENTO.includes(s.estado)) return null
    const texto = (v) => (typeof v === 'string' ? v : '')
    limpio[clave] = {
      estado: s.estado || 'pendiente',
      nota: texto(s.nota),
      telefono: texto(s.telefono),
      mes: texto(s.mes),
      fecha: texto(s.fecha),
    }
  }
  return limpio
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

/**
 * Análisis de retención de las inscripciones (distribuidores que aparecieron
 * por primera vez con CV_INSCRIPCION pts exactos). Responde: cuántos entraron,
 * cuántos siguen activos hoy, cuántos nunca recompraron, su vida promedio,
 * la curva de retención (mes +1, +2, +3, +6, +12) y las cohortes por año.
 *
 * Solo considera meses que tengan lista de distribuidores capturada.
 */
export function analisisInscripciones(meses) {
  const conListas = ordenarPorFecha(meses).filter((m) => (m.distribuidores || []).length > 0)
  if (conListas.length < 2) return null

  const ids = conListas.map((m) => m.id)
  const ultimoId = ids[ids.length - 1]
  const indice = new Map(ids.map((id, i) => [id, i]))

  // Set de claves activas (volumen > 0) por mes, y nombre más reciente
  const activos = new Map()
  const nombres = new Map()
  const volumenUltimo = new Map()
  for (const m of conListas) {
    const set = new Set()
    for (const d of m.distribuidores) {
      const k = claveDistribuidor(d)
      nombres.set(k, d.nombre)
      if (d.volumen > 0) set.add(k)
      if (m.id === ultimoId) volumenUltimo.set(k, d.volumen)
    }
    activos.set(m.id, set)
  }

  // Primera aparición con exactamente CV_INSCRIPCION pts = inscripción
  const inscritos = new Map() // clave -> mes de inscripción
  for (const m of conListas) {
    for (const d of m.distribuidores) {
      const k = claveDistribuidor(d)
      if (d.volumen === CV_INSCRIPCION && !inscritos.has(k)) inscritos.set(k, m.id)
    }
  }

  const sigueActivo = (k) => activos.get(ultimoId).has(k)

  let recienEntrados = 0 // entraron en el último mes: aún sin oportunidad
  let siguen = 0
  let sefueron = 0
  let nuncaRecompraron = 0
  const vidas = []
  const sobrevivientes = []

  for (const [k, mesIns] of inscritos) {
    const i = indice.get(mesIns)
    const posteriores = ids.slice(i + 1)
    const mesesActivo = ids.slice(i).filter((id) => activos.get(id).has(k)).length
    vidas.push(mesesActivo)

    if (posteriores.length === 0) {
      recienEntrados++
      continue
    }
    if (sigueActivo(k)) {
      siguen++
      sobrevivientes.push({
        clave: k,
        nombre: nombres.get(k),
        mesIngreso: mesIns,
        mesesActivo,
        volumenActual: volumenUltimo.get(k) || 0,
      })
    } else {
      sefueron++
      if (!posteriores.some((id) => activos.get(id).has(k))) nuncaRecompraron++
    }
  }

  const evaluables = inscritos.size - recienEntrados

  // Curva de retención: % que sigue activo N meses después de entrar
  const curva = [1, 2, 3, 6, 12].map((n) => {
    let conOportunidad = 0
    let activosN = 0
    for (const [k, mesIns] of inscritos) {
      const i = indice.get(mesIns)
      if (i + n < ids.length) {
        conOportunidad++
        if (activos.get(ids[i + n]).has(k)) activosN++
      }
    }
    return {
      n,
      conOportunidad,
      activos: activosN,
      pct: conOportunidad ? (activosN / conOportunidad) * 100 : null,
    }
  })

  // Cohortes por año de entrada
  const porAnio = new Map()
  for (const [k, mesIns] of inscritos) {
    const i = indice.get(mesIns)
    const anio = mesIns.slice(0, 4)
    if (!porAnio.has(anio)) porAnio.set(anio, { anio, total: 0, siguienteMes: 0, vidaTotal: 0, inscritos: 0 })
    const c = porAnio.get(anio)
    c.inscritos++
    c.vidaTotal += ids.slice(i).filter((id) => activos.get(id).has(k)).length
    if (i + 1 < ids.length) {
      c.total++
      if (activos.get(ids[i + 1]).has(k)) c.siguienteMes++
    }
  }
  const cohortes = [...porAnio.values()]
    .sort((a, b) => a.anio.localeCompare(b.anio))
    .map((c) => ({
      ...c,
      pctSiguienteMes: c.total ? (c.siguienteMes / c.total) * 100 : null,
      vidaPromedio: c.inscritos ? c.vidaTotal / c.inscritos : 0,
    }))

  const ordenadas = [...vidas].sort((a, b) => a - b)
  const mediana = ordenadas.length
    ? ordenadas.length % 2
      ? ordenadas[(ordenadas.length - 1) / 2]
      : (ordenadas[ordenadas.length / 2 - 1] + ordenadas[ordenadas.length / 2]) / 2
    : 0

  return {
    desde: ids[0],
    hasta: ultimoId,
    mesesAnalizados: ids.length,
    total: inscritos.size,
    recienEntrados,
    evaluables,
    siguen,
    sefueron,
    nuncaRecompraron,
    pctSiguen: evaluables ? (siguen / evaluables) * 100 : null,
    pctNuncaRecompraron: evaluables ? (nuncaRecompraron / evaluables) * 100 : null,
    vidaPromedio: vidas.length ? vidas.reduce((s, v) => s + v, 0) / vidas.length : 0,
    vidaMediana: mediana,
    curva,
    cohortes,
    sobrevivientes: sobrevivientes.sort((a, b) => b.mesesActivo - a.mesesActivo),
  }
}

// ---------- Rango, retención del mes y listas de acción (rediseño nov 2026) ----------

/** PV personal mínimo para contar como "activo" según el plan de la compañía */
export const PV_ACTIVO_PLAN = 120

/**
 * Volumen mínimo en la pierna de pago por rango (plan 2020). El rango real
 * además pide PV personal y, desde Oro, directos en Bronce: esto solo dice
 * hasta dónde alcanza el volumen.
 */
export const RANGOS = [
  ['Afiliado Calificado', 120], ['Aprendiz', 300], ['Aprendiz Elite', 600], ['Supervisor', 1200],
  ['Bronce', 2500], ['Plata', 5000], ['Oro', 10000], ['Oro Rosado', 15000], ['Platino', 20000],
  ['Jade', 30000], ['Zafiro', 40000], ['Perla', 50000], ['Rubí', 60000], ['Esmeralda', 80000],
  ['Diamante', 100000], ['Doble Diamante', 250000], ['Triple Diamante', 500000],
  ['Diamante Corona', 1000000],
]

/** Rango que alcanza un volumen de pierna de pago y lo que falta para el siguiente */
export function rangoPorVolumen(volumen) {
  const v = Number(volumen) || 0
  let i = -1
  RANGOS.forEach(([, min], idx) => { if (v >= min) i = idx })
  const actual = i >= 0 ? RANGOS[i] : null
  const siguiente = RANGOS[i + 1] || null
  const piso = actual ? actual[1] : 0
  return {
    nombre: actual ? actual[0] : 'Sin rango',
    piso,
    siguiente: siguiente ? siguiente[0] : null,
    meta: siguiente ? siguiente[1] : null,
    falta: siguiente ? siguiente[1] - v : 0,
    avance: siguiente ? Math.max(0, Math.min(1, (v - piso) / (siguiente[1] - piso))) : 1,
  }
}

/** Cuántos de una lista llegan al mínimo del plan (120 PV) */
export function contarCalificados(distribuidores) {
  return (distribuidores || []).filter((d) => Number(d.volumen) >= PV_ACTIVO_PLAN).length
}

/** Meses que traen lista de distribuidores, en orden cronológico */
export function mesesConLista(meses) {
  return ordenarPorFecha(meses).filter((m) => (m.distribuidores || []).length > 0)
}

/** Mes de la primera compra de cada persona y si entró con inscripción (30 pts) */
function primerasCompras(conListas) {
  const mapa = new Map()
  for (const m of conListas) {
    for (const d of m.distribuidores) {
      if (d.volumen <= 0) continue
      const clave = claveDistribuidor(d)
      if (!mapa.has(clave)) mapa.set(clave, { mes: m, inscripcion: esNuevo(d) })
    }
  }
  return mapa
}

/**
 * Retención de un mes contra el anterior con lista: de los que compraron el mes
 * pasado, cuántos repitieron; de los inscritos del mes pasado, cuántos
 * recompraron; y cuántos regresaron después de estar inactivos.
 * `hastaId` permite calcularlo para un mes anterior al último.
 */
export function retencionDelMes(meses, hastaId = null) {
  let conListas = mesesConLista(meses)
  if (hastaId) conListas = conListas.filter((m) => m.id <= hastaId)
  if (conListas.length < 2) return null
  const actual = conListas[conListas.length - 1]
  if (hastaId && actual.id !== hastaId) return null
  const previo = conListas[conListas.length - 2]

  const activos = (m) => new Set(m.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor))
  const A = activos(actual)
  const P = activos(previo)
  const primeras = primerasCompras(conListas)

  const repitieron = [...P].filter((k) => A.has(k)).length
  // Misma cuenta que "Inscritos nuevos" del mes: quien compró exactamente 30 pts
  const inscritosPrevios = previo.distribuidores.filter(esNuevo).map(claveDistribuidor)
  const nuevosRecompraron = inscritosPrevios.filter((k) => A.has(k)).length
  const regresaron = [...A].filter((k) => !P.has(k) && primeras.get(k).mes.id < previo.id).length

  // Promedio de los 6 pares anteriores, para saber si el mes fue bueno o malo
  const tasas = []
  for (let i = conListas.length - 2; i >= 1 && tasas.length < 6; i--) {
    const b = activos(conListas[i - 1])
    const a = activos(conListas[i])
    if (b.size) tasas.push([...b].filter((k) => a.has(k)).length / b.size)
  }

  return {
    actual, previo,
    base: P.size,
    repitieron,
    pct: P.size ? (repitieron / P.size) * 100 : null,
    pctPromedio: tasas.length ? (tasas.reduce((s, t) => s + t, 0) / tasas.length) * 100 : null,
    inscritosPrevios: inscritosPrevios.length,
    nuevosRecompraron,
    regresaron,
  }
}

/**
 * Nuevos que hay que arrancar: personas cuya primera compra fue una inscripción
 * (30 pts) en alguno de los últimos 3 meses con lista y que no han vuelto a
 * comprar. Los del último mes aún están a tiempo; los anteriores ya se enfrían.
 */
export function nuevosEnRiesgo(meses) {
  const conListas = mesesConLista(meses)
  if (conListas.length === 0) return []
  const ultimo = conListas[conListas.length - 1]
  const ventana = conListas.slice(-3)
  const primeras = primerasCompras(conListas)

  const personas = []
  for (const m of ventana) {
    for (const d of m.distribuidores) {
      const clave = claveDistribuidor(d)
      const p = primeras.get(clave)
      if (!p || !p.inscripcion || p.mes.id !== m.id || !esNuevo(d)) continue
      const recompro = conListas.some(
        (x) => x.id > m.id && x.distribuidores.some((y) => y.volumen > 0 && claveDistribuidor(y) === clave)
      )
      if (recompro) continue
      personas.push({
        clave, id: String(d.id ?? '').trim(), nombre: d.nombre,
        mesInscripcion: m,
        mesesDesde: mesesEntre(m.id, ultimo.id),
      })
    }
  }
  return personas.sort((a, b) => a.mesesDesde - b.mesesDesde || a.nombre.localeCompare(b.nombre, 'es'))
}

/**
 * Casi califican: compraron en el último mes pero se quedaron entre `minimo`
 * y 119 pts, a poco de los 120 PV que pide el plan.
 */
export function casiCalifican(meses, minimo = 60) {
  const conListas = mesesConLista(meses)
  if (conListas.length === 0) return []
  const ultimo = conListas[conListas.length - 1]
  return ultimo.distribuidores
    .filter((d) => d.volumen >= minimo && d.volumen < PV_ACTIVO_PLAN)
    .map((d) => ({
      clave: claveDistribuidor(d), id: String(d.id ?? '').trim(), nombre: d.nombre,
      volumen: d.volumen, falta: PV_ACTIVO_PLAN - d.volumen,
    }))
    .sort((a, b) => a.falta - b.falta)
}

// ---------- Modelo de crecimiento, actividad y arranque (nov 2026) ----------

/**
 * Números base para proyectar la pierna de pago, sacados de los últimos 6
 * cambios de mes: retención (r), entradas por mes (E = primera compra +
 * regresos), activos de hoy y puntos por activo (promedio de 3 meses).
 * Fórmula: activos del mes siguiente = activos × r + E.
 */
export function modeloCrecimiento(meses) {
  const conListas = mesesConLista(meses)
  if (conListas.length < 3) return null
  const activos = (m) => new Set(m.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor))
  const tasas = []
  const entradas = []
  for (let i = conListas.length - 1; i >= 1 && tasas.length < 6; i--) {
    const b = activos(conListas[i - 1])
    const a = activos(conListas[i])
    if (!b.size) continue
    const siguen = [...b].filter((k) => a.has(k)).length
    tasas.push(siguen / b.size)
    entradas.push(a.size - siguen)
  }
  if (!tasas.length) return null
  const prom = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length
  // La retención es estable (6 meses); las entradas cambian rápido (3 meses, las más recientes)
  const entradasRecientes = entradas.slice(0, 3)
  const ultimos = conListas.slice(-3)
  const ptsPorActivo = prom(ultimos.map((m) => m.volumenRed / (activos(m).size || 1)))
  const ultimo = conListas[conListas.length - 1]
  return {
    retencion: prom(tasas),
    entradas: prom(entradasRecientes),
    // >1 si las entradas de los últimos 3 meses superan a las de los 3 anteriores
    tendenciaEntradas: entradas.length >= 6 && prom(entradas.slice(3, 6)) > 0
      ? prom(entradasRecientes) / prom(entradas.slice(3, 6)) : null,
    activos: activos(ultimo).size,
    ptsPorActivo,
    volumen: ultimo.volumenRed,
  }
}

/**
 * Proyecta mes a mes con activos × r + E hasta alcanzar `metaVolumen`.
 * Devuelve { meses, llega, estable, volumenEstable, activosMeta }.
 * `meses` es null si con esos números la red se estaciona antes de la meta.
 */
export function proyectarRango({ activos, ptsPorActivo, retencion, entradas, metaVolumen, volumen = 0, tope = 60 }) {
  const r = Math.min(0.97, Math.max(0, retencion))
  const estable = entradas / (1 - r)
  const activosMeta = Math.ceil(metaVolumen / (ptsPorActivo || 1))
  let a = activos
  let n = null
  // "Ya alcanza" solo si el volumen real ya llegó; si no, como mínimo es el mes que viene
  if (volumen >= metaVolumen) n = 0
  else {
    for (let i = 1; i <= tope; i++) {
      a = a * r + entradas
      if (a >= activosMeta) { n = i; break }
    }
  }
  return { meses: n, llega: n != null, estable, volumenEstable: estable * ptsPorActivo, activosMeta }
}

export const CAMPOS_ACTIVIDAD = [
  ['invitaciones', 'Invitaciones'],
  ['presentaciones', 'Presentaciones'],
  ['seguimientos', 'Seguimientos'],
  ['inscritos', 'Inscritos'],
]

/** "2026-11-16" de una fecha local */
export function fechaISO(fecha = new Date()) {
  return fecha.toLocaleDateString('en-CA')
}

/** Suma la actividad de los últimos `dias` días (incluye hoy) */
export function sumarActividad(actividad, dias, hasta = new Date()) {
  const total = { invitaciones: 0, presentaciones: 0, seguimientos: 0, inscritos: 0, diasConRegistro: 0 }
  for (let i = 0; i < dias; i++) {
    const f = new Date(hasta)
    f.setDate(f.getDate() - i)
    const dia = actividad[fechaISO(f)]
    if (!dia) continue
    let alguno = false
    for (const [campo] of CAMPOS_ACTIVIDAD) {
      const v = Number(dia[campo]) || 0
      total[campo] += v
      if (v > 0) alguno = true
    }
    if (alguno) total.diasConRegistro++
  }
  return total
}

/** Días transcurridos de la semana en curso (lunes = 1 … domingo = 7) */
export function diasDeEstaSemana(hoy = new Date()) {
  return ((hoy.getDay() + 6) % 7) + 1
}

/** Pasos del arranque de un nuevo: clave, texto y día sugerido tras inscribirse */
export const PASOS_ARRANQUE = [
  { id: 'bienvenida', texto: 'Bienvenida', detalle: 'Darle la bienvenida y explicarle cómo usar sus productos', dia: 1 },
  { id: 'seguimiento', texto: 'Llamada de seguimiento', detalle: 'Preguntarle cómo le ha ido y resolver dudas', dia: 7 },
  { id: 'recompra', texto: 'Recompra', detalle: 'Ayudarle a hacer su siguiente pedido', dia: 21 },
]

/**
 * "Ya compró": se marca a mano en cuanto el nuevo hace su recompra, sin esperar
 * a la lista del mes siguiente (que de todos modos lo saca de Nuevos).
 */
export const PASO_COMPRA = 'compro'

/**
 * Estado del arranque de una persona: pasos hechos, el siguiente y, si se
 * conoce su fecha de inscripción, cuándo toca ("hoy", atrasado o en N días).
 */
export function estadoArranque(registro, hoy = new Date()) {
  const hechos = registro?.pasos || {}
  const compro = Boolean(hechos[PASO_COMPRA])
  const completos = PASOS_ARRANQUE.filter((p) => hechos[p.id]).length
  const siguiente = compro ? null : PASOS_ARRANQUE.find((p) => !hechos[p.id]) || null
  let diasPara = null
  if (siguiente && registro?.inicio) {
    const inicio = new Date(`${registro.inicio}T12:00`)
    const toca = new Date(inicio)
    toca.setDate(toca.getDate() + siguiente.dia)
    const medio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12)
    diasPara = Math.round((toca - medio) / 86400000)
  }
  return { completos, total: PASOS_ARRANQUE.length, siguiente, diasPara, compro }
}

/** Limpia un objeto { fecha: { campo: n } } de actividad importado; null si viene dañado */
export function validarActividad(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return null
  const limpio = {}
  for (const [fecha, dia] of Object.entries(obj)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !dia || typeof dia !== 'object') return null
    const d = {}
    for (const [campo] of CAMPOS_ACTIVIDAD) {
      const v = Number(dia[campo]) || 0
      if (v > 0) d[campo] = Math.round(v)
    }
    if (Object.keys(d).length) limpio[fecha] = d
  }
  return limpio
}

/** Limpia el arranque importado { clave: { inicio, pasos: { id: fecha } } }; null si viene dañado */
export function validarArranque(obj) {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return null
  const limpio = {}
  for (const [clave, r] of Object.entries(obj)) {
    if (!r || typeof r !== 'object') return null
    const pasos = {}
    for (const id of [...PASOS_ARRANQUE.map((p) => p.id), PASO_COMPRA]) {
      if (typeof r.pasos?.[id] === 'string' && r.pasos[id]) pasos[id] = r.pasos[id]
    }
    limpio[clave] = { inicio: typeof r.inicio === 'string' ? r.inicio : '', pasos }
  }
  return limpio
}

// ---------- Revividos (nov 2026) ----------

/** Grupo según los meses que alguien llevaba sin comprar (mismos cortes que Mi gente) */
export function grupoPorMeses(n) {
  return GRUPOS_INACTIVOS.find((g) => n >= g.desde && n <= g.hasta)?.id || 'perdidos'
}

/**
 * Quién revivió en cada mes, detectado solo con las listas: compró este mes,
 * NO compró el mes anterior y ya había comprado antes. Se clasifica por los
 * meses que llevaba sin comprar al mes anterior (este mes, tibio, frío,
 * dormido o perdido = más de 12). Además dice cuántos de los que revivieron
 * el mes anterior siguieron comprando este mes ("se quedaron").
 *
 * Devuelve { actual, previo, personas, porGrupo, anteriores, siguen, historia }
 * o null si no hay al menos 2 meses con lista.
 */
export function revividos(meses, hastaId = null) {
  let conListas = mesesConLista(meses)
  if (hastaId) conListas = conListas.filter((m) => m.id <= hastaId)
  if (conListas.length < 2) return null
  if (hastaId && conListas[conListas.length - 1].id !== hastaId) return null

  const activos = conListas.map((m) => new Set(m.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor)))

  // Para cada mes i (desde el segundo): revividos y su grupo
  const ultimaCompra = new Map() // clave → id del último mes con compra ANTES del mes que se revisa
  const porMes = []
  for (let i = 0; i < conListas.length; i++) {
    const m = conListas[i]
    const lista = []
    if (i > 0) {
      const previo = conListas[i - 1]
      for (const d of m.distribuidores) {
        if (d.volumen <= 0) continue
        const k = claveDistribuidor(d)
        if (activos[i - 1].has(k) || !ultimaCompra.has(k)) continue
        if (lista.some((p) => p.clave === k)) continue
        const sinComprar = mesesEntre(ultimaCompra.get(k), previo.id)
        lista.push({
          clave: k, id: String(d.id ?? '').trim(), nombre: d.nombre, volumen: d.volumen,
          ultimaCompra: ultimaCompra.get(k), sinComprar, grupo: grupoPorMeses(sinComprar),
        })
      }
    }
    porMes.push(lista)
    for (const k of activos[i]) ultimaCompra.set(k, m.id)
  }

  const i = conListas.length - 1
  const personas = porMes[i].sort((a, b) => a.sinComprar - b.sinComprar || b.volumen - a.volumen)
  const porGrupo = {}
  for (const p of personas) porGrupo[p.grupo] = (porGrupo[p.grupo] || 0) + 1

  // De los que revivieron el mes anterior, ¿siguieron comprando?
  const anteriores = i >= 1 ? porMes[i - 1] : []
  const siguen = anteriores.filter((p) => activos[i].has(p.clave))

  // Historia de los últimos 6 meses: revividos y cuántos se quedaron al mes siguiente
  const historia = []
  for (let j = Math.max(1, i - 5); j <= i; j++) {
    historia.push({
      mes: conListas[j],
      revividos: porMes[j].length,
      seQuedaron: j < i ? porMes[j].filter((p) => activos[j + 1].has(p.clave)).length : null,
    })
  }

  return {
    actual: conListas[i], previo: conListas[i - 1],
    personas, porGrupo,
    anteriores: anteriores.length, siguen,
    historia,
  }
}
