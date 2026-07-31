# Historial

Cómo llegó el proyecto hasta aquí. Empezó con un análisis completo del código
que encontró bugs, redundancias y datos de la API desaprovechados; a partir de
ahí se trabajó por tandas.

## Commits

| Commit | Qué |
|---|---|
| `596d0f7` | (previo) Pokédex personal y filtros avanzados |
| `30a437a` | Tandas 1–4: bugs, caché+GraphQL, datos desaprovechados, features nuevas |
| `71224d2` | Elimina el selector de región duplicado, renombra ÉPOCA → REGLAS |
| `5449830` | Barrido de limpieza: código muerto, duplicados, accesibilidad |
| `62f8817` | Simulador de batalla completo |

## Tanda 1 — Bugs

Encontrados analizando y **reproducidos en el navegador**, no solo leídos.

- **Ruleta: bucle infinito** que congelaba la pestaña si pedías más Pokémon de
  los que había en el pool (Kalos + Hielo + 6). Probado: 50 000 iteraciones sin
  salir. Ahora baraja el pool y lo recorre.
- **Carrusel se vaciaba** al navegar rápido. Los sprites que salían de vista
  programaban su borrado a 520 ms; si volvías antes se reutilizaba el nodo pero
  el temporizador lo borraba igual. Medido: 3 → 0 sprites.
- **`jumpToId` destructivo e inútil**: borraba tipo y región pero ignoraba
  favoritos, capturados, 2.º tipo y stats, así que te destruía los filtros y
  encima no llegaba al destino.
- **Atajos de teclado** pilotaban la Pokédex oculta desde otros modos.
- **Los modos crasheaban** si se abrían antes de cargar el catálogo, y quedaban
  rotos hasta recargar (`TOOL_INITED` ya marcado).
- **Carreras de red** sin guard en cadena evolutiva, localizaciones y filtros.
- **Filtro de stats** descartaba Pokémon en silencio si la carga fallaba.
- Menores: bucle de `onerror`, `loadVariety` sin guard, etiqueta «TOTAL BASE»
  que en realidad mostraba stats al nivel elegido.

## Tanda 2 — Rendimiento y deuda

- **Stats por GraphQL**: 1025 peticiones REST con 24 workers → **1 consulta,
  505 ms**. Segunda visita desde caché: **7 ms, 0 peticiones**.
- **IndexedDB** para todas las respuestas (lo pide la fair-use de PokéAPI).
- **`effectiveness()`**: la multiplicación de la tabla de tipos estaba copiada
  en 6 sitios.
- Fuera 15 clases CSS muertas de una calculadora de daño ya eliminada.

## Tanda 3 — Datos que ya se descargaban y se tiraban

- **Movesets reales por juego**: selector de versión y pestañas por método de
  aprendizaje. Antes: los 16 primeros por orden alfabético. Estaba todo en
  `version_group_details`.
- **Crianza y captura**: ratio con su probabilidad, género, grupos huevo,
  incubación, curva de EXP, felicidad, hábitat.
- **Legendarios desde la API**. La lista a mano tenía **17 falsos positivos**
  (Ultraentes y Paradoja), así que «sin legendarios» escondía Pokémon válidos.
- **Sprites animados en todas las generaciones** vía Showdown, con fallback.

## Tanda 4 — Features

- **Modo generación**: reconstruye la tabla de tipos y el tipado de cada
  Pokémon en cualquier época (`past_damage_relations`, `past_types`).
  Verificado: Gen I tiene 15 tipos y Fantasma→Psíquico ×0 (el bug de Gen 1);
  Clefairy sale como Normal.
- **URLs compartibles** (`#/pokemon/448`, `#/equipo/6,9,3`) y export/import del
  Pokédex personal en JSON.
- **PWA offline**: service worker + manifiesto.

## Tanda 5 — Deduplicación de región

El `<select>` de REGIÓN y los tabs de generación eran el mismo filtro pintado
dos veces. Fuera el select. Y el selector de generación se llamaba ÉPOCA con
opciones tipo «Gen I · Kanto» — nombres de región en un control que no filtra
por región, colocado encima de los tabs de región. Renombrado a **REGLAS**.

