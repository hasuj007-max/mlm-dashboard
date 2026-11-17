// Corrida de estrés: un año de crecimiento orgánico hasta Diamante con gente
// que entra, se cae y regresa. Corre todas las cuentas de la app mes a mes y
// revisa que cuadren entre sí (invariantes). Datos 100% inventados.
//
// Uso:  node pruebas/simulacion.mjs            → tabla + revisión
//       node pruebas/simulacion.mjs --json F   → además guarda el respaldo simulado en F
//
// Escenario: 12 meses de base estable (~55 activos, ~10,000 pts, como hoy) y
// luego 12 meses de crecimiento escalonado: suben las entradas y la retención.

import fs from 'node:fs'
import {
  idDeMes, contarActivos, contarNuevos, contarCalificados, rangoPorVolumen, retencionDelMes,
  porReactivar, nuevosEnRiesgo, casiCalifican, revividos, modeloCrecimiento, proyectarRango,
  validarImportacion, GRUPOS_INACTIVOS, claveDistribuidor, mesesEntre, RANGOS, estadisticasGanancias,
  directorioDistribuidores, analisisInscripciones, CV_INSCRIPCION, PV_ACTIVO_PLAN,
} from '../src/utils/calculos.js'
import { fusionarMeses } from '../src/nube/fusion.js'

// ---------- Azar reproducible ----------
let semilla = 20261117
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648)
const elegir = (xs) => xs[Math.floor(azar() * xs.length)]
const VOLUMENES = [40, 60, 80, 100, 120, 120, 120, 135, 160, 160, 200, 240, 300, 360, 480, 755]

// ---------- Escenario ----------
// Por mes: tasa de retención, % de nuevos sobre los activos y % de inactivos recientes que regresan
const BASE = Array.from({ length: 12 }, () => ({ r: 0.56, nuevos: 0.12, regreso: 0.16, ptsExtra: 1 }))
const CRECE = [
  [0.58, 0.2, 0.17, 1.0], [0.6, 0.26, 0.18, 1.05], [0.62, 0.32, 0.18, 1.1], [0.64, 0.38, 0.19, 1.15],
  [0.65, 0.42, 0.19, 1.2], [0.66, 0.46, 0.2, 1.25], [0.67, 0.5, 0.2, 1.3], [0.68, 0.52, 0.2, 1.35],
  [0.69, 0.54, 0.2, 1.4], [0.7, 0.55, 0.2, 1.45], [0.71, 0.56, 0.2, 1.5], [0.72, 0.56, 0.2, 1.55],
].map(([r, nuevos, regreso, ptsExtra]) => ({ r, nuevos, regreso, ptsExtra }))
const ESCENARIO = [...BASE, ...CRECE]

let siguienteId = 1
const nuevaPersona = () => {
  const n = siguienteId++
  return { id: `SIM${String(n).padStart(5, '0')}`, nombre: `Persona Prueba ${n}`, ultima: null }
}

const personas = []
let activos = []
for (let i = 0; i < 55; i++) { const p = nuevaPersona(); personas.push(p); activos.push(p) }

const meses = []
let anio = 2025, mes = 11
for (const [i, e] of ESCENARIO.entries()) {
  const id = idDeMes(anio, mes)
  // Quién se queda, quién entra nuevo y quién regresa
  const quedan = activos.filter(() => azar() < e.r)
  const nuevos = Array.from({ length: Math.round(activos.length * e.nuevos) }, () => {
    const p = nuevaPersona(); personas.push(p); return p
  })
  const enActivos = new Set(activos)
  const recientes = personas.filter((p) => p.ultima && !enActivos.has(p) && mesesEntre(p.ultima, id) <= 13)
  const regresan = recientes.filter(() => azar() < e.regreso * 2)
  const esteMes = [...new Set([...quedan, ...nuevos, ...regresan])]

  const distribuidores = esteMes.map((p) => {
    const esNuevo = nuevos.includes(p)
    // Nuevo = exactamente 30 pts. Los demás nunca 30 (si no, contarían como inscripción)
    let v = esNuevo ? CV_INSCRIPCION : Math.round(elegir(VOLUMENES) * e.ptsExtra)
    if (!esNuevo && v === CV_INSCRIPCION) v = 31
    return { id: p.id, nombre: p.nombre, volumen: v }
  })
  // Una devolución de vez en cuando (volumen negativo, como en el back office real)
  if (i % 7 === 3) {
    const p = elegir(personas.filter((x) => !esteMes.includes(x) && x.ultima))
    if (p) distribuidores.push({ id: p.id, nombre: p.nombre, volumen: -40 })
  }
  const volumenRed = distribuidores.reduce((s, d) => s + d.volumen, 0)
  const ganancias = Math.round(volumenRed * (0.19 + 0.004 * Math.max(0, i - 11)))
  meses.push({
    id, anio, mes, ganancias, metaGanancias: i >= 12 ? 10000 + (i - 12) * 2000 : ganancias,
    nuevosInicios: contarNuevos(distribuidores), activos: contarActivos(distribuidores), volumenRed,
    distribuidores,
  })
  for (const p of esteMes) p.ultima = id
  activos = esteMes
  if (++mes > 12) { mes = 1; anio++ }
}

