// Página de inicio: bienvenida, resumen rápido del último mes y accesos directos.

import { useApp } from '../context/AppContext'
import { mesMasReciente, mesAnterior, cambioPct } from '../utils/calculos'
import { usd, num, pts, etiquetaMes } from '../utils/formato'
import Cambio from '../components/Cambio'
import {
  IconoDolar, IconoUsuarioMas, IconoUsuarios, IconoCapas, IconoMas, IconoDashboard,
} from '../components/Iconos'

/** Tarjeta de resumen del último mes registrado */
function Resumen({ etiqueta, valor, tono, icono, pct }) {
  return (
    <div className="tarjeta">
      <div className="kpi">
        <span className={`kpi-icono ${tono}`}>{icono}</span>
        <div>
          <div className="kpi-cifra">{valor}</div>
          <div className="kpi-etiqueta">
            {etiqueta} <Cambio pct={pct} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Inicio() {
  const { meses, navegar } = useApp()

  const actual = mesMasReciente(meses)
  const anterior = mesAnterior(meses, actual)

  return (
    <div>
      <div className="tarjeta hero">
        <div className="overline">Bienvenido</div>
        <h1>
          Tu red, en un solo <span>centro de mando</span>
        </h1>
        <p>
          Registra los resultados mes a mes y observa cómo crece tu negocio:
          ganancias, volumen, nuevos inicios y el ranking de tu equipo, todo junto.
        </p>
        <div className="acciones">
          <button className="boton boton-primario" onClick={() => navegar('captura')}>
            <IconoMas /> Capturar este mes
          </button>
          <button className="boton boton-secundario" onClick={() => navegar('dashboard')}>
            <IconoDashboard /> Ver dashboard
          </button>
        </div>
      </div>

      {actual && (
        <>
          <div className="titulo-seccion" style={{ marginTop: 28 }}>
            Último mes registrado
            <span className="sub">{etiquetaMes(actual)} · comparado con el mes anterior</span>
          </div>
          <div className="grid-accesos">
            <Resumen
              etiqueta="Ganancias" valor={usd(actual.ganancias)} tono="dorado"
              icono={<IconoDolar />} pct={cambioPct(actual.ganancias, anterior?.ganancias)}
            />
            <Resumen
              etiqueta="Nuevos inicios" valor={num(actual.nuevosInicios)} tono="verde"
              icono={<IconoUsuarioMas />} pct={cambioPct(actual.nuevosInicios, anterior?.nuevosInicios)}
            />
            <Resumen
              etiqueta="Distribuidores activos" valor={num(actual.activos)} tono="azul"
              icono={<IconoUsuarios />} pct={cambioPct(actual.activos, anterior?.activos)}
            />
            <Resumen
              etiqueta="Volumen de red" valor={pts(actual.volumenRed)} tono="morado"
              icono={<IconoCapas />} pct={cambioPct(actual.volumenRed, anterior?.volumenRed)}
            />
          </div>
        </>
      )}
    </div>
  )
}
