// Minigráfica de área sin ejes ni rejilla, para el pie de los tiles de KPI.
// Solo insinúa la forma de la serie; los números exactos están arriba.

import { ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function Sparkline({ datos, clave, color, alto = 46 }) {
  if (!datos || datos.length < 2) return null

  const id = `spark-${clave}`

  return (
    <ResponsiveContainer width="100%" height={alto}>
      <AreaChart data={datos} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={clave}
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
