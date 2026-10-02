// Seguimiento de inactivos: quién dejó de comprar (el último mes o en los
// últimos 12) para contactarlo, con su estado, WhatsApp y notas por persona.
// También cuenta a quién regresó a comprar después de contactarlo.

import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  porReactivar, regresosTrasContacto, ESTADOS_SEGUIMIENTO,
} from '../utils/calculos'
import { pts, num, etiquetaMes, etiquetaCorta, MESES } from '../utils/formato'
import { COLORES_AVATAR, iniciales } from '../utils/tema'

const ESTADO = {
  pendiente: { texto: 'Sin contactar', plural: 'Sin contactar', color: 'var(--texto-medio)', fondo: 'var(--superficie-2)' },
  contactado: { texto: 'Contactado', plural: 'Contactados', color: 'var(--azul)', fondo: 'var(--azul-suave)' },
  regresara: { texto: 'Va a regresar', plural: 'Van a regresar', color: 'var(--verde)', fondo: 'var(--verde-suave)' },
  descartado: { texto: 'No le interesa', plural: 'No les interesa', color: 'var(--rojo)', fondo: 'var(--rojo-suave)' },
}

/** "12 sep 2026" a partir de "2026-09-12" */
function fechaCorta(iso) {
  if (!iso) return ''
  return new Date(`${iso}T12:00`).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Panel desplegado de una persona: estado, teléfono y notas */
function Panel({ persona, registro, ultimo, regreso, actualizar }) {
  const telefono = registro?.telefono || ''
  const digitos = telefono.replace(/\D/g, '')
  const telefonoValido = digitos.length >= 8

  function cambiarEstado(estado) {
    // El mes cargado al contactarlo sirve para detectar si después regresa
    actualizar({ estado, mes: ultimo.id, fecha: new Date().toLocaleDateString('en-CA') })
  }

  const estadoActual = regreso ? 'pendiente' : registro?.estado || 'pendiente'

  return (
    <div className="ficha seg-panel">
      {regreso && (
        <div className="seg-aviso">
          Regresó en {etiquetaMes(regreso.mes)} después de contactarlo y se volvió a caer.
        </div>
      )}

      <div className="seg-etiqueta">Estado</div>
      <div className="seg-estados">
        {ESTADOS_SEGUIMIENTO.map((e) => {
          const activo = estadoActual === e
          return (
            <button
              key={e}
              className={`chip-filtro ${activo ? 'seg-estado-activo' : ''}`}
              style={activo ? { color: ESTADO[e].color, background: ESTADO[e].fondo, borderColor: ESTADO[e].color } : undefined}
              onClick={() => cambiarEstado(e)}
              aria-pressed={activo}
            >
              {ESTADO[e].texto}
            </button>
          )
        })}
      </div>

      <div className="seg-etiqueta">WhatsApp / teléfono</div>
      <div className="seg-contacto">
        <input
          type="tel"
          className="seg-input"
          placeholder="Con lada del país, ej. 52 55 1234 5678"
          value={telefono}
          onChange={(e) => actualizar({ telefono: e.target.value })}
        />
        <a
          className={`boton boton-primario boton-chico ${telefonoValido ? '' : 'deshabilitado'}`}
          href={telefonoValido ? `https://wa.me/${digitos}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!telefonoValido}
        >
          WhatsApp
        </a>
        <a
          className={`boton boton-secundario boton-chico ${telefonoValido ? '' : 'deshabilitado'}`}
          href={telefonoValido ? `tel:+${digitos}` : undefined}
          aria-disabled={!telefonoValido}
        >
          Llamar
        </a>
      </div>

      <div className="seg-etiqueta">Notas</div>
      <textarea
        className="seg-input seg-nota"
        rows={3}
        placeholder="Qué te dijo, cuándo volver a hablarle…"
        value={registro?.nota || ''}
        onChange={(e) => actualizar({ nota: e.target.value })}
      />

      <div className="seg-pie">
        {persona.volumenTotal > 0 && <>{pts(persona.volumenTotal)} en los últimos 12 meses · </>}
        {registro?.fecha && !regreso
          ? `Último cambio de estado: ${fechaCorta(registro.fecha)}`
          : 'Aún sin registrar contacto'}
      </div>
    </div>
  )
}

export default function Seguimiento() {
  const { meses, seguimiento, actualizarSeguimiento, navegar } = useApp()
  const [periodo, setPeriodo] = useState('mes') // mes | anio
  const [filtro, setFiltro] = useState('todos') // todos | un estado | regresaron
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)

  const datos = useMemo(() => porReactivar(meses), [meses])
  const regresos = useMemo(() => regresosTrasContacto(meses, seguimiento), [meses, seguimiento])

  if (!datos) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Tu equipo</div>
            <h1>Seguimiento</h1>
            <p>Sin datos suficientes todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '48px 24px' }}>
            Necesitas al menos dos meses con lista de distribuidores para saber quién dejó de comprar 📞
            <div style={{ marginTop: 16 }}>
              <button className="boton boton-primario boton-chico" onClick={() => navegar('captura')}>
                Capturar un mes
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { ultimo, penultimo, desde, personas } = datos
  const delPeriodo = periodo === 'mes' ? personas.filter((p) => p.cayoEsteMes) : personas

  /** Estado vigente: si regresó tras el contacto, vuelve a quedar sin contactar */
  const estadoDe = (clave) =>
    regresos.has(clave) ? 'pendiente' : seguimiento[clave]?.estado || 'pendiente'

  const conteo = { todos: delPeriodo.length }
  for (const e of ESTADOS_SEGUIMIENTO) conteo[e] = 0
  for (const p of delPeriodo) conteo[estadoDe(p.clave)]++
  const contactados = delPeriodo.length - conteo.pendiente

  const q = busqueda.trim().toLocaleLowerCase('es')
  const coincide = (p) =>
    !q || p.nombre.toLocaleLowerCase('es').includes(q) || p.id.toLowerCase().includes(q)

  const listaRegresos = [...regresos.values()]
    .filter(coincide)
    .sort((a, b) => b.mes.id.localeCompare(a.mes.id))
  const visibles = delPeriodo.filter(
    (p) => coincide(p) && (filtro === 'todos' || estadoDe(p.clave) === filtro)
  )

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Tu equipo</div>
          <h1>Seguimiento</h1>
          <p>Quién dejó de comprar, para que lo contactes y lleves el control. Último mes cargado: {etiquetaMes(ultimo)}.</p>
        </div>
      </div>

      {/* Periodo */}
      <div className="seg-periodos">
        {[
          ['mes', personas.filter((p) => p.cayoEsteMes).length, `Se cayeron en ${etiquetaMes(ultimo)}`,
            `Compraron en ${MESES[penultimo.mes - 1]}, no en ${MESES[ultimo.mes - 1]}`],
          ['anio', personas.length, 'Inactivos de los últimos 12 meses',
            `Compraron entre ${etiquetaCorta(desde)} y ${etiquetaCorta(penultimo)}, no en ${MESES[ultimo.mes - 1]}`],
        ].map(([val, n, txt, sub]) => (
          <button
            key={val}
            className={`seg-periodo ${periodo === val ? 'activo' : ''}`}
            onClick={() => { setPeriodo(val); setAbierto(null) }}
            aria-pressed={periodo === val}
          >
            <span className="seg-periodo-cifra">{num(n)}</span>
            <span>
              <span className="seg-periodo-texto">{txt}</span>
              <span className="seg-periodo-sub">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="tarjeta">
        <div className="seg-avance">
          <div className="seg-avance-texto">
            <span><b>{num(contactados)} de {num(delPeriodo.length)}</b> ya contactados</span>
            <span className="seg-avance-regresos">{num(regresos.size)} regresaron tras contactarlos</span>
          </div>
          <div className="seg-barra">
            <span style={{ width: `${delPeriodo.length ? (contactados / delPeriodo.length) * 100 : 0}%` }} />
          </div>
        </div>

        <input
          type="text"
          className="input-busqueda seg-busqueda"
          placeholder="🔍  Buscar por nombre o ID…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            ['todos', `Todos (${conteo.todos})`],
            ...ESTADOS_SEGUIMIENTO.map((e) => [e, `${ESTADO[e].plural} (${conteo[e]})`]),
            ['regresaron', `Regresaron (${regresos.size})`],
          ].map(([val, txt]) => (
            <button
              key={val}
              className={`chip-filtro ${filtro === val ? 'activo' : ''}`}
              onClick={() => setFiltro(val)}
            >
              {txt}
            </button>
          ))}
        </div>

        {filtro === 'regresaron' ? (
          listaRegresos.length === 0 ? (
            <div className="vacio">
              Aquí aparecerá quien vuelva a comprar después de que lo contactes.<br />
              Marca a las personas como <strong>Contactado</strong> y, al cargar el mes siguiente, la app lo detecta sola.
            </div>
          ) : (
            listaRegresos.map((r, i) => (
              <div className="dist-fila" key={r.clave}>
                <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                  {iniciales(r.nombre)}
                </span>
                <div className="dist-info">
                  <div className="dist-nombre">
                    {r.nombre}
                    {r.id && <span className="dist-id">ID {r.id}</span>}
                  </div>
                  <div className="comp-volumenes">
                    Regresó en {etiquetaMes(r.mes)} con {pts(r.volumen)}
                    {r.fechaContacto && ` · lo contactaste el ${fechaCorta(r.fechaContacto)}`}
                  </div>
                </div>
                <span className="badge-estado" style={{ color: 'var(--verde)', background: 'var(--verde-suave)', borderColor: 'var(--verde)' }}>
                  ✓ Regresó
                </span>
              </div>
            ))
          )
        ) : visibles.length === 0 ? (
          <div className="vacio">
            {q ? `Nadie con «${busqueda.trim()}» en esta lista.` : 'No hay nadie en esta categoría 👍'}
          </div>
        ) : (
          visibles.map((p, i) => {
            const estado = estadoDe(p.clave)
            const e = ESTADO[estado]
            const registro = seguimiento[p.clave]
            const estaAbierto = abierto === p.clave
            return (
              <div key={p.clave}>
                <div
                  className="dist-fila dist-fila-click"
                  onClick={() => setAbierto(estaAbierto ? null : p.clave)}
                >
                  <span className="avatar" style={{ background: COLORES_AVATAR[i % COLORES_AVATAR.length] }}>
                    {iniciales(p.nombre)}
                  </span>
                  <div className="dist-info">
                    <div className="dist-nombre">
                      {p.nombre}
                      {p.id && <span className="dist-id">ID {p.id}</span>}
                      {p.soloInscripcion && <span className="dist-id seg-tag">Solo inscripción</span>}
                      {registro?.telefono && <span className="seg-tag-tel" title="Tiene teléfono">📱</span>}
                    </div>
                    <div className="comp-volumenes">
                      Última compra: {etiquetaMes(p.ultimoMes)} ({pts(p.volumenUltimo)})
                      {!p.cayoEsteMes && ` · hace ${p.mesesSinComprar} meses`}
                      {` · activo ${p.mesesActivo} de los últimos 12`}
                    </div>
                    {registro?.nota && !estaAbierto && <div className="seg-nota-previa">📝 {registro.nota}</div>}
                  </div>
                  <span className="badge-estado" style={{ color: e.color, background: e.fondo, borderColor: estado === 'pendiente' ? 'var(--borde-fuerte)' : e.color }}>
                    {e.texto}
                  </span>
                </div>
                {estaAbierto && (
                  <Panel
                    persona={p}
                    registro={registro}
                    ultimo={ultimo}
                    regreso={regresos.get(p.clave)}
                    actualizar={(cambios) => actualizarSeguimiento(p.clave, cambios)}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
