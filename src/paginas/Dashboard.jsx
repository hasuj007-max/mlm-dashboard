// Dashboard principal: grid de tarjetas ejecutivas con KPIs y gráficas.

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ReferenceLine, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  mesMasReciente, mesAnterior, cambioPct, tendencia, ultimosMeses, ranking, esNuevo,
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
  const { mesesVisibles, esDemo, navegar, tema } = useApp()
  const colores = coloresGrafica(tema)

  const actual = mesMasReciente(mesesVisibles)
  const anterior = mesAnterior(mesesVisibles, actual)

  // Series para las gráficas (orden cronológico)
  const serie12 = ultimosMeses(mesesVisibles, 12).map((m) => ({
    nombre: etiquetaCorta(m),
    completo: etiquetaMes(m),
    ganancias: m.ganancias,
    inicios: m.nuevosInicios,
    volumen: m.volumenRed,
  }))
  const serie3 = serie12.slice(-3)

  const pctMeta = actual?.metaGanancias > 0 ? (actual.ganancias / actual.metaGanancias) * 100 : 0
  const rumbo = tendencia(mesesVisibles)
  const top = ranking(actual)
  const liderVolumen = top[0]?.volumen || 0
  const medallas = ['🥇', '🥈', '🥉']

  const RUMBOS = {
    creciendo: { texto: 'Creciendo', icono: '↗', descripcion: 'Tus ganancias suben en los últimos 3 meses. ¡Sigue así!' },
    estable: { texto: 'Estable', icono: '→', descripcion: 'El negocio se mantiene sin cambios fuertes en 3 meses.' },
    descenso: { texto: 'En descenso', icono: '↘', descripcion: 'Las ganancias bajaron en los últimos 3 meses. Hora de activar a tu equipo.' },
  }

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Panel ejecutivo</div>
          <h1>Dashboard</h1>
          <p>{actual ? `Mostrando ${etiquetaMes(actual)}` : 'Sin datos'}</p>
        </div>
        <button className="boton boton-primario" onClick={() => navegar('captura')}>
          <IconoMas /> Capturar mes
        </button>
      </div>

      {esDemo && (
        <div className="aviso-demo">
          <span>👋 Estás viendo datos de ejemplo. Captura tu primer mes real para empezar.</span>
          <button className="boton boton-primario boton-chico" onClick={() => navegar('captura')}>
            Capturar mi primer mes
          </button>
        </div>
      )}

      <div className="grid-dashboard">
        {/* ===== Resumen del negocio ===== */}
        <div className="tarjeta col-8">
          <div className="titulo-seccion">Resumen del negocio</div>
          <div className="fila-kpis">
            <div className="kpi">
              <div className="kpi-icono dorado"><IconoDolar /></div>
              <div>
                <div className="kpi-cifra">{usd(actual?.ganancias)}</div>
                <div className="kpi-etiqueta">
                  Ganancias del mes{' '}
                  <Cambio pct={cambioPct(actual?.ganancias, anterior?.ganancias)} />
                </div>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icono verde"><IconoUsuarioMas /></div>
              <div>
                <div className="kpi-cifra">{num(actual?.nuevosInicios)}</div>
                <div className="kpi-etiqueta">
                  Nuevos inicios{' '}
                  <Cambio pct={cambioPct(actual?.nuevosInicios, anterior?.nuevosInicios)} />
                </div>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icono azul"><IconoUsuarios /></div>
              <div>
                <div className="kpi-cifra">{num(actual?.activos)}</div>
                <div className="kpi-etiqueta">
                  Distribuidores activos{' '}
                  <Cambio pct={cambioPct(actual?.activos, anterior?.activos)} />
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
              {actual?.metaGanancias > 0 && (
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

        {/* ===== Meta mensual ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Meta mensual alcanzada</div>
          <div className="gauge-contenedor">
            <Gauge porcentaje={pctMeta} />
            <div className="gauge-motivacion">{fraseMotivacional(pctMeta)}</div>
            <div className="gauge-detalle">
              {usd(actual?.ganancias)} de {usd(actual?.metaGanancias)}
            </div>
          </div>
        </div>

        {/* ===== Top distribuidores ===== */}
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Top distribuidores del mes</div>
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
                        {esNuevo(d) && <span className="badge-nuevo">Nuevo</span>}
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
          <div className="titulo-seccion">Volumen de red · últimos 12 meses</div>
          <div className="fila-kpis">
            <div>
              <div className="kpi-cifra" style={{ fontSize: 28 }}>{pts(actual?.volumenRed)}</div>
              <div className="kpi-etiqueta">
                vs. mes anterior{' '}
                <Cambio pct={cambioPct(actual?.volumenRed, anterior?.volumenRed)} />
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
      </div>
    </div>
  )
}
