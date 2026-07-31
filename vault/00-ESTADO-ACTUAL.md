# Estado actual

> **Empieza por aquí.** Este archivo dice dónde está el proyecto ahora mismo y
> qué toca hacer después. Última actualización: **2026-07-30**.

## Situación

| | |
|---|---|
| Rama | `main`, sincronizada con `origin/main` |
| Último trabajo | Accesibilidad de teclado y auditoría de tablet (`git log -1` para el hash) |
| Árbol de trabajo | Limpio, todo pusheado |
| Remoto | https://github.com/Jhampier-u/Pokedex |
| Servidor local | `python -m http.server 5599` (ya está en `.claude/launch.json` como `pokedex-static`) |

## Qué se acaba de terminar

**Accesibilidad de teclado.** La Tanda 6 añadió roles ARIA pero nunca se
recorrió la app con el teclado. Al hacerlo: 28 elementos con clic eran
inalcanzables (movimientos, habilidades y cadena evolutiva) y **no había
ningún indicador de foco visible**. Ambas cosas arregladas.

Tablet (768px) auditado: limpio.

## Qué toca ahora

Nada empezado. La app está auditada en móvil, tablet, escritorio, sin conexión
y con teclado.

Si aparece algo nuevo, lo más probable es que salga **usándola** o auditando
algo que se dio por bueno. Cuatro tandas seguidas de bugs han salido así y
ninguno de las pruebas funcionales. Lee las trampas de
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
