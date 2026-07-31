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
