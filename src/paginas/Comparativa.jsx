// Comparativa de continuidad: toma a los distribuidores que estuvieron activos
// con un volumen mínimo en un mes, y muestra cómo les fue en el mes siguiente
// (se mantuvieron, subieron, bajaron o se cayeron).

import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { ordenarPorFecha, comparativaMeses } from '../utils/calculos'
import { pts, num, etiquetaMes } from '../utils/formato'

const COLORES_AVATAR = [
  'linear-gradient(135deg, #e8b34b, #f7d488)',
  'linear-gradient(135deg, #4d8df7, #8ab4ff)',
  'linear-gradient(135deg, #9d7bf7, #c3adff)',
  'linear-gradient(135deg, #3ddc84, #8af0b8)',
  'linear-gradient(135deg, #f76d8d, #ffa8bc)',
  'linear-gradient(135deg, #5ad0e0, #9ce8f2)',
]
const iniciales = (n) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

const ESTADO = {
  subio: { texto: 'Subió', color: 'var(--verde)', fondo: 'var(--verde-suave)', icono: '▲' },
  igual: { texto: 'Se mantuvo', color: 'var(--azul)', fondo: 'var(--azul-suave)', icono: '=' },
  bajo: { texto: 'Bajó', color: 'var(--dorado)', fondo: 'var(--dorado-suave)', icono: '▼' },
  inactivo: { texto: 'Se cayó', color: 'var(--rojo)', fondo: 'var(--rojo-suave)', icono: '✕' },
}

export default function Comparativa() {
  const { meses, navegar } = useApp()
  const orden = useMemo(() => ordenarPorFecha(meses), [meses])
  const [minimo, setMinimo] = useState(40)
  const [filtro, setFiltro] = useState('todos') // todos | inactivo | bajo | activos

  // Por defecto: penúltimo (base) vs último (objetivo)
  const [baseId, setBaseId] = useState(orden.length >= 2 ? orden[orden.length - 2].id : '')
  const [objetivoId, setObjetivoId] = useState(orden.length >= 1 ? orden[orden.length - 1].id : '')

  const comp = useMemo(
    () => comparativaMeses(meses, baseId, objetivoId, minimo),
    [meses, baseId, objetivoId, minimo]
  )

  if (orden.length < 2) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Tu equipo</div>
            <h1>Comparativa mes a mes</h1>
            <p>Sin datos suficientes todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '48px 24px' }}>
            Necesitas al menos dos meses registrados para comparar la continuidad de tu red 📊
          </div>
        </div>
      </div>
    )
  }

  const { filas, resumen, base, objetivo } = comp
  const visibles = filas.filter((f) => {
    if (filtro === 'todos') return true
    if (filtro === 'activos') return f.estado !== 'inactivo'
    return f.estado === filtro
  })

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Comparativa mes a mes</h1>
          <p>Quién tenía volumen un mes y cómo le fue al siguiente.</p>
        </div>
      </div>

      {/* Controles */}
      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <div className="controles-comp">
          <label>
            <span>Base (mes anterior)</span>
            <select className="selector-mes" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {[...orden].reverse().map((m) => (
                <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
              ))}
            </select>
          </label>
          <span className="flecha-comp">→</span>
          <label>
            <span>Objetivo (mes actual)</span>
            <select className="selector-mes" value={objetivoId} onChange={(e) => setObjetivoId(e.target.value)}>
              {[...orden].reverse().map((m) => (
                <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Volumen mínimo</span>
            <select className="selector-mes" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))}>
              <option value={30}>30 pts o más</option>
              <option value={40}>40 pts o más</option>
              <option value={50}>50 pts o más</option>
              <option value={100}>100 pts o más</option>
              <option value={200}>200 pts o más</option>
            </select>
          </label>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid-dashboard" style={{ marginBottom: 20 }}>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Con ≥{minimo} pts en {etiquetaMes(base)}</div>
          <div className="kpi-cifra">{num(resumen.total)}</div>
          <div className="kpi-etiqueta">distribuidores a seguir</div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Continuidad</div>
          <div className="kpi-cifra" style={{ color: 'var(--verde)' }}>
            {resumen.continuidad == null ? '—' : `${Math.round(resumen.continuidad)}%`}
          </div>
          <div className="kpi-etiqueta">
            {num(resumen.activos)} siguieron activos · {num(resumen.subieron)} subieron, {num(resumen.bajaron)} bajaron
          </div>
        </div>
        <div className="tarjeta col-4">
          <div className="titulo-seccion">Se cayeron</div>
          <div className="kpi-cifra" style={{ color: resumen.inactivos ? 'var(--rojo)' : 'var(--verde)' }}>
            {num(resumen.inactivos)}
          </div>
          <div className="kpi-etiqueta">no tuvieron volumen en {etiquetaMes(objetivo)}</div>
        </div>
      </div>

      {/* Lista comparativa */}
      <div className="tarjeta">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            ['todos', `Todos (${resumen.total})`],
            ['inactivo', `Se cayeron (${resumen.inactivos})`],
            ['bajo', `Bajaron (${resumen.bajaron})`],
            ['activos', `Siguen activos (${resumen.activos})`],
          ].map(([val, txt]) => (
            <button
              key={val}
              className={`chip-filtro ${filtro === val ? 'activo' : ''}`}
              onClick={() => setFiltro(val)}
            >
              {txt}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <div className="vacio">No hay distribuidores en esta categoría 👍</div>
        ) : (
          visibles.map((d, i) => {
            const e = ESTADO[d.estado]
            return (
              <div className="dist-fila" key={d.clave}>
                <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                  {iniciales(d.nombre)}
                </span>
                <div className="dist-info">
                  <div className="dist-nombre">
                    {d.nombre}
                    {d.id && <span className="dist-id">ID {d.id}</span>}
                  </div>
                  <div className="comp-volumenes">
                    {pts(d.volumenBase)} <span className="comp-flecha">→</span> {pts(d.volumenActual)}
                  </div>
                </div>
                <span className="badge-estado" style={{ color: e.color, background: e.fondo, borderColor: e.color }}>
                  {e.icono} {e.texto}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
