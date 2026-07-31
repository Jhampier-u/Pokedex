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
