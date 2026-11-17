# MLM Dashboard

App web local para medir la red de venta directa del usuario mes a mes: ganancias,
meta, volumen, nuevos inicios, activos y ranking del equipo.

- **Código:** `~/mlm-dashboard/`
- **En vivo:** https://mi-red-hasuj.firebaseapp.com (nueva, Firebase) · https://hasuj007-max.github.io/mlm-dashboard/ (vieja, GitHub Pages)
- **Repo:** github.com/hasuj007-max/mlm-dashboard
- **Stack:** React 18 + Vite 5 + Recharts 2. Sin backend, sin router, sin librería de UI.

---

## Comandos

```bash
npm run dev      # http://localhost:5173/  (la base ya es / ; /mlm-dashboard/ solo en GitHub Pages)
npm run build    # a dist/
git push origin main   # dispara el deploy solo (.github/workflows/deploy.yml → GitHub Pages)
```

Si `npm` falla por permisos de caché: `npm_config_cache=/tmp/npmcache-jr npm run build`.

---

## Trampas (leer antes de tocar nada)

1. **`base` es `/`** (Firebase Hosting). Solo el workflow de GitHub Pages compila con
   `BASE=/mlm-dashboard/`. En local se abre `localhost:PUERTO/` sin subruta.
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
  paginas/             4 pantallas: Resumen, Gente, Captura, Mas (+ Historial, Reporte, Configuracion dentro de Mas)
  components/          Navegacion, Cambio (chip ±%), TooltipGrafica, Iconos (SVG inline)
  utils/calculos.js    toda la lógica de negocio, sin React
  utils/formato.js     usd() pts() num() etiquetaMes() etiquetaCorta()
  utils/tema.js        paleta y ejes compartidos de gráficas
  styles/global.css    base (tokens + clases de Captura/Historial/Reporte/Ajustes)
  styles/v2.css        rediseño nov 2026: tokens retocados + navegación, Resumen, Mi gente
