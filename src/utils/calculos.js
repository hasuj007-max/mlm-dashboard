// Cálculos del negocio: ordenamiento cronológico, % de cambio y tendencia.
// Todos los cálculos comparan contra el mes anterior REGISTRADO (el inmediato
// en orden cronológico), por lo que funcionan aunque falten meses intermedios.

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
          (d) => typeof d.nombre === 'string' && d.nombre.trim() && typeof d.volumen === 'number' && d.volumen >= 0
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
      distribuidores: m.distribuidores.map((d) => ({ nombre: d.nombre.trim(), volumen: d.volumen })),
    }))
    return { valido: true, meses: limpios }
  } catch {
    return { valido: false, error: 'No se pudo leer el archivo.' }
  }
}
