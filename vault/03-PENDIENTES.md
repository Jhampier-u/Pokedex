# Pendientes

Ordenado por retorno respecto al esfuerzo. Nada de esto está empezado.

---

## 1. Filtrar por Pokédex regional · esfuerzo medio · opcional

**Los números de dex regional ya están hechos** (se muestran en la ficha).
Lo que queda, si se quiere, es poder **filtrar** por una Pokédex regional.

Sería un eje nuevo, no un sustituto de las pestañas de generación: las
pestañas filtran por *generación de origen* y eso es correcto; una Pokédex
regional incluye además Pokémon de generaciones anteriores. Por ejemplo,
«Alola (US/UL)» tiene 403 entradas, muchas de gen I–VI.

Daría acceso a dexes que hoy no se pueden filtrar de ninguna forma: Isla de la
Armadura, Tundra Corona, Hisui, Kitakami, Área Azul.

Se puede sacar todo con una sola consulta GraphQL
(`pokemon_v2_pokemondexnumber`) y cachearla como las demás.

Ojo con la UI: ya hay pestañas de región y un selector de REGLAS, y añadir un
tercer control parecido puede volver a liar las cosas (ya pasó una vez, ver
`04-DECISIONES.md`).

---

## 2. Nuzlocke: lo que aún falta · esfuerzo bajo-medio

Fases 1 y 2 hechas. Ideas que quedaron fuera:

- **Orden de visita real.** Ahora las rutas van por número y el resto detrás,
  que es una aproximación honesta. El orden real de visita no está en la API
  (el `game_index` solo cubre 49 de 93 zonas de Kanto y solo en gen IV), así
  que haría falta una lista escrita a mano por región. Valorar si compensa.
- **Línea temporal** del run: qué cayó y cuándo, con marcas de tiempo.
- **Más reglas**: nivel máximo por medalla, modo «solo un tipo».
- **Nombre del run** y varios runs guardados por juego.

---

## 3. Deuda menor

- **`detailCache` sin tope.** Ya no es agudo (con GraphQL no se descargan los
  1025 objetos completos), pero sigue creciendo sin límite mientras navegas.
  Un LRU de ~200 entradas bastaría.
- **`Tareas Por Hacer.txt`** está obsoleto: todo marcado como hecho y ya no
  refleja el proyecto. Su contenido lo cubre el README. **Pendiente de que el
  usuario decida si se borra** — no borrar sin preguntar.
- **`applyFilters` con `resetIndex`** al cargar stats: ya se arregló, pero hay
  otros sitios que resetean posición y convendría revisarlos si molesta.

---

## Ideas sueltas que salieron y no se han evaluado

- Sprites por generación («máquina del tiempo» visual): la carpeta
  `versions/generation-i…viii` del repo de sprites existe y el modo generación
  ya sabe en qué época estás. Sería coherente cambiar también el sprite.
- Cadena evolutiva con requisitos completos por juego.
- Comparador de tipos 18×18 completo generado desde la API.
- `/machine` para mostrar el número de MT por juego en la lista de movimientos.
