# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Iconos de la PWA regenerados (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Desplegado | https://jhampier-u.github.io/Pokedex/ (GitHub Pages, verificado) |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

**Iconos de la PWA.** Al hacer el icono adaptativo se descubrió que el original
no era transparente: tenía el tablero de cuadros pegado en la imagen. Se limpió
y se generaron cuatro iconos (`any` y `maskable`, 192 y 512), con la zona
segura **medida**. Borrado también `Tareas Por Hacer.txt`.

## Qué toca ahora

Nada empezado. El backlog está agotado: la app está auditada en móvil, tablet,
escritorio, sin conexión y con teclado, y el despliegue en GitHub Pages está
verificado.

Lo que queda en [`03-PENDIENTES.md`](03-PENDIENTES.md) son ideas opcionales que
nadie echa de menos. Lo más útil es **usarla**.

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
