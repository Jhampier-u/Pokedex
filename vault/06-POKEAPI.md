# PokéAPI: qué usamos y qué queda

Sin autenticación, sin límite formal de peticiones, pero la fair-use policy
pide explícitamente **cachear en local todo lo que se descargue** — de ahí la
capa de IndexedDB.

## Endpoints en uso

| Endpoint | Para qué |
|---|---|
| `/pokemon?limit=1025` | Catálogo |
| `/pokemon/{id}` | Detalle: tipos, stats, habilidades, movimientos, sprites, gritos, `past_types` |
| `/pokemon-species/{id}` | Género, entradas de Pokédex, formas, evolución, crianza, captura, flags |
| `/evolution-chain/{id}` | Cadena con métodos |
| `/type/{name}` | Miembros por tipo, y `damage_relations` + `past_damage_relations` para el modo generación |
| `/move/{name}` | Potencia, precisión, PP, `meta`, prioridad |
| `/ability/{name}` | Efecto |
| `location_area_encounters` | Localizaciones |

## GraphQL

`https://beta.pokeapi.co/graphql/v1beta` — tres consultas, cacheadas en IndexedDB:

```graphql
# stats:all:v1 — los 1025 con sus 6 stats, ~505 ms
pokemon_v2_pokemon(where:{id:{_lte:1025}}, order_by:{id:asc}, limit:2000) {
  id pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
}

# species:flags:v1 — legendarios y singulares (94 en total)
pokemon_v2_pokemonspecies(where:{id:{_lte:1025}}, order_by:{id:asc}, limit:2000) {
  id is_legendary is_mythical
}

# natures:v1 — las 25, con nombre en español (language_id 7)
pokemon_v2_nature(order_by:{id:asc}) {
  name
  pokemonV2StatByIncreasedStatId { name }   # sube
  pokemon_v2_stat { name }                  # baja
  pokemon_v2_naturenames(where:{language_id:{_eq:7}}) { name }
}
```

## Sprites

Repo `PokeAPI/sprites`, rutas bajo `sprites/pokemon`:

| Ruta | Nota |
|---|---|
| `{id}.png`, `shiny/{id}.png` | Estáticos, cobertura total |
| `other/official-artwork/{id}.png` | Arte oficial, usado en la ficha |
| `versions/generation-v/black-white/animated/` | GIF animados hasta el 649 |
| `other/showdown/{id}.gif` + `shiny/` | Animados de gen VI–IX. **Cobertura incompleta**: el 1025 da 404 |
| `other/home/{id}.png` | Arte de Pokémon HOME. **Sin usar** |
| `versions/generation-i…viii/` | El mismo Pokémon por generación. **Sin usar** |

## Lo que queda por explotar

### Campos que ya descargamos y no leemos

- `pokemon`: `held_items`, `forms`, `game_indices`, `past_abilities`, `past_stats`
- `pokemon-species`: `pokedex_numbers` (números de dex regional — ver
  pendiente nº 2), `color`, `shape`, `evolves_from_species`,
  `has_gender_differences`, `pal_park_encounters`
- `move`: `machines` (número de MT por juego), `stat_changes`, `target`,
  `effect_chance`, `past_values`, `learned_by_pokemon`

### Endpoints sin tocar

| Endpoint | Qué da | Idea |
|---|---|---|
| `/pokedex` (35) | Dexes regionales reales con su numeración | Arregla el bug de las formas regionales |
| `/item` (2223) | Sprites, efecto, coste | Objetos equipados, piedras evolutivas |
| `/machine` | MT/MO por juego | «Aprende MT24 Rayo» |
| `/berry` (68) | Sabores, firmeza | Sección de bayas |
| `/egg-group` | Compatibilidad de cría | Calculadora de crianza |
| `/growth-rate` | Tabla de EXP por nivel | Curvas de experiencia |
| `/encounter-method`, `/location-area` | Encuentros reales por ruta | Base del tracker Nuzlocke |
| `/characteristic`, `/gender`, `/pokeathlon-stat` | Menores | — |

### Ojo con esto

- Los `version_group` que devuelve la API son **32** e incluyen cosas poco
  obvias: `colosseum`, `xd`, `the-isle-of-armor`, `red-green-japan`,
  `legends-za`, `mega-dimension`, `champions`. La app los ordena con
  `VERSION_GROUP_ORDER` y traduce los conocidos.
- Los métodos de aprendizaje **no** son solo 4. Ver `04-DECISIONES.md`.
- `is_legendary` / `is_mythical` **no** marcan Ultraentes ni Paradoja. Es
  correcto: son clasificaciones distintas.
