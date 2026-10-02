// Captura de datos del mes: formulario general + lista de distribuidores
// (pegada del back office, subida como archivo o fila por fila). Personas
// nuevas y activos se calculan solos de la lista. También funciona como
// pantalla de edición cuando se llega desde Historial.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { CV_INSCRIPCION, contarNuevos, contarActivos } from '../utils/calculos'
import { MESES, etiquetaMes, num, pts } from '../utils/formato'
import { IconoMas, IconoBasura, IconoCheck, IconoSubida } from '../components/Iconos'

/** Estado inicial del formulario: el mes anterior, que es el que acaba de cerrar */
function formularioVacio() {
  const hoy = new Date()
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1) // en enero da diciembre del año pasado
  return {
    anio: anterior.getFullYear(),
    mes: anterior.getMonth() + 1,
    volumenRed: '',
    ganancias: '',
    metaGanancias: '',
  }
}

let contadorFila = 0
const nuevaFila = () => ({ clave: ++contadorFila, id: '', nombre: '', volumen: '' })

/**
 * Convierte una línea de la lista en { id, nombre, volumen } o null.
 * Acepta "Nombre 350", "Nombre, 350", "Nombre⇥350", con ID al inicio
 * ("12345 Nombre 350", el ID lleva algún dígito) y el formato del back
 * office, que antepone una letra al ID: "N⇥123456701⇥NOMBRE⇥420.00".
 */
