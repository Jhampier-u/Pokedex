# Instrucciones del proyecto

## Lee el vault antes de trabajar

Todo el contexto vive en [`vault/`](vault/). **Empieza siempre por
[`vault/00-ESTADO-ACTUAL.md`](vault/00-ESTADO-ACTUAL.md)**: dice en qué punto
está el proyecto y qué toca hacer. Desde ahí se navega al resto.

No hace falta leerlo entero cada vez, pero sí el estado actual, y el archivo que
corresponda a lo que vayas a tocar:

- Vas a **cambiar código** → `01-PROYECTO.md` (arquitectura) y
  `04-DECISIONES.md` (por qué está así)
- Vas a **probar algo** → `05-VERIFICACION.md` (trampas conocidas, te ahorra
  tiempo real)
- Vas a **usar la API** → `06-POKEAPI.md`
- Quieres saber **qué hacer** → `03-PENDIENTES.md`

## Actualiza el vault al terminar

**Después de cada cambio o flujo de trabajo, actualiza el vault** antes de dar
la tarea por cerrada. Como mínimo:

1. `00-ESTADO-ACTUAL.md` — commit nuevo, qué se acaba de terminar, qué sigue
2. `02-HISTORIAL.md` — una entrada con qué se hizo y qué se verificó
3. `03-PENDIENTES.md` — quitar lo hecho, añadir lo que haya surgido
4. `04-DECISIONES.md` — si tomaste una decisión no obvia, escribe el porqué
5. `05-VERIFICACION.md` — si tropezaste con una trampa nueva, anótala

El vault se commitea junto con el cambio, no en un commit aparte.

## Cómo se trabaja aquí

- **Verifica ejecutando, no leyendo.** Levanta el preview (`preview_start` con
  `{name: "pokedex-static"}`) y comprueba en el navegador. Este método ha
  encontrado bugs que la inspección del código no vio.
- **Contrasta contra valores conocidos**, no contra lo que devuelve el código.
  Hay una tabla de referencia en `05-VERIFICACION.md`.
- **Nada de listas hardcodeadas si la API tiene el dato.**
- Interfaz, comentarios y commits **en español**. Los comentarios explican el
  *porqué*; varios documentan bugs concretos ya arreglados, no los borres.
- Mensajes de commit sin tildes en el cuerpo, explicando la razón del cambio.

## Entorno

Servidor: `python -m http.server 5599`, ya configurado en `.claude/launch.json`
como `pokedex-static`. No arranques servidores con Bash.
