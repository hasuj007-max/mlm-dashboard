// Dashboard principal: fila de KPIs con minigráficas + rejilla de tarjetas.
// Permite elegir el mes a mostrar o ver el acumulado histórico completo.

import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ReferenceLine, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  mesAnterior, cambioPct, tendencia, ranking, esNuevo,
  ordenarPorFecha, directorioDistribuidores, estadisticasGanancias, analisisInscripciones,
  CV_INSCRIPCION,
} from '../utils/calculos'
import { usd, pts, num, etiquetaMes, etiquetaCorta } from '../utils/formato'
import { paleta, COLORES_AVATAR, coloresGrafica, ejeX, ejeY, iniciales } from '../utils/tema'
import Cambio from '../components/Cambio'
import Gauge from '../components/Gauge'
import Sparkline from '../components/Sparkline'
import TooltipGrafica from '../components/TooltipGrafica'
import { IconoDolar, IconoUsuarioMas, IconoUsuarios, IconoCapas, IconoMas } from '../components/Iconos'

/** Texto motivacional del gauge según el avance hacia la meta */
function fraseMotivacional(pct) {
  if (pct >= 100) return '¡Meta superada! Eres imparable 🏆'
  if (pct >= 75) return '¡Ya casi! El último empujón cuenta doble 🔥'
  if (pct >= 40) return 'Buen ritmo, mantén el enfoque 💪'
  if (pct > 0) return 'Cada contacto te acerca a la meta 🚀'
  return 'Es momento de arrancar el mes 🌱'
}

const RUMBOS = {
  creciendo: { texto: 'Creciendo', icono: '↗', descripcion: 'Tus ganancias suben en los últimos 3 meses. ¡Sigue así!' },
  estable: { texto: 'Estable', icono: '→', descripcion: 'El negocio se mantiene sin cambios fuertes en 3 meses.' },
  descenso: { texto: 'En descenso', icono: '↘', descripcion: 'Las ganancias bajaron en los últimos 3 meses. Hora de activar a tu equipo.' },
}

const MEDALLAS = ['🥇', '🥈', '🥉']

