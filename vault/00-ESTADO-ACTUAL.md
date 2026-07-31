# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Galería de sprites por juegos (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Desplegado | https://jhampier-u.github.io/Pokedex/ (GitHub Pages, verificado) |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

**Galería de sprites.** Pulsando el sprite de la ficha se abre la historia
completa del Pokémon: Bulbasaur tiene 79 sprites en 23 juegos. Sale de
`data.sprites.versions`, que ya se descargaba, así que son 0 peticiones nuevas.

La tarjeta y el carrusel muestran **siempre el aspecto actual**: el modo
generación cambia reglas, no apariencia. (Primero se hizo al revés y el
usuario pidió el cambio; ver Tanda 20.)

## Qué toca ahora

Nada empezado. Sobre la mesa quedan, de la conversación sobre objetos:
mostrar los que lleva en salvaje (`held_items`, ya descargado) y las Pokéballs
en la calculadora de captura. Ver la nota final de
[`03-PENDIENTES.md`](03-PENDIENTES.md).

## Antes de tocar nada

1. Levanta el preview: `preview_start` con `{name: "pokedex-static"}`.
2. Lee [`05-VERIFICACION.md`](05-VERIFICACION.md) — hay trampas conocidas que
   te harán perder el tiempo si no las sabes (sobre todo la caché del navegador
   sirviendo JS viejo tras editar).
3. Los cambios se verifican **ejecutando la app**, no leyendo el código. Es la
   forma de trabajo que hemos seguido todo el proyecto y ha encontrado bugs
   reales que la inspección no vio.

## Mapa del vault

| Archivo | Qué contiene |
|---|---|
| `00-ESTADO-ACTUAL.md` | Este archivo: dónde estamos y qué sigue |
| `01-PROYECTO.md` | Qué es la app, arquitectura, dónde está cada cosa |
| `02-HISTORIAL.md` | Todo lo hecho, tanda por tanda, con commits |
| `03-PENDIENTES.md` | Backlog priorizado con estimación y contexto |
| `04-DECISIONES.md` | Decisiones de diseño y por qué se tomaron |
| `05-VERIFICACION.md` | Cómo probar, y las trampas conocidas |
| `06-POKEAPI.md` | Qué da la API, qué usamos y qué queda por explotar |
