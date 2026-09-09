// Retención de inscripciones: analiza a todos los distribuidores que entraron
// con 30 pts (inscripción) y mide cuántos siguen activos, cuántos nunca
// recompraron, su vida promedio, la curva de retención y las cohortes por año.

import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { analisisInscripciones, CV_INSCRIPCION } from '../utils/calculos'
import { pts, num, MESES_CORTOS } from '../utils/formato'

const COLORES_AVATAR = [
  'linear-gradient(135deg, #e8b34b, #f7d488)',
  'linear-gradient(135deg, #4d8df7, #8ab4ff)',
  'linear-gradient(135deg, #9d7bf7, #c3adff)',
  'linear-gradient(135deg, #3ddc84, #8af0b8)',
  'linear-gradient(135deg, #f76d8d, #ffa8bc)',
  'linear-gradient(135deg, #5ad0e0, #9ce8f2)',
]
const iniciales = (n) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

/** "2025-03" → "Mar 2025" */
function etiquetaId(id) {
  const [a, m] = id.split('-')
  return `${MESES_CORTOS[Number(m) - 1]} ${a}`
}

function coloresGrafica(tema) {
  return tema === 'claro'
    ? { eje: '#5d6880', rejilla: 'rgba(20,30,60,0.08)' }
    : { eje: '#8b96ad', rejilla: 'rgba(255,255,255,0.07)' }
}

