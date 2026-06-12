// Utilidades de formato: moneda USD, puntos de volumen y nombres de meses.

const formatoUSD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const formatoNumero = new Intl.NumberFormat('es-MX')

/** Formatea un monto como dólares, ej. "$45,300" */
export function usd(valor) {
  return formatoUSD.format(valor || 0)
}

/** Formatea el volumen en puntos, ej. "12,450 pts" */
export function pts(valor) {
  return `${formatoNumero.format(valor || 0)} pts`
}

/** Formatea un número con separador de miles */
export function num(valor) {
  return formatoNumero.format(valor || 0)
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

/** "Mayo 2026" */
export function etiquetaMes(registro) {
  return `${MESES[registro.mes - 1]} ${registro.anio}`
}

/** "May 26" — para ejes de gráficas */
export function etiquetaCorta(registro) {
  return `${MESES_CORTOS[registro.mes - 1]} ${String(registro.anio).slice(2)}`
}
