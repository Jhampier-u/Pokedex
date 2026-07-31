# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Objetos y bayas en el buscador Ctrl+K (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Desplegado | https://jhampier-u.github.io/Pokedex/ (GitHub Pages, verificado) |
| Rediseño | Planificado en [`07-REDISENO.md`](07-REDISENO.md), sin empezar |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

**Objetos y bayas buscables.** 492 objetos y bayas en el buscador Ctrl+K, con
búsqueda bilingüe (buscar «zreza» encuentra la Baya Zreza). Ficha de baya con
sabores y **qué naturalezas la aprecian**, que enlaza con el simulador de
batalla. Y sprites de objeto en la cadena evolutiva.

Se descartó hacer una **sección** de bayas: habría sido el catálogo aislado que
se desaconsejó en la Tanda 21. Meterlas en el buscador las hace alcanzables sin
crear una vista que nadie visita.

## Qué toca ahora

**Hay un rediseño planificado y sin empezar**: ver
[`07-REDISENO.md`](07-REDISENO.md). Están tomadas las decisiones de gusto
(consola CRT, framework completo, offline negociable, todas las pantallas) y
hay un plan por fases. Falta aprobar tres cosas, listadas al final de ese
documento.

Si se retoma el rediseño, **la Fase 0 no exige migrar nada** y ya mejora la
app: transiciones entre modos, animaciones en las pantallas que tienen cero, y
profundidad al nivel de la Pokédex.

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