export default function Retencion() {
  const { meses, navegar, tema } = useApp()
  const colores = coloresGrafica(tema)
  const a = useMemo(() => analisisInscripciones(meses), [meses])

  if (!a) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Tu equipo</div>
            <h1>Retención de inscritos</h1>
            <p>Sin datos suficientes todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '48px 24px' }}>
            Captura al menos dos meses con lista de distribuidores para medir la retención 📉
          </div>
        </div>
      </div>
    )
  }

  const serieCurva = a.curva
    .filter((c) => c.conOportunidad > 0)
    .map((c) => ({ nombre: `Mes +${c.n}`, pct: Number(c.pct.toFixed(1)), personas: c.activos, base: c.conOportunidad }))

  const serieCohortes = a.cohortes
    .filter((c) => c.pctSiguienteMes != null)
    .map((c) => ({ nombre: c.anio, pct: Number(c.pctSiguienteMes.toFixed(1)), inscritos: c.inscritos, vida: c.vidaPromedio }))

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Retención de inscritos</h1>
          <p>
            De los que entraron con {CV_INSCRIPCION} pts: cuántos se quedaron y cuántos se fueron ·{' '}
            {etiquetaId(a.desde)} → {etiquetaId(a.hasta)}
          </p>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Entraron con {CV_INSCRIPCION} pts</div>
          <div className="kpi-cifra">{num(a.total)}</div>
          <div className="kpi-etiqueta">
            personas en {a.mesesAnalizados} meses
            {a.recienEntrados > 0 && ` · ${a.recienEntrados} entraron apenas este mes`}
          </div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Siguen activas hoy</div>
          <div className="kpi-cifra" style={{ color: 'var(--verde)' }}>
            {a.pctSiguen == null ? '—' : `${a.pctSiguen.toFixed(1)}%`}
          </div>
          <div className="kpi-etiqueta">
            {num(a.siguen)} de {num(a.evaluables)} · {num(a.sefueron)} ya no están
          </div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Nunca recompraron</div>
          <div className="kpi-cifra" style={{ color: 'var(--rojo)' }}>
            {a.pctNuncaRecompraron == null ? '—' : `${a.pctNuncaRecompraron.toFixed(1)}%`}
          </div>
          <div className="kpi-etiqueta">
            {num(a.nuncaRecompraron)} murieron en su mes de inscripción
          </div>
        </div>
      </div>

      {/* Curva de retención */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        <div className="tarjeta col-8">
          <div className="titulo-seccion">Curva de retención · ¿cuánto aguantan?</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={serieCurva} margin={{ top: 24, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-ret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d8df7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4d8df7" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colores.rejilla} vertical={false} />
              <XAxis dataKey="nombre" tick={{ fill: colores.eje, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: colores.eje, fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false} tickLine={false} width={40}
              />
              <Tooltip
                contentStyle={{ background: 'var(--tarjeta-solida)', border: '1px solid var(--borde)', borderRadius: 12 }}
                labelStyle={{ color: 'var(--texto)', fontWeight: 700 }}
                formatter={(v, n, p) => [`${v}% (${p.payload.personas} de ${p.payload.base})`, 'Siguen activos']}
              />
              <Bar dataKey="pct" fill="url(#grad-ret)" radius={[8, 8, 0, 0]} maxBarSize={54} isAnimationActive={false}>
                <LabelList dataKey="pct" position="top" formatter={(v) => `${v}%`}
                  style={{ fill: colores.eje, fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="rumbo-descripcion" style={{ textAlign: 'left', marginTop: 4 }}>
            De cada 100 que entran, {Math.round(100 - (a.curva[0]?.pct ?? 0))} no vuelven a comprar al mes siguiente.
            Quien sobrevive los primeros meses tiende a quedarse.
          </div>
        </div>

        <div className="tarjeta col-4">
          <div className="titulo-seccion">Vida del distribuidor</div>
          <div className="fila-estadisticas" style={{ gridTemplateColumns: '1fr' }}>
            <div className="estadistica">
              <div className="estadistica-cifra">{a.vidaPromedio.toFixed(1)} meses</div>
              <div className="estadistica-etq">Vida promedio (meses con volumen)</div>
            </div>
            <div className="estadistica">
              <div className="estadistica-cifra">{a.vidaMediana} {a.vidaMediana === 1 ? 'mes' : 'meses'}</div>
              <div className="estadistica-etq">Mediana · lo que dura la persona típica</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohortes por año */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
      <div className="tarjeta col-12">
        <div className="titulo-seccion">Retención por año de entrada · ¿estás mejorando?</div>
        <ResponsiveContainer width="99%" height={200}>
          <BarChart data={serieCohortes} margin={{ top: 24, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-coh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3ddc84" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3ddc84" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={colores.rejilla} vertical={false} />
            <XAxis dataKey="nombre" tick={{ fill: colores.eje, fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: colores.eje, fontSize: 12 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: 'var(--tarjeta-solida)', border: '1px solid var(--borde)', borderRadius: 12 }}
              labelStyle={{ color: 'var(--texto)', fontWeight: 700 }}
              formatter={(v, n, p) => [`${v}% · ${p.payload.inscritos} inscritos · vida ${p.payload.vida.toFixed(1)} meses`, 'Sobrevivió al mes +1']}
            />
            <Bar dataKey="pct" fill="url(#grad-coh)" radius={[8, 8, 0, 0]} maxBarSize={70} isAnimationActive={false}>
              <LabelList dataKey="pct" position="top" formatter={(v) => `${v}%`}
                style={{ fill: colores.eje, fontSize: 12, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="rumbo-descripcion" style={{ textAlign: 'left' }}>
          % de los inscritos de cada año que volvió a comprar al mes siguiente.
        </div>
      </div>
      </div>

      {/* Sobrevivientes */}
      <div className="tarjeta">
        <div className="titulo-seccion">
          Los {a.sobrevivientes.length} sobrevivientes · entraron con {CV_INSCRIPCION} pts y siguen activos
        </div>
        {a.sobrevivientes.length === 0 ? (
          <div className="vacio">
            Ninguno de los inscritos sigue activo en el último mes.<br />
            Revisa <strong>Salud de la red</strong> para ver a quién reactivar.
          </div>
        ) : (
          a.sobrevivientes.map((d, i) => (
            <div className="dist-fila" key={d.clave}>
              <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                {iniciales(d.nombre)}
              </span>
              <div className="dist-info">
                <div className="dist-nombre">{d.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--texto-suave)', fontWeight: 600, marginTop: 2 }}>
                  Entró en {etiquetaId(d.mesIngreso)} · {d.mesesActivo} {d.mesesActivo === 1 ? 'mes' : 'meses'} activo
                </div>
              </div>
              <div className="dist-total">
                <div className="dist-total-cifra">{pts(d.volumenActual)}</div>
                <div className="dist-total-etiqueta">su volumen hoy</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
