// Historial: tabla con todos los meses registrados. Permite editar un mes
// (abre Captura precargada) o eliminarlo con confirmación en línea.

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ordenarPorFecha } from '../utils/calculos'
import { mxn, pts, num, etiquetaMes } from '../utils/formato'

export default function Historial() {
  const { meses, eliminarMes, navegar, avisar } = useApp()
  const [confirmandoId, setConfirmandoId] = useState(null)

  // Del más reciente al más antiguo
  const ordenados = ordenarPorFecha(meses).reverse()

  function confirmarEliminar(registro) {
    eliminarMes(registro.id)
    setConfirmandoId(null)
    avisar(`${etiquetaMes(registro)} eliminado`, 'error')
  }

  return (
    <div>
      <div className="encabezado">
        <h1>Historial</h1>
        <p>Todos los meses que has registrado. Puedes editarlos o eliminarlos.</p>
      </div>

      <div className="tarjeta">
        {ordenados.length === 0 ? (
          <div className="vacio">
            Todavía no has registrado ningún mes.<br />
            Ve a <strong>Captura de datos</strong> para guardar el primero 🚀
            <div style={{ marginTop: 16 }}>
              <button className="boton boton-primario boton-chico" onClick={() => navegar('captura')}>
                Capturar mi primer mes
              </button>
            </div>
          </div>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ganancias</th>
                  <th>Volumen de red</th>
                  <th>Nuevos inicios</th>
                  <th>Activos</th>
                  <th>Distribuidores</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((m) => (
                  <tr key={m.id}>
                    <td>{etiquetaMes(m)}</td>
                    <td>{mxn(m.ganancias)}</td>
                    <td>{pts(m.volumenRed)}</td>
                    <td>{num(m.nuevosInicios)}</td>
                    <td>{num(m.activos)}</td>
                    <td>{m.distribuidores.length}</td>
                    <td>
                      <div className="acciones-fila">
                        {confirmandoId === m.id ? (
                          <>
                            <span style={{ fontSize: 13, color: 'var(--rojo)', fontWeight: 700, alignSelf: 'center' }}>
                              ¿Eliminar?
                            </span>
                            <button className="boton boton-peligro boton-chico" onClick={() => confirmarEliminar(m)}>
                              Sí
                            </button>
                            <button className="boton boton-secundario boton-chico" onClick={() => setConfirmandoId(null)}>
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="boton boton-secundario boton-chico" onClick={() => navegar('captura', m.id)}>
                              Editar
                            </button>
                            <button className="boton boton-peligro boton-chico" onClick={() => setConfirmandoId(m.id)}>
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
