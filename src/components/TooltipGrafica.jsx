// Tooltip personalizado para todas las gráficas (sin estilos por defecto).

export default function TooltipGrafica({ active, payload, label, formatear }) {
  if (!active || !payload?.length) return null

  return (
    <div className="tooltip-grafica">
      <div className="tt-titulo">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tt-valor">
          {formatear ? formatear(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}
