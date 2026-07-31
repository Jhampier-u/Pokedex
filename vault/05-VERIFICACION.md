# Cómo verificar (y trampas conocidas)

La forma de trabajo de todo el proyecto ha sido **ejecutar la app y medir**, no
leer el código y suponer. Ha encontrado bugs que la inspección no vio (el
carrusel vaciándose, el sprite del 1025 roto, «Champions» sin movimientos) y ha
desmentido cosas que yo mismo había afirmado.

## Flujo

1. `preview_start` con `{name: "pokedex-static"}` → sirve en
   `http://localhost:5599`.
2. Ejecutar comprobaciones con `javascript_tool`. Casi todo el estado interno es
   accesible por nombre (`state`, `duelState`, `PDEX`, `effectiveness`, …)
   porque es un script clásico, no un módulo.
3. `read_console_messages` con `onlyErrors: true` al terminar.
4. Comparar contra **valores conocidos**, no contra lo que devuelve el código.

## Trampas conocidas

### El navegador sirve JS viejo tras editar

`python -m http.server` no manda cabeceras de no-caché. Editas `js/index.js`,
recargas y sigues ejecutando el código anterior. Pasó varias veces y cuesta
diagnosticar porque no da error: simplemente faltan funciones nuevas.

**Purga antes de recargar:**

```js
for (const f of ['js/index.js','styles.css','index.html'])
  await fetch(f, {cache:'reload'});
location.reload();
```

Comprueba que cargó lo nuevo con `typeof miFuncionNueva` antes de dar por
válido un resultado.

### `naturalWidth` no es fiable

Si el panel del navegador no está visible la página no compone, y las imágenes
con `loading="lazy"` no llegan a cargar. `img.naturalWidth > 0` da falsos
negativos.

Para probar sprites, crea un `<img>` aparte y espera a su evento `load`, en vez
de mirar los del carrusel.

### El carrusel pinta 5 sprites, no 1

`#stage` contiene los offsets −2..+2. `querySelector('#stage img')` te da el de
la izquierda, no el actual. Usa `.stage-item.pos-c`.

### `applyFilters` es asíncrono y puede reordenar tus pruebas

Varias funciones lo llaman sin `await` (por ejemplo `pdexLoadAllStats`). Si
haces `jumpToId(94)` justo después, un `applyFilters` pendiente puede resetear
la posición y acabar en otro Pokémon. Mete esperas o comprueba el id resultante.

### Los nombres de campo de GraphQL no se adivinan

Usa introspección antes de escribir una consulta:

```js
{ __type(name:"pokemon_v2_nature") { fields { name } } }
```

### Nunca sustituyas `prompt`/`confirm`/`alert` para que pase una prueba

Es la trampa que ha causado el único bug que llegó al usuario. Probé el gestor
de runs del Nuzlocke con `window.prompt = () => 'nombre'` y todo pasaba; en el
navegador real `prompt()` devolvía `null` y el botón «＋» no hacía nada.

Sustituir un diálogo **oculta justo lo que hay que comprobar**. Si el código
usa un diálogo bloqueante, la prueba no puede ser fiable: lo correcto es
**quitar el diálogo del código** (hay confirmación en dos pasos y renombrado en
línea ya implementados como referencia) y luego probarlo de verdad.

Truco útil: en la prueba, redefinir los diálogos para que **marquen un fallo**
en lugar de devolver un valor válido:

```js
let usoDialogo = false;
window.prompt  = () => { usoDialogo = 'prompt';  return null; };
window.confirm = () => { usoDialogo = 'confirm'; return false; };
// ...y al final comprobar que usoDialogo sigue siendo false
```

### Prueba el camino de carga inicial, no solo el de navegación

Mismo tipo de error: las rutas compartibles se probaron cambiando
`location.hash` sobre una página ya cargada (que va por `hashchange`) y nunca
recargando con el hash puesto. Estuvieron rotas desde el primer día sin que
saliera en ninguna prueba.

### Auditar maquetación midiendo, no mirando

No siempre se puede capturar pantalla (el panel a veces no compone frames).
Este auditor encuentra contenido **inalcanzable**: cajas cuyo contenido no cabe
y que además no se pueden desplazar.

```js
[...document.querySelectorAll('.mode-view:not(.hidden) *')]
  .filter(el => el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0
    && ['visible','hidden'].includes(getComputedStyle(el).overflowX))
  .map(el => `${el.className} (${el.clientWidth}→${el.scrollWidth})`)
```

Excluye `.stage` y `.stage-section`: el carrusel coloca sprites fuera de
pantalla a propósito y los recorta.

