// Dashboard principal: grid de tarjetas ejecutivas con KPIs y gráficas.
// Permite elegir el mes a mostrar o ver el acumulado histórico completo.

import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ReferenceLine, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  mesAnterior, cambioPct, tendencia, ranking, esNuevo,
  ordenarPorFecha, directorioDistribuidores, estadisticasGanancias,
} from '../utils/calculos'
import { usd, pts, num, etiquetaMes, etiquetaCorta } from '../utils/formato'
import Cambio from '../components/Cambio'
import Gauge from '../components/Gauge'
import TooltipGrafica from '../components/TooltipGrafica'
import { IconoDolar, IconoUsuarioMas, IconoUsuarios, IconoMas } from '../components/Iconos'

/** Paleta para los avatares con iniciales del ranking */
const COLORES_AVATAR = [
  'linear-gradient(135deg, #e8b34b, #f7d488)',
  'linear-gradient(135deg, #4d8df7, #8ab4ff)',
  'linear-gradient(135deg, #9d7bf7, #c3adff)',
  'linear-gradient(135deg, #3ddc84, #8af0b8)',
  'linear-gradient(135deg, #f76d8d, #ffa8bc)',
  'linear-gradient(135deg, #5ad0e0, #9ce8f2)',
]

/** Iniciales de un nombre: "María González" → "MG" */
function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Colores de ejes/rejilla según el tema (los acentos no cambian) */
function coloresGrafica(tema) {
  return tema === 'claro'
    ? { eje: '#5d6880', rejilla: 'rgba(20,30,60,0.08)' }
    : { eje: '#8b96ad', rejilla: 'rgba(255,255,255,0.07)' }
}

/** Texto motivacional del gauge según el avance hacia la meta */
function fraseMotivacional(pct) {
  if (pct >= 100) return '¡Meta superada! Eres imparable 🏆'
  if (pct >= 75) return '¡Ya casi! El último empujón cuenta doble 🔥'
  if (pct >= 40) return 'Buen ritmo, mantén el enfoque 💪'
  if (pct > 0) return 'Cada contacto te acerca a la meta 🚀'
  return 'Es momento de arrancar el mes 🌱'
}

