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

## Tanda 13 — Filtro por Pokédex regional + LRU en la caché

**Filtro por Pokédex regional.** En vez de añadir un tercer control junto a los
tabs y al selector de REGLAS (que ya lió las cosas una vez), se resolvió con un
**conmutador de criterio** sobre la misma fila de pestañas:

```
[Por generación] [Por Pokédex regional]
```

Cada criterio pinta sus propias pestañas. Así queda explícito que son dos ejes
distintos en lugar de tres controles que parecen lo mismo.

Las pertenencias son una consulta GraphQL (7212 filas, ~299 KB, 596 ms) que
**solo se pide si entras en ese modo**, y queda en IndexedDB. La barra de
progreso de capturados también se adapta a la dex activa.

Verificado contra los tamaños que da la API: Kanto 151, Alola (US/UL) 403,
Galar 400, Hisui 242. Y lo importante: la dex de Alola incluye **52 Pokémon de
gen I**, que es justo lo que demuestra que no es lo mismo que el filtro por
generación de origen.

**LRU en `detailCache`.** Era la última deuda abierta del análisis inicial:
cada objeto `/pokemon` trae la lista completa de movimientos y la caché en
memoria crecía sin tope. Ahora está acotada a 300 entradas. IndexedDB sigue
teniendo todo, así que recuperar algo desalojado no toca la red.

Verificado: metiendo 500 entradas se queda en 300, el LRU no se desincroniza
del objeto, las más viejas salen, reinsertar no duplica, y los objetos que ya
estaban referenciados (equipo, duelo) siguen intactos aunque salgan de caché.

## Tanda 14 — Nuzlocke: varios runs y línea temporal

**Varios runs guardados.** Antes había uno por juego y punto. Ahora cada run
tiene identificador, nombre y juego propios, así que caben varios del mismo
juego (un run normal y uno monotipo, por ejemplo). Selector arriba con botones
de crear, renombrar y borrar.

El formato antiguo (`runs: { red: {zona: entry} }`) **se migra solo** al
cargar, conservando zonas, apodos y estados. La misma migración se aplica al
importar un JSON, así que un export viejo sigue valiendo.

**Línea temporal.** Cada run lleva su bitácora: capturas, pases a caja,
muertes, zonas falladas y reinicios, con sprite, apodo y tiempo relativo
(«hace 5 min»). Se muestra en orden inverso y se limita a 400 entradas.

Un fallo que salió probando: cambiar el estado desde el desplegable mutaba el
objeto directamente sin pasar por `nuzSet`, así que las muertes **no se
registraban** en la bitácora. Ahora todo pasa por `nuzSet`, que es quien
decide qué anotar (el apodo no, para no llenar el log con cada tecla).

Verificado: migración del formato viejo con datos intactos, dos runs
independientes del mismo juego, los cuatro tipos de evento en la bitácora
(«Pidgey capturado en Kanto Route 1», «Pidgey cae en Kanto Route 1»…),
export/import de ida y vuelta con log incluido, y renombrar/borrar dejando los
botones deshabilitados cuando no queda ninguno.

## Tanda 15 — Bug reportado por el usuario: el gestor de runs no funcionaba

**Primer bug que llegó al usuario.** El botón «＋» del Nuzlocke no hacía nada y
el selector de runs salía vacío (y por tanto «✎» y «🗑» salían deshabilitados,
que es correcto cuando no hay runs).

Causa: usaba `prompt()` para pedir el nombre. En el navegador del usuario
devolvía `null`, y el código hacía `if (nombre === null) return;`. La lógica de
creación estaba bien; el diálogo era el problema.

**Por qué no se detectó:** en las pruebas hice `window.prompt = () => 'nombre'`.
Sustituir el diálogo ocultaba exactamente lo que había que comprobar. Anotado
en `05-VERIFICACION.md` como trampa a no repetir.

Arreglo, quitando los diálogos bloqueantes en vez de parchearlos:
- «＋» crea el run al momento con un nombre por defecto no repetido y deja el
  campo listo para editar.
- Renombrado **en línea**: el `<select>` se cambia por un `<input>`; Enter
  guarda, Escape cancela, perder el foco guarda.
