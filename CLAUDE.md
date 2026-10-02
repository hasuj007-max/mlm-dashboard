# MLM Dashboard

App web local para medir la red de venta directa del usuario mes a mes: ganancias,
meta, volumen, nuevos inicios, activos y ranking del equipo.

- **Código:** `~/mlm-dashboard/`
- **En vivo:** https://hasuj007-max.github.io/mlm-dashboard/
- **Repo:** github.com/hasuj007-max/mlm-dashboard
- **Stack:** React 18 + Vite 5 + Recharts 2. Sin backend, sin router, sin librería de UI.

---

## Comandos

```bash
npm run dev      # http://localhost:5173/mlm-dashboard/  ← la ruta /mlm-dashboard/ es obligatoria
npm run build    # a dist/
git push origin main   # dispara el deploy solo (.github/workflows/deploy.yml → GitHub Pages)
```

Si `npm` falla por permisos de caché: `npm_config_cache=/tmp/npmcache-jr npm run build`.

---

## Trampas (leer antes de tocar nada)

1. **`base: '/mlm-dashboard/'`** en `vite.config.js` porque se publica en una subruta de
   GitHub Pages. Abrir `localhost:PORT` sin `/mlm-dashboard/` da **pantalla en blanco**.
2. **Los datos viven en `localStorage`**, claves `mlm-dashboard-datos-v1`,
   `mlm-dashboard-seguimiento-v1` (estado/teléfono/nota por persona inactiva) y
   `mlm-dashboard-tema`. Son **por origen**: lo que hay en `localhost:5173` no existe en
   el sitio publicado ni en otro puerto. **Son datos reales de 8 años de su negocio**
   (ver abajo). Nunca sembrar datos de prueba sin avisar ni borrar nada sin confirmar;
   revisar siempre qué hay antes de escribir.
3. **Recharts no lee variables CSS.** Todo color de gráfica sale de `src/utils/tema.js`
   (`paleta(tema)`, `coloresGrafica(tema)`, `ejeX/ejeY`). No volver a escribir hex sueltos
   en las páginas: ya se limpió esa duplicación una vez.
4. **`Reporte.jsx` es la excepción:** usa `PALETA` fija oscura a propósito, para que la
   imagen PNG que se comparte por WhatsApp salga igual sin importar el tema activo.
5. `index.html` lleva un script de **auto-recuperación de caché**: si el navegador sirve un
   HTML viejo que pide un `.js` que ya no existe, recarga una vez con `?v=timestamp`.
   No quitarlo.
6. **Commits sin acentos** (convención del repo: "Redisenar", "Retencion").

---

## Mapa

```
src/
  App.jsx              enrutado por objeto PAGINAS (no hay react-router)
  context/AppContext   estado global: meses[], página activa, tema, toasts, localStorage
  paginas/             9 pantallas (ver abajo)
  components/          Sidebar, Cambio (chip ±%), Gauge (meta), Sparkline, TooltipGrafica, Iconos (SVG inline)
  utils/calculos.js    toda la lógica de negocio, sin React
  utils/formato.js     usd() pts() num() etiquetaMes() etiquetaCorta()
  utils/tema.js        paleta y ejes compartidos de gráficas
  styles/global.css    sistema de diseño completo (tokens + todas las clases)
```

**Páginas:** Dashboard (entrada) · Distribuidores · Seguimiento · Retención · Comparativa ·
Reporte mensual · Captura de datos · Historial · Configuración.

**Seguimiento** (sep 2026): quién compró en los 12 meses previos al último mes cargado y no
en ese último mes (`porReactivar`), con vista "se cayeron este mes" vs. "últimos 12". Cada
persona lleva estado (`ESTADOS_SEGUIMIENTO`), teléfono con botón WhatsApp (`wa.me`) y nota.
Al cambiar el estado se guarda `mes` = último mes cargado; si luego aparece con volumen en un
mes posterior, cuenta como **"Regresaron"** (`regresosTrasContacto`). El respaldo JSON de
Configuración exporta/importa `seguimiento` junto a `meses`; un respaldo sin él no lo borra.

**Modelo de datos** — un mes es:
`{ id: "2026-07", anio, mes, ganancias, metaGanancias, nuevosInicios, activos, volumenRed,
distribuidores: [{ id, nombre, volumen }] }`

La lista de un mes solo trae a quien **compró**: no aparecer = inactivo ese mes.

Reglas del dominio: moneda **USD**, volumen en **puntos (pts)**. `CV_INSCRIPCION = 30` — un
distribuidor con volumen **exactamente 30 pts** cuenta como inscripción nueva (`esNuevo`).
El volumen **puede ser negativo** (devoluciones). La identidad de una persona es
`claveDistribuidor`: por ID si lo tiene, si no por nombre normalizado.

---

## Datos reales (¡no es una app vacía!)