// ---------- Revisión mes a mes ----------
const fallas = []
const revisa = (ok, msg) => { if (!ok) fallas.push(msg) }
const filas = []
const ids = meses.map((m) => m.id)

for (let k = 1; k < meses.length; k++) {
  const hasta = meses.slice(0, k + 1)
  const m = meses[k]
  const previo = meses[k - 1]
  const et = m.id

  const act = contarActivos(m.distribuidores)
  const rango = rangoPorVolumen(m.volumenRed)
  const ret = retencionDelMes(hasta)
  const rev = revividos(hasta)
  const caidos = porReactivar(hasta)
  const nuevos = nuevosEnRiesgo(hasta)
  const casi = casiCalifican(hasta)
  const modelo = modeloCrecimiento(hasta)

  // 1. Rango: coherente con la tabla
  const esperado = RANGOS.filter(([, min]) => m.volumenRed >= min).at(-1)?.[0] || 'Sin rango'
  revisa(rango.nombre === esperado, `${et}: rango ${rango.nombre} ≠ ${esperado}`)
  revisa(rango.avance >= 0 && rango.avance <= 1, `${et}: avance de rango fuera de 0–1 (${rango.avance})`)
  if (rango.siguiente) revisa(rango.falta > 0, `${et}: falta ≤ 0 con siguiente rango`)

  // 2. Retención: repitieron ≤ base, % entre 0 y 100, regresaron = revividos
  revisa(ret.repitieron <= ret.base, `${et}: repitieron > base`)
  revisa(ret.pct >= 0 && ret.pct <= 100, `${et}: retención fuera de rango (${ret.pct})`)
  revisa(ret.nuevosRecompraron <= ret.inscritosPrevios, `${et}: nuevos recompraron > inscritos`)
  revisa(ret.regresaron === rev.personas.length, `${et}: "regresaron" (${ret.regresaron}) ≠ revividos (${rev.personas.length})`)
  revisa(ret.inscritosPrevios === contarNuevos(previo.distribuidores), `${et}: inscritos del mes anterior no cuadran con la tarjeta`)

  // 3. Revividos: compraron este mes, no el anterior, y ya habían comprado antes
  const activosPrev = new Set(previo.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor))
  const antes = new Set(meses.slice(0, k - 1).flatMap((x) => x.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor)))
  for (const p of rev.personas) {
    revisa(!activosPrev.has(p.clave), `${et}: revivido ${p.nombre} sí compró el mes anterior`)
    revisa(antes.has(p.clave), `${et}: revivido ${p.nombre} nunca había comprado`)
  }
  revisa(rev.siguen.length <= rev.anteriores, `${et}: se quedaron > revividos del mes anterior`)
  const sumaGrupos = Object.values(rev.porGrupo).reduce((a, b) => a + b, 0)
  revisa(sumaGrupos === rev.personas.length, `${et}: grupos de revividos no suman`)

  // 4. El grupo de un revivido = el grupo donde lo mostraba "Se cayeron" el mes anterior
  if (k >= 2) {
    const caidosPrev = porReactivar(meses.slice(0, k))
    const grupoPrev = new Map(caidosPrev.personas.map((p) => [p.clave, GRUPOS_INACTIVOS.find((g) => p.mesesSinComprar >= g.desde && p.mesesSinComprar <= g.hasta)?.id]))
    for (const p of rev.personas) {
      if (p.grupo === 'perdidos') continue
      revisa(grupoPrev.get(p.clave) === p.grupo, `${et}: ${p.nombre} revivió como "${p.grupo}" pero el mes anterior estaba en "${grupoPrev.get(p.clave)}"`)
    }
  }

  // 5. Se cayeron: nadie activo este mes, todos entre 1 y 12 meses sin comprar
  const activosHoy = new Set(m.distribuidores.filter((d) => d.volumen > 0).map(claveDistribuidor))
  for (const p of caidos.personas) {
    revisa(!activosHoy.has(p.clave), `${et}: ${p.nombre} está en "Se cayeron" pero compró`)
    revisa(p.mesesSinComprar >= 1 && p.mesesSinComprar <= 12, `${et}: ${p.nombre} con ${p.mesesSinComprar} meses sin comprar`)
  }
  const enGrupos = GRUPOS_INACTIVOS.reduce((s, g) => s + caidos.personas.filter((p) => p.mesesSinComprar >= g.desde && p.mesesSinComprar <= g.hasta).length, 0)
  revisa(enGrupos === caidos.personas.length, `${et}: hay inactivos fuera de los 4 grupos`)

  // 6. Nuevos sin recomprar: entraron con 30 pts en los últimos 3 meses y no han recomprado
  for (const p of nuevos) {
    revisa(p.mesesDesde >= 0 && p.mesesDesde <= 2, `${et}: nuevo ${p.nombre} fuera de la ventana de 3 meses`)
    const recompro = meses.slice(ids.indexOf(p.mesInscripcion.id) + 1, k + 1)
      .some((x) => x.distribuidores.some((d) => d.volumen > 0 && claveDistribuidor(d) === p.clave))
    revisa(!recompro, `${et}: nuevo ${p.nombre} ya recompró y sigue en la lista`)
  }

  // 7. Casi califican: entre 60 y 119
  for (const p of casi) revisa(p.volumen >= 60 && p.volumen < PV_ACTIVO_PLAN, `${et}: casi califica con ${p.volumen}`)

  // 8. Modelo y plan
  let plan = null
  if (modelo) {
    revisa(modelo.retencion >= 0 && modelo.retencion <= 1, `${et}: retención del modelo fuera de 0–1`)
    revisa(isFinite(modelo.ptsPorActivo) && modelo.ptsPorActivo > 0, `${et}: pts por activo inválido`)
    if (rango.siguiente) {
      plan = proyectarRango({ ...modelo, metaVolumen: rango.meta })
      revisa(plan.meses === null || plan.meses >= 0, `${et}: plan con meses negativos`)
      revisa(plan.meses !== 0 || m.volumenRed >= rango.meta, `${et}: el plan dice "Ya alcanza" pero faltan ${rango.falta} pts`)
      revisa(isFinite(plan.estable), `${et}: nivel estable infinito (retención ${modelo.retencion})`)
    }
  }

  filas.push({
    mes: et, activos: act, nuevos: contarNuevos(m.distribuidores), califican: contarCalificados(m.distribuidores),
    volumen: m.volumenRed, rango: rango.nombre, falta: rango.siguiente ? `${rango.falta} p/${rango.siguiente}` : '—',
    ret: `${Math.round(ret.pct)}%`, revividos: rev.personas.length, quedaron: `${rev.siguen.length}/${rev.anteriores}`,
    caidos: caidos.personas.length, nuevosRiesgo: nuevos.length, casi: casi.length,
    plan: plan ? (plan.llega ? `${plan.meses}m` : 'no alcanza') : '—',
    _meta: rango.meta,
  })
}