## Tanda 6 — Barrido de limpieza

Código muerto (`pdexAfterFilter`, `others`), los 18 tipos generados desde
`TYPE_LABELS_ES` en vez de escritos a mano en 3 sitios, `renderTypes` y
`renderStageTypes` fusionadas, subtítulo y año dinámicos.

**Accesibilidad desde cero**: `role="tablist"` con `aria-selected`,
`role="tabpanel"`, tres diálogos con `role="dialog"` + `aria-modal`, foco que
se guarda, se atrapa con Tab y se devuelve al cerrar, y `aria-live` en el
contador.

## Tanda 7 — Simulador de batalla

Naturaleza (25, de la API), EVs/IVs, objeto, estado, clima, crítico, y del meta
del movimiento: multigolpe, drenaje, dolencia y prioridad. El veredicto calcula
turnos hasta el K.O. y quién ataca primero.

Verificado contra valores conocidos: Garchomp Adamant 252 EV nv.100 = **394**
de Ataque, Blissey **651** PS, Vidasfera ×1.30, quemadura ×0.50, crítico ×1.50,
lluvia ×0.50 sobre Fuego.

## Tanda 8 — Modalidades del quiz

El quiz solo tenía siluetas. Ahora hay cuatro modalidades y un contrarreloj:

- **🖼 Silueta** — la de siempre.
- **🔊 Grito** — reproduce el grito (`cries.latest`, ya se descargaba).
- **📖 Descripción** — una entrada de Pokédex al azar, con el nombre del propio
  Pokémon tapado con `???` (varias entradas se nombran a sí mismas).
- **📊 Estadísticas** — las 6 stats en barras, sin decir de quién son.
- **⏱ Contrarreloj** — 10 s por ronda; si se agota cuenta como fallo.

Al responder siempre se revela el sprite, en cualquier modalidad, para que se
aprenda. Las pistas que necesitan red llevan guard de secuencia (`quizRoundSeq`)
para que una respuesta lenta no pise la ronda siguiente.

Verificado: las 4 modalidades pintan su pista, Mewtwo sale como «??? fue creado
por manipulación genética…», el temporizador agotado suma total y pone la racha
a 0, y un acierto revela el sprite y oculta la pista.

## Tanda 9 — Números de dex regional

La ficha muestra ahora en qué Pokédex regionales aparece cada Pokémon y con qué
número. El dato ya venía dentro de `pokemon-species` (`pokedex_numbers`), así
que **son 0 peticiones nuevas**.

Se filtran la Nacional (redundante con el número grande) y las Pokédex de isla
de Alola (Melemele, Akala, Ulaula, Poni), que son subdivisiones y solo añaden
ruido.

Verificado: Vulpix sale en 13 dexes incluidas las dos de Alola; Pikachu en 19
con Kanto #025, Johto #022 y Hoenn #156; Ogerpon solo en Kitakami #200.

## Tanda 10 — Paleta de comandos (Ctrl+K)

Buscador único sobre **Pokémon (1025), movimientos (937), habilidades (373) y
13 acciones** de la app. Reutiliza `fuzzyScore`, así que tolera erratas:
`charzrd` encuentra a Charizard.

El índice de movimientos y habilidades son dos peticiones de lista que se
cachean en IndexedDB; a partir de ahí, cero red.

Detalles que hubo que resolver:
- `Ctrl+K` se intercepta **antes** del `return` para inputs del handler de
  teclado, porque si no, no se podía abrir mientras escribías en un campo. Y la
  propia paleta es un input, así que sus teclas también van antes de ese check.
- Sesgo por grupo en la puntuación (+60 Pokémon, +30 acciones) para que a igual
  parecido mande el Pokémon, que es lo que se busca casi siempre.

Verificado: abre con Ctrl+K incluso desde un campo de texto, flechas y Enter
navegan, Escape cierra, y seleccionar un movimiento o habilidad abre su modal
(Earthquake → «Terremoto», Levitate → «Levitación»).

