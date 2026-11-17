// Resumen: ¿cómo voy? Una cifra grande (ganancia), tres datos de la red,
// a quién llamar esta semana, el rango que alcanza el volumen, cuánta gente
// se quedó y una sola gráfica. Todo lo de red es de la pierna de pago.

import { useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'
import { useApp } from '../context/AppContext'
import {
  ordenarPorFecha, mesAnterior, cambioPct, contarActivos, contarNuevos, contarCalificados,
  rangoPorVolumen, retencionDelMes, porReactivar, nuevosEnRiesgo, casiCalifican, estadisticasGanancias,
  modeloCrecimiento, proyectarRango, revividos, GRUPOS_INACTIVOS, sumarActividad, diasDeEstaSemana, fechaISO, CAMPOS_ACTIVIDAD, RANGOS,
} from '../utils/calculos'
import { usd, num, etiquetaMes, etiquetaCorta, MESES } from '../utils/formato'
import { paleta, coloresGrafica, ejeX, ejeY } from '../utils/tema'
import Cambio from '../components/Cambio'
import TooltipGrafica from '../components/TooltipGrafica'
import { IconoBrote, IconoCaida, IconoDiana, IconoFlecha } from '../components/Iconos'

/** Dato chico con etiqueta arriba, cifra y una línea de contexto */
function Dato({ etiqueta, valor, pie, cambio }) {
  return (
    <div className="dato">
      <div className="dato-etq">{etiqueta}</div>
      <div className="dato-cifra">
        {valor}
        {cambio !== undefined && <Cambio pct={cambio} />}
      </div>
      {pie && <div className="dato-pie">{pie}</div>}
    </div>
  )
}

/** Fila de acción: cuánta gente hay en una lista y a dónde lleva */
function Accion({ Icono, tono, cifra, titulo, detalle, onClick }) {
  return (
    <button className="accion" onClick={onClick}>
      <span className={`accion-icono tono-${tono}`}><Icono /></span>
      <span className="accion-texto">
        <b>{num(cifra)} {titulo}</b>
        <span>{detalle}</span>
      </span>
      <IconoFlecha />
    </button>
  )
}

/** Contadores de lo que hiciste hoy + total de la semana y tu embudo real */
function Actividad() {
  const { actividad, registrarActividad } = useApp()
  const hoy = actividad[fechaISO()] || {}
  const semana = sumarActividad(actividad, diasDeEstaSemana())
  const mes = sumarActividad(actividad, 30)
  const cierre = mes.presentaciones >= 5 ? mes.inscritos / mes.presentaciones : null

  return (
    <section className="panel">
      <div className="panel-cabecera">
        <h2>Tu actividad de hoy</h2>
        <span className="panel-nota">Toca + cada vez que lo hagas</span>
      </div>
      <div className="contadores">
        {CAMPOS_ACTIVIDAD.map(([campo, texto]) => (
          <div className="contador" key={campo}>
            <div className="contador-etq">{texto}</div>
            <div className="contador-fila">
              <button
                className="contador-boton" aria-label={`Quitar una de ${texto}`}
                onClick={() => registrarActividad(campo, -1)} disabled={!hoy[campo]}
              >−</button>
              <b>{num(hoy[campo] || 0)}</b>
              <button
                className="contador-boton mas" aria-label={`Sumar una a ${texto}`}
                onClick={() => registrarActividad(campo, 1)}
              >+</button>
            </div>
            <div className="contador-pie">{num(semana[campo])} esta semana</div>
          </div>
        ))}
      </div>
      <p className="nota">
        {cierre != null
          ? `En los últimos 30 días: ${num(mes.invitaciones)} invitaciones, ${num(mes.presentaciones)} presentaciones y ${num(mes.inscritos)} inscritos. De cada 10 presentaciones inscribes ${(cierre * 10).toFixed(1)}.`
          : 'Cuando lleves al menos 5 presentaciones registradas, aquí verás cuántas necesitas para inscribir a una persona.'}
      </p>
    </section>
  )
}

/** Plan hacia un rango: cuánta gente tiene que entrar y en cuántos meses llegas */
function PlanRango({ meses, volumenActual }) {
  const { actividad } = useApp()
  const base = useMemo(() => modeloCrecimiento(meses), [meses])
  const opciones = RANGOS.filter(([, min]) => min > volumenActual).slice(0, 4)
  const [metaNombre, setMetaNombre] = useState(null)
  const [entradas, setEntradas] = useState(null)
  const [retencion, setRetencion] = useState(null)
  if (!base || opciones.length === 0) return null

  const meta = opciones.find(([n]) => n === metaNombre) || opciones[0]
  const E = entradas ?? Math.round(base.entradas)
  const r = retencion ?? Math.round(base.retencion * 100)
  const p = proyectarRango({ ...base, retencion: r / 100, entradas: E, metaVolumen: meta[1] })
  const hoy = proyectarRango({ ...base, metaVolumen: meta[1] })
  const mes30 = sumarActividad(actividad, 30)
  const cierre = mes30.presentaciones >= 5 && mes30.inscritos > 0 ? mes30.inscritos / mes30.presentaciones : null
  const cambiado = entradas != null || retencion != null
  // El control crece con la red: al menos 80 y siempre el doble de lo que entra hoy
  const maxEntradas = Math.max(80, Math.ceil((base.entradas * 2) / 10) * 10)

  return (
    <section className="panel">
      <div className="panel-cabecera">
        <h2>Tu plan para subir de rango</h2>
        <select className="selector-mes" value={meta[0]} onChange={(e) => setMetaNombre(e.target.value)} aria-label="Rango meta">
          {opciones.map(([n, min]) => <option key={n} value={n}>{n} · {num(min)} pts</option>)}
        </select>
      </div>

      <div className={`plan-resultado ${p.llega ? '' : 'no-llega'}`}>
        {p.llega ? (
          <>
            <b>{p.meses === 0 ? 'Ya alcanza' : p.meses === 1 ? '1 mes' : `${p.meses} meses`}</b>
            <span>para llegar a {meta[0]}: unas {num(p.activosMeta)} personas comprando cada mes (hoy {num(base.activos)}).</span>
          </>
        ) : (
          <>
            <b>No alcanza</b>
            <span>
              Con estos números te estacionas en unas {num(Math.round(p.estable))} personas
              (≈ {num(Math.round(p.volumenEstable / 100) * 100)} pts). {meta[0]} pide unas {num(p.activosMeta)}.
            </span>
          </>
        )}
      </div>

      <div className="deslizador">
        <div className="deslizador-texto">
          <span>Personas que entran por mes <small>nuevas + las que regresan</small></span>
          <b>{num(E)}</b>
        </div>
        <input type="range" min="0" max={maxEntradas} step="1" value={E} onChange={(e) => setEntradas(Number(e.target.value))} aria-label="Personas que entran por mes" />
        <div className="deslizador-pie">Hoy: {num(Math.round(base.entradas))} por mes</div>
      </div>
      <div className="deslizador">
        <div className="deslizador-texto">
          <span>De cada 100 que compran, repiten el mes siguiente</span>
          <b>{r}</b>
        </div>
        <input type="range" min="30" max="90" step="1" value={r} onChange={(e) => setRetencion(Number(e.target.value))} aria-label="Retención" />
        <div className="deslizador-pie">Hoy: {Math.round(base.retencion * 100)}</div>
      </div>

      <p className="nota">
        {!p.llega && base.tendenciaEntradas > 1.2 && !cambiado && `Ojo: tus entradas vienen subiendo (+${Math.round((base.tendenciaEntradas - 1) * 100)}% contra los 3 meses anteriores). Si siguen creciendo, llegas antes de lo que dice este cálculo. `}
        {!hoy.llega && !cambiado && base.tendenciaEntradas <= 1.2 && `Tal como vas hoy, no llegas a ${meta[0]}: mueve los controles para ver qué haría falta. `}
        {cierre != null && E > 0 && `Con tu ritmo de cierre, ${num(E)} entradas al mes son unas ${num(Math.ceil(E / cierre / 4.3))} presentaciones por semana (si todas fueran inscritos nuevos). `}
        Supone que sigues metiendo {num(E)} personas al mes (tus últimos 3 meses: {num(Math.round(base.entradas))}), que repite tu promedio de 6 meses y {num(Math.round(base.ptsPorActivo))} pts por persona. Es una proyección, no una promesa.
        {cambiado && (
          <button className="boton-enlace" onClick={() => { setEntradas(null); setRetencion(null) }}> Volver a mis números</button>
        )}
      </p>
    </section>
  )
}

const NOMBRE_GRUPO = {
  este: 'se habían caído el mes pasado',
  tibios: 'tibios (2–3 meses)',
  frios: 'fríos (4–6 meses)',
  dormidos: 'dormidos (7–12 meses)',
  perdidos: 'más de un año',
}
const ETIQUETA_GRUPO = { este: 'Mes pasado', tibios: 'Tibio', frios: 'Frío', dormidos: 'Dormido', perdidos: '+1 año' }

/** Quién revivió este mes (detectado solo con las listas) y cuántos de los del mes pasado se quedaron */
function Revividos({ meses, mes }) {
  const r = useMemo(() => revividos(meses, mes.id), [meses, mes.id])
  const [verLista, setVerLista] = useState(false)
  if (!r) return null

  const mesTxt = MESES[r.actual.mes - 1].toLowerCase()
  const previoTxt = MESES[r.previo.mes - 1].toLowerCase()
  const n = r.personas.length
  const previos = r.historia.slice(0, -1).map((h) => h.revividos)
  const promedio = previos.length ? previos.reduce((a, b) => a + b, 0) / previos.length : null
  const tasas = r.historia.filter((h) => h.seQuedaron != null && h.revividos > 0 && h.mes.id !== r.previo.id)
  const promQuedan = tasas.length ? tasas.reduce((a, h) => a + h.seQuedaron / h.revividos, 0) / tasas.length : null
  const pctQuedan = r.anteriores ? r.siguen.length / r.anteriores : null
  const grupos = [...GRUPOS_INACTIVOS.map((g) => g.id), 'perdidos'].filter((g) => r.porGrupo[g])
  const maxHist = Math.max(1, ...r.historia.map((h) => h.revividos))

  return (
    <section className="panel revividos">
      <h2>Gente que revivió</h2>
      <div className="revividos-cabeza">
        <b>{num(n)}</b>
        <span>
          {n === 0
            ? `Nadie que estuviera inactivo volvió a comprar en ${mesTxt}.`
            : `${n === 1 ? 'persona que ya no compraba volvió' : 'personas que ya no compraban volvieron'} a comprar en ${mesTxt}${promedio != null && n > promedio ? ' 🎉' : '.'}`}
          {promedio != null && n > 0 && (
            <small>{n > promedio ? `Más que tu promedio de ${Math.round(promedio)} al mes.` : `Tu promedio es ${Math.round(promedio)} al mes.`}</small>
          )}
        </span>
      </div>

      {grupos.length > 0 && (
        <div className="revividos-grupos">
          {grupos.map((g) => (
            <span key={g} className={`revividos-grupo g-${g}`}><b>{num(r.porGrupo[g])}</b> {NOMBRE_GRUPO[g]}</span>
          ))}
        </div>
      )}

      {r.anteriores > 0 && (
        <div className={`revividos-quedan ${promQuedan != null && pctQuedan >= promQuedan ? 'bien' : ''}`}>
          <b>{num(r.siguen.length)} de {num(r.anteriores)}</b>
          <span>
            de los que revivieron en {previoTxt} siguieron comprando en {mesTxt}
            {promQuedan != null && pctQuedan >= promQuedan && r.siguen.length > 0 ? '. ¡Esos ya son tuyos otra vez! 💪' : '.'}
            <small>
              Revivir de verdad es que se queden.
              {promQuedan != null && ` Normalmente se queda ${Math.round(promQuedan * 100)}%; este mes ${Math.round(pctQuedan * 100)}%.`}
            </small>
          </span>
        </div>
      )}

      <div className="revividos-historia" aria-label="Revividos por mes">
        {r.historia.map((h) => (
          <div key={h.mes.id} className={`rh-col ${h.mes.id === r.actual.id ? 'actual' : ''}`}>
            <div className="rh-barra">
              <span className="rh-total" style={{ height: `${(h.revividos / maxHist) * 100}%` }}>
                {h.seQuedaron != null && <span className="rh-quedan" style={{ height: `${h.revividos ? (h.seQuedaron / h.revividos) * 100 : 0}%` }} />}
              </span>
            </div>
            <b>{num(h.revividos)}</b>
            <small>{etiquetaCorta(h.mes)}</small>
          </div>
        ))}
      </div>
      <div className="rh-leyenda"><span className="l-total" /> revivieron <span className="l-quedan" /> se quedaron al mes siguiente</div>

      {n > 0 && (
        <>
          <button className="boton-enlace" onClick={() => setVerLista(!verLista)}>
            {verLista ? 'Ocultar quiénes' : `Ver quiénes son (${num(n)})`}
          </button>
          {verLista && (
            <ul className="revividos-lista">
              {r.personas.map((p) => (
                <li key={p.clave}>
                  <span className="rl-nombre">{p.nombre}</span>
                  <span className={`rl-grupo g-${p.grupo}`}>{ETIQUETA_GRUPO[p.grupo]}</span>
                  <span className="rl-detalle">
                    {p.sinComprar} {p.sinComprar === 1 ? 'mes' : 'meses'} sin comprar · volvió con {num(p.volumen)} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default function Resumen() {
  const { meses, sinDatos, navegar, tema, usuario, estadoNube, entrarConGoogle } = useApp()
  const orden = useMemo(() => ordenarPorFecha(meses), [meses])
  const ultimo = orden[orden.length - 1]
  const [idElegido, setIdElegido] = useState(null)
  const [alcance, setAlcance] = useState(null) // gráfica: '12' | 'todo' (null = según la vista)

  const esHistorico = idElegido === 'historico'
  const mes = orden.find((m) => m.id === idElegido) || ultimo
  const esUltimo = !esHistorico && mes && ultimo && mes.id === ultimo.id

  const retencion = useMemo(() => (mes ? retencionDelMes(meses, mes.id) : null), [meses, mes])
  const caidos = useMemo(() => porReactivar(meses), [meses])
  const nuevos = useMemo(() => nuevosEnRiesgo(meses), [meses])
  const casi = useMemo(() => casiCalifican(meses), [meses])

  if (sinDatos) {
    return (
      <div className="pagina">
        <header className="cabecera">
          <h1>Tu negocio, de un vistazo</h1>
          <p>Aún no hay ningún mes cargado.</p>
        </header>
        <div className="panel vacio-grande">
          <p>Carga tu primer mes y aquí verás cuánto ganaste, cómo va tu rango y a quién llamar.</p>
          <div className="vacio-botones">
            {!usuario && (
              <button className="boton boton-primario" onClick={entrarConGoogle} disabled={estadoNube === 'cargando'}>
                Entrar con Google y traer mis datos
              </button>
            )}
            <button className={`boton ${usuario ? 'boton-primario' : 'boton-secundario'}`} onClick={() => navegar('captura')}>
              Cargar mi primer mes
            </button>
          </div>
          {estadoNube === 'sincronizando' && <p className="nota">Buscando tus datos en la nube…</p>}
        </div>
      </div>
    )
  }

  const previo = mesAnterior(meses, mes)
  const tieneLista = (mes.distribuidores || []).length > 0
  const metaReal = mes.metaGanancias > 0 && Math.abs(mes.metaGanancias - mes.ganancias) > 1
  const avanceMeta = metaReal ? Math.min(100, (mes.ganancias / mes.metaGanancias) * 100) : 0
  const activos = contarActivos(mes.distribuidores)
  const califican = contarCalificados(mes.distribuidores)
  const inscritos = contarNuevos(mes.distribuidores)
  const rango = rangoPorVolumen(mes.volumenRed)
  // Compra promedio = volumen ÷ personas que compraron (pts por persona)
  const promedioDe = (m) => {
    const n = contarActivos(m?.distribuidores)
    return n ? m.volumenRed / n : null
  }
  const compraPromedio = promedioDe(mes) || 0
  const compraPrevia = previo ? promedioDe(previo) : null
  const ultimos12ConLista = orden.filter((m) => m.id <= mes.id && (m.distribuidores || []).length).slice(-12)
  const compraAnual = ultimos12ConLista.length >= 3
    ? ultimos12ConLista.reduce((s, m) => s + m.volumenRed, 0) / ultimos12ConLista.reduce((s, m) => s + contarActivos(m.distribuidores), 0)
    : null
  const caidosEsteMes = caidos ? caidos.personas.filter((p) => p.cayoEsteMes).length : 0

  const P = paleta(tema)
  const colores = coloresGrafica(tema)
  const rango12 = (alcance || (esHistorico ? 'todo' : '12')) === '12'
  const serie = (rango12 ? orden.slice(-12) : orden).map((m) => ({
    id: m.id, nombre: etiquetaCorta(m), ganancias: m.ganancias,
  }))
  const marcado = !esHistorico && serie.find((p) => p.id === mes.id)
  const stats = estadisticasGanancias(meses)
  const ultimos12 = orden.slice(-12).reduce((t, m) => t + m.ganancias, 0)

  const grafica = (
    <section className="panel">
      <div className="panel-cabecera">
        <h2>Tus ganancias mes a mes</h2>
        <div className="segmentos segmentos-chicos">
          <button className={`segmento ${rango12 ? 'activo' : ''}`} onClick={() => setAlcance('12')}>12 meses</button>
          <button className={`segmento ${!rango12 ? 'activo' : ''}`} onClick={() => setAlcance('todo')}>Todo</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={serie} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-ganancias" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.dorado} stopOpacity={0.32} />
              <stop offset="100%" stopColor={P.dorado} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colores.rejilla} vertical={false} />
          <XAxis dataKey="nombre" {...ejeX(colores, { interval: 'preserveStartEnd', minTickGap: 24 })} />
          <YAxis {...ejeY(colores, { width: 40, tickFormatter: (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`) })} />
          <Tooltip content={<TooltipGrafica formatear={usd} />} cursor={{ stroke: colores.rejilla }} />
          <Area
            type="monotone" dataKey="ganancias" stroke={P.dorado} strokeWidth={2.2}
            fill="url(#grad-ganancias)" dot={false} activeDot={{ r: 4.5, fill: P.dorado, stroke: 'none' }}
            isAnimationActive={false}
          />
          {marcado && <ReferenceDot x={marcado.nombre} y={marcado.ganancias} r={5} fill={P.dorado} stroke="var(--superficie)" strokeWidth={2} />}
        </AreaChart>
      </ResponsiveContainer>
    </section>
  )

  const selector = (
    <select
      className="selector-mes"
      value={esHistorico ? 'historico' : mes.id}
      onChange={(e) => { setIdElegido(e.target.value); setAlcance(null) }}
      aria-label="Elegir mes o el total histórico"
    >
      <option value="historico">Histórico (total)</option>
      {[...orden].reverse().map((m) => (
        <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
      ))}
    </select>
  )

  const conListaTodos = orden.filter((m) => (m.distribuidores || []).length)
  const compraHistorica = conListaTodos.length
    ? conListaTodos.reduce((t, m) => t + m.volumenRed, 0) / (conListaTodos.reduce((t, m) => t + contarActivos(m.distribuidores), 0) || 1)
    : null

  if (esHistorico) {
    return (
      <div className="pagina">
        <header className="cabecera cabecera-fila">
          <div>
            <h1>Todo tu historial</h1>
            <p>{orden.length} meses · {etiquetaMes(orden[0])} a {etiquetaMes(ultimo)}</p>
          </div>
          {selector}
        </header>

        <section className="panel heroe">
          <div className="heroe-etq">Has ganado en total</div>
          <div className="heroe-cifra">{usd(stats.total)}</div>
          <div className="heroe-pie"><span>desde {etiquetaMes(orden[0]).toLowerCase()}</span></div>
        </section>

        {grafica}

        <section className="datos datos-4">
          <Dato etiqueta="Promedio por mes" valor={usd(stats.promedio)} pie={`${usd(stats.promedio3)} en los últimos 3`} />
          <Dato etiqueta="Últimos 12 meses" valor={usd(ultimos12)} pie={`${usd(ultimos12 / Math.min(12, orden.length))} por mes`} />
          <Dato etiqueta="Mejor mes" valor={usd(stats.mejor.ganancias)} pie={etiquetaMes(stats.mejor)} />
          {compraHistorica && (
            <Dato etiqueta="Compra promedio" valor={`${num(Math.round(compraHistorica))} pts`} pie="por persona, todo el historial con lista" />
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="pagina">
      <header className="cabecera cabecera-fila">
        <div>
          <h1>{etiquetaMes(mes)}</h1>
          <p>{esUltimo ? 'Tu último mes cargado' : 'Estás viendo un mes anterior'}</p>
        </div>
        {selector}
      </header>

      {/* Ganancia: la cifra que manda */}
      <section className="panel heroe">
        <div className="heroe-etq">Ganaste</div>
        <div className="heroe-cifra">{usd(mes.ganancias)}</div>
        <div className="heroe-pie">
          <Cambio pct={previo ? cambioPct(mes.ganancias, previo.ganancias) : null} />
          {previo && <span>contra {MESES[previo.mes - 1].toLowerCase()} ({usd(previo.ganancias)})</span>}
        </div>
        {metaReal && (
          <div className="meta">
            <div className="meta-texto">
              <span>Meta {usd(mes.metaGanancias)}</span>
              <b>{Math.round((mes.ganancias / mes.metaGanancias) * 100)}%</b>
            </div>
            <div className="barra"><span style={{ width: `${avanceMeta}%` }} /></div>
          </div>
        )}
      </section>

      {grafica}

      {esUltimo && <Actividad />}

      {tieneLista ? (
        <>
          <section className="datos datos-4">
            <Dato
              etiqueta="Compraron"
              valor={num(activos)}
              cambio={previo && previo.activos ? cambioPct(activos, previo.activos) : undefined}
              pie={`${num(califican)} con 120 pts o más`}
            />
            <Dato
              etiqueta="Inscritos nuevos"
              valor={num(inscritos)}
              pie={previo ? `${num(previo.nuevosInicios)} el mes anterior` : null}
            />
            <Dato
              etiqueta="Volumen"
              valor={num(mes.volumenRed)}
              cambio={previo && previo.volumenRed ? cambioPct(mes.volumenRed, previo.volumenRed) : undefined}
              pie="pts en tu pierna de pago"
            />
            <Dato
              etiqueta="Compra promedio"
              valor={`${num(Math.round(compraPromedio))} pts`}
              cambio={compraPrevia ? cambioPct(compraPromedio, compraPrevia) : undefined}
              pie={compraAnual ? `por persona · tu promedio de 12 meses: ${num(Math.round(compraAnual))}` : 'por persona que compró'}
            />
          </section>

          {esUltimo && (nuevos.length > 0 || caidosEsteMes > 0 || casi.length > 0) && (
            <section className="panel">
              <h2>A quién llamar esta semana</h2>
              <div className="acciones">
                {nuevos.length > 0 && (
                  <Accion
                    Icono={IconoBrote} tono="verde" cifra={nuevos.length}
                    titulo={nuevos.length === 1 ? 'nuevo sin recomprar' : 'nuevos sin recomprar'}
                    detalle="Sigue su arranque de 30 días. Aquí es donde más gente se pierde."
                    onClick={() => navegar('gente', null, 'nuevos')}
                  />
                )}
                {caidosEsteMes > 0 && (
                  <Accion
                    Icono={IconoCaida} tono="rojo" cifra={caidosEsteMes}
                    titulo={caidosEsteMes === 1 ? `se cayó en ${MESES[mes.mes - 1].toLowerCase()}` : `se cayeron en ${MESES[mes.mes - 1].toLowerCase()}`}
                    detalle="Compraron el mes pasado y este no. Son los más fáciles de recuperar."
                    onClick={() => navegar('gente', null, 'caidos')}
                  />
                )}
                {casi.length > 0 && (
                  <Accion
                    Icono={IconoDiana} tono="dorado" cifra={casi.length}
                    titulo={casi.length === 1 ? 'casi califica' : 'casi califican'}
                    detalle="Compraron, pero no llegaron a 120 pts."
                    onClick={() => navegar('gente', null, 'casi')}
                  />
                )}
              </div>
            </section>
          )}

          <div className="dos-columnas">
            <section className="panel">
              <h2>Tu rango por volumen</h2>
              <div className="rango-nombre">{rango.nombre}</div>
              {rango.siguiente ? (
                <>
                  <div className="barra barra-dorada"><span style={{ width: `${rango.avance * 100}%` }} /></div>
                  <div className="rango-pie">
                    <span>Te faltan <b>{num(rango.falta)} pts</b> para {rango.siguiente}</span>
                    <span>{num(rango.meta)}</span>
                  </div>
                </>
              ) : (
                <div className="rango-pie"><span>Estás en el rango más alto de la tabla.</span></div>
              )}
              <p className="nota">
                Es hasta donde alcanza el volumen de tu pierna de pago. El rango oficial también
                pide tus puntos personales y, desde Oro, directos en Bronce.
              </p>
            </section>

            {retencion && (
              <section className="panel">
                <h2>¿Se quedó tu gente?</h2>
                <div className="retencion">
                  <div className="retencion-fila">
                    <b>{retencion.pct == null ? '—' : `${Math.round(retencion.pct)}%`}</b>
                    <span>
                      repitió compra
                      <small>
                        {num(retencion.repitieron)} de {num(retencion.base)} de {MESES[retencion.previo.mes - 1].toLowerCase()}
                        {retencion.pctPromedio != null && ` · tu promedio es ${Math.round(retencion.pctPromedio)}%`}
                      </small>
                    </span>
                  </div>
                  <div className="retencion-fila">
                    <b>{num(retencion.nuevosRecompraron)}<i> de {num(retencion.inscritosPrevios)}</i></b>
                    <span>
                      nuevos recompraron
                      <small>de los inscritos en {MESES[retencion.previo.mes - 1].toLowerCase()}</small>
                    </span>
                  </div>
                  <div className="retencion-fila">
                    <b>{num(retencion.regresaron)}</b>
                    <span>
                      regresaron
                      <small>llevaban al menos un mes sin comprar</small>
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>

          <Revividos meses={meses} mes={mes} />

          {esUltimo && <PlanRango meses={meses} volumenActual={mes.volumenRed} />}
        </>
      ) : (
        <section className="panel">
          <p className="nota" style={{ margin: 0 }}>
            De este mes solo hay ganancias. La lista de tu equipo existe desde junio 2024.
          </p>
        </section>
      )}

    </div>
  )
}
