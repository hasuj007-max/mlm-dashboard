// Indicador de % de cambio vs. mes anterior: ▲ verde, ▼ rojo o "—".

export default function Cambio({ pct }) {
  if (pct == null) return <span className="cambio neutro">—</span>

  const positivo = pct >= 0
  return (
    <span className={`cambio ${positivo ? 'positivo' : 'negativo'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}
