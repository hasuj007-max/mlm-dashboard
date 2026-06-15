// Reporte mensual: genera una tarjeta visual del mes (resumen + top 5) que se
// puede descargar como imagen PNG para compartir con el equipo por WhatsApp.

import { useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { ordenarPorFecha, mesMasReciente, ranking } from '../utils/calculos'
import { usd, pts, num, etiquetaMes } from '../utils/formato'

// Colores fijos del reporte (no dependen del tema, para que la imagen salga igual)
const C = {
  fondo1: '#131a2a', fondo2: '#0d1117', tarjeta: '#182034',
  texto: '#f2f5fa', suave: '#8b96ad', borde: 'rgba(255,255,255,0.08)',
  dorado: '#e8b34b', azul: '#4d8df7', verde: '#3ddc84',
}

export default function Reporte() {
  const { meses, navegar } = useApp()
  const svgRef = useRef(null)
  const orden = ordenarPorFecha(meses)
  const ultimo = mesMasReciente(meses)
  const [id, setId] = useState(ultimo?.id || '')
  const [descargando, setDescargando] = useState(false)

  const mes = useMemo(() => orden.find((m) => m.id === id) || ultimo, [orden, id, ultimo])

  if (!ultimo) {
    return (
      <div>
        <div className="encabezado">
          <div>
            <div className="overline">Compartir</div>
            <h1>Reporte mensual</h1>
            <p>Sin datos todavía</p>
          </div>
        </div>
        <div className="tarjeta">
          <div className="vacio" style={{ padding: '48px 24px' }}>
            Captura un mes y aquí podrás generar una imagen para compartir con tu equipo 📲
          </div>
        </div>
      </div>
    )
  }

  const top = ranking(mes).slice(0, 5)
  const medallas = ['🥇', '🥈', '🥉', '4', '5']
  const pctMeta = mes.metaGanancias > 0 ? Math.round((mes.ganancias / mes.metaGanancias) * 100) : null

  /** Serializa el SVG en pantalla y lo descarga como PNG de alta resolución */
  function descargar() {
    setDescargando(true)
    const svg = svgRef.current
    const xml = new XMLSerializer().serializeToString(svg)
    const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1080
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, 1080, 1080)
      const a = document.createElement('a')
      a.download = `reporte-${mes.id}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
      setDescargando(false)
    }
    img.onerror = () => setDescargando(false)
    img.src = svg64
  }

  // Texto del rango Y para el top (posiciones verticales)
  const filaY = (i) => 700 + i * 66

  return (
    <div>
      <div className="encabezado">
        <div>
          <div className="overline">Compartir</div>
          <h1>Reporte mensual</h1>
          <p>Genera una imagen del mes para mandar a tu equipo.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="selector-mes" value={mes.id} onChange={(e) => setId(e.target.value)}>
            {[...orden].reverse().map((m) => (
              <option key={m.id} value={m.id}>{etiquetaMes(m)}</option>
            ))}
          </select>
          <button className="boton boton-primario" onClick={descargar} disabled={descargando}>
            {descargando ? 'Generando…' : '⬇ Descargar imagen'}
          </button>
        </div>
      </div>

      <div className="reporte-preview">
        <svg ref={svgRef} viewBox="0 0 1080 1080" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 520, borderRadius: 20 }}>
          <defs>
            <linearGradient id="rep-fondo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.fondo1} />
              <stop offset="100%" stopColor={C.fondo2} />
            </linearGradient>
            <radialGradient id="rep-glow" cx="85%" cy="0%" r="60%">
              <stop offset="0%" stopColor="rgba(232,179,75,0.22)" />
              <stop offset="100%" stopColor="rgba(232,179,75,0)" />
            </radialGradient>
            <linearGradient id="rep-barra" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.azul} />
              <stop offset="100%" stopColor={C.dorado} />
            </linearGradient>
          </defs>

          <rect width="1080" height="1080" fill="url(#rep-fondo)" />
          <rect width="1080" height="1080" fill="url(#rep-glow)" />

          {/* Encabezado */}
          <text x="80" y="110" fill={C.dorado} fontSize="26" fontWeight="800" letterSpacing="4" fontFamily="Inter, sans-serif">RESUMEN DEL MES</text>
          <text x="80" y="170" fill={C.texto} fontSize="56" fontWeight="800" fontFamily="Inter, sans-serif">{etiquetaMes(mes)}</text>

          {/* Ganancias grande */}
          <text x="80" y="300" fill={C.suave} fontSize="24" fontWeight="600" fontFamily="Inter, sans-serif">Ganancias del mes</text>
          <text x="80" y="380" fill={C.texto} fontSize="92" fontWeight="800" fontFamily="Inter, sans-serif">{usd(mes.ganancias)}</text>
          {pctMeta != null && (
            <text x="80" y="425" fill={C.verde} fontSize="26" fontWeight="700" fontFamily="Inter, sans-serif">{pctMeta}% de la meta</text>
          )}

          {/* Tres métricas */}
          <g fontFamily="Inter, sans-serif">
            <rect x="80" y="470" width="290" height="140" rx="18" fill={C.tarjeta} stroke={C.borde} />
            <text x="105" y="535" fill={C.azul} fontSize="46" fontWeight="800">{num(mes.volumenRed)}</text>
            <text x="105" y="575" fill={C.suave} fontSize="22" fontWeight="600">Volumen (pts)</text>

            <rect x="395" y="470" width="290" height="140" rx="18" fill={C.tarjeta} stroke={C.borde} />
            <text x="420" y="535" fill={C.verde} fontSize="46" fontWeight="800">{num(mes.nuevosInicios)}</text>
            <text x="420" y="575" fill={C.suave} fontSize="22" fontWeight="600">Nuevos inicios</text>

            <rect x="710" y="470" width="290" height="140" rx="18" fill={C.tarjeta} stroke={C.borde} />
            <text x="735" y="535" fill={C.dorado} fontSize="46" fontWeight="800">{num(mes.activos)}</text>
            <text x="735" y="575" fill={C.suave} fontSize="22" fontWeight="600">Activos</text>
          </g>

          {/* Top distribuidores */}
          <text x="80" y="670" fill={C.dorado} fontSize="24" fontWeight="800" letterSpacing="3" fontFamily="Inter, sans-serif">TOP DISTRIBUIDORES</text>
          <g fontFamily="Inter, sans-serif">
            {top.map((d, i) => (
              <g key={i}>
                <text x="80" y={filaY(i)} fill={C.texto} fontSize="30" fontWeight="700">{medallas[i]}</text>
                <text x="140" y={filaY(i)} fill={C.texto} fontSize="30" fontWeight="600">
                  {d.nombre.length > 28 ? d.nombre.slice(0, 27) + '…' : d.nombre}
                </text>
                <text x="1000" y={filaY(i)} fill={C.dorado} fontSize="30" fontWeight="800" textAnchor="end">{pts(d.volumen)}</text>
              </g>
            ))}
            {top.length === 0 && (
              <text x="80" y="710" fill={C.suave} fontSize="26" fontWeight="600">Sin distribuidores capturados este mes</text>
            )}
          </g>

          {/* Footer */}
          <circle cx="92" cy="1015" r="8" fill={C.dorado} />
          <text x="112" y="1024" fill={C.texto} fontSize="26" fontWeight="800" fontFamily="Inter, sans-serif">MLM Dashboard</text>
        </svg>
      </div>

      <p className="config-descripcion" style={{ textAlign: 'center', marginTop: 16 }}>
        Tip: descarga la imagen y compártela directo en tu grupo de WhatsApp o historia. 📲
      </p>
    </div>
  )
}