### El culpable de un desbordamiento suele ser `min-width: auto` en un grid

Perdí tres intentos poniendo `min-width: 0` a los hijos equivocados. Un
**elemento de grid** (hijo directo del contenedor con `display: grid`) lleva
`min-width: auto` y no encoge por debajo de su contenido, aunque el grid sí
quepa. `.team-analysis` es grid y `.team-section` era el elemento: había que
poner `min-width: 0` **al elemento, no a sus hijos**.

Para localizarlo sin adivinar, recorre la cadena de ancestros imprimiendo
`display`, `width`, `minWidth` y `gridTemplateColumns`. El síntoma es una
columna más ancha que su propio contenedor.

### Al probar sin conexión, comprueba que el dato NO estaba ya cacheado

La caché es tan buena que invalida sus propias pruebas. Probando el Nuzlocke
sin red, «funcionó» — pero porque el pool de Esmeralda ya estaba en IndexedDB
de un test anterior. La prueba no medía nada.

Antes de dar por válido un test offline, busca un recurso **que no esté
cacheado**:

```js
const candidatos = ['platinum','crystal','soulsilver'];
let limpio = null;
for (const v of candidatos) if (!(await idbGet(`nuz:pool:${v}:v1`))) { limpio = v; break; }
```

Cortar la red para el código de la app:

```js
const real = window.fetch;
window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
// ...probar...
window.fetch = real;
```

Ojo: esto **no** prueba el service worker (que intercepta la red real), solo la
resiliencia del código de la app y la caché de IndexedDB.

### Distingue «cargado y vacío» de «no se pudo cargar»

Devolver `{}` en el `catch` hace que la app culpe a la API de un problema de
conexión. El Nuzlocke decía «este juego no tiene encuentros registrados en la
API» cuando lo que pasaba es que no había internet. Devuelve `null` en el
fallo y `{}` en el vacío legítimo.

### `el.focus()` no activa `:focus-visible`

`:focus-visible` solo se activa con foco por teclado. Enfocar desde JS da
`matches(':focus-visible') === false` y parece que la regla no funciona.

Para probarlo hace falta una pulsación **real** de Tab (herramienta `computer`,
acción `key`), y aun así no siempre llega si el panel no tiene el foco. Como
alternativa determinista, comprueba por CSSOM que la regla existe con sus
prioridades, y aplica las mismas declaraciones a un elemento de prueba:

```js
const p = document.createElement('button');
p.className = 'move-tag';
p.style.cssText = 'outline-color:#FFD700 !important; ...';
document.body.appendChild(p);
getComputedStyle(p).outlineColor;   // rgb(255, 215, 0)
```

### Evita `outline: Xpx solid var(--algo)` en atajos

Con el atajo, el color acababa resolviéndose a `currentColor` y el
`outline-offset` lo pisaban reglas previas, aunque el bloque sí entraba (se
confirmó porque otras declaraciones del mismo bloque tampoco ganaban). Con
longhands (`outline-style`, `outline-width`, `outline-color`, `outline-offset`)
y color literal, cada una con `!important`, no hay ambigüedad.

### Cuidado con las métricas propias

El «108 selectores CSS duplicados» que reporté era un artefacto de mi propio
grep (truncaba en el primer `:` o `.`). Antes de dar una cifra como hallazgo,
comprueba que mide lo que crees.

## Valores buenos para contrastar

| Comprobación | Valor correcto |
|---|---|
| Garchomp Adamant, 252 EV Atq, nv.100 | 394 de Ataque |
| Blissey, 0 EV PS, nv.100 | 651 PS |
| Gen I: nº de tipos | 15 (sin Siniestro, Acero ni Hada) |
| Gen I: Fantasma → Psíquico | ×0 (el bug de Gen 1) |
| Gen II–V: Fantasma → Acero | ×0.5 |
| Gen VI+: Acero → Hada | ×2 |
| Clefairy en Gen V / VI | Normal / Hada |
| Magnemite en Gen I / II | Eléctrico / Eléctrico-Acero |
| Lapras (Agua-Hielo) | Hielo ×¼ |
| Bullet Seed | 2–5 golpes |
| Giga Drenaje | 50% de drenaje |
| Rayo | 10% de parálisis |
| Vidasfera / quemadura / crítico | ×1.3 / ×0.5 / ×1.5 |
| Legendarios + singulares | 94 |
| Pikachu en Rojo/Azul | Nv.1 Growl, Nv.1 Thunder Shock, Nv.9 Thunder Wave |
| Sprite animado del 1025 | No existe en Showdown → debe caer al PNG |