El usuario tiene **más de 100 meses cargados, desde abril 2018**. Los meses anteriores a
jun-2024 se reconstruyeron desde historiales de comisiones y solo tienen ganancias
(volumen 0, sin lista de distribuidores); de ahí en adelante sí traen la lista completa.

Los datos crudos (nombres e IDs reales de cientos de personas, **privados**) NO viven aquí:
están en `~/mlm-dashboard-datos/`, carpeta aparte con su propio repo privado. **Este repo es
público — nunca copiar datos personales a él.**

**Captura (oct 2026):** "Personas nuevas" y "Distribuidores activos" ya NO se teclean: se
calculan de la lista (`contarNuevos` = exactamente 30 pts, `contarActivos` = volumen > 0),
igual que `procesar.js` — verificado contra las 27 listas reales, cuadran todas. El pegado
(`interpretarLinea` en `Captura.jsx`) entiende el formato del back office con prefijo
"N"/"Y" y también acepta subir .txt/.csv. El volumen de la red sigue siendo manual (el back
office a veces difiere de la suma: mar-2026) con pista "Tu lista suma X · Usar".

**Para agregar un mes nuevo** él ya puede pegarlo directo en Captura. Si te lo pide a ti:

1. Transcribir el listado que pegue el usuario a `~/mlm-dashboard-datos/<mes>-<anio>.txt`
   tal cual (los prefijos "N"/"Y" los ignora el parser).
2. `node procesar.js <archivo.txt> <anio> <mes> <ganancias> [meta] [volumenRed]` — valida que
   la suma de la lista cuadre con el volumen declarado. Siempre ha cuadrado; si difiere mucho,
   suele ser un typo del usuario: preguntarle antes de "corregirlo".
3. Fusionar en `respaldo-mlm.json` ordenado por id, commit al repo privado.
4. Él lo carga desde **Configuración → Importar datos**.

---

## Diseño

Tema **oscuro premium con acento dorado**, elegido explícitamente por el usuario sobre las
alternativas (Linear/Vercel, claro ejecutivo, denso tipo terminal).

- Todo sale de tokens en `:root` de `global.css`: superficies (`--superficie`, `--superficie-2`,
  `--superficie-3`), espaciado (`--e1..--e6`), radios (`--r-sm..--r-full`), acentos.
- Los dos temas se definen completos; los acentos **se oscurecen en tema claro** porque el
  dorado era ilegible sobre blanco.
- **Clases y nombres en español.** El código es del usuario y lo lee él.
- Nada de hover que levante tarjetas: se realza el borde. Sin cristal translúcido apilado.
- `.tarjeta-flex` + `.grafica-flex` = tarjeta cuya gráfica crece para llenar el alto de la fila.
- Gráficas con pocos puntos llevan dominio Y acotado (`domain={[min*0.9, max*1.08]}`) o la
  línea se aplasta contra el techo y no se lee la tendencia.

---

## Decisiones tomadas (no revertir sin preguntar)

- **"Salud de la red" se borró** (sep 2026). El usuario no la entendía y su lista de "a
  reactivar" es la misma gente que Comparativa marca como **"Se cayeron"**, ahí con umbral de
  volumen configurable. Se eliminó también `actividadPorMes`, `distribuidoresEnRiesgo`,
  `clavesActivas` e `IconoPulso`. **No re-agregarla.** Está en el historial de Git.
- **Criterio de simplificación del usuario:** *si una pantalla no cambia lo que va a hacer
  esta semana, no gana su lugar en el menú.* Él quiere **menos** cosas, no más.
- **No sin App Store ni backend.** Es una herramienta personal en localStorage y así se queda
  salvo que él lo pida.

- **"Inicio" se borró** (sep 2026) a pedido suyo: duplicaba las cifras del Dashboard, que
  ahora es la pantalla de entrada.

## Sobre la mesa (él aún no decide)

- **Pasar los datos a Firebase** (Firestore + login con Google) para verlos en cualquier
  dispositivo. Lo quiere, pero pidió pulir la app antes. Hosting solo NO resuelve nada: el
  problema es que los datos están en localStorage. Hay nombres/IDs/teléfonos reales → reglas
  de seguridad obligatorias.
- Candidata a borrar por la misma regla: **Retención** (la más técnica: curva, cohortes,
  vida mediana). Seguimiento se solapa con "Se cayeron" de Comparativa.
- Métricas que se le propusieron y **pospuso para simplificar primero**: quién patrocinó a
  quién (desbloquea medir duplicación real), actividad semanal (contactos/invitaciones/
  presentaciones/seguimientos), marcar cliente vs. distribuidor, fecha de alta + primer
  volumen (arranque 72 h), ratio acumulado/anual.

## Contexto del usuario

Construye una red de venta directa real; esta app es su tablero, no un ejercicio. Habla
español, prefiere respuestas directas y concretas. Para consejo de negocio MLM (no de
código) existe la skill `arquitecto-de-redes`.
