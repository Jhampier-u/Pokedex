# El proyecto

Pokédex Nacional de los 1025 Pokémon con estética de hardware. **Web plana: sin
build, sin dependencias, sin framework.** HTML + CSS + JavaScript clásico sobre
la PokéAPI. Instalable como PWA y funciona sin conexión.

Idioma de la interfaz, comentarios y commits: **español**.

## Archivos

```
index.html               ~650 líneas  Estructura y los 6 modos
styles.css              ~3300 líneas  Todos los estilos
js/index.js             ~3600 líneas  Toda la lógica
sw.js                                 Service worker (offline)
manifest.webmanifest                  PWA
fonts/                                Nintendo DS BIOS + fuentes Pokémon
vault/                                Este contexto
.claude/launch.json                   Config del servidor de preview
```

Un solo archivo JS a propósito, sin módulos ES: la app se sirve como estático
puro y `<script defer>` basta. Si algún día crece más, el corte natural sería
por modo (pokedex / duel / team / quiz / roulette / nuzlocke).

## Arquitectura

### Estado

Un objeto global `state` en `js/index.js` con lo esencial:

```js
state = {
  allPokemon, filtered, current,     // catálogo y navegación
  detailCache, speciesCache, evoCache, moveCache, abilityCache, locationCache,
  statIndex,                         // stats de los 1025 para el filtro
  shinyMode, animatedMode, musicOn,
  mode,        // pokedex | quiz | duel | team | roulette | nuzlocke
  gen,         // reglas activas: 9 = actuales
  region,      // generación de origen; su ÚNICO control son los tabs
  regionMode,  // "gen" | "dex" — los dos criterios de región
  dex,         // Pokédex regional activa cuando regionMode === "dex"
}
```

Además: `PDEX` (favoritos, capturados, notas, recientes), `pdexUI`,
`duelState`, `teamState`, `quizState`, `nuzState`, `moveset`.

### Red y caché — tres capas

1. **`apiFetch(url)`** — todo lo que va a PokéAPI pasa por aquí. Consulta
   IndexedDB (TTL 30 días); si hay acierto no toca la red. Además deduplica
   peticiones en vuelo: dos sitios pidiendo lo mismo comparten una llamada.
2. **GraphQL** (`beta.pokeapi.co/graphql/v1beta`) para cargas masivas: stats de
   los 1025, flags de legendario, las 25 naturalezas, los encuentros por zona de
   cada juego y la pertenencia a Pokédex regionales. Una petición cada una.
3. **Service worker** — `network-first` para los archivos de la app,
   `cache-first` para sprites y respuestas de API.

**Nunca uses `fetch()` directo contra PokéAPI.** Usa `apiFetch`. Las únicas
excepciones legítimas son las consultas GraphQL, que son POST.

### Piezas clave

| Función | Para qué |
|---|---|
| `effectiveness(atk, defTypes)` | **Única** fuente de la tabla de tipos. Respeta la generación activa |
| `activeChart` / `activeTypes()` | Tabla vigente según `state.gen` |
| `apiFetch(url)` | Fetch con caché persistente |
| `detailCachePut(k, d)` | Caché en memoria acotada a 300 entradas (LRU) |
| `applySprite(img, id, opts)` | Sprite con fallback controlado (un reintento) |
| `renderTypeBadges(cont, types)` | Badges de tipo, un solo sitio |
| `computeStat(...)` / `actualStatsFor(...)` | Fórmula oficial de stats |
| `calcDamage(atk, def, move, lvl, opts)` | Fórmula oficial de daño |
| `syncHash()` / `applyRoute(hash)` | URLs compartibles |

### Modos

Seis vistas conmutadas por `switchMode(mode)`, que es **async**: espera a
`catalogReady` antes de inicializar cualquier modo que dependa del catálogo.
Los atajos de teclado solo actúan si `state.mode === "pokedex"`.

### Persistencia del usuario

`localStorage`: `pdex_favs`, `pdex_caught`, `pdex_notes`, `pdex_recent`,
`poketeam`, `pokequiz_best`, `pokenuz`. Exportable/importable en JSON desde el chip
«⇄ Datos».

`IndexedDB` (`pokedex-cache` / store `api`): respuestas de la API, más las
claves especiales `stats:all:v1`, `species:flags:v1`, `natures:v1`,
`nuz:versions:v1`, `nuz:pool:{version}:v1` y `dex:members:v1`.

## Convenciones

- Comentarios en español, y **explicando el porqué**, no el qué. Varios
  comentarios del código documentan bugs concretos que se arreglaron; no los
  borres al refactorizar, son la razón de que el código esté así.
- Nada de listas hardcodeadas si la API tiene el dato. La única excepción viva
  son los multiplicadores de objetos de combate, y está justificada y marcada
  (ver [`04-DECISIONES.md`](04-DECISIONES.md)).
- Mensajes de commit en español, sin tildes en el cuerpo (por compatibilidad),
  con el porqué del cambio y no solo el qué.