- Borrar y vaciar usan **confirmación en dos pasos dentro del propio botón**
  («¿Seguro?» en rojo, caduca a los 4 s).
- Cambiar de juego con datos ya metidos **ya no los destruye**: crea un run
  nuevo y conserva el anterior, así que no hace falta confirmar nada.

Verificado con `prompt` y `confirm` redefinidos para **marcar fallo** si
alguien los llama: no se usa ninguno.

## Tanda 16 — Barrido de la misma clase de bug + maquetación en móvil

Tras el bug del `prompt()`, se buscó si quedaba más de lo mismo. Sí quedaba.

**Diálogos bloqueantes restantes:** dos `alert()` (fallo al cargar las Pokédex
regionales y la tabla de tipos histórica) y un `prompt()` de reserva al copiar
el enlace. Todos pasan al `toast()`, que ya existía. Si `alert` está bloqueado,
el usuario se quedaba **sin ningún aviso** de que algo había fallado.

**Fallos silenciosos:** `loadCenterDetail` tenía un `catch {}` vacío —señalado
en el análisis inicial y nunca arreglado—. Si la ficha fallaba, se quedaba con
los datos del Pokémon anterior sin explicar nada. Igual en `loadVariety`.

**Maquetación en móvil (375px), medida, no supuesta:**
- La **cadena evolutiva se salía y era inalcanzable**: Eevee tiene 9 nodos que
  ocupan 396px en un contenedor de 294px, y como la página no hace scroll
  horizontal, las últimas evoluciones no se podían ver. Ahora `overflow-x:auto`.
- El **análisis de equipo** desbordaba 42px. La causa costó tres intentos: no
  era el radar ni el contenido, era `min-width: auto` en `.team-section`, que
  es elemento de grid de `.team-analysis`. Ver `05-VERIFICACION.md`.
- Lo mismo en `.team-roles`, y columnas fijas de 320px y 70+130+130px que en
  375px no caben.

Quedan dos desbordes de ≤8px (`.tdc-member` y un `.section-title`) dentro de
sus propias tarjetas, sin contenido inalcanzable. Se dejan a propósito.

Verificado en los 6 modos a 375px y en escritorio, con `alert`, `confirm` y
`prompt` redefinidos para marcar fallo: no se usa ninguno.

## Tanda 17 — Auditoría offline

Se había afirmado en el README y en el vault que la app **funciona sin
conexión**, y nunca se había comprobado. Se comprobó cortando `window.fetch`.

**Lo que sí funciona** (todo servido desde IndexedDB, sin tocar la red):
catálogo de 1025, fichas ya visitadas, los 1025 stats, las 25 naturalezas, las
tablas de tipos históricas, las Pokédex regionales y el shell del service
worker (`index.html`, `js/index.js`, `styles.css`).

**Lo que falla, y ahora avisa bien:** un Pokémon nunca visitado no se puede
cargar; la ficha muestra «No se pudieron cargar los datos de este Pokémon» y un
aviso, en vez de quedarse con los datos del anterior.

**Bug encontrado:** el Nuzlocke decía «Este juego no tiene encuentros
registrados en la API» cuando lo que pasaba era que **no había internet**.
`nuzEnsurePool` devolvía `{}` tanto si fallaba como si el juego estaba vacío.
Ahora devuelve `null` al fallar, no lo cachea, y el mensaje culpa a la conexión
y no a la API. Verificado que el reintento con red funciona sin recargar.

**La primera versión de esta prueba no valía:** «funcionaba» sin red porque el
dato ya estaba en IndexedDB de un test anterior. Hubo que buscar un juego sin
cachear (Platino) para medir algo de verdad. Anotado en `05-VERIFICACION.md`.

## Tanda 18 — Accesibilidad de teclado y auditoría de tablet

La Tanda 6 añadió roles ARIA y trampas de foco, pero **nunca se recorrió la app
con el teclado**. Al hacerlo salieron dos fallos que llevaban ahí desde
entonces:

