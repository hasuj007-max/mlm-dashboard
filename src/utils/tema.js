// Paleta compartida por todas las gráficas y avatares.
// Los componentes de recharts no leen variables CSS, así que los acentos
// viven aquí para que Dashboard, Salud, Retención y compañía usen los mismos.

export const PALETA = {
  dorado: '#e9b658',
  doradoClaro: '#f4cf8a',
  azul: '#5b93f5',
  verde: '#43d18a',
  rojo: '#f8676c',
  morado: '#a084f0',
  teal: '#4fd1d9',
}

/** Los mismos acentos oscurecidos, para que se lean sobre fondo blanco */
const PALETA_CLARA = {
  dorado: '#c08a1c',
  doradoClaro: '#e0ab3e',
  azul: '#2c6ae0',
  verde: '#119c56',
  rojo: '#dc3b45',
  morado: '#7355cf',
  teal: '#1898a2',
}

/** Acentos de gráfica según el tema activo */
export function paleta(tema) {
  return tema === 'claro' ? PALETA_CLARA : PALETA
}

/** Degradados de los avatares con iniciales (mismo orden en toda la app) */
export const COLORES_AVATAR = [
  'linear-gradient(140deg, #f4cf8a, #e9b658)',
  'linear-gradient(140deg, #8ab4ff, #5b93f5)',
  'linear-gradient(140deg, #c3adff, #a084f0)',
  'linear-gradient(140deg, #8af0b8, #43d18a)',
  'linear-gradient(140deg, #ffa8bc, #f8676c)',
  'linear-gradient(140deg, #9ce8f2, #4fd1d9)',
]

/** Colores de ejes y rejilla según el tema (los acentos no cambian) */
export function coloresGrafica(tema) {
  return tema === 'claro'
    ? { eje: '#6b768e', rejilla: 'rgba(18,28,56,0.08)' }
    : { eje: '#7c869c', rejilla: 'rgba(255,255,255,0.06)' }
}

/** Props comunes de los ejes: sin línea, sin ticks, tipografía de la app */
export function ejeX(colores, extra = {}) {
  return {
    tick: { fill: colores.eje, fontSize: 11, fontWeight: 600 },
    axisLine: false,
    tickLine: false,
    dy: 4,
    ...extra,
  }
}

export function ejeY(colores, extra = {}) {
  return {
    tick: { fill: colores.eje, fontSize: 11, fontWeight: 600 },
    axisLine: false,
    tickLine: false,
    width: 44,
    ...extra,
  }
}

/** Iniciales de un nombre: "María González" → "MG" */
export function iniciales(nombre) {
  return String(nombre || '')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
