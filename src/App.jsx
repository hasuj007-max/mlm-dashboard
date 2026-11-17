// Componente raíz: navegación + página activa + notificaciones.

import { useApp } from './context/AppContext'
import Navegacion from './components/Navegacion'
import Resumen from './paginas/Resumen'
import Gente from './paginas/Gente'
import Captura from './paginas/Captura'
import Mas from './paginas/Mas'

const PAGINAS = { resumen: Resumen, gente: Gente, captura: Captura, mas: Mas }

export default function App() {
  const { pagina, toast } = useApp()
  const Pagina = PAGINAS[pagina] || Resumen

  return (
    <div className="app">
      <Navegacion />
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