function interpretarLinea(linea) {
  const limpia = linea
    .replace(/"/g, '') // comillas de CSV
    .trim()
    .replace(/^[A-Za-z][\s,;\t]+(?=[A-Za-z0-9.-]*\d)/, '') // marcador "N"/"Y" del back office

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

  const nombre = m?.[2].replace(/[,;:\t]+$/, '').replace(/\s+/g, ' ').trim()
  const volumen = m ? Number(m[3].replace(/,/g, '')) : NaN
  if (!nombre || isNaN(volumen)) return null
  return { id, nombre, volumen }
}

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
  const [pegadoAbierto, setPegadoAbierto] = useState(true)
  const [textoPegado, setTextoPegado] = useState('')
  const [filaEnfocada, setFilaEnfocada] = useState(null) // fila recién creada con Enter

  const inputArchivo = useRef(null)

  // Lo que se calcula solo de la lista: nuevos (CV de exactamente 30 pts),
  // activos (volumen mayor a 0) y la suma de volumen para cuadrar con la red
  const filasConNombre = filas.filter((f) => f.nombre.trim() !== '')
  const hayLista = filasConNombre.length > 0
  const nuevosDetectados = contarNuevos(filasConNombre)
  const activosDetectados = contarActivos(filasConNombre)
  const sumaLista = Math.round(filasConNombre.reduce((s, f) => s + (Number(f.volumen) || 0), 0) * 100) / 100

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
    // El cuadro de pegado se abre solo cuando todavía no hay lista
    setPegadoAbierto(!mesEditado?.distribuidores.length)
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
   * Convierte el texto de la lista (un distribuidor por línea) en filas.
   * Las líneas sin ningún número (encabezados, títulos) se ignoran; las que
   * tienen números pero no se entienden se quedan en el cuadro para corregirlas.
   */
  function procesarTexto(texto) {
    const nuevas = []
    const noReconocidas = []

    for (const linea of texto.split(/\r?\n/)) {
      if (!/\d/.test(linea)) continue
      const d = interpretarLinea(linea)
      if (d) nuevas.push({ ...nuevaFila(), id: d.id, nombre: d.nombre, volumen: String(d.volumen) })
      else noReconocidas.push(linea)
    }

    if (nuevas.length === 0) {
      setTextoPegado(texto)
      avisar('No se reconoció ninguna línea. Usa el formato "ID Nombre 350" o "Nombre 350".', 'error')
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

  /** Sube la lista como archivo de texto (.txt o .csv exportado del back office) */
  function subirArchivo(evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permitir volver a elegir el mismo archivo
    if (!archivo) return
    const lector = new FileReader()
    lector.onload = () => procesarTexto(String(lector.result))
    lector.onerror = () => avisar('No se pudo leer el archivo.', 'error')
    lector.readAsText(archivo)
  }

  /** Valida todo el formulario; devuelve { errores, advertenciaDuplicados } */
  function validar() {
    const errs = []
    const numericos = [
      ['volumenRed', 'Volumen total de la red'],
      ['ganancias', 'Ganancias totales'],
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

    // El ranking se ordena automáticamente por volumen al guardar
    const distribuidores = llenas
      .map((f) => ({ id: f.id.trim(), nombre: f.nombre.trim(), volumen: Number(f.volumen) }))
      .sort((a, b) => b.volumen - a.volumen)

    const registro = {
      anio: Number(form.anio),
      mes: Number(form.mes),
      volumenRed: Number(form.volumenRed),
      ganancias: Number(form.ganancias),
      nuevosInicios: contarNuevos(distribuidores),
      activos: contarActivos(distribuidores),
      metaGanancias: Number(form.metaGanancias),
      distribuidores,
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
        <div>
          <div className="overline">Registro</div>
          <h1>{mesEditado ? `Editar ${etiquetaMes(mesEditado)}` : 'Captura de datos'}</h1>
          <p>
            {mesEditado
              ? 'Modifica los datos del mes y vuelve a guardar.'
              : 'Registra los resultados de tu negocio este mes. Solo te tomará un par de minutos.'}
          </p>
        </div>
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
            {hayLista && (
              Number(form.volumenRed) === sumaLista ? (
                <span className="pista-nuevos">✓ Cuadra con la suma de tu lista</span>
              ) : (
                <span className="pista-nuevos pista-aviso">
                  Tu lista suma {pts(sumaLista)}
                  <button
                    type="button"
                    className="boton-pista"
                    onClick={() => cambiarCampo('volumenRed', String(sumaLista))}
                  >
                    Usar
                  </button>
                </span>
              )
            )}
          </div>

          <div className="campo">
            <label>Ganancias totales del mes (USD)</label>
            <input
              type="number" min="0" placeholder="Ej. 38500"
              value={form.ganancias}
              onChange={(e) => cambiarCampo('ganancias', e.target.value)}
            />
          </div>

          {/* Se calculan solos a partir de la lista de distribuidores */}
          <div className="fila-doble">
            <div className="dato-auto">
              <div className="dato-auto-etq">Personas nuevas</div>
              <div className="dato-auto-cifra" style={{ color: hayLista ? 'var(--verde)' : undefined }}>
                {hayLista ? num(nuevosDetectados) : '—'}
              </div>
              <div className="dato-auto-sub">con {CV_INSCRIPCION} pts en la lista</div>
            </div>
            <div className="dato-auto">
              <div className="dato-auto-etq">Distribuidores activos</div>
              <div className="dato-auto-cifra" style={{ color: hayLista ? 'var(--azul)' : undefined }}>
                {hayLista ? num(activosDetectados) : '—'}
              </div>
              <div className="dato-auto-sub">con volumen en la lista</div>
            </div>
          </div>
          <p className="dato-auto-nota">
            {hayLista
              ? 'Se calculan solos con tu lista de distribuidores.'
              : 'Se calculan solos cuando pegues o subas la lista de distribuidores.'}
          </p>

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
            Pega o sube la lista del back office y la app cuenta sola a los nuevos
            (<strong>{CV_INSCRIPCION} pts</strong> 🆕) y a los activos. También puedes agregar o
            corregir filas a mano: presiona <strong>Enter</strong> en el volumen para agregar la siguiente.
          </p>

          <button
            className="boton boton-secundario boton-chico"
            style={{ marginBottom: 14 }}
            onClick={() => setPegadoAbierto(!pegadoAbierto)}
          >
            📋 {pegadoAbierto ? 'Ocultar pegado' : 'Pegar o subir lista'}
          </button>

          {pegadoAbierto && (
            <div style={{ marginBottom: 16 }}>
              <p className="config-descripcion">
                Copia la lista del back office y pégala tal cual, o sube el archivo (.txt o .csv).
                Un distribuidor por línea con el volumen al final; el ID al inicio es opcional:
                <br />«N 123456701 María González 420.00» · «88412 Ana Torres 3650» · «Pedro, 4800»
              </p>
              <textarea
                rows={6}
                style={{
                  width: '100%', background: 'var(--fondo-2)', color: 'var(--texto)',
                  border: '1px solid var(--borde)', borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                }}
                placeholder={'N\t123456701\tMaría González\t420.00\nN\t123456702\tPedro López\t70.00'}
                value={textoPegado}
                onChange={(e) => setTextoPegado(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button
                  className="boton boton-primario boton-chico"
                  onClick={() => procesarTexto(textoPegado)}
                  disabled={!textoPegado.trim()}
                >
                  Agregar lista
                </button>
                <button className="boton boton-secundario boton-chico" onClick={() => inputArchivo.current?.click()}>
                  <IconoSubida /> Subir archivo
                </button>
                <input
                  ref={inputArchivo}
                  type="file"
                  accept=".txt,.csv,.tsv,text/plain,text/csv"
                  style={{ display: 'none' }}
                  onChange={subirArchivo}
                />
              </div>
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
