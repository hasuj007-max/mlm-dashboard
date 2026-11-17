// Mi gente: ¿a quién le llamo? Cuatro listas en una sola pantalla:
// nuevos sin recomprar, los que se cayeron, los que casi califican y todos.
// Cada persona se abre para marcar su estado, guardar su teléfono y notas, y
// mandarle un WhatsApp con el mensaje ya escrito.

import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'
import { useApp, MENSAJES_BASE } from '../context/AppContext'
import {
  porReactivar, regresosTrasContacto, nuevosEnRiesgo, casiCalifican,
  directorioDistribuidores, serieDistribuidor, mesesConLista, ESTADOS_SEGUIMIENTO,
  PASOS_ARRANQUE, PASO_COMPRA, estadoArranque, GRUPOS_INACTIVOS,
} from '../utils/calculos'
import { pts, num, etiquetaMes, etiquetaCorta, MESES, MESES_CORTOS } from '../utils/formato'
import { paleta, COLORES_AVATAR, coloresGrafica, ejeX, iniciales } from '../utils/tema'
import TooltipGrafica from '../components/TooltipGrafica'
import { IconoBrote, IconoCaida, IconoDiana, IconoGente, IconoLupa, IconoWhatsApp, IconoTelefono } from '../components/Iconos'

const ESTADO = {
  pendiente: { texto: 'Sin contactar', plural: 'Sin contactar', tono: 'neutro' },
  contactado: { texto: 'Contactado', plural: 'Contactados', tono: 'azul' },
  regresara: { texto: 'Va a comprar', plural: 'Van a comprar', tono: 'verde' },
  descartado: { texto: 'No le interesa', plural: 'No les interesa', tono: 'rojo' },
}

const PESTANAS = [
  { id: 'nuevos', texto: 'Nuevos', Icono: IconoBrote },
  { id: 'caidos', texto: 'Se cayeron', Icono: IconoCaida },
  { id: 'casi', texto: 'Casi califican', Icono: IconoDiana },
  { id: 'todos', texto: 'Todos', Icono: IconoGente },
]

const TOPE_TODOS = 50

