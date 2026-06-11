// Datos de ejemplo que se muestran mientras el usuario no ha capturado
// ningún mes real. Desaparecen automáticamente al guardar el primer mes.

import { idDeMes } from '../utils/calculos'

function mesDemo(anio, mes, datos) {
  return { id: idDeMes(anio, mes), anio, mes, ...datos }
}

export const DATOS_DEMO = [
  mesDemo(2025, 10, {
    volumenRed: 38200, ganancias: 31500, nuevosInicios: 4, activos: 26, metaGanancias: 35000,
    distribuidores: [
      { nombre: 'María González', volumen: 5200 },
      { nombre: 'Carlos Ramírez', volumen: 4100 },
      { nombre: 'Ana Torres', volumen: 3650 },
      { nombre: 'Luis Hernández', volumen: 2900 },
      { nombre: 'Sofía Martínez', volumen: 2400 },
    ],
  }),
  mesDemo(2025, 11, {
    volumenRed: 41600, ganancias: 34200, nuevosInicios: 6, activos: 29, metaGanancias: 35000,
    distribuidores: [
      { nombre: 'María González', volumen: 5600 },
      { nombre: 'Ana Torres', volumen: 4300 },
      { nombre: 'Carlos Ramírez', volumen: 4150 },
      { nombre: 'Sofía Martínez', volumen: 3100 },
      { nombre: 'Luis Hernández', volumen: 2750 },
      { nombre: 'Jorge Díaz', volumen: 1900 },
    ],
  }),
  mesDemo(2025, 12, {
    volumenRed: 47900, ganancias: 39800, nuevosInicios: 8, activos: 33, metaGanancias: 38000,
    distribuidores: [
      { nombre: 'María González', volumen: 6300 },
      { nombre: 'Ana Torres', volumen: 5100 },
      { nombre: 'Jorge Díaz', volumen: 4400 },
      { nombre: 'Carlos Ramírez', volumen: 4200 },
      { nombre: 'Sofía Martínez', volumen: 3300 },
    ],
  }),
  mesDemo(2026, 1, {
    volumenRed: 44100, ganancias: 36400, nuevosInicios: 5, activos: 31, metaGanancias: 40000,
    distribuidores: [
      { nombre: 'Ana Torres', volumen: 5400 },
      { nombre: 'María González', volumen: 5350 },
      { nombre: 'Jorge Díaz', volumen: 4100 },
      { nombre: 'Carlos Ramírez', volumen: 3800 },
    ],
  }),
  mesDemo(2026, 2, {
    volumenRed: 49800, ganancias: 41200, nuevosInicios: 7, activos: 35, metaGanancias: 40000,
    distribuidores: [
      { nombre: 'María González', volumen: 6100 },
      { nombre: 'Ana Torres', volumen: 5800 },
      { nombre: 'Jorge Díaz', volumen: 4900 },
      { nombre: 'Paola Ruiz', volumen: 4200 },
      { nombre: 'Carlos Ramírez', volumen: 3900 },
      { nombre: 'Sofía Martínez', volumen: 3500 },
    ],
  }),
  mesDemo(2026, 3, {
    volumenRed: 53400, ganancias: 44600, nuevosInicios: 9, activos: 38, metaGanancias: 42000,
    distribuidores: [
      { nombre: 'María González', volumen: 6800 },
      { nombre: 'Paola Ruiz', volumen: 5900 },
      { nombre: 'Ana Torres', volumen: 5600 },
      { nombre: 'Jorge Díaz', volumen: 5100 },
      { nombre: 'Carlos Ramírez', volumen: 4300 },
    ],
  }),
  mesDemo(2026, 4, {
    volumenRed: 51200, ganancias: 43100, nuevosInicios: 6, activos: 37, metaGanancias: 45000,
    distribuidores: [
      { nombre: 'Paola Ruiz', volumen: 6400 },
      { nombre: 'María González', volumen: 6200 },
      { nombre: 'Ana Torres', volumen: 5300 },
      { nombre: 'Jorge Díaz', volumen: 4800 },
      { nombre: 'Sofía Martínez', volumen: 3900 },
      { nombre: 'Luis Hernández', volumen: 3200 },
    ],
  }),
  mesDemo(2026, 5, {
    volumenRed: 58700, ganancias: 48900, nuevosInicios: 11, activos: 42, metaGanancias: 45000,
    distribuidores: [
      { nombre: 'María González', volumen: 7400 },
      { nombre: 'Paola Ruiz', volumen: 6900 },
      { nombre: 'Ana Torres', volumen: 6100 },
      { nombre: 'Jorge Díaz', volumen: 5500 },
      { nombre: 'Carlos Ramírez', volumen: 4700 },
      { nombre: 'Sofía Martínez', volumen: 4100 },
      { nombre: 'Luis Hernández', volumen: 3600 },
    ],
  }),
]
