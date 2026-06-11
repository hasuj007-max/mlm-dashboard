// Componente raíz: sidebar + página activa + notificaciones.

import { useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Inicio from './paginas/Inicio'
import Dashboard from './paginas/Dashboard'
import Captura from './paginas/Captura'
import Historial from './paginas/Historial'
import Configuracion from './paginas/Configuracion'

const PAGINAS = {
  inicio: Inicio,
  dashboard: Dashboard,
  captura: Captura,
  historial: Historial,
  configuracion: Configuracion,
}

export default function App() {
  const { pagina, toast } = useApp()
  const Pagina = PAGINAS[pagina] || Inicio

  return (
    <div className="app">
      <Sidebar />
      <main className="contenido">
        <Pagina />
      </main>

      {toast && (
        <div className={`toast ${toast.tipo}`} key={toast.id}>
          {toast.mensaje}
        </div>
      )}
    </div>
  )
}