```

**Rediseño nov 2026 — 4 pantallas** (antes 9; él se confundía). Cada una responde una pregunta:

- **Resumen** (`Resumen.jsx`, entrada): ganancia grande + meta (solo si es real: distinta a la
  ganancia), 3 datos (compraron / inscritos / volumen), "A quién llamar esta semana" (lleva a
  Mi gente), rango por volumen (`rangoPorVolumen`, tabla `RANGOS` del plan 2020), "¿Se quedó tu
  gente?" (`retencionDelMes`) y una sola gráfica de ganancias. Selector de mes arriba.
- **Mi gente** (`Gente.jsx`): pestañas Nuevos (`nuevosEnRiesgo`) · Se cayeron (`porReactivar`
  en 4 grupos `GRUPOS_INACTIVOS`: este mes · tibios 2–3 · fríos 4–6 · dormidos 7–12 meses sin
  comprar; primero los "constantes" = 3+ meses con compra, `MESES_CONSTANTE`; >12 meses se omite a
  propósito) · Casi califican (`casiCalifican`, 60–119 pts) · Todos (directorio con
  historial). Cada persona abre una ficha: estado (`ESTADOS_SEGUIMIENTO`), teléfono, mensaje de
  WhatsApp con `{nombre}` (plantilla por pestaña en `mlm-dashboard-mensajes-v1`, NO va en el
  respaldo JSON), llamar y notas. Si alguien contactado vuelve a comprar cuenta como "Volvieron"
  (`regresosTrasContacto`) y su estado se reinicia.
  En Resumen, **"Gente que revivió"** (`revividos`): se detecta sola con las listas, sin marcar
  nada: compró este mes, no el anterior y ya había comprado antes. Se clasifica por el grupo en que
  estaba (mes pasado/tibio/frío/dormido/+1 año) y dice cuántos de los revividos del mes anterior
  "se quedaron" (volvieron a comprar). Historial de 6 meses. Festeja solo si supera su promedio.
- **Cargar mes** (`Captura.jsx`, sin cambios de lógica).
- **Más** (`Mas.jsx`): pestañas Historial · Compartir mes (Reporte) · Respaldo y ajustes
  (Configuración) + botón de tema.

**Tres herramientas de resultado (nov 2026)**, todas en localStorage y dentro del respaldo JSON
(`actividad`, `arranque`, `mensajes`; un respaldo viejo sin ellas no borra las actuales):

- **Actividad diaria** (Resumen, solo en el último mes): contadores +/− de invitaciones,
  presentaciones, seguimientos e inscritos. Clave `mlm-dashboard-actividad-v1`
  (`{ 'AAAA-MM-DD': {...} }`). Con ≥5 presentaciones en 30 días muestra su cierre real.
- **Plan para subir de rango** (Resumen): `modeloCrecimiento` saca retención y entradas de los
  últimos 6 cambios de mes; `proyectarRango` aplica activos × r + E. Dos deslizadores. Dice
  "No alcanza" cuando la red se estaciona antes de la meta. Es proyección, nunca promesa.
- **Arranque de 30 días** (Mi gente → Nuevos): `PASOS_ARRANQUE` (bienvenida día 1, seguimiento
  día 7, recompra día 21), clave `mlm-dashboard-arranque-v1`. La lista mensual no trae el día
  de inscripción: él lo captura a mano en la ficha y entonces la app dice "Toca hoy/Atrasado".
  En Nuevos la ficha no muestra los chips de estado: solo 4 botones (los 3 pasos + **Ya compró**,
  `PASO_COMPRA`, guardado en `arranque[clave].pasos.compro`). Quien ya compró baja al final.
  Prender un paso marca a la persona como contactada.

`navegar(destino, idAEditar, opcion)`: `opcion` abre una pestaña; los nombres viejos
(`dashboard`, `seguimiento`, `historial`…) siguen funcionando por el mapa `ALIAS` del contexto.
Navegación en `components/Navegacion.jsx` (lateral en escritorio, barra inferior con texto en
teléfono). Estilo nuevo en `styles/v2.css`, cargado después de `global.css`: retoca tokens (plano,
sin brillo ni sombras) y define las piezas nuevas. `global.css` aún tiene clases de las páginas
borradas (dashboard, comparativa, seg-*): limpieza pendiente, no estorban.

**Se borraron** Dashboard, Seguimiento, Distribuidores, Comparativa y Retención (y Gauge,
Sparkline, Sidebar): lo útil vive en Resumen y Mi gente; el análisis profundo lo hacen los agentes
de `~/mlm-dashboard-datos`. No re-agregarlas sin preguntar.

**Modelo de datos** — un mes es:
`{ id: "2026-07", anio, mes, ganancias, metaGanancias, nuevosInicios, activos, volumenRed,
distribuidores: [{ id, nombre, volumen }] }`

La lista de un mes solo trae a quien **compró**: no aparecer = inactivo ese mes.

El volumen y la lista que captura el usuario son **solo de su pierna de pago** (plan binario: la
pierna de menor volumen). "Activos" y "volumen" en la app = de esa pierna, no de toda la organización.

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
están en `~/mlm-dashboard-datos/`, carpeta aparte con su propio repo privado. Esa carpeta es
también el **"cerebro" del negocio**: agentes de análisis (historia, retención, estrategia de
duplicación), `analisis/numeros.mjs` y `conocimiento/`. Ver su propio `CLAUDE.md`; es la que el
usuario abre en Cowork. **Este repo es
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

## Pruebas

- `node pruebas/simulacion.mjs`: corrida de 24 meses inventados (base estable y luego crecimiento
  hasta Diamante, con gente que entra, se cae, regresa y devoluciones). Corre todas las cuentas mes
  a mes y revisa invariantes (rango, retención = revividos, grupos, nuevos, casi califican, plan,
  importación, fusión). Datos 100% inventados (`SIM00001`…). `--json archivo` guarda el respaldo
  simulado para probar la interfaz. Correrla antes de publicar cambios en `calculos.js`.
- `node src/nube/fusion.test.mjs`: reglas de fusión con la nube.

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
- **Sin App Store.** Backend solo Firebase (lo pidió él, nov 2026); localStorage sigue siendo la base.

- **"Inicio" se borró** (sep 2026) a pedido suyo: duplicaba las cifras del Dashboard, que
  ahora es la pantalla de entrada.

## Nube: Firebase "Mi Red" (nov 2026)

- **Proyecto:** `mi-red-hasuj` (plan Spark). **Dirección nueva: https://mi-red-hasuj.firebaseapp.com**
  (`.web.app` redirige ahí desde `index.html`: el login con Google en iPhone instalado solo
  funciona en el dominio de `authDomain`). GitHub Pages sigue existiendo en `/mlm-dashboard/`
  (su workflow compila con `BASE=/mlm-dashboard/`; `vite.config.js` usa `/` por defecto).
- **Publicar:** `npm run build && firebase deploy --only hosting --project mi-red-hasuj`
  (reglas: `--only firestore:rules`). Hosting sirve `dist/` sin rewrites; comprobar con curl
  que `/.git/HEAD` dé 404.
- **Login opcional.** Sin sesión la app funciona igual que siempre con localStorage. Con sesión
  de Google, `src/nube/useNube.js` mantiene copia en Firestore:
  `usuarios/{uid}/meses/{AAAA-MM}` (el mes + `actualizado`) y `usuarios/{uid}/extras/{seguimiento|
  actividad|arranque|mensajes}` (`{ json, actualizado, reinicio }`).
- **Reglas de fusión** (`src/nube/fusion.js`, pruebas: `node src/nube/fusion.test.mjs`): se lee
  la nube del servidor ANTES de subir; si falla la lectura no se toca nada; un dispositivo vacío
  nunca borra la nube; mes en ambos lados → gana `actualizado` mayor; `conocidos` (en
  `mlm-dashboard-sync-v1`) distingue "nuevo aquí" de "borrado en otro lado"; los extras se unen
  por clave. "Borrar todo" con sesión borra también la nube (marca `reinicio`).
- `firestore.rules`: cada uid solo lee/escribe `usuarios/{su uid}/**`. No lleva su correo porque
  el repo es público. Endurecer a su UID cuando ya haya entrado una vez.
- Firebase se carga con import dinámico (`motor.js`, chunk aparte). La config web en
  `src/nube/firebase.js` es pública por diseño.
- **Pendiente:** que él active Google en Authentication (consola) y, si quiere entrar desde la
  dirección vieja, agregar `hasuj007-max.github.io` a dominios autorizados. Probar el login real
  y la primera subida. Luego: aviso/redirección en GitHub Pages y PWA instalable.

## Contexto del usuario

Construye una red de venta directa real; esta app es su tablero, no un ejercicio. Habla
español, prefiere respuestas directas y concretas. Para consejo de negocio MLM (no de
código) existe la skill `arquitecto-de-redes`.
