// Indicador de % de cambio vs. mes anterior, en forma de chip:
// verde si sube, rojo si baja, gris cuando no hay con qué comparar.

function Flecha({ arriba }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d={arriba ? 'M5 8.5V1.5M5 1.5 1.8 4.7M5 1.5l3.2 3.2' : 'M5 1.5v7M5 8.5 1.8 5.3M5 8.5l3.2-3.2'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Cambio({ pct }) {
  if (pct == null) return <span className="cambio neutro">sin comparar</span>

  const positivo = pct >= 0
  return (
    <span className={`cambio ${positivo ? 'positivo' : 'negativo'}`}>
      <Flecha arriba={positivo} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}
