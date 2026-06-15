// Directorio de distribuidores: buscador por nombre o ID con el volumen
// total histórico y, al abrir, la ficha individual con su gráfica de volumen
// mes a mes, mejor mes y meses activo.

import { useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'
import { useApp } from '../context/AppContext'
import { directorioDistribuidores, serieDistribuidor } from '../utils/calculos'
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

const TOPE_SIN_BUSQUEDA = 50

/** Ficha individual: se renderiza solo al abrir el detalle de una persona */
function Ficha({ meses, dist, tema }) {
  const serie = useMemo(
    () => serieDistribuidor(meses, dist.clave).map((m) => ({
      nombre: `${MESES_CORTOS[m.mes - 1]} ${String(m.anio).slice(2)}`,
      volumen: m.volumen,
    })),
    [meses, dist.clave]
  )

  const activos = dist.meses.filter((m) => m.volumen > 0)
  const mejor = activos.reduce((a, b) => (b.volumen > a.volumen ? b : a), activos[0] || { volumen: 0 })
  const promedio = activos.length ? dist.total / activos.length : 0
  const eje = tema === 'claro' ? '#5d6880' : '#8b96ad'

  return (
    <div className="ficha">
      <div className="ficha-stats">
        <div>
          <div className="ficha-stat-cifra">{num(activos.length)}</div>
          <div className="ficha-stat-etq">meses activo</div>
        </div>
        <div>
          <div className="ficha-stat-cifra">{pts(mejor.volumen)}</div>
          <div className="ficha-stat-etq">mejor mes ({MESES_CORTOS[mejor.mes - 1]} {mejor.anio})</div>
        </div>
        <div>
          <div className="ficha-stat-cifra">{pts(Math.round(promedio))}</div>
          <div className="ficha-stat-etq">promedio cuando activo</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={serie} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-ficha" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d8df7" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#4d8df7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="nombre" tick={{ fill: eje, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <Tooltip
            contentStyle={{ background: 'var(--tarjeta-solida)', border: '1px solid var(--borde)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'var(--texto)', fontWeight: 700 }}
            formatter={(v) => [pts(v), 'Volumen']}
          />
          <Area type="monotone" dataKey="volumen" stroke="#4d8df7" strokeWidth={2} fill="url(#grad-ficha)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Distribuidores() {
  const { meses, navegar, tema } = useApp()
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null) // clave de la ficha desplegada

  const directorio = useMemo(() => directorioDistribuidores(meses), [meses])

  const q = busqueda.trim().toLocaleLowerCase('es')
  const filtrados = q
    ? directorio.filter(
        (d) => d.nombre.toLocaleLowerCase('es').includes(q) || d.id.toLowerCase().includes(q)
      )
    : directorio
  const resultados = q ? filtrados : filtrados.slice(0, TOPE_SIN_BUSQUEDA)

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Distribuidores</h1>
          <p>
            {directorio.length} distribuidores registrados · busca por nombre o ID
            y abre a cualquiera para ver su historial
          </p>
        </div>
      </div>

      <input
        type="text"
        className="input-busqueda"
        placeholder="🔍  Buscar por nombre o ID…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        autoFocus
      />

      <div className="tarjeta">
        {directorio.length === 0 ? (
          <div className="vacio">
            Aún no hay distribuidores registrados.<br />
            Captura tu primer mes y aquí aparecerá todo tu equipo 👥
            <div style={{ marginTop: 16 }}>
              <button className="boton boton-primario boton-chico" onClick={() => navegar('captura')}>
                Capturar un mes
              </button>
            </div>
          </div>
        ) : resultados.length === 0 ? (
          <div className="vacio">
            No se encontró ningún distribuidor con «{busqueda.trim()}».<br />
            Revisa la escritura o intenta con el ID.
          </div>
        ) : (
          <>
            {resultados.map((d, i) => {
              const estaAbierto = abierto === d.clave
              return (
                <div key={d.clave}>
                  <div
                    className="dist-fila dist-fila-click"
                    onClick={() => setAbierto(estaAbierto ? null : d.clave)}
                  >
                    <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                      {iniciales(d.nombre)}
                    </span>
                    <div className="dist-info">
                      <div className="dist-nombre">
                        {d.nombre}
                        {d.id && <span className="dist-id">ID {d.id}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--azul)', fontWeight: 600, marginTop: 2 }}>
                        {d.meses.length} {d.meses.length === 1 ? 'mes' : 'meses'} con volumen · {estaAbierto ? 'ocultar' : 'ver ficha'}
                      </div>
                    </div>
                    <div className="dist-total">
                      <div className="dist-total-cifra">{pts(d.total)}</div>
                      <div className="dist-total-etiqueta">volumen histórico</div>
                    </div>
                  </div>
                  {estaAbierto && <Ficha meses={meses} dist={d} tema={tema} />}
                </div>
              )
            })}
            {!q && directorio.length > TOPE_SIN_BUSQUEDA && (
              <div className="vacio" style={{ paddingBottom: 4 }}>
                Mostrando los {TOPE_SIN_BUSQUEDA} de mayor volumen. Usa el buscador para encontrar a cualquier otro.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
