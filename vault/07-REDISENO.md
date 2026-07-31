# Rediseño: investigación y propuesta

> **Estado: propuesta, nada implementado.** Documento de planificación escrito
> el 2026-07-31. Las decisiones de gusto ya están tomadas (ver abajo); lo que
> falta es aprobar el plan y empezar.

## Decisiones ya tomadas

| Pregunta | Respuesta |
|---|---|
| Dirección visual | **Consola de verdad**: CRT, chasis, cada modo en su pantalla |
| Cambio técnico | **Framework completo** |
| Offline y PWA | **Negociables** si el salto lo justifica |
| Alcance | **Todas** las pantallas, incluida la Pokédex |

Estas cuatro condicionan todo lo que sigue. Si alguna cambia, hay que releer.

---

## 1. Diagnóstico: por qué se ven planas

No es falta de CSS. Medido sobre `styles.css`:

| Pantalla | Reglas | `animation` | `transition` | `box-shadow` |
|---|---|---|---|---|
| **Pokédex** | 83 | **5** | **8** | **13** |
| Batalla | 99 | **0** | 2 | 4 |
| Equipo | 92 | **0** | 2 | 3 |
| Nuzlocke | 74 | **0** | **0** | **0** |
| Quiz | 45 | 1 | 5 | 4 |
| Ruleta | 24 | 1 | 2 | 4 |

**Batalla tiene más reglas que la Pokédex y cero animaciones. Nuzlocke tiene 74
reglas y cero de todo.** El problema no es cantidad de estilo, es que el estilo
es **estático**: sin movimiento, sin profundidad, sin respuesta al puntero.

Las tres causas concretas:

1. **Nada se mueve.** 19 `@keyframes` en todo el proyecto y casi todos se usan
   en la Pokédex (luces del chasis, flotación del sprite, destellos shiny).
2. **Todo está al mismo plano.** Las otras pantallas usan borde de 2-3 px y
   fondo plano. La Pokédex usa sombras internas, degradados y capas.
3. **No hay transición entre modos.** `switchMode` hace
   `classList.toggle("hidden")`: la pantalla aparece de golpe. Es lo que más
   barato de arreglar y más cambia la sensación.

---

## 2. Stack

### Lo que hay hoy

3 600 líneas de JS clásico, 3 300 de CSS, sin build, sin dependencias. Estado
en un objeto global mutable, DOM manipulado a mano, IndexedDB, service worker.
**Arranca instantáneo y funciona sin conexión.** Eso es lo que hay que
justificar perder.

### Opciones comparadas

#### A. Svelte 5 + Vite

- **Runtime**: se compila; apenas queda framework en el bundle.
- **Migración**: la sintaxis de plantilla es HTML con añadidos, así que las
  ~650 líneas de `index.html` portan casi literalmente. Los `render*()` que hoy
  escriben `innerHTML` pasan a bloques `{#each}`.
- **Animación**: `transition:`, `animate:` y `crossfade` vienen de serie y son
  buenos. Para lo complejo, GSAP encima.
- **Coste real**: reescribir los 6 modos. El estado global mutable encaja bien
  con las *runes* (`$state`), que es literalmente un objeto reactivo. La lógica
  pura (`effectiveness`, `calcDamage`, `computeStat`, `chartForGeneration`,
  `fuzzyScore`, `apiFetch`) **se copia sin tocar**: son funciones sin DOM.
- **Riesgo**: ecosistema más pequeño; menos respuestas cuando algo raro falla.

#### B. React + Vite

- **Runtime**: el más pesado de los tres.
- **Migración**: la más invasiva. Todo el HTML pasa a JSX y el estado mutable
  global choca con el modelo de React: habría que trocearlo en contextos o
  meter Zustand.
- **Animación**: **Motion** (antes Framer Motion) es lo mejor que hay para
  animación declarativa, con diferencia. `layout` animations resolverían solas
  cosas como reordenar el equipo o el carrusel.
- **Coste real**: el mayor de los tres, y el que más se aleja del código
  actual.
- **Riesgo**: bajo en soporte, alto en esfuerzo.

#### C. SolidJS + Vite

- Sintaxis parecida a React, reactividad fina, bundle pequeño.
- Ecosistema el más pequeño de los tres. **Descartado**: no aporta nada que
  Svelte no dé y tiene menos comunidad.

### Capa CRT: dónde está el techo

La decisión de «consola de verdad» **no la resuelve el framework**, es una capa
aparte:

- **CSS puro** llega a scanlines (`repeating-linear-gradient`), viñeta, brillo
  de fósforo (`box-shadow` interior + `text-shadow`), y curvatura *falsa* con
  `border-radius` y sombras internas.
- **CSS no llega** a la curvatura real (distorsión de barril). Los filtros SVG
  y CSS no hacen bulge de forma convincente.