// 9. Respaldo: el simulado pasa la validación de importación
const imp = validarImportacion({ meses })
revisa(imp.valido, `respaldo simulado rechazado: ${imp.error}`)

// 10. Historia y directorio no truenan con cientos de personas
const stats = estadisticasGanancias(meses)
revisa(stats.total > 0, 'estadísticas de ganancias vacías')
const dir = directorioDistribuidores(meses)
revisa(dir.length === new Set(meses.flatMap((m) => m.distribuidores.map(claveDistribuidor))).size, 'directorio con personas duplicadas o faltantes')
revisa(analisisInscripciones(meses) != null, 'análisis de inscripciones nulo')

// 11. Nube: un teléfono vacío baja todo; editar un mes en otro lado gana el más reciente
const f1 = fusionarMeses([], meses, [])
revisa(f1.meses.length === meses.length && f1.borrarEnNube.length === 0, 'fusión: teléfono vacío no bajó todo')
const editado = { ...meses[5], ganancias: 1, actualizado: 99 }
const f2 = fusionarMeses(meses.map((m) => (m.id === editado.id ? editado : m)), meses, ids)
revisa(f2.meses.find((m) => m.id === editado.id).ganancias === 1 && f2.subir.length === 1, 'fusión: edición local no ganó')

// Qué tan bien atinó el plan: ¿llegó al rango en los meses que dijo?
let aciertos = 0, conPlan = 0
filas.forEach((f, j) => {
  const n = parseInt(f.plan)
  if (!Number.isFinite(n) || n === 0) return
  const destino = filas[j + n]
  if (!destino) return
  conPlan++
  if (filas.slice(j + 1, j + n + 2).some((x) => x.volumen >= f._meta)) aciertos++
})
for (const f of filas) delete f._meta

// ---------- Reporte ----------
console.table(filas)
if (conPlan) console.log(`Plan de rango: en ${aciertos} de ${conPlan} meses con proyección, el rango llegó en el plazo dicho (±1 mes).`)
const ultimo = filas.at(-1)
console.log(`\nPersonas inventadas: ${personas.length} · último mes ${ultimo.mes}: ${ultimo.activos} activos, ${ultimo.volumen.toLocaleString('en-US')} pts → ${ultimo.rango}`)
if (fallas.length) {
  console.log(`\n✗ ${fallas.length} fallas:`)
  for (const f of [...new Set(fallas)].slice(0, 40)) console.log('  - ' + f)
  process.exitCode = 1
} else {
  console.log('\n✓ Todas las revisiones pasan')
}

const i = process.argv.indexOf('--json')
if (i > 0) {
  fs.writeFileSync(process.argv[i + 1], JSON.stringify({ version: 1, app: 'mlm-dashboard', meses, seguimiento: {} }))
  console.log(`Respaldo simulado guardado en ${process.argv[i + 1]}`)
}
