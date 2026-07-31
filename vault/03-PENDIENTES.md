# Pendientes

Ordenado por retorno respecto al esfuerzo. Nada de esto está empezado.

---

## 1. Nuzlocke: lo que aún falta · esfuerzo bajo-medio

Fases 1 y 2 hechas. Ideas que quedaron fuera:

- **Orden de visita real.** Ahora las rutas van por número y el resto detrás,
  que es una aproximación honesta. El orden real de visita no está en la API
  (el `game_index` solo cubre 49 de 93 zonas de Kanto y solo en gen IV), así
  que haría falta una lista escrita a mano por región. Valorar si compensa.
- **Más reglas**: nivel máximo por medalla, modo «solo un tipo».

---

## 2. Deuda menor

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