/** "12 sep 2026" a partir de "2026-09-12" */
function fechaCorta(iso) {
  if (!iso) return ''
  return new Date(`${iso}T12:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Primer nombre con mayúscula inicial: "MARIA LOPEZ" → "Maria" */
function primerNombre(nombre) {
  const p = String(nombre || '').trim().split(/\s+/)[0] || ''
  return p.charAt(0).toLocaleUpperCase('es') + p.slice(1).toLocaleLowerCase('es')
}

/** Historial de compras de una persona (solo en la pestaña Todos) */
function Historia({ meses, persona, tema }) {
  const serie = useMemo(
    () => serieDistribuidor(mesesConLista(meses), persona.clave).map((m) => ({
      nombre: `${MESES_CORTOS[m.mes - 1]} ${String(m.anio).slice(2)}`, volumen: m.volumen,
    })),
    [meses, persona.clave]
  )
  const activos = persona.meses.filter((m) => m.volumen > 0)
  const mejor = activos.reduce((a, b) => (b.volumen > a.volumen ? b : a), activos[0] || { volumen: 0 })
  const colores = coloresGrafica(tema)
  const P = paleta(tema)

  return (
    <div className="historia">
      <div className="historia-datos">
        <span><b>{num(activos.length)}</b> meses con compra</span>
        <span><b>{pts(activos.length ? Math.round(persona.total / activos.length) : 0)}</b> en promedio</span>
        {mejor.mes && <span><b>{pts(mejor.volumen)}</b> su mejor mes ({MESES_CORTOS[mejor.mes - 1]} {mejor.anio})</span>}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={serie} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-historia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.dorado} stopOpacity={0.35} />
              <stop offset="100%" stopColor={P.dorado} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="nombre" {...ejeX(colores, { tick: { fill: colores.eje, fontSize: 10, fontWeight: 600 }, interval: 'preserveStartEnd' })} />
          <Tooltip content={<TooltipGrafica formatear={pts} />} />
          <Area type="monotone" dataKey="volumen" stroke={P.dorado} strokeWidth={2} fill="url(#grad-historia)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** "Toca hoy", "Atrasado 3 días" o "En 4 días" según la fecha del siguiente paso */
function textoCuando(dias) {
  if (dias == null) return null
  if (dias === 0) return 'Toca hoy'
  if (dias < 0) return `Atrasado ${-dias} ${dias === -1 ? 'día' : 'días'}`
  return `En ${dias} ${dias === 1 ? 'día' : 'días'}`
}

/** Arranque de un nuevo: tres pasos + "Ya compró", cada uno un botón que se prende y apaga */
function Arranque({ clave, alContactar }) {
  const { arranque, marcarPaso, fijarInicio } = useApp()
  const registro = arranque[clave]
  const estado = estadoArranque(registro)
  const pasos = registro?.pasos || {}

  function alternar(id) {
    const prender = !pasos[id]
    marcarPaso(clave, id, prender)
    if (prender) alContactar()
  }

  return (
    <div className="arranque">
      <div className="pasos-botones">
        {PASOS_ARRANQUE.map((p) => {
          const hecho = Boolean(pasos[p.id])
          const cuando = estado.siguiente?.id === p.id ? textoCuando(estado.diasPara) : null
          return (
            <button key={p.id} className={`paso-boton ${hecho ? 'hecho' : ''}`} onClick={() => alternar(p.id)} aria-pressed={hecho}>
              <span className="paso-marca">{hecho ? '✓' : ''}</span>
              <span className="paso-texto">
                <b>{p.texto}</b>
                <small className={cuando && estado.diasPara <= 0 ? 'urge' : ''}>{hecho ? `Hecho ${fechaCorta(pasos[p.id])}` : cuando || `Día ${p.dia}`}</small>
              </span>
            </button>
          )
        })}
        <button className={`paso-boton paso-compra ${estado.compro ? 'hecho' : ''}`} onClick={() => alternar(PASO_COMPRA)} aria-pressed={estado.compro}>
          <span className="paso-marca">{estado.compro ? '✓' : ''}</span>
          <span className="paso-texto">
            <b>Ya compró</b>
            <small>{estado.compro ? `Desde ${fechaCorta(pasos[PASO_COMPRA])}` : 'Hizo su recompra'}</small>
          </span>
        </button>
      </div>
      <div className="arranque-fecha">
        <span>Se inscribió el</span>
        <input type="date" className="entrada" value={registro?.inicio || ''} onChange={(e) => fijarInicio(clave, e.target.value)} />
      </div>
    </div>
  )
}

/** Lo que se abre al tocar a una persona */
function Ficha({ persona, tipo, registro, estado, regreso, mesContacto, actualizar, children }) {
  const { mensajes, guardarMensaje, avisar } = useApp()
  const plantilla = mensajes[tipo] || MENSAJES_BASE.todos
  const [mensaje, setMensaje] = useState(plantilla)
  const telefono = registro?.telefono || ''
  const digitos = telefono.replace(/\D/g, '')
  const telefonoValido = digitos.length >= 8
  const textoFinal = mensaje.replaceAll('{nombre}', primerNombre(persona.nombre))

  function cambiarEstado(e) {
    // El mes cargado al contactarlo sirve para detectar si después vuelve a comprar
    actualizar({ estado: e, mes: mesContacto, fecha: new Date().toLocaleDateString('en-CA') })
  }

  return (
    <div className="ficha-persona">
      {regreso && (
        <div className="aviso-verde">Volvió a comprar en {etiquetaMes(regreso.mes)} después de que lo contactaste.</div>
      )}
      {children}

      {tipo !== 'nuevos' && <label className="campo-etq">¿Cómo va?</label>}
      {tipo !== 'nuevos' && <div className="chips">
        {ESTADOS_SEGUIMIENTO.map((e) => (
          <button
            key={e}
            className={`chip ${estado === e ? `chip-activo tono-${ESTADO[e].tono}` : ''}`}
            onClick={() => cambiarEstado(e)}
            aria-pressed={estado === e}
          >
            {ESTADO[e].texto}
          </button>
        ))}
      </div>}

      <label className="campo-etq">Teléfono (con lada del país)</label>
      <input
        type="tel"
        className="entrada"
        placeholder="52 55 1234 5678"
        value={telefono}
        onChange={(e) => actualizar({ telefono: e.target.value })}
      />

      <label className="campo-etq">Mensaje</label>
      <textarea className="entrada" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      <div className="ficha-botones">
        <a
          className={`boton boton-whats ${telefonoValido ? '' : 'deshabilitado'}`}
          href={telefonoValido ? `https://wa.me/${digitos}?text=${encodeURIComponent(textoFinal)}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!telefonoValido}
        >
          <IconoWhatsApp /> WhatsApp
        </a>
        <a
          className={`boton boton-secundario ${telefonoValido ? '' : 'deshabilitado'}`}
          href={telefonoValido ? `tel:+${digitos}` : undefined}
          aria-disabled={!telefonoValido}
        >
          <IconoTelefono /> Llamar
        </a>
        {mensaje !== plantilla && mensaje.trim() && (
          <button
            className="boton-enlace"
            onClick={() => { guardarMensaje(tipo, mensaje); avisar('Mensaje guardado para esta lista') }}
          >
            Usar este mensaje siempre
          </button>
        )}
      </div>
      {!telefonoValido && <div className="ficha-pista">Escribe su teléfono para activar los botones.</div>}

      <label className="campo-etq">Notas</label>
      <textarea
        className="entrada"
        rows={2}
        placeholder="Qué te dijo, cuándo volver a hablarle…"
        value={registro?.nota || ''}
        onChange={(e) => actualizar({ nota: e.target.value })}
      />
      {registro?.fecha && <div className="ficha-pista">Último cambio: {fechaCorta(registro.fecha)}</div>}
    </div>
  )
}