**1. 28 elementos con clic inalcanzables por teclado.** `.move-tag` (16) y
`.ability-tag` (3) eran `<span>`, y `.evo-poke` (9) un `<div>`, todos con
manejador de clic y sin `tabindex`. Con teclado **no había forma** de abrir el
detalle de un movimiento o una habilidad, ni de saltar por la cadena
evolutiva. Ahora los dos primeros son `<button>` y el nodo de evolución lleva
`role="button"`, `tabindex="0"`, `aria-label` y manejador de Enter/Espacio.

Los `.stage-item` del carrusel se dejan fuera del orden de tabulación a
propósito: su función (navegar) ya está cubierta por las flechas y la
paginación, y meterían 5 paradas por render sin aportar nada.

**2. No había ningún indicador de foco visible.** Cero reglas de
`:focus-visible` y una decena de `outline: none`. Navegando con teclado no se
veía dónde estabas. Añadido un contorno amarillo global, con blanco sobre los
badges de tipo, donde el amarillo no contrasta.

**Tablet (768px): limpio.** Solo el `.tdc-member` de 4px ya conocido.

Nota honesta: la comprobación final del contorno se hizo por CSSOM y con un
elemento de prueba, porque las pulsaciones reales de Tab no llegaban al panel
de forma fiable. Una pulsación sí llegó y confirmó que la regla se activa.

## Verificación del despliegue (GitHub Pages)

El proyecto está publicado en **https://jhampier-u.github.io/Pokedex/**.
Se había predicho que funcionaría en un subdirectorio porque las rutas son
relativas; ahora está **comprobado**, no predicho:

- Service worker registrado y activo con scope `/Pokedex/` (lo que más suele
  romperse al desplegar en subruta).
- Manifiesto servido, con `start_url` y `scope` relativos.
- CSS, JS, service worker e icono: los cuatro a 200.
- Enlaces compartibles funcionando en la subruta:
  `#/equipo/6,9,3` carga Charizard, Blastoise y Venusaur.
- Sin conexión: el catálogo de 1025 sale de IndexedDB. Shell cacheado
  (10 archivos) y servible.
- La versión desplegada está al día (tiene hasta la Tanda 18).
- Sin errores en consola.

**Pega suelta encontrada:** el icono del manifiesto es de 1024×1024 pero el
contenido ocupa el 100% del lienzo, sin margen. Medido: 0% de margen por
arriba y por la izquierda. Por eso **no debe declararse `purpose: "maskable"`**
—Android lo recorta en círculo y se comería el borde del icono—. Para tener
icono adaptativo haría falta una versión con el 20% de zona segura.

## Tanda 19 — Iconos de la PWA (y un hallazgo sobre el original)

Al preparar el icono adaptativo salió que **el archivo original no era
transparente**: `Pokeball_PixelArt_Transparent.png` tenía **el tablero de
cuadros de transparencia pegado en la imagen**, opaco al 100%. Es decir, el
favicon y el icono de la PWA mostraban un fondo de cuadros grises.

Mi diagnóstico anterior («el contenido ocupa el 100% del lienzo») era correcto
pero por la razón equivocada: no es que la Pokéball llegara al borde, es que
había un fondo pintado.

Proceso: relleno por inundación desde los bordes para quitar los cuadros
(se detiene en el contorno oscuro de la bola), filtrado de 1554 componentes
pequeños de menos de 3000 px que quedaban como motas por el ruido de
compresión, y recorte de la sombra usando el perfil de anchura por fila
(la bola acaba en y=876, la sombra va de 880 a 940).

Resultado: cuatro iconos generados y **medidos**, no supuestos.

| Icono | Uso | Contenido |
|---|---|---|
| `icon-192/512.png` | `purpose: any`, transparente | 48,8% del lienzo |
| `icon-maskable-192/512.png` | `purpose: maskable`, fondo `#0a0a0a` | 34,9% (límite 40%) |

El criterio para maskable es que el píxel opaco más lejano del centro quede
dentro del 40% del lienzo, que es lo que sobrevive al recorte circular de
Android. Se comprueba con el mismo script que detectó el problema.

También: `sw.js` pasa a `VERSION v2` para invalidar la caché vieja, y se borró
`Tareas Por Hacer.txt`, obsoleto desde que existen el README y el vault.

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
