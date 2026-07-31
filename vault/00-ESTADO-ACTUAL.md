# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Arreglo del gestor de runs del Nuzlocke (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

**Arreglo de un bug reportado por el usuario**: el botón «＋» del Nuzlocke no
creaba runs porque usaba `prompt()`, que en su navegador devolvía `null`.
Fuera los diálogos bloqueantes: renombrado en línea y confirmación en dos pasos
dentro del propio botón. Ver Tanda 15 en [`02-HISTORIAL.md`](02-HISTORIAL.md).

## Qué toca ahora

Nada empezado. El backlog de funciones está agotado; en
[`03-PENDIENTES.md`](03-PENDIENTES.md) solo quedan ideas opcionales.

**Lo más útil es seguir usando la app.** El bug de la Tanda 15 lo encontró el
usuario en dos minutos y quince tandas de pruebas por consola no lo vieron.
Lee las dos primeras trampas de [`05-VERIFICACION.md`](05-VERIFICACION.md)
antes de dar nada por verificado.

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
