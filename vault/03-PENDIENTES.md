# Pendientes

Ordenado por retorno respecto al esfuerzo. Nada de esto está empezado.

> **Antes de coger nada de esta lista**, mira
> [`07-REDISENO.md`](07-REDISENO.md): hay un rediseño planificado que cambia el
> stack. Varias ideas de aquí encajan mejor **después** de migrar, y la Fase 0
> de ese plan aporta más que casi todo lo que sigue.

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

- Cadena evolutiva con requisitos completos por juego.
- Comparador de tipos 18×18 completo generado desde la API.
- `/machine` para mostrar el número de MT por juego en la lista de movimientos.

---

## Nota: ¿sección de objetos? (analizado, no decidido)

Se midió qué da `/item` antes de plantearlo. Conclusiones:

- **2180 objetos, pero la mayoría es ruido**: 339 MT, 300 cristales Dinamax,
  222 materiales de MT, 122 marcados como `unused`, 101 de avance de trama,
  85 de picnic, 59 ingredientes de bocadillo. Lo realmente consultable son
  quizá 400–600.
- **Los efectos largos están solo en inglés**: 955 textos de efecto, ninguno
  en español. Sí hay descripciones de juego en español (`flavor_text`), que
  son las que se leen en la mochila.
- **Los multiplicadores no son datos**: la Ultra Ball dice
  «Success rate is 2×» en prosa. Por eso la tabla de objetos de combate del
  simulador sigue escrita a mano (ver `04-DECISIONES.md`).

**Recomendación: no hacer un catálogo suelto de 2180 objetos.** Lo que sí
aportaría, por orden:

1. **Objetos que lleva en salvaje** (`pokemon.held_items`, ya se descarga):
   Chansey lleva Piedra Oval 50%, Huevo Suerte 5%, Puño Suerte 100%.
   Cero peticiones nuevas.
2. **Pokéballs en la calculadora de captura** (38 en total): la ficha ya
   calcula «≈35% con Poké Ball»; con las balls sería una tabla por tipo.
   Conecta con algo que ya existe.
3. **Sprites de objeto en la cadena evolutiva**: ahora pone «Piedra Fuego»
   como texto; la API tiene el sprite.
4. **Bayas** (68): conjunto pequeño y coherente, si apetece.
