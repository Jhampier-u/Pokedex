# Pokédex Nacional

Pokédex de los 1025 Pokémon con estética de hardware, construida como aplicación
web sin dependencias ni build: HTML, CSS y JavaScript plano sobre la
[PokéAPI](https://pokeapi.co/). Funciona offline y se puede instalar como PWA.

## Cómo ejecutarla

Necesita servirse por HTTP (el service worker y los módulos no funcionan desde
`file://`):

```bash
python -m http.server 5599
```

Y abrir <http://localhost:5599>. También está configurada en `.claude/launch.json`.

## Qué incluye

### Pokédex

- **Carrusel** con navegación por teclado, flechas y swipe táctil.
- **Ficha completa**: tipos, entrada de Pokédex por versión de juego, cadena
  evolutiva con métodos (nivel, objeto, intercambio, felicidad…), habilidades,
  estadísticas base, debilidades y resistencias calculadas, formas alternativas
  y localizaciones.
- **Movimientos reales por juego**: selector de versión y pestañas por método
  de aprendizaje (nivel con su nivel exacto, MT/MO, huevo, tutor…).
- **Crianza y captura**: ratio de captura con su probabilidad estimada, ratio de
  género, grupos huevo, pasos de incubación, curva de experiencia, felicidad
  base y hábitat.
- **Sprites**: normal, shiny y animado (GIF de Blanco/Negro hasta gen V y
  sprites de Showdown en adelante), más el grito de cada Pokémon.
- **Modo generación**: reconstruye la tabla de tipos y el tipado de cada
  Pokémon tal y como eran en cualquier generación. En Gen I, Fantasma no afecta
  a Psíquico y Clefairy es de tipo Normal.

### Filtros

Tipo y segundo tipo, orden, búsqueda difusa tolerante a erratas (`charzrd`
encuentra a Charizard), rango por estadística con presets, y vista de carrusel o
lista compacta. La **región** se elige con las pestañas de colores de cada
generación.

Ojo con no confundir dos controles que suenan parecido: las **pestañas de
región** eligen *qué Pokémon ves*, mientras que el selector **REGLAS** elige *con
qué reglas se calculan* tipos y debilidades. Son independientes: puedes ver Kanto
con reglas de Gen VI.

### Herramientas

| Modo | Qué hace |
|---|---|
| ❓ ¿Quién es ese Pokémon? | Quiz de siluetas con racha, récord y tres dificultades |
| ⚔️ Batalla | Calculadora de daño con naturaleza, EVs/IVs, objeto, estado, clima y crítico. Multigolpe, drenaje y probabilidad de estado salen de los metadatos del movimiento; el veredicto compara turnos hasta el K.O. y quién ataca primero según prioridad y velocidad |
| 🛡️ Equipo | Radar de estadísticas, roles, orden de velocidad, cobertura defensiva y ofensiva, y alertas de sinergia |
| 🎲 Ruleta | Genera equipos aleatorios por región y tipo, con opción de tipos únicos y sin legendarios |

### Pokédex personal

Favoritos, capturados con barra de progreso por región, notas por Pokémon e
historial de vistos recientemente. Todo se guarda en el navegador y se puede
**exportar e importar en JSON** desde el chip «⇄ Datos».

## Enlaces compartibles

La URL refleja dónde estás, así que se puede compartir:

- `#/pokemon/448` — abre la ficha de Lucario
- `#/equipo/6,9,3` — carga ese equipo en el constructor
- `#/quiz`, `#/batalla`, `#/equipo`, `#/ruleta` — abre ese modo

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `←` `→` | Navegar |
| `↑` `↓` | Saltar de 10 en 10 |
| `Inicio` `Fin` | Primero / último |
| `R` | Aleatorio |
| `C` | Reproducir grito |
| `S` | Variante shiny |
| `A` | Sprite animado |
| `M` | Música ambiente |
| `F` / `G` | Favorito / capturado |
| `L` | Alternar lista y carrusel |
| `/` | Buscar |
| `?` | Ayuda |

El simulador usa la fórmula oficial de estadísticas y de daño de gen V+. Las 25
naturalezas salen de la API; los multiplicadores de los objetos, en cambio,
están escritos a mano, porque la API describe su efecto en prosa y no publica
esos números.

## Datos y caché

Todos los datos vienen de la PokéAPI, que no requiere autenticación pero pide
cachear en local lo que se descargue. La app lo cumple en dos niveles:

- **IndexedDB** guarda cada respuesta de la API durante 30 días, y deduplica las
  peticiones que estén en vuelo a la vez.
- **Service worker** cachea los archivos de la aplicación (estrategia
  *network-first*, para que una edición del código se vea al recargar) y los
  sprites y respuestas de la API (*cache-first*, porque son inmutables).

Las estadísticas de los 1025 Pokémon se piden en **una sola consulta GraphQL** a
`beta.pokeapi.co/graphql/v1beta`, con REST como plan B si ese endpoint —que está
en beta— no responde.

## Estructura

```
index.html                 Estructura y los cinco modos
styles.css                 Estilos
js/index.js                Toda la lógica
sw.js                      Service worker (caché offline)
manifest.webmanifest       Manifiesto PWA
fonts/                     Nintendo DS BIOS y fuentes Pokémon
```

## Créditos

Datos y sprites de [PokéAPI](https://pokeapi.co/) y del repositorio
[PokeAPI/sprites](https://github.com/PokeAPI/sprites). Pokémon es una marca
registrada de Nintendo, Game Freak y The Pokémon Company. Proyecto sin ánimo de
lucro y con fines educativos.