export default function Gente() {
  const { meses, seguimiento, actualizarSeguimiento, navegar, opcion, tema, arranque } = useApp()
  const [pestana, setPestana] = useState(opcion || 'nuevos')
  const [grupo, setGrupo] = useState('este') // en "Se cayeron": qué tan frío está cada quien
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)
  useEffect(() => { if (opcion) setPestana(opcion) }, [opcion])

  const caidos = useMemo(() => porReactivar(meses), [meses])
  const nuevos = useMemo(() => nuevosEnRiesgo(meses), [meses])
  const casi = useMemo(() => casiCalifican(meses), [meses])
  const directorio = useMemo(() => directorioDistribuidores(meses), [meses])
  const regresos = useMemo(() => regresosTrasContacto(meses, seguimiento), [meses, seguimiento])
  const conLista = useMemo(() => mesesConLista(meses), [meses])
  const ultimo = conLista[conLista.length - 1]

  if (!ultimo) {
    return (
      <div className="pagina">
        <header className="cabecera">
          <h1>Mi gente</h1>
          <p>Aún no hay ninguna lista cargada.</p>
        </header>
        <div className="panel vacio-grande">
          <p>Cuando cargues un mes con la lista de tu equipo, aquí verás a quién llamar.</p>
          <button className="boton boton-primario" onClick={() => navegar('captura')}>Cargar un mes</button>
        </div>
      </div>
    )
  }

  // Cada grupo: primero los clientes constantes, luego los más recientes y de más volumen
  const porGrupo = Object.fromEntries(GRUPOS_INACTIVOS.map((g) => [
    g.id,
    (caidos ? caidos.personas : [])
      .filter((p) => p.mesesSinComprar >= g.desde && p.mesesSinComprar <= g.hasta)
      .sort((a, b) => b.constante - a.constante || a.mesesSinComprar - b.mesesSinComprar || b.volumenTotal - a.volumenTotal),
  ]))
  const caidosMes = porGrupo.este
  const grupoActual = GRUPOS_INACTIVOS.find((g) => g.id === grupo) || GRUPOS_INACTIVOS[0]
  const cuenta = { nuevos: nuevos.length, caidos: caidosMes.length, casi: casi.length, todos: directorio.length }

  /** Estado vigente: si volvió a comprar tras el contacto, el ciclo empieza de nuevo */
  const estadoDe = (clave) => (regresos.has(clave) ? 'pendiente' : seguimiento[clave]?.estado || 'pendiente')

  const base = { nuevos, caidos: porGrupo[grupoActual.id], casi, todos: directorio }[pestana]
  const conEstado = pestana !== 'todos'
  const esNuevos = pestana === 'nuevos'
  const compro = (clave) => Boolean(arranque[clave]?.pasos?.[PASO_COMPRA])
  const yaCompraron = esNuevos ? base.filter((p) => compro(p.clave)).length : 0
  const q = busqueda.trim().toLocaleLowerCase('es')
  const coincide = (p) => !q || p.nombre.toLocaleLowerCase('es').includes(q) || String(p.id).toLowerCase().includes(q)

  const conteo = { todos: base.length }
  for (const e of ESTADOS_SEGUIMIENTO) conteo[e] = 0
  if (conEstado) for (const p of base) conteo[estadoDe(p.clave)]++
  const contactados = base.length - conteo.pendiente

  const verRegresos = pestana === 'caidos' && filtro === 'regresaron'
  let visibles = verRegresos
    ? [...regresos.values()].filter(coincide).sort((a, b) => b.mes.id.localeCompare(a.mes.id))
    : base.filter((p) => coincide(p) && (!conEstado || esNuevos || filtro === 'todos' || estadoDe(p.clave) === filtro))
  // En Nuevos, los que ya compraron van al final: quedan arriba los que faltan
  if (esNuevos) visibles = [...visibles].sort((a, b) => compro(a.clave) - compro(b.clave))
  const recortado = pestana === 'todos' && !q && visibles.length > TOPE_TODOS
  if (recortado) visibles = visibles.slice(0, TOPE_TODOS)

  const mesTxt = MESES[ultimo.mes - 1].toLowerCase()
  const explicacion = {
    nuevos: 'Se inscribieron en los últimos 3 meses y no han vuelto a comprar. Lleva a cada uno por sus tres pasos de arranque.',
    caidos: grupoActual.consejo,
    casi: `Compraron en ${mesTxt} entre 60 y 119 pts. Con poco más llegan a los 120 que pide el plan.`,
    todos: 'Todas las personas que han comprado alguna vez, de mayor a menor volumen.',
  }[pestana]

  function detalleDe(p) {
    if (verRegresos) return `Volvió en ${etiquetaMes(p.mes)} con ${pts(p.volumen)}`
    if (pestana === 'nuevos') {
      return p.mesesDesde === 0
        ? `Se inscribió en ${etiquetaMes(p.mesInscripcion)} · aún a tiempo`
        : `Se inscribió en ${etiquetaMes(p.mesInscripcion)} · ${p.mesesDesde === 1 ? '1 mes' : `${p.mesesDesde} meses`} sin recomprar`
    }
    if (pestana === 'caidos') {
      const hace = p.mesesSinComprar === 1 ? '' : ` · hace ${p.mesesSinComprar} meses`
      return `Última compra: ${etiquetaCorta(p.ultimoMes)} (${pts(p.volumenUltimo)})${hace}${p.soloInscripcion ? ' · solo se inscribió' : ` · compró ${p.mesesConCompra} ${p.mesesConCompra === 1 ? 'mes' : 'meses'}`}`
    }
    if (pestana === 'casi') return `Compró ${pts(p.volumen)} · le faltan ${num(p.falta)}`
    return `${p.meses.length} ${p.meses.length === 1 ? 'mes' : 'meses'} con compra · ${pts(p.total)} en total`
  }

  function cambiarPestana(id) {
    setPestana(id); setFiltro('todos'); setAbierto(null); setBusqueda('')
  }

  return (
    <div className="pagina">
      <header className="cabecera">
        <h1>Mi gente</h1>
        <p>Con los datos de {etiquetaMes(ultimo)}.</p>
      </header>

      <div className="pestanas" role="tablist">
        {PESTANAS.map(({ id, texto, Icono }) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            className={`pestana ${pestana === id ? 'activa' : ''}`}
            onClick={() => cambiarPestana(id)}
          >
            <Icono />
            <span className="pestana-cifra">{num(cuenta[id])}</span>
            <span className="pestana-texto">{texto}</span>
          </button>
        ))}
      </div>

      <section className="panel">
        <p className="explicacion">{explicacion}</p>

        {pestana === 'caidos' && (
          <div className="grupos">
            {GRUPOS_INACTIVOS.map((g) => {
              const lista = porGrupo[g.id]
              const constantes = lista.filter((p) => p.constante).length
              return (
                <button
                  key={g.id}
                  className={`grupo grupo-${g.id} ${grupoActual.id === g.id ? 'activo' : ''}`}
                  onClick={() => { setGrupo(g.id); setAbierto(null); setFiltro('todos') }}
                  aria-pressed={grupoActual.id === g.id}
                >
                  <span className="grupo-nombre">{g.texto}</span>
                  <b>{num(lista.length)}</b>
                  <span className="grupo-sub">{g.corto}{constantes ? ` · ${num(constantes)} constantes` : ''}</span>
                </button>
              )
            })}
          </div>
        )}

        {conEstado && base.length > 0 && (
          <div className="avance">
            <div className="avance-texto">
              {esNuevos
                ? <span><b>{num(yaCompraron)} de {num(base.length)}</b> ya compraron</span>
                : <span><b>{num(contactados)} de {num(base.length)}</b> contactados</span>}
              {pestana === 'caidos' && regresos.size > 0 && <span className="texto-verde">{num(regresos.size)} volvieron a comprar</span>}
            </div>
            <div className={`barra ${esNuevos ? 'barra-verde' : ''}`}><span style={{ width: `${((esNuevos ? yaCompraron : contactados) / base.length) * 100}%` }} /></div>
          </div>
        )}

        <div className="buscador">
          <IconoLupa />
          <input
            type="search"
            placeholder="Buscar por nombre o ID"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {conEstado && !esNuevos && (
          <div className="chips chips-fila">
            {[
              ['todos', `Todos ${conteo.todos}`],
              ...ESTADOS_SEGUIMIENTO.map((e) => [e, `${ESTADO[e].plural} ${conteo[e]}`]),
              ...(pestana === 'caidos' ? [['regresaron', `Volvieron ${regresos.size}`]] : []),
            ].map(([val, txt]) => (
              <button key={val} className={`chip ${filtro === val ? 'chip-activo' : ''}`} onClick={() => setFiltro(val)}>
                {txt}
              </button>
            ))}
          </div>
        )}

        {visibles.length === 0 ? (
          <div className="vacio">
            {q ? `Nadie con «${busqueda.trim()}» en esta lista.`
              : verRegresos ? 'Aquí aparecerá quien vuelva a comprar después de que lo contactes.'
              : 'No hay nadie en esta lista.'}
          </div>
        ) : (
          <ul className="lista">
            {visibles.map((p, i) => {
              const estado = estadoDe(p.clave)
              const registro = seguimiento[p.clave]
              const estaAbierto = abierto === p.clave && !verRegresos
              return (
                <li key={p.clave} className={estaAbierto ? 'abierta' : ''}>
                  <button className="persona" onClick={() => !verRegresos && setAbierto(estaAbierto ? null : p.clave)}>
                    <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                      {iniciales(p.nombre)}
                    </span>
                    <span className="persona-texto">
                      <b>{p.nombre}{pestana === 'caidos' && !verRegresos && p.constante && <span className="insignia">Constante</span>}</b>
                      <span>{detalleDe(p)}</span>
                      {registro?.nota && !estaAbierto && !verRegresos && <span className="persona-nota">{registro.nota}</span>}
                    </span>
                    {verRegresos ? (
                      <span className="etiqueta tono-verde">Volvió</span>
                    ) : pestana === 'nuevos' && estado !== 'descartado' ? (
                      (() => {
                        const a = estadoArranque(arranque[p.clave])
                        const urge = a.diasPara != null && a.diasPara <= 0
                        return (
                          <span className={`etiqueta tono-${a.compro ? 'verde' : urge ? 'rojo' : a.completos ? 'azul' : 'neutro'}`}>
                            {a.compro ? 'Ya compró' : a.completos === a.total ? 'Falta que compre' : urge ? textoCuando(a.diasPara) : `Paso ${a.completos + 1} de ${a.total}`}
                          </span>
                        )
                      })()
                    ) : (conEstado || estado !== 'pendiente') ? (
                      <span className={`etiqueta tono-${ESTADO[estado].tono}`}>{ESTADO[estado].texto}</span>
                    ) : null}
                  </button>
                  {estaAbierto && (
                    <Ficha
                      persona={p}
                      tipo={pestana}
                      registro={registro}
                      estado={estado}
                      regreso={regresos.get(p.clave)}
                      mesContacto={ultimo.id}
                      actualizar={(cambios) => actualizarSeguimiento(p.clave, cambios)}
                    >
                      {p.id && <div className="ficha-pista">ID {p.id}</div>}
                      {pestana === 'nuevos' && (
                        <Arranque
                          clave={p.clave}
                          alContactar={() => {
                            if (estado === 'pendiente') {
                              actualizarSeguimiento(p.clave, { estado: 'contactado', mes: ultimo.id, fecha: new Date().toLocaleDateString('en-CA') })
                            }
                          }}
                        />
                      )}
                      {pestana === 'todos' && <Historia meses={meses} persona={p} tema={tema} />}
                    </Ficha>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {recortado && (
          <div className="vacio">Se muestran los {TOPE_TODOS} de mayor volumen. Usa el buscador para encontrar a cualquier otro.</div>
        )}
      </section>
    </div>
  )
}
