# Pendientes

Ordenado por retorno respecto al esfuerzo. Nada de esto está empezado.

---

## 1. Números de dex regional · esfuerzo medio · **arregla un bug**

Ahora mismo la región se decide por **rango de ID** (`REGIONS` en la línea ~23),
lo cual es incorrecto para formas regionales: un Vulpix de Alola es el ID 27 y
cae en «Kanto».

La API tiene **35 pokédex regionales** en `/pokedex`, con la lista real de cada
uno y el número de entrada dentro de esa región. `pokemon-species` también trae
`pokedex_numbers` (Pikachu: `kanto:25`, `original-johto:22`, `hoenn:156`…).

Esto permitiría:
- Filtrar por región de verdad, con formas regionales donde toca.
- Mostrar «#022 en Johto» además del número nacional.
- Dexes que hoy no existen en la app: Isla de la Armadura, Tundra Corona,
  Hisui, Kitakami, Disco Índigo.

Ojo: cambiar `REGIONS` afecta al filtro, a los tabs, a la barra de progreso por
región y a la ruleta. No es un cambio de una línea.

---

## 2. Tracker Nuzlocke · esfuerzo alto · el más ambicioso

La ruleta ya es la semilla. Un tracker de verdad necesitaría:
- Encuentros por ruta (`/location-area` da los encuentros reales por juego).
- Registro de capturas, muertes y apodos.
- Reglas configurables (solo el primer encuentro, muerte permanente…).
- Línea temporal del run y estado del equipo.
- Persistencia y export/import (ya hay infraestructura en el chip «⇄ Datos»).

Es un proyecto en sí mismo. Merecería su propio modo.

---

## 3. Paleta de comandos (Ctrl+K) · esfuerzo medio

Buscador global unificado sobre Pokémon, movimientos, habilidades y objetos.
La búsqueda difusa (`fuzzyScore`) ya existe y funciona bien; faltaría un índice
de movimientos/habilidades y el overlay.

---

## 4. Deuda menor

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
