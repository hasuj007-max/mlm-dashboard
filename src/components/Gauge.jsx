// Indicador circular tipo gauge con arco dorado para el % de meta alcanzado.
// Dibujado a mano en SVG: pista gris de 270° y arco de progreso con degradado.

export default function Gauge({ porcentaje }) {
  const radio = 78
  const circunferencia = 2 * Math.PI * radio
  const fraccionVisible = 0.75 // arco de 270°
  const pista = circunferencia * fraccionVisible
  const avance = Math.min(Math.max(porcentaje, 0), 100) / 100
  const progreso = pista * avance

  return (
    <svg width="210" height="190" viewBox="0 0 210 190">
      <defs>
        <linearGradient id="grad-gauge" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#d49a2e" />
          <stop offset="100%" stopColor="#f7d488" />
        </linearGradient>
      </defs>

      {/* El círculo inicia a 135° para que el hueco quede abajo, centrado */}
      <g transform="rotate(135 105 105)">
        <circle
          cx="105" cy="105" r={radio}
          fill="none"
          stroke="var(--borde)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${pista} ${circunferencia}`}
        />
        <circle
          cx="105" cy="105" r={radio}
          fill="none"
          stroke="url(#grad-gauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${progreso} ${circunferencia}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </g>

      <text x="105" y="105" textAnchor="middle" className="gauge-pct">
        {Math.round(porcentaje)}%
      </text>
      <text x="105" y="128" textAnchor="middle" className="gauge-sub">
        de la meta
      </text>
    </svg>
  )
}
