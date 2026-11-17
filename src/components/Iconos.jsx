// Iconos SVG en línea (sin librerías externas) para la sidebar y botones.

const base = {
  width: 19,
  height: 19,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconoDashboard = () => (
  <svg {...base}>
    <rect x="3" y="3" width="8" height="10" rx="2" />
    <rect x="13" y="3" width="8" height="6" rx="2" />
    <rect x="13" y="11" width="8" height="10" rx="2" />
    <rect x="3" y="15" width="8" height="6" rx="2" />
  </svg>
)

export const IconoCaptura = () => (
  <svg {...base}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const IconoHistorial = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)

export const IconoConfig = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
  </svg>
)

export const IconoSol = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconoLuna = () => (
  <svg {...base}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export const IconoMas = () => (
  <svg {...base} width={16} height={16}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconoBasura = () => (
  <svg {...base} width={16} height={16}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const IconoDescarga = () => (
  <svg {...base} width={16} height={16}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
)

export const IconoSubida = () => (
  <svg {...base} width={16} height={16}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </svg>
)

export const IconoDolar = () => (
  <svg {...base} width={21} height={21}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9.5c-.5-1-1.5-1.5-3-1.5-1.8 0-2.8.9-2.8 2 0 2.8 6 1.4 6 4 0 1.2-1.2 2-3.2 2-1.6 0-2.6-.6-3-1.5" />
    <path d="M12 6.5v11" />
  </svg>
)

export const IconoUsuarioMas = () => (
  <svg {...base} width={21} height={21}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
)

export const IconoUsuarios = () => (
  <svg {...base} width={21} height={21}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const IconoCapas = () => (
  <svg {...base} width={21} height={21}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
)

export const IconoRetencion = () => (
  <svg {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
)

export const IconoTelefono = () => (
  <svg {...base}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
)

export const IconoComparativa = () => (
  <svg {...base}>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 4-6" />
  </svg>
)

export const IconoCompartir = () => (
  <svg {...base}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
)

export const IconoCheck = () => (
  <svg {...base} width={16} height={16}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// ---------- Iconos del rediseño (nov 2026): trazo fino, 22 px ----------

const fino = { ...base, width: 22, height: 22, strokeWidth: 1.7 }

/** Resumen: pulso del negocio */
export const IconoResumen = () => (
  <svg {...fino}>
    <path d="M3 12h3.5l2.5-6 4 12 2.5-6H21" />
  </svg>
)

/** Mi gente */
export const IconoGente = () => (
  <svg {...fino}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 19.5c.5-3.2 3-5 6.2-5s5.7 1.8 6.2 5" />
    <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.8M18 14.9c1.8.7 2.9 2.3 3.2 4.6" />
  </svg>
)

/** Cargar mes */
export const IconoCargar = () => (
  <svg {...fino}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

/** Más */
export const IconoPuntos = () => (
  <svg {...fino}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
  </svg>
)

/** Nuevo por arrancar */
export const IconoBrote = () => (
  <svg {...fino}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6Z" />
    <path d="M12 9.5c0-3 2.2-5.5 6.5-5.5 0 3.5-2.5 5.5-6.5 5.5Z" />
  </svg>
)

/** Se cayeron */
export const IconoCaida = () => (
  <svg {...fino}>
    <path d="M3 7l6.5 6.5 4-4L21 17" />
    <path d="M21 11.5V17h-5.5" />
  </svg>
)

/** Casi califican / meta */
export const IconoDiana = () => (
  <svg {...fino}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
)

export const IconoFlecha = () => (
  <svg {...fino} width="18" height="18">
    <path d="M9 5.5 15.5 12 9 18.5" />
  </svg>
)

export const IconoWhatsApp = () => (
  <svg {...fino} width="18" height="18">
    <path d="M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.2Z" />
    <path d="M9 8.8c0 3.2 2.8 6 6 6.2l1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2Z" />
  </svg>
)

export const IconoLupa = () => (
  <svg {...fino} width="18" height="18">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
)
