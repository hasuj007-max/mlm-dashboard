// Navegación de 4 destinos: barra lateral en escritorio, barra inferior con
// icono y texto en el teléfono. Cada destino responde una sola pregunta.

import { useApp } from '../context/AppContext'
import { IconoResumen, IconoGente, IconoCargar, IconoPuntos } from './Iconos'

const DESTINOS = [
  { id: 'resumen', etiqueta: 'Resumen', Icono: IconoResumen },
  { id: 'gente', etiqueta: 'Mi gente', Icono: IconoGente },
  { id: 'captura', etiqueta: 'Cargar mes', Icono: IconoCargar },
  { id: 'mas', etiqueta: 'Más', Icono: IconoPuntos },
]

export default function Navegacion() {
  const { pagina, navegar } = useApp()

  return (
    <aside className="nav">
      <div className="nav-marca">
        <span className="nav-sello">M</span>
        <span>Mi red</span>
      </div>
      <nav className="nav-lista">
        {DESTINOS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            className={`nav-boton ${pagina === id ? 'activo' : ''}`}
            onClick={() => navegar(id)}
            aria-current={pagina === id ? 'page' : undefined}
          >
            <Icono />
            <span>{etiqueta}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
