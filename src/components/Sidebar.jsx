// Barra lateral fija con navegación e interruptor de tema.
// En pantallas chicas (<900px) se convierte en barra inferior con solo iconos.

import { useApp } from '../context/AppContext'
import {
  IconoInicio, IconoDashboard, IconoCaptura, IconoHistorial,
  IconoConfig, IconoSol, IconoLuna, IconoUsuarios,
} from './Iconos'

const PAGINAS = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: IconoInicio },
  { id: 'dashboard', etiqueta: 'Dashboard', Icono: IconoDashboard },
  { id: 'captura', etiqueta: 'Captura de datos', Icono: IconoCaptura },
  { id: 'distribuidores', etiqueta: 'Distribuidores', Icono: IconoUsuarios },
  { id: 'historial', etiqueta: 'Historial', Icono: IconoHistorial },
  { id: 'configuracion', etiqueta: 'Configuración', Icono: IconoConfig },
]

export default function Sidebar() {
  const { pagina, navegar, tema, setTema } = useApp()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="punto" />
        MLM Dashboard
      </div>

      <nav>
        <div className="nav-seccion">Menú</div>
        {PAGINAS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            className={`nav-item ${pagina === id ? 'activo' : ''}`}
            onClick={() => navegar(id)}
          >
            <Icono />
            <span className="nav-texto">{etiqueta}</span>
          </button>
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
