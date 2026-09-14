// Barra lateral fija con navegación agrupada e interruptor de tema.
// En pantallas chicas (<900px) se convierte en barra inferior con solo iconos.

import { Fragment } from 'react'
import { useApp } from '../context/AppContext'
import {
  IconoInicio, IconoDashboard, IconoCaptura, IconoHistorial,
  IconoConfig, IconoSol, IconoLuna, IconoUsuarios, IconoCompartir, IconoComparativa,
  IconoRetencion,
} from './Iconos'

// Menú agrupado por intención: ver el negocio, cuidar al equipo, mover datos.
const GRUPOS = [
  {
    titulo: 'Panel',
    paginas: [
      { id: 'inicio', etiqueta: 'Inicio', Icono: IconoInicio },
      { id: 'dashboard', etiqueta: 'Dashboard', Icono: IconoDashboard },
    ],
  },
  {
    titulo: 'Mi equipo',
    paginas: [
      { id: 'distribuidores', etiqueta: 'Distribuidores', Icono: IconoUsuarios },
      { id: 'retencion', etiqueta: 'Retención', Icono: IconoRetencion },
    ],
  },
  {
    titulo: 'Análisis',
    paginas: [
      { id: 'comparativa', etiqueta: 'Comparativa', Icono: IconoComparativa },
      { id: 'reporte', etiqueta: 'Reporte mensual', Icono: IconoCompartir },
    ],
  },
  {
    titulo: 'Datos',
    paginas: [
      { id: 'captura', etiqueta: 'Captura de datos', Icono: IconoCaptura },
      { id: 'historial', etiqueta: 'Historial', Icono: IconoHistorial },
      { id: 'configuracion', etiqueta: 'Configuración', Icono: IconoConfig },
    ],
  },
]

export default function Sidebar() {
  const { pagina, navegar, tema, setTema } = useApp()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="punto" />
        <span className="sidebar-marca">
          <b>MLM Dashboard</b>
          <span>Centro de mando</span>
        </span>
      </div>

      <nav>
        {GRUPOS.map(({ titulo, paginas }) => (
          <Fragment key={titulo}>
            <div className="nav-seccion">{titulo}</div>
            {paginas.map(({ id, etiqueta, Icono }) => (
              <button
                key={id}
                className={`nav-item ${pagina === id ? 'activo' : ''}`}
                onClick={() => navegar(id)}
                title={etiqueta}
                aria-current={pagina === id ? 'page' : undefined}
              >
                <Icono />
                <span className="nav-texto">{etiqueta}</span>
              </button>
            ))}
          </Fragment>
        ))}
      </nav>

      <button
        className="boton-tema"
        onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
        title="Cambiar tema"
      >
        {tema === 'oscuro' ? <IconoSol /> : <IconoLuna />}
        <span className="nav-texto">
          {tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
        </span>
      </button>
    </aside>
  )
}