- **WebGL sí**: distorsión de barril, máscara de fósforo RGB, aberración
  cromática, bloom. Es lo que usan las librerías tipo CRTFilter o los shaders
  de Three.js, y va acelerado por hardware.

**Propuesta**: capa CSS para todo (barata, siempre activa) + **shader WebGL
opcional** para la pantalla principal, con interruptor y apagado automático si
`prefers-reduced-motion` o si el dispositivo va justo. Un shader a pantalla
completa y siempre activo es la forma más fácil de convertir una app fluida en
una que calienta el móvil.

### Transiciones entre pantallas

La **View Transitions API** es hoy la respuesta correcta para esto:

- Mismo documento: soporte en Chrome/Edge desde la 111, Firefox desde la 129 y
  Safari desde la 18. Alcanzó *Baseline Newly Available* en octubre de 2025.
- Entre documentos: solo Chromium; Firefox y Safari aún no.

Como la app es de un solo documento, **el caso que necesitamos es el que está
soportado en los tres motores**. Y degrada solo: sin soporte, el cambio de
pantalla es instantáneo como ahora.

### ¿Hace falta servidor?

Se autorizó dejar de ser estática. Analizado, **no hace falta servidor, hace
falta paso de compilación**:

- **SSR**: no aporta nada. Los datos son de una API de terceros, la app es
  intensamente interactiva y el SEO da igual.
- **Proxy de API**: innecesario. PokéAPI no pide clave ni limita.
- **Lo que sí aporta**: **precalcular datos en tiempo de compilación**. Hoy los
  1025 stats, las flags de legendario, las naturalezas y las Pokédex regionales
  se piden en caliente a GraphQL. Si se generan como JSON en el build, la app
  arranca con ellos ya dentro: se quitan cinco consultas y varios estados de
  carga. Eso es un script de build, no un servidor.
- **Lo único que exige servidor de verdad**: sincronizar el Pokédex personal
  entre dispositivos (tu run de Nuzlocke en el móvil y en el PC). Es una
  funcionalidad nueva con coste propio: backend, cuentas, privacidad. **Va a
  fase aparte, no al rediseño.**

### Recomendación

**Svelte 5 + Vite + GSAP + capa CRT (CSS siempre, WebGL opcional) + View
Transitions.**

El motivo principal es que **conserva lo que hoy hace buena a la app**. Svelte
compila a algo cercano a lo que ya hay, así que el arranque rápido y el offline
sobreviven; con React habría que pelearlos.

Si en algún momento pesara más el ecosistema que el rendimiento, React + Motion
es la alternativa defendible. **No la recomiendo aquí** porque el mayor activo
de esta app es que carga al instante y funciona sin red, y React es justo lo
que más lo compromete.

---

## 3. Diseño: la consola de verdad

La idea rectora: **cada modo es un aparato distinto**, no una pestaña.

- **Pokédex** — el dispositivo actual, subido de nivel: pantalla curva con
  brillo de fósforo, luces que responden al tipo activo, chasis con relieve.
- **Quiz** — máquina recreativa: marcador de siete segmentos, luz que parpadea
  con el contrarreloj, revelado de silueta con barrido.
- **Batalla** — consola de combate: dos paneles enfrentados, barras que se
  llenan con inercia, el veredicto entra como un sello.
- **Equipo** — banco de trabajo: seis huecos físicos, el radar dibujándose
  trazo a trazo, cobertura como diodos que se encienden.
- **Ruleta** — máquina tragaperras: los tambores ya giran, falta el frenado con
  rebote y el clac al parar.
- **Nuzlocke** — cuaderno de campo: la más plana hoy y la que más gana. Fichas
  con textura, sello de «muerto», la línea temporal como registro de impresora.

**Común a todas**: transición entre modos con View Transitions (el chasis se
queda, la pantalla cambia), estados de carga con identidad (no *spinners*
genéricos), y respuesta al puntero en todo lo pulsable.

**Lo que no se toca**: la identidad de hardware. El objetivo es reforzarla, no
sustituirla por un panel moderno.

---

## 4. PokéAPI: qué queda

Medido el 2026-07-31. El bloque de objetos y bayas **ya se hizo** (Tandas 21 y
22), así que `06-POKEAPI.md` está desactualizado en ese punto.

### Lo más aprovechable

| Fuente | Tamaño | Español | Qué habilita |
|---|---|---|---|
| **Formas alternativas** | **276** no-base, 1579 formas | 360 nombres | Megas, regionales, Gigamax como fichas propias, no chips |
| `/machine` | 2 372 | — | «Se aprende con MT24» en la lista de movimientos |
| `/egg-group` | 15 | **15/15** | Calculadora de crianza: con quién puede criar |
| `/characteristic` | 30 | **30/30** | «Le encanta comer» → deduce qué IV es el más alto |
| `/pokemon-color` | 10 | **10/10** | Buscar por aspecto |
| `/pokemon-shape` | 14 | **0/14** | Buscar por silueta — habría que traducir a mano |
| `/growth-rate` | 6 | — | Curva de EXP nivel a nivel |
| `/encounter-method` | 66 | — | Cómo aparece: pescando, surfeando, hierba alta |

