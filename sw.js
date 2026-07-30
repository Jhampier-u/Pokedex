// ════════════════════════════════════════════════════════
//  SERVICE WORKER  —  Pokédex offline
//
//  Dos estrategias distintas a propósito:
//   · Archivos de la app  → network-first. Así, al editar el código, el
//     navegador siempre coge la versión nueva; el caché solo entra en juego
//     si no hay red. (Un cache-first aquí serviría código viejo durante el
//     desarrollo, que es justo el problema que queremos evitar.)
//   · Sprites y respuestas de PokéAPI → cache-first. Son inmutables, así que
//     una vez descargados no vuelve a hacer falta la red.
// ════════════════════════════════════════════════════════
const VERSION     = "v1";
const SHELL_CACHE = `pokedex-shell-${VERSION}`;
const ASSET_CACHE = `pokedex-assets-${VERSION}`;

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/index.js",
  "./manifest.webmanifest",
  "./Pokeball_PixelArt_Transparent.png",
  "./fonts/Nintendo-DS-BIOS.ttf",
  "./fonts/Pokemon Hollow.ttf",
  "./fonts/Pokemon Solid.ttf",
];

const ASSET_HOSTS = ["raw.githubusercontent.com", "pokeapi.co"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll falla entero si un archivo falta; los metemos uno a uno
      .then(cache => Promise.all(SHELL.map(u => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (!url.protocol.startsWith("http")) return;

  // ── Sprites y API: cache-first ──
  if (ASSET_HOSTS.some(h => url.hostname.endsWith(h))) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          // Las respuestas opacas (no-cors) también valen para imágenes
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // ── Archivos de la app: network-first ──
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          // Navegación sin red: servimos la app desde caché
          if (req.mode === "navigate") {
            const shell = await caches.match("./index.html");
            if (shell) return shell;
          }
          return Response.error();
        })
    );
  }
});