/** Tarjeta compacta de KPI: icono, cifra, comparación y minigráfica al pie */
function TileKPI({ etiqueta, valor, tono, icono, delta, pie, serie, clave, color }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile-top">
        <span className={`kpi-icono ${tono}`}>{icono}</span>
        <span className="kpi-tile-etq">{etiqueta}</span>
      </div>
      <div className="kpi-tile-cifra">{valor}</div>
      <div className="kpi-tile-pie">
        {delta !== undefined && <Cambio pct={delta} />}
        <span>{pie}</span>
      </div>
      <div className="kpi-tile-spark">
        <Sparkline datos={serie} clave={clave} color={color} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { meses, navegar, tema } = useApp()
  const colores = coloresGrafica(tema)
  const P = paleta(tema)

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
    activos: m.activos,
    volumen: m.volumenRed,
  }))
  const serie3 = serie12.slice(-3)

  const pctMeta = datos?.metaGanancias > 0 ? (datos.ganancias / datos.metaGanancias) * 100 : 0
  const rumbo = tendencia(visibles)
  const stats = estadisticasGanancias(meses)
  const retencion = analisisInscripciones(meses)

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
          <div className="vacio" style={{ padding: '48px 24px' }}>
            <div className="vacio-icono">📊</div>
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

  // Pie de los tiles: contra qué se compara la cifra grande
  const pieComparacion = esHistorico
    ? `${orden.length} ${orden.length === 1 ? 'mes' : 'meses'} acumulados`
    : anterior ? `vs. ${etiquetaCorta(anterior)}` : 'primer mes registrado'

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Panel ejecutivo</div>
          <h1>Dashboard</h1>
          <p>
            {esHistorico
              ? `Acumulado de ${orden.length} ${orden.length === 1 ? 'mes' : 'meses'} · ${etiquetaMes(orden[0])} – ${etiquetaMes(ultimo)}`
              : `Resultados de ${etiquetaMes(actual)}`}
          </p>
        </div>
        <div className="encabezado-acciones">
          <select
            className="selector-mes"
            value={esHistorico ? 'historico' : actual.id}
            onChange={(e) => setVista(e.target.value === ultimo.id ? '' : e.target.value)}
            title="Elige el mes a mostrar o el acumulado histórico"
          >
            <option value="historico">Histórico (total)</option>
            {[...orden].reverse().map((m) => (
              <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
            ))}
          </select>
          <button className="boton boton-primario" onClick={() => navegar('captura')}>
            <IconoMas /> Capturar mes
          </button>
        </div>
      </div>

      {/* ===== Fila de KPIs ===== */}
      <div className="grid-kpis">
        <TileKPI
          etiqueta={esHistorico ? 'Ganancias totales' : 'Ganancias del mes'}
          valor={usd(datos?.ganancias)}
          tono="dorado" icono={<IconoDolar />}
          delta={esHistorico ? undefined : cambioPct(actual?.ganancias, anterior?.ganancias)}
          pie={pieComparacion}
          serie={serie12} clave="ganancias" color={P.dorado}
        />
        <TileKPI
          etiqueta={esHistorico ? 'Nuevos inicios totales' : 'Nuevos inicios'}
          valor={num(datos?.nuevosInicios)}
          tono="verde" icono={<IconoUsuarioMas />}
          delta={esHistorico ? undefined : cambioPct(actual?.nuevosInicios, anterior?.nuevosInicios)}
          pie={pieComparacion}
          serie={serie12} clave="inicios" color={P.verde}
        />
        <TileKPI
          etiqueta={esHistorico ? 'Activos (último mes)' : 'Distribuidores activos'}
          valor={num(datos?.activos)}
          tono="azul" icono={<IconoUsuarios />}
          delta={esHistorico ? undefined : cambioPct(actual?.activos, anterior?.activos)}
          pie={esHistorico ? etiquetaMes(ultimo) : pieComparacion}
          serie={serie12} clave="activos" color={P.azul}
        />
        <TileKPI
          etiqueta={esHistorico ? 'Volumen acumulado' : 'Volumen de red'}
          valor={pts(datos?.volumenRed)}
          tono="morado" icono={<IconoCapas />}
          delta={esHistorico ? undefined : cambioPct(actual?.volumenRed, anterior?.volumenRed)}
          pie={pieComparacion}
          serie={serie12} clave="volumen" color={P.morado}
        />
      </div>

      <div className="grid-dashboard">
        {/* ===== Ganancias mes a mes ===== */}
        <div className="tarjeta col-8">
          <div className="tarjeta-cabecera">
            <div className="titulo-seccion">
              Ganancias mes a mes
              <span className="sub">
                {esHistorico ? 'Todo el historial' : `Hasta ${etiquetaMes(actual)}`} · últimos {serie12.length} meses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={252}>
            <AreaChart data={serie12} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-area-dorado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.dorado} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={P.dorado} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis dataKey="nombre" {...ejeX(colores)} />
              <YAxis {...ejeY(colores, { tickFormatter: (v) => `$${Math.round(v / 1000)}k` })} />
              <Tooltip content={<TooltipGrafica formatear={usd} />} cursor={{ stroke: colores.rejilla }} />
              {!esHistorico && actual?.metaGanancias > 0 && (
                <ReferenceLine
                  y={actual.metaGanancias}
                  stroke={P.dorado} strokeDasharray="5 5" strokeOpacity={0.5}
                  label={{ value: 'Meta', position: 'insideTopRight', fill: P.dorado, fontSize: 10.5, fontWeight: 700 }}
                />
              )}
              <Area
                type="monotone" dataKey="ganancias"
                stroke={P.dorado} strokeWidth={2.2}
                fill="url(#grad-area-dorado)"
                dot={false} activeDot={{ r: 4.5, fill: P.dorado, stroke: 'none' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Meta mensual / acumulada ===== */}
        <div className="tarjeta tarjeta-acento col-4">
          <div className="titulo-seccion">
            {esHistorico ? 'Meta acumulada' : 'Meta del mes'}
            <span className="sub">{usd(datos?.ganancias)} de {usd(datos?.metaGanancias)}</span>
          </div>
          <div className="gauge-contenedor">
            <Gauge porcentaje={pctMeta} />
            <div className="gauge-motivacion">{fraseMotivacional(pctMeta)}</div>
            <div className="gauge-detalle">
              {datos?.metaGanancias > 0
                ? pctMeta >= 100
                  ? `${usd(datos.ganancias - datos.metaGanancias)} por encima de la meta`
                  : `Faltan ${usd(datos.metaGanancias - datos.ganancias)}`
                : 'Sin meta definida para este periodo'}
            </div>
          </div>
        </div>

        {/* ===== Top distribuidores ===== */}
        <div className="tarjeta col-4">
          <div className="tarjeta-cabecera">
            <div className="titulo-seccion">
              Top distribuidores
              <span className="sub">{esHistorico ? 'Volumen acumulado' : `Volumen de ${etiquetaMes(actual)}`}</span>
            </div>
            <button className="boton boton-secundario boton-chico" onClick={() => navegar('distribuidores')}>
              Ver todos
            </button>
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
                    <span className="ranking-medalla">{MEDALLAS[i]}</span>
                  ) : (
                    <span className="ranking-posicion">{i + 1}</span>
                  )}
                  <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                    {iniciales(d.nombre)}
                  </span>
                  <div className="ranking-info">
                    <div className="ranking-linea">
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
        <div className="tarjeta tarjeta-flex col-4">
          <div className="titulo-seccion">
            Nuevos inicios
            <span className="sub">Personas que entraron cada mes</span>
          </div>
          <div className="grafica-flex">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie12.slice(-8)} margin={{ top: 24, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-barra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.azul} stopOpacity={0.75} />
                  <stop offset="100%" stopColor={P.azul} stopOpacity={0.22} />
                </linearGradient>
                <linearGradient id="grad-barra-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.doradoClaro} />
                  <stop offset="100%" stopColor={P.dorado} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis dataKey="nombre" {...ejeX(colores)} />
              <Tooltip content={<TooltipGrafica formatear={(v) => `${v} inicios`} />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="inicios" radius={[6, 6, 0, 0]} maxBarSize={30}>
                <LabelList dataKey="inicios" position="top" style={{ fill: colores.eje, fontSize: 11, fontWeight: 700 }} />
                {serie12.slice(-8).map((m, i, arr) => (
                  // El mes más reciente se destaca en dorado
                  <Cell key={m.nombre} fill={i === arr.length - 1 ? 'url(#grad-barra-actual)' : 'url(#grad-barra)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* ===== Rumbo del negocio ===== */}
        <div className="tarjeta tarjeta-flex col-4">
          <div className="titulo-seccion">
            Rumbo del negocio
            <span className="sub">Tendencia de los últimos 3 meses</span>
          </div>
          {rumbo == null ? (
            <div className="vacio">Se necesitan al menos 2 meses registrados para calcular la tendencia 📈</div>
          ) : (
            <div className="rumbo">
              <div className={`rumbo-estado ${rumbo}`}>
                <span>{RUMBOS[rumbo].icono}</span> {RUMBOS[rumbo].texto}
              </div>
              <div className="rumbo-grafica">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie3} margin={{ top: 12, right: 16, left: 16, bottom: 4 }}>
                  {/* Escala ajustada a los datos: con 3 puntos, lo que importa
                      es la forma de la tendencia, no la distancia al cero */}
                  <YAxis hide domain={[(min) => min * 0.9, (max) => max * 1.08]} />
                  <Tooltip content={<TooltipGrafica formatear={usd} />} cursor={false} />
                  <Line
                    type="monotone" dataKey="ganancias"
                    stroke={rumbo === 'creciendo' ? P.verde : rumbo === 'descenso' ? P.rojo : P.dorado}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0, fill: rumbo === 'creciendo' ? P.verde : rumbo === 'descenso' ? P.rojo : P.dorado }}
                  />
                  <XAxis dataKey="nombre" {...ejeX(colores)} />
                </LineChart>
              </ResponsiveContainer>
              </div>
              <div className="rumbo-descripcion">{RUMBOS[rumbo].descripcion}</div>
            </div>
          )}
        </div>

        {/* ===== Volumen de red (evolución completa) ===== */}
        <div className="tarjeta col-12">
          <div className="tarjeta-cabecera">
            <div className="titulo-seccion">
              Volumen de red
              <span className="sub">
                {esHistorico ? 'Total acumulado del historial' : 'Evolución de los últimos 12 meses'}
              </span>
            </div>
            <div className="fila-estadisticas" style={{ minWidth: 320, flex: 1, maxWidth: 460 }}>
              <div className="estadistica">
                <div className="estadistica-cifra">{pts(datos?.volumenRed)}</div>
                <div className="estadistica-etq">
                  {esHistorico ? `suma de ${orden.length} meses` : 'volumen total del mes'}
                </div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra" style={{ color: 'var(--dorado)' }}>
                  {promedioPorActivo != null ? pts(Math.round(promedioPorActivo)) : '—'}
                </div>
                <div className="estadistica-etq">
                  promedio por activo{esHistorico ? ' (mensual)' : ` · ${num(actual?.activos)} activos`}
                </div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={serie12} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-area-morado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={P.morado} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={P.morado} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis dataKey="nombre" {...ejeX(colores)} />
              <YAxis {...ejeY(colores, { tickFormatter: (v) => `${Math.round(v / 1000)}k`, width: 40 })} />
              <Tooltip content={<TooltipGrafica formatear={pts} />} cursor={{ stroke: colores.rejilla }} />
              <Area
                type="monotone" dataKey="volumen"
                stroke={P.morado} strokeWidth={2.2}
                fill="url(#grad-area-morado)"
                dot={false} activeDot={{ r: 4.5, fill: P.morado, stroke: 'none' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ===== Estadísticas de ganancias ===== */}
        {stats && (
          <div className="tarjeta col-6">
            <div className="titulo-seccion">
              Estadísticas de ganancias
              <span className="sub">Sobre el historial completo</span>
            </div>
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

        {/* ===== Retención de inscritos (resumen) ===== */}
        {retencion && (
          <div className={`tarjeta ${stats ? 'col-6' : 'col-12'}`}>
            <div className="tarjeta-cabecera">
              <div className="titulo-seccion">
                Retención de inscritos
                <span className="sub">Los que entraron con {CV_INSCRIPCION} pts</span>
              </div>
              <button className="boton boton-secundario boton-chico" onClick={() => navegar('retencion')}>
                Análisis completo →
              </button>
            </div>
            <div className="fila-estadisticas">
              <div className="estadistica">
                <div className="estadistica-cifra">{num(retencion.total)}</div>
                <div className="estadistica-etq">Entraron en total</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra" style={{ color: 'var(--verde)' }}>
                  {retencion.pctSiguen == null ? '—' : `${retencion.pctSiguen.toFixed(1)}%`}
                </div>
                <div className="estadistica-etq">Siguen activos ({num(retencion.siguen)})</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra" style={{ color: 'var(--rojo)' }}>
                  {retencion.pctNuncaRecompraron == null ? '—' : `${retencion.pctNuncaRecompraron.toFixed(1)}%`}
                </div>
                <div className="estadistica-etq">Nunca recompraron ({num(retencion.nuncaRecompraron)})</div>
              </div>
              <div className="estadistica">
                <div className="estadistica-cifra">{retencion.vidaPromedio.toFixed(1)} meses</div>
                <div className="estadistica-etq">Vida promedio del inscrito</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
