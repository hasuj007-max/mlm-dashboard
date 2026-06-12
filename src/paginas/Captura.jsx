// Captura manual de datos del mes: formulario general + distribuidores
// fila por fila con autocompletado de nombres usados en meses anteriores.
// También funciona como pantalla de edición cuando se llega desde Historial.

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { CV_INSCRIPCION, contarNuevos } from '../utils/calculos'
import { MESES, etiquetaMes } from '../utils/formato'
import { IconoMas, IconoBasura, IconoCheck } from '../components/Iconos'

/** Estado inicial del formulario (mes actual por defecto) */
function formularioVacio() {
  const hoy = new Date()
  return {
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
    volumenRed: '',
    ganancias: '',
    nuevosInicios: '',
    activos: '',
    metaGanancias: '',
  }
}

let contadorFila = 0
const nuevaFila = () => ({ clave: ++contadorFila, id: '', nombre: '', volumen: '' })

export default function Captura() {
  const {
    meses, guardarMes, existeMes, editandoId, navegar, avisar, nombresConocidos,
  } = useApp()

  // Si venimos de Historial con un mes a editar, precargamos sus datos
  const mesEditado = useMemo(
    () => meses.find((m) => m.id === editandoId) || null,
    [meses, editandoId]
  )

  const [form, setForm] = useState(formularioVacio)
  const [filas, setFilas] = useState([nuevaFila()])
  const [errores, setErrores] = useState([])
  const [duplicadosPendientes, setDuplicadosPendientes] = useState(null)
  const [pegadoAbierto, setPegadoAbierto] = useState(false)
  const [textoPegado, setTextoPegado] = useState('')
  const [filaEnfocada, setFilaEnfocada] = useState(null) // fila recién creada con Enter

  // Inscripciones nuevas detectadas en la lista (CV de exactamente 30 pts)
  const nuevosDetectados = contarNuevos(filas)

  // Último ID conocido de cada nombre (para autollenar el ID al escribir un
  // nombre que ya existe en meses anteriores)
  const idsPorNombre = useMemo(() => {
    const mapa = new Map()
    for (const m of meses) {
      for (const d of m.distribuidores || []) {
        const id = String(d.id ?? '').trim()
        if (id) mapa.set(d.nombre.trim().toLocaleLowerCase('es'), id)
      }
    }
    return mapa
  }, [meses])

  useEffect(() => {
    if (mesEditado) {
      setForm({
        anio: mesEditado.anio,
        mes: mesEditado.mes,
        volumenRed: String(mesEditado.volumenRed),
        ganancias: String(mesEditado.ganancias),
        nuevosInicios: String(mesEditado.nuevosInicios),
        activos: String(mesEditado.activos),
        metaGanancias: String(mesEditado.metaGanancias),
      })
      setFilas(
        mesEditado.distribuidores.length
          ? mesEditado.distribuidores.map((d) => ({
              ...nuevaFila(),
              id: String(d.id ?? ''),
              nombre: d.nombre,
              volumen: String(d.volumen),
            }))
          : [nuevaFila()]
      )
    } else {
      setForm(formularioVacio())
      setFilas([nuevaFila()])
    }
    setErrores([])
    setDuplicadosPendientes(null)
  }, [mesEditado])

  function cambiarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setDuplicadosPendientes(null)
  }

  function cambiarFila(clave, campo, valor) {
    setFilas((fs) =>
      fs.map((f) => {
        if (f.clave !== clave) return f
        const fila = { ...f, [campo]: valor }
        // Al escribir un nombre ya conocido, autollenar su ID si está vacío
        if (campo === 'nombre' && !fila.id.trim()) {
          const idConocido = idsPorNombre.get(valor.trim().toLocaleLowerCase('es'))
          if (idConocido) fila.id = idConocido
        }
        return fila
      })
    )
    setDuplicadosPendientes(null)
  }

  function eliminarFila(clave) {
    setFilas((fs) => (fs.length > 1 ? fs.filter((f) => f.clave !== clave) : [nuevaFila()]))
  }

  /** Enter en el campo de volumen agrega y enfoca la siguiente fila */
  function alPresionarEnter(evento) {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    const fila = nuevaFila()
    setFilas((fs) => [...fs, fila])
    setFilaEnfocada(fila.clave)
  }

  /**
   * Pegado rápido: convierte un texto con un distribuidor por línea en filas.
   * Acepta "Nombre 350", "Nombre, 350", "Nombre⇥350" y también con ID al
   * inicio: "12345 Nombre 350" (el ID debe contener al menos un dígito).
   * Las líneas que no se entienden se quedan en el cuadro para corregirlas.
   */
  function agregarLista() {
    const lineas = textoPegado.split('\n')
    const nuevas = []
    const noReconocidas = []

    for (const linea of lineas) {
      if (!linea.trim()) continue
      const limpia = linea.trim()

      // Intento 1: ID + Nombre + Volumen (el primer token lleva algún dígito)
      let id = ''
      let m = limpia.match(/^([A-Za-z0-9.-]*\d[A-Za-z0-9.-]*)[\s,;:\t]+(.+?)[\s,;:\t]+\$?(-?[\d][\d.,]*)\s*(?:pts)?$/i)
      if (m) {
        id = m[1]
      } else {
        // Intento 2: solo Nombre + Volumen
        m = limpia.match(/^(.+?)[\s,;:\t]+\$?(-?[\d][\d.,]*)\s*(?:pts)?$/i)
        if (m) m = [m[0], '', m[1], m[2]]
      }

      const nombre = m?.[2].replace(/[,;:\t]+$/, '').trim()
      const volumen = m ? Number(m[3].replace(/,/g, '')) : NaN
      if (!nombre || isNaN(volumen)) {
        noReconocidas.push(linea)
        continue
      }
      nuevas.push({ ...nuevaFila(), id, nombre, volumen: String(volumen) })
    }

    if (nuevas.length === 0) {
      avisar('No se reconoció ninguna línea. Usa el formato "Nombre 350".', 'error')
      return
    }

    // Reemplaza las filas que siguen vacías y agrega las nuevas al final
    setFilas((fs) => {
      const conDatos = fs.filter((f) => f.nombre.trim() !== '' || f.volumen !== '')
      return [...conDatos, ...nuevas]
    })
    setTextoPegado(noReconocidas.join('\n'))
    if (noReconocidas.length === 0) setPegadoAbierto(false)
    avisar(
      `✓ ${nuevas.length} distribuidores agregados` +
        (noReconocidas.length ? ` · ${noReconocidas.length} líneas sin reconocer` : '')
    )
  }

  /** Valida todo el formulario; devuelve { errores, advertenciaDuplicados } */
  function validar() {
    const errs = []
    const numericos = [
      ['volumenRed', 'Volumen total de la red'],
      ['ganancias', 'Ganancias totales'],
      ['nuevosInicios', 'Personas nuevas'],
      ['activos', 'Distribuidores activos'],
      ['metaGanancias', 'Meta de ganancias'],
    ]
    for (const [campo, etiqueta] of numericos) {
      const v = form[campo]
      if (v === '' || isNaN(Number(v))) errs.push(`«${etiqueta}» es obligatorio y debe ser un número.`)
      else if (Number(v) < 0) errs.push(`«${etiqueta}» no puede ser negativo.`)
    }

    if (existeMes(form.anio, form.mes, editandoId)) {
      errs.push(`Ya existe un registro para ${MESES[form.mes - 1]} ${form.anio}. Edítalo desde el Historial o elige otro mes.`)
    }

    // Filas de distribuidores: ignoramos las totalmente vacías
    const llenas = filas.filter((f) => f.nombre.trim() !== '' || f.volumen !== '' || f.id.trim() !== '')
    for (const f of llenas) {
      if (!f.nombre.trim()) errs.push('Hay un distribuidor sin nombre.')
      // El volumen puede ser negativo (devoluciones), pero debe ser un número
      if (f.volumen === '' || isNaN(Number(f.volumen))) errs.push(`El volumen de «${f.nombre.trim() || '(sin nombre)'}» debe ser un número.`)
    }

    // Nombres o IDs duplicados dentro del mismo mes → advertir y confirmar
    const nombresVistos = new Set()
    const idsVistos = new Set()
    const duplicados = new Set()
    for (const f of llenas) {
      const nombre = f.nombre.trim().toLocaleLowerCase('es')
      const id = f.id.trim().toLowerCase()
      if (nombre) {
        if (nombresVistos.has(nombre)) duplicados.add(f.nombre.trim())
        nombresVistos.add(nombre)
      }
      if (id) {
        if (idsVistos.has(id)) duplicados.add(`ID ${f.id.trim()}`)
        idsVistos.add(id)
      }
    }

    return { errores: errs, duplicados: [...duplicados], llenas }
  }

  function guardar(confirmandoDuplicados = false) {
    const { errores: errs, duplicados, llenas } = validar()
    setErrores(errs)
    if (errs.length) {
      setDuplicadosPendientes(null)
      return
    }

    if (duplicados.length && !confirmandoDuplicados) {
      setDuplicadosPendientes(duplicados)
      return
    }
    setDuplicadosPendientes(null)

    const registro = {
      anio: Number(form.anio),
      mes: Number(form.mes),
      volumenRed: Number(form.volumenRed),
      ganancias: Number(form.ganancias),
      nuevosInicios: Number(form.nuevosInicios),
      activos: Number(form.activos),
      metaGanancias: Number(form.metaGanancias),
      // El ranking se ordena automáticamente por volumen al guardar
      distribuidores: llenas
        .map((f) => ({ id: f.id.trim(), nombre: f.nombre.trim(), volumen: Number(f.volumen) }))
        .sort((a, b) => b.volumen - a.volumen),
    }

    guardarMes(registro, editandoId)
    avisar(`✓ ${MESES[registro.mes - 1]} ${registro.anio} guardado con éxito`)
    navegar('dashboard')
  }

  const aniosDisponibles = []
  const anioActual = new Date().getFullYear()
  for (let a = anioActual + 1; a >= anioActual - 10; a--) aniosDisponibles.push(a)

  return (
    <div>
      <div className="encabezado">
        <h1>{mesEditado ? `Editar ${etiquetaMes(mesEditado)}` : 'Captura de datos'}</h1>
        <p>
          {mesEditado
            ? 'Modifica los datos del mes y vuelve a guardar.'
            : 'Registra los resultados de tu negocio este mes. Solo te tomará un par de minutos.'}
        </p>
      </div>

      {errores.length > 0 && (
        <div className="caja-errores">
          {errores.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      {duplicadosPendientes && (
        <div className="caja-advertencia">
          ⚠️ Hay nombres repetidos en este mes: <strong>{duplicadosPendientes.join(', ')}</strong>.
          ¿Quieres guardarlos de todos modos?
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button className="boton boton-primario boton-chico" onClick={() => guardar(true)}>
              Sí, guardar así
            </button>
            <button className="boton boton-secundario boton-chico" onClick={() => setDuplicadosPendientes(null)}>
              No, voy a corregir
            </button>
          </div>
        </div>
      )}

      <div className="grid-captura">
        {/* ===== Datos generales ===== */}
        <div className="tarjeta">
          <div className="titulo-seccion">Datos generales del mes</div>

          <div className="fila-doble">
            <div className="campo">
              <label>Mes</label>
              <select value={form.mes} onChange={(e) => cambiarCampo('mes', Number(e.target.value))}>
                {MESES.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>{nombre}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Año</label>
              <select value={form.anio} onChange={(e) => cambiarCampo('anio', Number(e.target.value))}>
                {aniosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="campo">
            <label>Volumen total de la red (puntos)</label>
            <input
              type="number" min="0" placeholder="Ej. 45000"
              value={form.volumenRed}
              onChange={(e) => cambiarCampo('volumenRed', e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Ganancias totales del mes (USD)</label>
            <input
              type="number" min="0" placeholder="Ej. 38500"
              value={form.ganancias}
              onChange={(e) => cambiarCampo('ganancias', e.target.value)}
            />
          </div>

          <div className="fila-doble">
            <div className="campo">
              <label>Personas nuevas</label>
              <input
                type="number" min="0" placeholder="Ej. 6"
                value={form.nuevosInicios}
                onChange={(e) => cambiarCampo('nuevosInicios', e.target.value)}
              />
              {nuevosDetectados > 0 && (
                <span className="pista-nuevos">
                  🆕 {nuevosDetectados} con {CV_INSCRIPCION} pts en tu lista
                  {Number(form.nuevosInicios) !== nuevosDetectados && (
                    <button
                      type="button"
                      className="boton-pista"
                      onClick={() => cambiarCampo('nuevosInicios', String(nuevosDetectados))}
                    >
                      Usar {nuevosDetectados}
                    </button>
                  )}
                </span>
              )}
            </div>
            <div className="campo">
              <label>Distribuidores activos</label>
              <input
                type="number" min="0" placeholder="Ej. 32"
                value={form.activos}
                onChange={(e) => cambiarCampo('activos', e.target.value)}
              />
            </div>
          </div>

          <div className="campo">
            <label>Meta de ganancias del mes (USD)</label>
            <input
              type="number" min="0" placeholder="Ej. 40000"
              value={form.metaGanancias}
              onChange={(e) => cambiarCampo('metaGanancias', e.target.value)}
            />
          </div>
        </div>

        {/* ===== Distribuidores del mes ===== */}
        <div className="tarjeta">
          <div className="titulo-seccion">Distribuidores del mes</div>
          <p className="config-descripcion">
            Captura el volumen personal de cada distribuidor. El ranking se ordena solo.
            Los nombres se autocompletan con los de meses anteriores.
            Los que tengan <strong>{CV_INSCRIPCION} pts</strong> se marcan como inscripción nueva 🆕.
            Tip: presiona <strong>Enter</strong> en el volumen para agregar la siguiente fila.
          </p>

          <button
            className="boton boton-secundario boton-chico"
            style={{ marginBottom: 14 }}
            onClick={() => setPegadoAbierto(!pegadoAbierto)}
          >
            ⚡ Pegado rápido (lista completa)
          </button>

          {pegadoAbierto && (
            <div style={{ marginBottom: 16 }}>
              <p className="config-descripcion">
                Pega tu lista completa, un distribuidor por línea, con el volumen al final.
                Puedes incluir el ID al inicio. Funciona con texto de WhatsApp, Excel o notas:
                <br />«María González 5200» · «Pedro, 4800» · «88412 Ana Torres 3650»
              </p>
              <textarea
                rows={6}
                style={{
                  width: '100%', background: 'var(--fondo-2)', color: 'var(--texto)',
                  border: '1px solid var(--borde)', borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                }}
                placeholder={'María González 5200\nPedro López 4800\nAna Torres 3650'}
                value={textoPegado}
                onChange={(e) => setTextoPegado(e.target.value)}
              />
              <button className="boton boton-primario boton-chico" style={{ marginTop: 10 }} onClick={agregarLista}>
                Agregar lista
              </button>
            </div>
          )}

          {/* Lista de nombres conocidos para el autocompletado del navegador */}
          <datalist id="nombres-conocidos">
            {nombresConocidos.map((n) => <option key={n} value={n} />)}
          </datalist>

          {filas.map((fila, i) => (
            <div className="fila-dist" key={fila.clave}>
              <span className="num-fila">{i + 1}</span>
              <input
                type="text"
                className="input-id"
                placeholder="ID"
                value={fila.id}
                onChange={(e) => cambiarFila(fila.clave, 'id', e.target.value)}
              />
              <input
                type="text"
                placeholder="Nombre del distribuidor"
                list="nombres-conocidos"
                value={fila.nombre}
                autoFocus={fila.clave === filaEnfocada}
                onChange={(e) => cambiarFila(fila.clave, 'nombre', e.target.value)}
              />
              <input
                type="number"
                className="input-volumen"
                placeholder="Volumen"
                value={fila.volumen}
                onChange={(e) => cambiarFila(fila.clave, 'volumen', e.target.value)}
                onKeyDown={alPresionarEnter}
              />
              {Number(fila.volumen) === CV_INSCRIPCION && (
                <span className="badge-nuevo">Nuevo</span>
              )}
              <button
                className="boton-icono"
                title="Eliminar fila"
                onClick={() => eliminarFila(fila.clave)}
              >
                <IconoBasura />
              </button>
            </div>
          ))}

          <button className="boton boton-fantasma" onClick={() => setFilas((fs) => [...fs, nuevaFila()])}>
            <IconoMas /> Agregar distribuidor
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="boton boton-primario" onClick={() => guardar(false)}>
          <IconoCheck /> {mesEditado ? 'Guardar cambios' : 'Guardar mes'}
        </button>
        {mesEditado && (
          <button className="boton boton-secundario" onClick={() => navegar('historial')}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
