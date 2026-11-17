// "Más": lo que se usa poco, en un solo lugar. Historial de meses, la imagen
// del mes para compartir y los ajustes (respaldo, tema).

import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import Historial from './Historial'
import Reporte from './Reporte'
import Configuracion from './Configuracion'

const PESTANAS = [
  ['historial', 'Historial', Historial],
  ['reporte', 'Compartir mes', Reporte],
  ['ajustes', 'Respaldo y ajustes', Configuracion],
]

export default function Mas() {
  const { opcion, tema, setTema } = useApp()
  const [pestana, setPestana] = useState(opcion || 'historial')
  useEffect(() => { if (opcion) setPestana(opcion) }, [opcion])

  const Actual = (PESTANAS.find(([id]) => id === pestana) || PESTANAS[0])[2]

  return (
    <div>
      <div className="barra-superior">
        <div className="segmentos" role="tablist">
          {PESTANAS.map(([id, texto]) => (
            <button
              key={id}
              role="tab"
              aria-selected={pestana === id}
              className={`segmento ${pestana === id ? 'activo' : ''}`}
              onClick={() => setPestana(id)}
            >
              {texto}
            </button>
          ))}
        </div>
        <button className="boton boton-secundario boton-chico" onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')}>
          {tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
        </button>
      </div>
      <Actual />
    </div>
  )
}
