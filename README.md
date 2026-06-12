# MLM Dashboard

Aplicación web local para líderes de network marketing: registra a mano las
métricas de tu negocio mes a mes y analízalas en un dashboard ejecutivo premium.

## Cómo correr la app

```bash
cd ~/mlm-dashboard
npm install      # solo la primera vez
npm run dev
```

Abre en el navegador la URL que muestra la terminal (normalmente `http://localhost:5173`).

## Stack

- **React + Vite** — frontend puro, sin backend.
- **Recharts** — gráficas con degradados.
- **localStorage** — persistencia local automática; respaldo manual vía
  exportar/importar JSON en *Configuración*.

## Guía rápida de uso

1. Entra a **Captura de datos**, llena los datos del mes y agrega tus distribuidores con su volumen.
2. Pulsa **Guardar mes**: el dashboard se actualiza al instante con KPIs, gauge de meta y ranking.
3. En **Dashboard** revisa ganancias, nuevos inicios, volumen, tendencia y top distribuidores.
4. En **Historial** edita o elimina cualquier mes ya guardado.
5. En **Configuración** exporta un respaldo JSON de vez en cuando (o impórtalo en otra computadora).

## Estructura de carpetas

```
src/
  components/   Sidebar, Gauge, iconos, indicador de cambio, tooltip
  context/      AppContext: datos + localStorage + navegación + tema
  paginas/      Inicio, Dashboard, Captura, Historial, Configuración
  styles/       global.css con variables de tema claro/oscuro
  utils/        Cálculos (% cambio, tendencia, validación) y formato (USD, pts)
```

## Notas

- El **volumen** se mide en puntos (pts); las **ganancias** y **metas** en dólares (USD).
- Los datos viven en el `localStorage` del navegador: si cambias de navegador
  o limpias datos del sitio, restaura desde tu respaldo JSON.
