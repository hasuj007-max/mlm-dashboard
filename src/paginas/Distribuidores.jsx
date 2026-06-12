// Directorio de distribuidores: buscador por nombre o ID con el volumen
// total histórico acumulado de cada uno y su detalle mes a mes.

import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { directorioDistribuidores } from '../utils/calculos'
import { pts, MESES_CORTOS } from '../utils/formato'

/** Paleta para los avatares (misma del ranking del dashboard) */
const COLORES_AVATAR = [
  'linear-gradient(135deg, #e8b34b, #f7d488)',
  'linear-gradient(135deg, #4d8df7, #8ab4ff)',
  'linear-gradient(135deg, #9d7bf7, #c3adff)',
  'linear-gradient(135deg, #3ddc84, #8af0b8)',
  'linear-gradient(135deg, #f76d8d, #ffa8bc)',
  'linear-gradient(135deg, #5ad0e0, #9ce8f2)',
]

function iniciales(nombre) {
  return nombre.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function Distribuidores() {
  const { meses, navegar } = useApp()
  const [busqueda, setBusqueda] = useState('')

  // Directorio completo, ordenado por volumen histórico de mayor a menor
  const directorio = useMemo(() => directorioDistribuidores(meses), [meses])

  const q = busqueda.trim().toLocaleLowerCase('es')
  const resultados = q
    ? directorio.filter(
        (d) => d.nombre.toLocaleLowerCase('es').includes(q) || d.id.toLowerCase().includes(q)
      )
    : directorio

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Distribuidores</h1>
          <p>
            {directorio.length} distribuidores registrados · busca por nombre o ID
            para ver su volumen histórico
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
          resultados.map((d, i) => (
            <div className="dist-fila" key={d.clave}>
              <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                {iniciales(d.nombre)}
              </span>

              <div className="dist-info">
                <div className="dist-nombre">
                  {d.nombre}
                  {d.id && <span className="dist-id">ID {d.id}</span>}
                </div>
                <details className="dist-detalle">
                  <summary>
                    {d.meses.length} {d.meses.length === 1 ? 'mes' : 'meses'} con volumen · ver detalle
                  </summary>
                  <div className="dist-meses">
                    {[...d.meses].reverse().map((m, j) => (
                      <div className="dist-mes-fila" key={j}>
                        <span>{MESES_CORTOS[m.mes - 1]} {m.anio}</span>
                        <span>{pts(m.volumen)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="dist-total">
                <div className="dist-total-cifra">{pts(d.total)}</div>
                <div className="dist-total-etiqueta">volumen histórico</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