**El hallazgo grande son las 276 formas alternativas.** Hoy se muestran como
chips dentro de la ficha; con el rediseño podrían ser fichas de pleno derecho,
con su propio sprite, tipos y estadísticas. Es contenido que ya está descargado
y no se está enseñando.

### Campos descargados y aún sin leer

`past_abilities`, `past_stats` (encajan con el modo generación),
`move.stat_changes`, `move.target`, `has_gender_differences`,
`pal_park_encounters`.

---

## 5. Qué se pierde

Honestamente, esto es lo que hay que aceptar:

| Se pierde | Gravedad | Mitigación |
|---|---|---|
| **Cero dependencias** | Alta | Inevitable con framework. Se gana mantenibilidad |
| **Editar y recargar** | Media | Vite tiene HMR, que es más rápido; pero hay `node_modules` |
| **Arranque instantáneo** | Media | Con Svelte el bundle es pequeño; medir antes y después |
| **Offline sencillo** | Media | El SW pasa a generarse en el build; más piezas, mismo resultado |
| **Un archivo, todo a la vista** | Baja | Se cambia por estructura por componentes |
| **Desplegar copiando ficheros** | Baja | Pasa a `build` + subir `dist/`. GitHub Pages lo admite igual |

**Lo que NO se puede perder** (restricción del encargo): favoritos, capturados,
notas, equipo y runs de Nuzlocke, con su formato de exportación. Son claves de
`localStorage` con un JSON estable; la migración debe leerlas tal cual y el
export debe seguir siendo compatible. **Prueba obligatoria**: exportar con la
app actual, importar en la nueva.

---

## 6. Plan por fases

### Fase 0 — Sin migrar nada · esfuerzo bajo

Lo que se puede hacer **hoy, sobre el código actual**, y que ya se nota mucho:

- Transiciones entre modos con View Transitions.
- Animaciones de entrada en las pantallas sin ninguna (Batalla, Equipo,
  Nuzlocke).
- Profundidad: sombras, degradados y relieve al nivel de la Pokédex.
- Respuesta al puntero en todo lo pulsable.

**Vale la pena hacerla aunque luego se migre**: sirve para decidir el lenguaje
visual con el código que ya conocemos, y si el rediseño se parase aquí, la app
ya habría mejorado. **Reversible con un `git revert`.**

### Fase 1 — Andamiaje · esfuerzo medio

Vite + Svelte conviviendo con lo actual. Precálculo de datos en build. Sin
tocar todavía la interfaz.

**Punto de vuelta atrás**: mientras no se borre el `index.html` actual, se
puede abandonar.

### Fase 2 — Migración por modos · esfuerzo alto

Un modo por tanda, empezando por **Nuzlocke** (el más plano, el que menos se
rompe si sale mal) y dejando la **Pokédex para el final** (la más compleja y la
que hoy funciona).

La lógica pura se copia sin tocar. Cada modo migrado se verifica ejecutándolo,
como siempre.

### Fase 3 — Capa CRT · esfuerzo medio

CSS primero. Shader WebGL después, con interruptor, respetando
`prefers-reduced-motion`.

### Fase 4 — Contenido nuevo · esfuerzo medio

Formas alternativas como fichas, MT en los movimientos, crianza, búsqueda por
aspecto.

### Fase aparte — Sincronización

Backend con cuentas para llevar tu Pokédex entre dispositivos. **No forma parte
del rediseño**; se valora cuando lo demás esté hecho.

---

## 7. Riesgos

1. **El más probable: quedarse a medias.** Una migración por fases con seis
   modos puede encallar con la mitad migrada. Mitigación: la Fase 0 aporta
   valor por sí sola y las fases 1 y 2 tienen punto de vuelta atrás.
2. **El shader CRT se come el móvil.** Mitigación: opcional y apagado por
   defecto en dispositivos lentos.
3. **Perder datos del usuario en la migración.** Mitigación: la prueba de
   exportar/importar entre versiones es bloqueante.
4. **Que el rediseño tape la app.** El CRT es un efecto, no la interfaz: si
   estorba para leer una estadística, sobra.
5. **Regresión de accesibilidad.** Se ha invertido en foco visible, roles y
   navegación por teclado (Tandas 6 y 18). Cualquier componente nuevo tiene que
   mantenerlo, y el shader no puede quedar por encima del foco.

---

## 8. Lo que hace falta decidir antes de empezar

- ¿Se hace la **Fase 0** antes de migrar, o se va directo al framework?
- **Svelte** (recomendado) o **React** por ecosistema.
- ¿El shader WebGL entra en el alcance o se deja en CSS?
