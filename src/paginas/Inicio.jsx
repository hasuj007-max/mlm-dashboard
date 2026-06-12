// Página de inicio: bienvenida, resumen rápido del último mes y accesos directos.

import { useApp } from '../context/AppContext'
import { mesMasReciente, mesAnterior, cambioPct } from '../utils/calculos'
import { usd, num, etiquetaMes } from '../utils/formato'
import Cambio from '../components/Cambio'

export default function Inicio() {
  const { mesesVisibles, esDemo, navegar } = useApp()

  const actual = mesMasReciente(mesesVisibles)
  const anterior = mesAnterior(mesesVisibles, actual)

  return (
    <div>
      <div className="tarjeta hero">
        <h1>
          Bienvenido a tu <span>centro de mando</span>
        </h1>
        <p>
          Registra los resultados de tu red mes a mes y observa cómo crece tu negocio:
          ganancias, volumen, nuevos inicios y el ranking de tu equipo, todo en un solo lugar.
        </p>
        <div className="acciones">
          <button className="boton boton-primario" onClick={() => navegar('captura')}>
            Capturar este mes
          </button>
          <button className="boton boton-secundario" onClick={() => navegar('dashboard')}>
            Ver dashboard
          </button>
        </div>
      </div>

      {esDemo && (
        <div className="aviso-demo">
          <span>👋 Aún no tienes datos reales: las cifras de abajo son de ejemplo.</span>
        </div>
      )}

      {actual && (
        <div className="grid-accesos">
          <div className="tarjeta">
            <div className="titulo-seccion">Ganancias · {etiquetaMes(actual)}</div>
            <div className="kpi-cifra">{usd(actual.ganancias)}</div>
            <div className="kpi-etiqueta">
              vs. mes anterior <Cambio pct={cambioPct(actual.ganancias, anterior?.ganancias)} />
            </div>
          </div>
          <div className="tarjeta">
            <div className="titulo-seccion">Nuevos inicios</div>
            <div className="kpi-cifra">{num(actual.nuevosInicios)}</div>
            <div className="kpi-etiqueta">
              vs. mes anterior <Cambio pct={cambioPct(actual.nuevosInicios, anterior?.nuevosInicios)} />
            </div>
          </div>
          <div className="tarjeta">
            <div className="titulo-seccion">Distribuidores activos</div>
            <div className="kpi-cifra">{num(actual.activos)}</div>
            <div className="kpi-etiqueta">
              vs. mes anterior <Cambio pct={cambioPct(actual.activos, anterior?.activos)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