export default function Dashboard() {
  const { meses, navegar, tema } = useApp()
  const colores = coloresGrafica(tema)

  // Qué se muestra: '' = último mes, 'historico' = acumulado, o el id de un mes
  const [vista, setVista] = useState('')

  const orden = ordenarPorFecha(meses)
  const ultimo = orden[orden.length - 1] || null
  const esHistorico = vista === 'historico'
  const actual = esHistorico ? null : orden.find((m) => m.id === vista) || ultimo
  const anterior = esHistorico ? null : mesAnterior(meses, actual)

  // Cifras mostradas: las del mes elegido, o la suma de todos los meses
  const datos = esHistorico
    ? {
        ganancias: orden.reduce((s, m) => s + m.ganancias, 0),
        nuevosInicios: orden.reduce((s, m) => s + m.nuevosInicios, 0),
        activos: ultimo?.activos ?? 0,
        volumenRed: orden.reduce((s, m) => s + m.volumenRed, 0),
        metaGanancias: orden.reduce((s, m) => s + m.metaGanancias, 0),
      }
    : actual

  // Series para las gráficas: hasta el mes elegido (o todo en histórico)
  const visibles = esHistorico ? orden : orden.slice(0, orden.indexOf(actual) + 1)
  const serie12 = visibles.slice(-12).map((m) => ({
    nombre: etiquetaCorta(m),
    completo: etiquetaMes(m),
    ganancias: m.ganancias,
    inicios: m.nuevosInicios,
    volumen: m.volumenRed,
  }))
  const serie3 = serie12.slice(-3)

  const pctMeta = datos?.metaGanancias > 0 ? (datos.ganancias / datos.metaGanancias) * 100 : 0
  const rumbo = tendencia(visibles)
  const stats = estadisticasGanancias(meses)

  // Volumen promedio por distribuidor activo (volumen ÷ activos)
  let promedioPorActivo
  if (esHistorico) {
    // promedio de los promedios mensuales, solo meses con activos
    const conActivos = orden.filter((m) => m.activos > 0)
    promedioPorActivo = conActivos.length
      ? conActivos.reduce((s, m) => s + m.volumenRed / m.activos, 0) / conActivos.length
      : null
  } else {
    promedioPorActivo = actual?.activos > 0 ? actual.volumenRed / actual.activos : null
  }
  // Ranking: del mes elegido, o el top histórico por volumen acumulado
  const top = esHistorico
    ? directorioDistribuidores(meses).slice(0, 8).map((d) => ({ ...d, volumen: d.total }))
    : ranking(actual)
  const liderVolumen = top[0]?.volumen || 0
  const medallas = ['🥇', '🥈', '🥉']

  const RUMBOS = {
    creciendo: { texto: 'Creciendo', icono: '↗', descripcion: 'Tus ganancias suben en los últimos 3 meses. ¡Sigue así!' },
    estable: { texto: 'Estable', icono: '→', descripcion: 'El negocio se mantiene sin cambios fuertes en 3 meses.' },
    descenso: { texto: 'En descenso', icono: '↘', descripcion: 'Las ganancias bajaron en los últimos 3 meses. Hora de activar a tu equipo.' },
  }

  // Sin meses registrados: estado vacío amigable en lugar de gráficas en cero
  if (!ultimo) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Panel ejecutivo</div>
            <h1>Dashboard</h1>
            <p>Sin datos todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '56px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            Tu dashboard está listo, solo falta alimentarlo.<br />
            Captura tu primer mes y aquí verás tus ganancias, tu meta,
            el ranking de tu equipo y la tendencia del negocio.
            <div style={{ marginTop: 20 }}>
              <button className="boton boton-primario" onClick={() => navegar('captura')}>
                <IconoMas /> Capturar mi primer mes
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Panel ejecutivo</div>
          <h1>Dashboard</h1>
          <p>
            {esHistorico
              ? `Acumulado de ${orden.length} ${orden.length === 1 ? 'mes' : 'meses'} (${etiquetaMes(orden[0])} – ${etiquetaMes(ultimo)})`
              : `Mostrando ${etiquetaMes(actual)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="selector-mes"
            value={esHistorico ? 'historico' : actual.id}
            onChange={(e) => setVista(e.target.value === ultimo.id ? '' : e.target.value)}
            title="Elige el mes a mostrar o el acumulado histórico"
          >
            <option value="historico">📊 Histórico (total)</option>
            {[...orden].reverse().map((m) => (
              <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
            ))}
          </select>
          <button className="boton boton-primario" onClick={() => navegar('captura')}>
            <IconoMas /> Capturar mes
          </button>
        </div>
      </div>

      <div className="grid-dashboard">
        {/* ===== Resumen del negocio ===== */}
        <div className="tarjeta col-8">
          <div className="titulo-seccion">Resumen del negocio</div>
          <div className="fila-kpis">
            <div className="kpi">
              <div className="kpi-icono dorado"><IconoDolar /></div>
              <div>
                <div className="kpi-cifra">{usd(datos?.ganancias)}</div>
                <div className="kpi-etiqueta">
                  {esHistorico ? 'Ganancias totales' : 'Ganancias del mes'}{' '}
                  {!esHistorico && <Cambio pct={cambioPct(actual?.ganancias, anterior?.ganancias)} />}
                </div>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icono verde"><IconoUsuarioMas /></div>
              <div>
                <div className="kpi-cifra">{num(datos?.nuevosInicios)}</div>
                <div className="kpi-etiqueta">
                  {esHistorico ? 'Nuevos inicios totales' : 'Nuevos inicios'}{' '}
                  {!esHistorico && <Cambio pct={cambioPct(actual?.nuevosInicios, anterior?.nuevosInicios)} />}
                </div>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icono azul"><IconoUsuarios /></div>
              <div>
                <div className="kpi-cifra">{num(datos?.activos)}</div>
                <div className="kpi-etiqueta">
                  {esHistorico ? 'Activos (último mes)' : 'Distribuidores activos'}{' '}
                  {!esHistorico && <Cambio pct={cambioPct(actual?.activos, anterior?.activos)} />}
                </div>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={serie12} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-area-azul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d8df7" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#4d8df7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis
                dataKey="nombre"
                tick={{ fill: colores.eje, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: colores.eje, fontSize: 12 }}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                axisLine={false} tickLine={false} width={44}
              />
              <Tooltip content={<TooltipGrafica formatear={usd} />} cursor={{ stroke: colores.rejilla }} />
              {!esHistorico && actual?.metaGanancias > 0 && (
                <ReferenceLine
                  y={actual.metaGanancias}
                  stroke="#e8b34b" strokeDasharray="6 6" strokeOpacity={0.55}
                  label={{ value: 'Meta', position: 'insideTopRight', fill: '#e8b34b', fontSize: 11, fontWeight: 700 }}
                />
              )}
              <Area
                type="monotone" dataKey="ganancias"
                stroke="#4d8df7" strokeWidth={2.5}
                fill="url(#grad-area-azul)"
                dot={false} activeDot={{ r: 5, fill: '#4d8df7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Meta mensual / acumulada ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">
            {esHistorico ? 'Meta acumulada alcanzada' : 'Meta mensual alcanzada'}
          </div>
          <div className="gauge-contenedor">
            <Gauge porcentaje={pctMeta} />
            <div className="gauge-motivacion">{fraseMotivacional(pctMeta)}</div>
            <div className="gauge-detalle">
              {usd(datos?.ganancias)} de {usd(datos?.metaGanancias)}
            </div>
          </div>
        </div>

        {/* ===== Top distribuidores ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">
            {esHistorico ? 'Top distribuidores · histórico' : 'Top distribuidores del mes'}
          </div>
          {top.length === 0 ? (
            <div className="vacio">
              Aún no hay distribuidores capturados este mes.<br />
              Agrégalos desde <strong>Captura de datos</strong> ✍️
            </div>
          ) : (
            <div className="ranking">
              {top.slice(0, 8).map((d, i) => (
                <div className="ranking-fila" key={d.nombre + i}>
                  {i < 3 ? (
                    <span className="ranking-medalla">{medallas[i]}</span>
                  ) : (
                    <span className="ranking-posicion">{i + 1}</span>
                  )}
                  <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                    {iniciales(d.nombre)}
                  </span>
                  <div className="ranking-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span className="ranking-nombre">
                        {d.nombre}
                        {!esHistorico && esNuevo(d) && <span className="badge-nuevo">Nuevo</span>}
                      </span>
                      <span className="ranking-volumen">{pts(d.volumen)}</span>
                    </div>
                    <div className="barra-progreso">
                      <div style={{ width: `${liderVolumen ? (d.volumen / liderVolumen) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Nuevos inicios ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Nuevos inicios</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serie12.slice(-8)} margin={{ top: 22, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-barra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d8df7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4d8df7" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="grad-barra-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f7d488" />
                  <stop offset="100%" stopColor="#d49a2e" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis
                dataKey="nombre"
                tick={{ fill: colores.eje, fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<TooltipGrafica formatear={(v) => `${v} inicios`} />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="inicios" radius={[8, 8, 0, 0]} maxBarSize={34}>
                <LabelList dataKey="inicios" position="top" style={{ fill: colores.eje, fontSize: 12, fontWeight: 700 }} />
                {serie12.slice(-8).map((m, i, arr) => (
                  // El mes más reciente se destaca en dorado
                  <Cell key={m.nombre} fill={i === arr.length - 1 ? 'url(#grad-barra-actual)' : 'url(#grad-barra)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Rumbo del negocio ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Rumbo del negocio</div>
          {rumbo == null ? (
            <div className="vacio">Se necesitan al menos 2 meses registrados para calcular la tendencia 📈</div>
          ) : (
            <div className="rumbo">
              <div className={`rumbo-estado ${rumbo}`}>
                <span>{RUMBOS[rumbo].icono}</span> {RUMBOS[rumbo].texto}
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={serie3} margin={{ top: 10, right: 16, left: 16, bottom: 5 }}>
                  <Tooltip content={<TooltipGrafica formatear={usd} />} cursor={false} />
                  <Line
                    type="monotone" dataKey="ganancias"
                    stroke={rumbo === 'creciendo' ? '#3ddc84' : rumbo === 'descenso' ? '#ff5a5a' : '#e8b34b'}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0, fill: rumbo === 'creciendo' ? '#3ddc84' : rumbo === 'descenso' ? '#ff5a5a' : '#e8b34b' }}
                  />
                  <XAxis dataKey="nombre" tick={{ fill: colores.eje, fontSize: 11 }} axisLine={false} tickLine={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="rumbo-descripcion">{RUMBOS[rumbo].descripcion}</div>
            </div>
          )}
        </div>

        {/* ===== Volumen de red (evolución completa) ===== */}
        <div className="tarjeta col-12">
          <div className="titulo-seccion">
            {esHistorico ? 'Volumen de red · total acumulado' : 'Volumen de red · últimos 12 meses'}
          </div>
          <div className="fila-kpis">
            <div>
              <div className="kpi-cifra" style={{ fontSize: 28 }}>{pts(datos?.volumenRed)}</div>
              <div className="kpi-etiqueta">
                {esHistorico ? (
                  `suma de ${orden.length} meses`
                ) : (
                  <>
                    vs. mes anterior{' '}
                    <Cambio pct={cambioPct(actual?.volumenRed, anterior?.volumenRed)} />
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="kpi-cifra" style={{ fontSize: 28, color: 'var(--dorado)' }}>
                {promedioPorActivo != null ? pts(Math.round(promedioPorActivo)) : '—'}
              </div>
              <div className="kpi-etiqueta">
                volumen promedio por activo{esHistorico ? ' (promedio mensual)' : ` · ${num(actual?.activos)} activos`}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={serie12} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-area-dorado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8b34b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#e8b34b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis
                dataKey="nombre"
                tick={{ fill: colores.eje, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: colores.eje, fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                axisLine={false} tickLine={false} width={40}
              />
              <Tooltip content={<TooltipGrafica formatear={pts} />} cursor={{ stroke: colores.rejilla }} />
              <Area
                type="monotone" dataKey="volumen"
                stroke="#e8b34b" strokeWidth={2.5}
                fill="url(#grad-area-dorado)"
                dot={false} activeDot={{ r: 5, fill: '#e8b34b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Estadísticas de ganancias ===== */}
        {stats && (
          <div className="tarjeta col-12">
            <div className="titulo-seccion">Estadísticas de ganancias · historial completo</div>
            <div className="fila-estadisticas">
              <div className="estadistica">
                <div className="estadistica-cifra">{usd(stats.promedio)}</div>
                <div className="estadistica-etq">Promedio mensual</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra">{usd(stats.promedio3)}</div>
                <div className="estadistica-etq">Promedio últimos 3 meses</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra" style={{ color: 'var(--verde)' }}>{usd(stats.mejor.ganancias)}</div>
                <div className="estadistica-etq">Mejor mes · {etiquetaMes(stats.mejor)}</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra" style={{ color: 'var(--rojo)' }}>{usd(stats.peor.ganancias)}</div>
                <div className="estadistica-etq">Mes más bajo · {etiquetaMes(stats.peor)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
