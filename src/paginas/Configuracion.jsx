// Configuración: exportar respaldo JSON, importar respaldo (con validación
// estricta para no romper la app con archivos corruptos) y borrado total.

import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { validarImportacion } from '../utils/calculos'
import { IconoDescarga, IconoSubida, IconoBasura } from '../components/Iconos'

export default function Configuracion() {
  const { meses, reemplazarTodo, avisar } = useApp()
  const inputArchivo = useRef(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  /** Descarga todos los datos como archivo JSON de respaldo */
  function exportar() {
    const contenido = JSON.stringify({ version: 1, app: 'mlm-dashboard', meses }, null, 2)
    const blob = new Blob([contenido], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    const fecha = new Date().toISOString().slice(0, 10)
    enlace.href = url
    enlace.download = `mlm-dashboard-respaldo-${fecha}.json`
    enlace.click()
    URL.revokeObjectURL(url)
    avisar('✓ Respaldo descargado')
  }

  /** Lee y valida el archivo elegido; si es corrupto, avisa sin romper nada */
  function importar(evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permitir re-seleccionar el mismo archivo
    if (!archivo) return

    const lector = new FileReader()
    lector.onload = () => {
      let datos
      try {
        datos = JSON.parse(lector.result)
      } catch {
        avisar('El archivo no es un JSON válido. No se importó nada.', 'error')
        return
      }
      const resultado = validarImportacion(datos)
      if (!resultado.valido) {
        avisar(resultado.error + ' No se importó nada.', 'error')
        return
      }
      reemplazarTodo(resultado.meses)
      avisar(`✓ Respaldo importado: ${resultado.meses.length} meses`)
    }
    lector.onerror = () => avisar('No se pudo leer el archivo.', 'error')
    lector.readAsText(archivo)
  }

  function borrarTodo() {
    reemplazarTodo([])
    setConfirmandoBorrado(false)
    avisar('Todos los datos fueron eliminados', 'error')
  }

  return (
    <div>
      <div className="encabezado">
        <h1>Configuración</h1>
        <p>Respaldos de tu información y mantenimiento de la app.</p>
      </div>

      <div className="grid-config">
        <div className="tarjeta">
          <div className="titulo-seccion">Exportar respaldo</div>
          <p className="config-descripcion">
            Descarga un archivo JSON con todos tus meses registrados
            ({meses.length} {meses.length === 1 ? 'mes' : 'meses'}). Guárdalo en un
            lugar seguro o úsalo para mover tus datos a otra computadora.
          </p>
          <button className="boton boton-primario" onClick={exportar} disabled={meses.length === 0}>
            <IconoDescarga /> Exportar datos (JSON)
          </button>
        </div>

        <div className="tarjeta">
          <div className="titulo-seccion">Importar respaldo</div>
          <p className="config-descripcion">
            Restaura un respaldo exportado desde esta app. <strong>Reemplaza</strong> los
            datos actuales. Si el archivo está dañado, se rechaza sin afectar tu información.
          </p>
          <button className="boton boton-secundario" onClick={() => inputArchivo.current?.click()}>
            <IconoSubida /> Importar datos (JSON)
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={importar}
          />
        </div>

        <div className="tarjeta">
          <div className="titulo-seccion">Zona de peligro</div>
          <p className="config-descripcion">
            Elimina todos los meses registrados. Esta acción no se puede deshacer:
            exporta un respaldo antes si tienes dudas.
          </p>
          {confirmandoBorrado ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="boton boton-peligro" onClick={borrarTodo}>
                Sí, borrar todo definitivamente
              </button>
              <button className="boton boton-secundario" onClick={() => setConfirmandoBorrado(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="boton boton-peligro"
              onClick={() => setConfirmandoBorrado(true)}
              disabled={meses.length === 0}
            >
              <IconoBasura /> Borrar todos los datos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
