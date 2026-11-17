// Configuración: exportar respaldo JSON, importar respaldo (con validación
// estricta para no romper la app con archivos corruptos) y borrado total.

import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { validarImportacion, validarSeguimiento, validarActividad, validarArranque } from '../utils/calculos'
import { IconoDescarga, IconoSubida, IconoBasura } from '../components/Iconos'

export default function Configuracion() {
  const {
    meses, reemplazarTodo, seguimiento, reemplazarSeguimiento, avisar,
    actividad, reemplazarActividad, arranque, reemplazarArranque, mensajes, reemplazarMensajes,
    usuario, estadoNube, ultimaSync, entrarConGoogle, salirDeNube, sincronizarAhora, marcarReinicio,
  } = useApp()
  const inputArchivo = useRef(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  /** Descarga meses y seguimiento de inactivos como archivo JSON de respaldo */
  function exportar() {
    const contenido = JSON.stringify({ version: 1, app: 'mlm-dashboard', meses, seguimiento, actividad, arranque, mensajes }, null, 2)
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
      // Un respaldo sin seguimiento (anterior a esa función) no borra el actual
      let seguimientoNuevo = null
      if (datos.seguimiento != null) {
        seguimientoNuevo = validarSeguimiento(datos.seguimiento)
        if (!seguimientoNuevo) {
          avisar('El seguimiento del archivo está dañado. No se importó nada.', 'error')
          return
        }
      }
      // Actividad, arranque y mensajes: si el respaldo no los trae (o vienen dañados), se conservan los actuales
      const actividadNueva = datos.actividad != null ? validarActividad(datos.actividad) : null
      const arranqueNuevo = datos.arranque != null ? validarArranque(datos.arranque) : null
      reemplazarTodo(resultado.meses)
      if (seguimientoNuevo) reemplazarSeguimiento(seguimientoNuevo)
      if (actividadNueva) reemplazarActividad(actividadNueva)
      if (arranqueNuevo) reemplazarArranque(arranqueNuevo)
      if (datos.mensajes && typeof datos.mensajes === 'object' && !Array.isArray(datos.mensajes)) {
        const textos = Object.fromEntries(Object.entries(datos.mensajes).filter(([, v]) => typeof v === 'string' && v.trim()))
        reemplazarMensajes(textos)
      }
      avisar(`✓ Respaldo importado: ${resultado.meses.length} meses`)
    }
    lector.onerror = () => avisar('No se pudo leer el archivo.', 'error')
    lector.readAsText(archivo)
  }

  function borrarTodo() {
    marcarReinicio()
    reemplazarTodo([])
    reemplazarSeguimiento({})
    reemplazarActividad({})
    reemplazarArranque({})
    setConfirmandoBorrado(false)
    avisar('Todos los datos fueron eliminados', 'error')
  }

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Ajustes</div>
          <h1>Configuración</h1>
          <p>Respaldos de tu información y mantenimiento de la app.</p>
        </div>
      </div>

      <div className="tarjeta nube-tarjeta">
        <div className="titulo-seccion">Tu nube</div>
        {usuario ? (
          <>
            <p className="config-descripcion">
              Conectado como <strong>{usuario.nombre || usuario.correo}</strong>. Tus datos se guardan
              solos en tu nube y los ves en cualquier dispositivo donde entres con esta cuenta.
            </p>
            <div className={`nube-estado nube-${estadoNube}`}>
              <span className="nube-punto" />
              {{
                sincronizando: 'Sincronizando…',
                'al-dia': `Todo al día${ultimaSync ? ` · ${ultimaSync.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}` : ''}`,
                'sin-conexion': 'Sin internet. Lo que guardes se sube al volver la señal.',
                error: 'No se pudo sincronizar. Tus datos siguen en este dispositivo.',
              }[estadoNube] || 'Conectando…'}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="boton boton-secundario" onClick={sincronizarAhora} disabled={estadoNube === 'sincronizando'}>
                Sincronizar ahora
              </button>
              <button className="boton boton-secundario" onClick={salirDeNube}>Cerrar sesión</button>
            </div>
          </>
        ) : (
          <>
            <p className="config-descripcion">
              Entra con tu cuenta de Google para guardar tus datos en tu nube y verlos en tu
              teléfono, tu computadora o donde sea. Solo tú puedes verlos. Lo que ya tienes en
              este dispositivo se sube; nada se borra.
            </p>
            <button className="boton boton-primario" onClick={entrarConGoogle} disabled={estadoNube === 'cargando'}>
              Entrar con Google
            </button>
          </>
        )}
      </div>

      <div className="grid-config">
        <div className="tarjeta">
          <div className="titulo-seccion">Exportar respaldo</div>
          <p className="config-descripcion">
            Descarga un archivo JSON con todos tus meses registrados
            ({meses.length} {meses.length === 1 ? 'mes' : 'meses'}) y el seguimiento de
            inactivos (estados, teléfonos y notas). Guárdalo en un
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
            Elimina todos los meses registrados y el seguimiento{usuario ? ', también de tu nube' : ''}. Esta acción no se puede deshacer:
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
