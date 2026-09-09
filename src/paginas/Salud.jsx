// Salud de la red: retención mes a mes y distribuidores en riesgo (los que
// generaban volumen y dejaron de hacerlo en el último mes registrado).

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  actividadPorMes, distribuidoresEnRiesgo, mesMasReciente, ordenarPorFecha,
} from '../utils/calculos'
import { pts, num, etiquetaMes, etiquetaCorta, MESES_CORTOS } from '../utils/formato'
import { paleta, COLORES_AVATAR, coloresGrafica, ejeX, ejeY, iniciales } from '../utils/tema'

export default function Salud() {
  const { meses, navegar, tema } = useApp()
  const colores = coloresGrafica(tema)
  const P = paleta(tema)
  const [ventana, setVentana] = useState(3)

  const actividad = useMemo(() => actividadPorMes(meses), [meses])
  const enRiesgo = useMemo(() => distribuidoresEnRiesgo(meses, ventana), [meses, ventana])
  const ultimo = mesMasReciente(meses)

  if (!ultimo) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Tu equipo</div>
            <h1>Salud de la red</h1>
            <p>Sin datos todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '48px 24px' }}>
            Captura al menos dos meses para ver retención y distribuidores en riesgo 📉
          </div>
        </div>
      </div>
    )
  }

  // Serie para la gráfica (últimos 12 meses): activos, nuevos, perdidos
  const orden = ordenarPorFecha(meses)
  const serie = actividad.slice(-12).map((a, i, arr) => ({
    nombre: etiquetaCorta(a),
    activos: a.activos,
    nuevos: a.nuevos,
    perdidos: -a.perdidos, // negativo para que la barra baje
    retencion: a.tasaRetencion,
  }))

  const ultimaActividad = actividad[actividad.length - 1]
  const volumenEnRiesgo = enRiesgo.reduce((s, d) => s + d.ultimoVolumen, 0)

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Salud de la red</h1>
          <p>Quién está activo, quién entró y a quién conviene reactivar.</p>
        </div>
      </div>

      {/* KPIs de la última actividad */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Activos · {etiquetaMes(ultimo)}</div>
          <div className="kpi-cifra">{num(ultimaActividad.activos)}</div>
          <div className="kpi-etiqueta">distribuidores con volumen este mes</div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Retención mensual</div>
          <div className="kpi-cifra" style={{ color: 'var(--verde)' }}>
            {ultimaActividad.tasaRetencion == null ? '—' : `${Math.round(ultimaActividad.tasaRetencion)}%`}
          </div>
          <div className="kpi-etiqueta">
            siguieron activos del mes anterior · {num(ultimaActividad.nuevos)} nuevos, {num(ultimaActividad.perdidos)} se fueron
          </div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">En riesgo</div>
          <div className="kpi-cifra" style={{ color: enRiesgo.length ? 'var(--rojo)' : 'var(--verde)' }}>
            {num(enRiesgo.length)}
          </div>
          <div className="kpi-etiqueta">dejaron de generar volumen · {pts(volumenEnRiesgo)} en juego</div>
        </div>
      </div>

      {/* Gráfica de actividad */}
      <div className="tarjeta col-12" style={{ marginBottom: 20 }}>
        <div className="titulo-seccion">Actividad de la red · últimos 12 meses</div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={serie} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
            <CartesianGrid stroke={colores.rejilla} vertical={false} />
            <XAxis dataKey="nombre" {...ejeX(colores)} />
            <YAxis {...ejeY(colores, { width: 34 })} />
            <Tooltip
              contentStyle={{
                background: 'var(--superficie)',
                border: '1px solid var(--borde-fuerte)',
                borderRadius: 9,
                boxShadow: 'var(--sombra-flotante)',
                fontSize: 12.5,
              }}
              labelStyle={{ color: 'var(--texto)', fontWeight: 700 }}
              cursor={{ fill: colores.rejilla }}
              formatter={(v, n) => [Math.abs(v), n]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="nuevos" name="Nuevos" stackId="a" fill={P.verde} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="perdidos" name="Se fueron" stackId="a" fill={P.rojo} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Line type="monotone" dataKey="activos" name="Activos" stroke={P.azul} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de en riesgo */}
      <div className="tarjeta">
        <div className="tarjeta-cabecera">
          <div className="titulo-seccion">
            A reactivar
            <span className="sub">Activos antes, sin volumen en {etiquetaMes(ultimo)}</span>
          </div>
          <select className="selector-mes" value={ventana} onChange={(e) => setVentana(Number(e.target.value))}>
            <option value={1}>Mirar 1 mes atrás</option>
            <option value={2}>Mirar 2 meses atrás</option>
            <option value={3}>Mirar 3 meses atrás</option>
            <option value={6}>Mirar 6 meses atrás</option>
          </select>
        </div>

        {enRiesgo.length === 0 ? (
          <div className="vacio">
            🎉 ¡Nadie en riesgo en esta ventana! Todos tus activos recientes siguen produciendo.
          </div>
        ) : (
          <div>
            {enRiesgo.map((d, i) => (
              <div className="dist-fila" key={d.clave}>
                <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                  {iniciales(d.nombre)}
                </span>
                <div className="dist-info">
                  <div className="dist-nombre">
                    {d.nombre}
                    {d.id && <span className="dist-id">ID {d.id}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--texto-suave)', fontWeight: 600, marginTop: 2 }}>
                    Último volumen: {MESES_CORTOS[d.ultimoMes - 1]} {d.ultimoAnio} · activo {d.mesesActivo} {d.mesesActivo === 1 ? 'mes' : 'meses'} en la ventana
                  </div>
                </div>
                <div className="dist-total">
                  <div className="dist-total-cifra" style={{ color: 'var(--rojo)' }}>{pts(d.ultimoVolumen)}</div>
                  <div className="dist-total-etiqueta">su último volumen</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
