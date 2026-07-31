# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Barrido de diálogos bloqueantes y maquetación en móvil (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

Barrido a raíz del bug que reportó el usuario:

1. **Cero diálogos bloqueantes** en toda la app (quedaban dos `alert()` y un
   `prompt()`); ahora todo va por `toast()`.
2. **Fallos silenciosos con aviso**: `loadCenterDetail` se tragaba los errores
   de red y dejaba la ficha del Pokémon anterior sin decir nada.
3. **Maquetación en móvil**: la cadena evolutiva de Eevee era inalcanzable y
   el análisis de equipo desbordaba 42px.

## Qué toca ahora

Nada empezado. El backlog de funciones está agotado y la app está auditada en
móvil y escritorio.

Si aparece algo, lo más probable es que salga **usándola**, no en pruebas por
consola: los dos últimos bugs reales los encontró el usuario o una auditoría
de maquetación, no las pruebas funcionales. Lee las trampas de
[`05-VERIFICACION.md`](05-VERIFICACION.md) antes de dar nada por verificado.

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