## Tanda 11 — Tracker Nuzlocke (fase 1) + bug de enlaces compartidos

**Modo nuevo (`💀 NUZLOCKE`)**, el sexto. Los encuentros son los **reales del
juego**: una consulta GraphQL trae qué especies aparecen en cada zona de esa
versión (Rojo: 469 filas, 44 zonas, ~44 KB, 714 ms), cacheada en IndexedDB.

- 29 juegos con encuentros registrados.
- Por zona: dado que solo saca especies de esa zona, o elegir a mano de la
  lista, o marcarla como fallada.
- Apodo, estado (equipo / caja / muerto) y resumen en cabecera.
- Cláusula de duplicados: marca en gris las especies ya capturadas en otra
  zona y bloquea el dado si no queda ninguna libre.
- Persistencia por juego e incluido en el export/import.

**Bug encontrado de rebote, y era gordo:** los enlaces compartidos **nunca
funcionaron al abrir la página**. `loadCatalog` leía `location.hash` *después*
de `applyFilters`, y `applyFilters` dispara `scheduleDetailLoad` → `syncHash()`,
que ya había sobrescrito el hash con `#/pokemon/1`. Abrir un enlace compartido
siempre caía en Bulbasaur.

No se detectó en la Tanda 4 porque allí probé cambiando `location.hash` sobre
una página ya cargada (que va por `hashchange`, otro camino), nunca recargando
con el hash puesto. Ahora la ruta se captura al entrar en `loadCatalog`.
Verificado con `#/pokemon/448` → Lucario, `#/equipo/6,9,3` → los tres, y
`#/nuzlocke` → el modo con su run restaurado.

## Tanda 12 — Nuzlocke fase 2

- **Orden de zonas.** Antes salían alfabéticas («Celadon City» la primera, que
  no ayuda a nadie). Ahora las rutas van por número (Ruta 1, 2, 3…) y el resto
  detrás alfabéticamente, con un selector para volver al alfabético.
  El orden de visita real **no está en la API**: se comprobó que el
  `game_index` solo existe para 49 de las 93 zonas de Kanto y solo en gen IV,
  así que esto es una aproximación deliberada, no el orden exacto del juego.
- **Equipo activo** con botón «→ Analizar en Equipo», que carga esos Pokémon
  en el constructor de equipo y abre su análisis de cobertura.
- **Cementerio**, con los sprites en escala de grises.
- **Regla «bloquear tras el encuentro»**: quita los botones de deshacer y deja
  un candado. Es la regla de verdad del Nuzlocke; sin ella se podía repetir la
  tirada hasta que saliera algo bueno.

Las tarjetas muestran el apodo en grande y la especie debajo, y llevan a la
ficha al hacer clic.

## Correcciones a lo que dije por el camino

Tres cosas que reporté mal y conviene no repetir:

0. **«Las regiones por rango de ID son un bug: un Vulpix de Alola cae en
   Kanto»** — falso, y estuvo escrito en el análisis y en el vault. Vulpix es
   la especie 37 y es de `generation-i`, así que clasificarlo en Kanto es
   **correcto**: las pestañas filtran por *generación de origen* y los IDs se
   asignan justamente por generación. Que además tenga forma de Alola no
   cambia su generación de origen. La Pokédex regional es un **eje distinto**,
   no una corrección del existente. (De paso: la 27 es Sandshrew, no Vulpix.)

1. **«108 selectores CSS duplicados»** — falso. Mi grep truncaba en el primer
   `:` o `.`, así que `.filter-chip`, `.filter-chip:hover` y `.filter-chip.on`
   contaban como el mismo selector repetido. Duplicados reales: **1**
   (`.section-hint`), ya arreglado. El CSS estaba bien.
2. **«Está todo lo que propuse»** al cerrar la Tanda 4 — falso. Faltaban 4 de
   11 features y casi toda la lista de redundancias. De ahí salieron las tandas
   6 y 7.
