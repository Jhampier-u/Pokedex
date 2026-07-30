# Decisiones

Por qué el proyecto está como está. Si vas a cambiar algo de aquí, lee primero
el motivo: casi todas responden a un problema concreto que ya ocurrió.

---

### GraphQL para cargas masivas, con REST como plan B

`beta.pokeapi.co/graphql/v1beta` trae los stats de los 1025 en una petición
(505 ms) en vez de 1025 peticiones REST. Se usa para stats, flags de legendario
y naturalezas.

Es un endpoint **beta**, así que los stats mantienen una ruta REST de respaldo.
Los otros dos degradan de forma suave: sin flags no se filtran legendarios (y se
avisa), sin naturalezas todas cuentan como neutras.

**Nombres de campo poco obvios**: la relación de naturaleza es
`pokemonV2StatByIncreasedStatId` (sube) y `pokemon_v2_stat` (baja). No se
adivinan; se sacaron por introspección.

---

### Los datos solo valen si están completos

`state.statAllLoaded` se pone a `true` **solo si la carga fue íntegra**. Antes,
un fallo parcial dejaba huecos en `statIndex` y el filtro hacía desaparecer
Pokémon sin explicar por qué. Con datos incompletos el panel se queda bloqueado
y se ofrece reintentar. Mejor no filtrar que filtrar mal en silencio.

---

### Service worker: network-first para la app, cache-first para los assets

Deliberadamente distinto. `cache-first` en los archivos de la app serviría
código viejo al editar — exactamente el problema que ya nos costó tiempo
durante el desarrollo. Los sprites y las respuestas de la API son inmutables, y
ahí sí cache-first.

---

### Los multiplicadores de objetos están escritos a mano (y es a propósito)

`BATTLE_ITEMS` es una tabla curada. La API describe el efecto en prosa
(*"holder's moves have 1.3× power"*) y **no publica el número**, así que no hay
forma de derivarlo. Está limitado a 6 objetos comunes y marcado en el código y
en el README.

Es el mismo tipo de lista hardcodeada que se eliminó con los legendarios; la
diferencia es que allí la API sí tenía el dato. **Si aparece una fuente mejor,
esto debería salir.**

---

### La región tiene un único control: los tabs

Había un `<select>` de REGIÓN **y** tabs de generación haciendo exactamente lo
mismo, sincronizados en ambos sentidos. El select se eliminó y la región vive
en `state.region`, no en el DOM.

El selector de generación se llamaba **ÉPOCA** con opciones «Gen I · Kanto»:
nombres de región en un control que no filtra por región, colocado justo encima
de los tabs de región. Se renombró a **REGLAS** con opciones «Reglas de Gen I».
Los dos ejes son independientes: puedes ver Kanto con reglas de Gen VI.

---

### `applySprite` en vez de `onerror` en línea

El atributo `onerror="this.onerror=null; ..."` evitaba bucles pero impedía el
reintento cuando `refreshSprites` cambiaba el `src`. Resultado: el sprite
animado del 1025 (que no existe en Showdown) se quedaba roto.

`applySprite` controla el fallback con un `dataset`: un reintento por imagen,
sin bucles y sin quedarse a medias.

---

### Semántica de las tablas históricas

En `past_damage_relations` y `past_types`, el campo `generation` indica la
**última** generación en la que esas reglas seguían vigentes. Por eso
`chartForGeneration(g)` busca la primera entrada con `gen >= g`. Además excluye
tipos que aún no existían (Siniestro y Acero desde gen II, Hada desde gen VI).

---

### Métodos de aprendizaje detectados, no listados

La primera versión de los movesets tenía una lista fija de 4 métodos
(nivel/MT/huevo/tutor) y dejaba «Champions» en blanco, porque usa `train`.
También existe `stadium-surfing-pikachu`, entre otros. Ahora se muestran **los
que realmente aparecen**, traduciendo los conocidos. No vuelvas a una lista fija.

---

### Trabajo en rama, no directo sobre `main`

Se creó `fix/bugs-cache-y-datos-pokeapi` para el bloque grande y luego se
fusionó a `main` con fast-forward. Los cambios posteriores fueron a `main` por
petición explícita del usuario.

---

### Un commit por tanda no siempre se puede

Se ofreció trocear el trabajo en un commit por tanda y no fue posible: los
cambios estaban entrelazados dentro de `js/index.js` (`renderAll` toca movesets
y modo generación en las mismas líneas; `effectiveness()` es la base del modo
generación). Trocear requiere staging interactivo por hunks, que no está
disponible aquí. Se hizo un commit con el cuerpo estructurado por bloques.
