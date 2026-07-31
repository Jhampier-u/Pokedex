// ════════════════════════════════════════════════════════
//  POKÉDEX  —  Stage Carousel + Immersion + Depth
// ════════════════════════════════════════════════════════

// ── Lookup tables ────────────────────────────────────────
const STAT_NAMES = {
  hp:               "HP",
  attack:           "ATK",
  defense:          "DEF",
  "special-attack": "SP.ATK",
  "special-defense":"SP.DEF",
  speed:            "VEL",
};
const STAT_CLASS = {
  hp:               "stat-hp",
  attack:           "stat-atk",
  defense:          "stat-def",
  "special-attack": "stat-spatk",
  "special-defense":"stat-spdef",
  speed:            "stat-speed",
};
const REGIONS = {
  kanto:  [1,   151], johto:  [152, 251], hoenn:  [252, 386],
  sinnoh: [387, 493], unova:  [494, 649], kalos:  [650, 721],
  alola:  [722, 809], galar:  [810, 905], paldea: [906, 1025],
};
const TYPE_RGB = {
  fire:    [240,128, 48], water:   [104,144,240], grass:   [120,200, 80],
  electric:[248,208, 48], psychic: [248, 88,136], ice:     [152,216,216],
  dragon:  [112, 56,248], dark:    [112, 88, 72], fairy:   [238,153,172],
  normal:  [168,168,120], fighting:[192, 48, 40], flying:  [168,144,240],
  poison:  [160, 64,160], ground:  [224,192,104], rock:    [184,160, 56],
  bug:     [168,184, 32], ghost:   [112, 88,152], steel:   [184,184,208],
};

// Type effectiveness chart  (attacker → defender → multiplier)
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0,   steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2,   ice: 2,   bug: 2,   rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2,   water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2,  electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2,   grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2,   ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2,     poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2,  poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2,   electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2,   fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2,   ice: 2,     fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2,   dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};
// Multiplicador de daño de un tipo atacante contra uno o dos tipos defensores.
// Fuente única: esta misma multiplicación estaba copiada en 6 sitios
// (debilidades, duelo, cálculo de daño, veredicto y cobertura del equipo).
// La tabla vigente. En "época actual" es TYPE_CHART; en modo generación se
// sustituye por la que devuelve la API para esa época (ver chartForGeneration).
let activeChart = TYPE_CHART;

function effectiveness(attackType, defenderTypes) {
  const row = activeChart[attackType];
  if (!row) return 1;
  let mult = 1;
  for (const d of defenderTypes) {
    const x = row[d];
    if (x !== undefined) mult *= x;
  }
  return mult;
}
// Tipos que existen en la época activa (gen 1 no tenía Siniestro/Acero/Hada)
const activeTypes = () => Object.keys(activeChart);
// Nombres de tipo de un Pokémon de la API → ["fire","flying"]
const typeNamesOf = pokemon => pokemon.types.map(t => t.type.name);

// ════════════════════════════════════════════════════════
//  MODO GENERACIÓN  (tabla de tipos y tipados históricos)
//  La API guarda cómo era la tabla en cada época en
//  type.past_damage_relations, y el tipado antiguo de cada Pokémon en
//  pokemon.past_types. En ambos casos la "generation" indica la ÚLTIMA
//  generación en la que esas reglas seguían vigentes.
// ════════════════════════════════════════════════════════
const CURRENT_GEN = 9;
const GEN_ROMAN   = { i:1, ii:2, iii:3, iv:4, v:5, vi:6, vii:7, viii:8, ix:9 };
const genNumber   = name => GEN_ROMAN[String(name).replace("generation-", "")] || CURRENT_GEN;
// Sin nombres de región a propósito: este control NO filtra por región (de eso
// se encargan los tabs de generación). Mezclarlos hacía que pareciesen lo mismo.
const GEN_LABELS = {
  1:"Gen I", 2:"Gen II", 3:"Gen III", 4:"Gen IV", 5:"Gen V",
  6:"Gen VI", 7:"Gen VII", 8:"Gen VIII", 9:"Gen IX",
};
const genOptionLabel = g =>
  g === CURRENT_GEN ? "Actuales (Gen IX)" : `Reglas de ${GEN_LABELS[g]}`;

function relationsToRow(rel) {
  const row = {};
  rel.double_damage_to.forEach(t => { row[t.name] = 2; });
  rel.half_damage_to.forEach(t   => { row[t.name] = 0.5; });
  rel.no_damage_to.forEach(t     => { row[t.name] = 0; });
  return row;
}

const typeInfoCache = {};
async function ensureTypeInfo() {
  const names = Object.keys(TYPE_CHART);
  if (names.every(n => typeInfoCache[n])) return true;
  try {
    await Promise.all(names.map(async n => {
      if (typeInfoCache[n]) return;
      const d = await apiFetch(`https://pokeapi.co/api/v2/type/${n}`);
      typeInfoCache[n] = {
        gen:     genNumber(d.generation.name),
        current: d.damage_relations,
        past:    (d.past_damage_relations || [])
                   .map(p => ({ gen: genNumber(p.generation.name), rel: p.damage_relations }))
                   .sort((a, b) => a.gen - b.gen),
      };
    }));
    return true;
  } catch { return false; }
}

function chartForGeneration(g) {
  if (g >= CURRENT_GEN) return TYPE_CHART;
  const chart = {};
  Object.entries(typeInfoCache).forEach(([name, info]) => {
    if (info.gen > g) return;                       // ese tipo aún no existía
    const past = info.past.find(p => p.gen >= g);   // primera época que cubre g
    const row  = relationsToRow(past ? past.rel : info.current);
    Object.keys(row).forEach(def => {               // ni el defensor
      if (typeInfoCache[def] && typeInfoCache[def].gen > g) delete row[def];
    });
    chart[name] = row;
  });
  return chart;
}

// Tipado de un Pokémon en una generación concreta
function typesForGeneration(data, g) {
  if (g >= CURRENT_GEN || !data.past_types?.length) return data.types;
  const past = data.past_types
    .map(p => ({ gen: genNumber(p.generation.name), types: p.types }))
    .sort((a, b) => a.gen - b.gen)
    .find(p => p.gen >= g);
  return past ? past.types : data.types;
}

const TYPE_LABELS_ES = {
  normal:"NORMAL", fire:"FUEGO", water:"AGUA", grass:"PLANTA", electric:"ELÉCTRICO",
  ice:"HIELO", fighting:"LUCHA", poison:"VENENO", ground:"TIERRA", flying:"VOLADOR",
  psychic:"PSÍQUICO", bug:"BICHO", rock:"ROCA", ghost:"FANTASMA", dragon:"DRAGÓN",
  dark:"SINIESTRO", steel:"ACERO", fairy:"HADA"
};

const VERSION_LABELS = {
  "red":"Rojo","blue":"Azul","yellow":"Amarillo",
  "gold":"Oro","silver":"Plata","crystal":"Cristal",
  "ruby":"Rubí","sapphire":"Zafiro","emerald":"Esmeralda",
  "firered":"Rojo Fuego","leafgreen":"Verde Hoja",
  "diamond":"Diamante","pearl":"Perla","platinum":"Platino",
  "heartgold":"HeartGold","soulsilver":"SoulSilver",
  "black":"Negro","white":"Blanco","black-2":"Negro 2","white-2":"Blanco 2",
  "x":"X","y":"Y","omega-ruby":"Rubí Omega","alpha-sapphire":"Zafiro Alfa",
  "sun":"Sol","moon":"Luna","ultra-sun":"Ultrasol","ultra-moon":"Ultraluna",
  "lets-go-pikachu":"Let's Go Pikachu","lets-go-eevee":"Let's Go Eevee",
  "sword":"Espada","shield":"Escudo",
  "brilliant-diamond":"Diamante Brillante","shining-pearl":"Perla Reluciente",
  "legends-arceus":"Leyendas Arceus",
  "scarlet":"Escarlata","violet":"Púrpura",
};
function prettyVersion(v) { return VERSION_LABELS[v] || v.replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase()); }

// Los 18 tipos estaban escritos a mano en tres sitios (filtro, ruleta y el
// clon del 2.º tipo). Ahora salen todos de TYPE_LABELS_ES.
function fillTypeSelect(sel, allLabel) {
  if (!sel) return;
  sel.innerHTML = `<option value="">${allLabel}</option>` +
    Object.entries(TYPE_LABELS_ES)
      .map(([key, label]) =>
        `<option value="${key}">${label.charAt(0) + label.slice(1).toLowerCase()}</option>`)
      .join("");
}

const REGION_CHORDS = {
  kanto:  [220.00, 277.18, 329.63, 415.30],   johto:  [246.94, 311.13, 369.99, 466.16],
  hoenn:  [261.63, 329.63, 392.00, 493.88],   sinnoh: [233.08, 277.18, 349.23, 440.00],
  unova:  [196.00, 246.94, 293.66, 369.99],   kalos:  [329.63, 415.30, 493.88, 622.25],
  alola:  [293.66, 369.99, 440.00, 554.37],   galar:  [207.65, 261.63, 311.13, 392.00],
  paldea: [277.18, 349.23, 415.30, 523.25],
};

// ── State ────────────────────────────────────────────────
const state = {
  allPokemon:   [],
  filtered:     [],
  current:      0,
  typeCache:    {},
  detailCache:  {},
  speciesCache: {},
  evoCache:     {},
  moveCache:    {},
  abilityCache: {},
  locationCache:{},
  shinyMode:    false,
  animatedMode: false,
  musicOn:      false,
  mode:         "pokedex",  // modo activo (pokedex · quiz · duel · team · roulette)
  gen:          9,          // reglas activas: 9 = generación actual
  region:       "",         // filtro de región; "" = Pokédex Nacional entera.
                            // Los tabs de generación son su ÚNICO control: antes
                            // había además un <select> que hacía exactamente lo
                            // mismo y había que mantener sincronizado.
  currentRegion: "kanto",
  currentVariety: null,    // alternate-form override (pokemon name); null = default
};

// ── DOM refs ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const introOverlay = $("introOverlay");
const bigLight     = $("bigLight");

const filterType   = $("filterType");
const filterSort   = $("filterSort");
const filterName   = $("filterName");
const filterCount  = $("filterCount");

const stage      = $("stage");
const stageNum   = $("stageNum");
const stageName  = $("stageName");
const stageGenus = $("stageGenus");
const stageTypes = $("stageTypes");
const navPrev    = $("navPrev");
const navNext    = $("navNext");

const pagFirst   = $("pagFirst");
const pagBack10  = $("pagBack10");
const pagFwd10   = $("pagFwd10");
const pagLast    = $("pagLast");
const pagCurrent = $("pagCurrent");
const pagTotal   = $("pagTotal");
const pagination = $("pagination");

const cardWrapper = $("cardWrapper");
const cardLoading = $("cardLoading");

const catalogLoading = $("catalogLoading");
const catalogError   = $("catalogError");
const noResults      = $("noResults");
const typeLoading    = $("typeLoading");

const randomBtn  = $("randomBtn");
const cryBtn     = $("cryBtn");
const shinyBtn   = $("shinyBtn");
const animBtn    = $("animBtn");
const musicBtn   = $("musicBtn");
const musicLabel = $("musicLabel");

const versionSel      = $("versionSel");
const pokeDescription = $("pokeDescription");

const varietiesWrap = $("varietiesWrap");
const varietiesList = $("varietiesList");
const evoChainEl    = $("evoChain");
const weaknessesGrid= $("weaknessesGrid");
const locationsList = $("locationsList");

const modalOverlay = $("modalOverlay");
const modalClose   = $("modalClose");
const modalLoading = $("modalLoading");
const modalContent = $("modalContent");

// ── Helpers ──────────────────────────────────────────────
const cap   = s  => s.charAt(0).toUpperCase() + s.slice(1);
const padId = id => String(id).padStart(3, "0");
const getId = url => parseInt(url.split("/").filter(Boolean).pop(), 10);
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

function spriteFor(id, { shiny = false, animated = false } = {}) {
  const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  if (animated) {
    // Gen I-V tienen los GIF de Blanco/Negro. Para el resto tiramos de los
    // sprites de Showdown, que llegan casi hasta gen 9 — pero no están todos
    // (p. ej. el 1025 da 404), así que el onerror del <img> cae al PNG estático.
    if (id <= 649) {
      return shiny
        ? `${base}/versions/generation-v/black-white/animated/shiny/${id}.gif`
        : `${base}/versions/generation-v/black-white/animated/${id}.gif`;
    }
    return shiny ? `${base}/other/showdown/shiny/${id}.gif`
                 : `${base}/other/showdown/${id}.gif`;
  }
  return shiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`;
}
// Asigna el sprite a un <img> con fallback controlado: si el GIF animado no
// existe (Showdown no cubre el 100% de gen 9) cae al PNG estático. Un solo
// reintento por imagen, así que no puede entrar en bucle de errores.
function applySprite(img, id, opts = {}) {
  img.dataset.fallback = "0";
  img.onerror = () => {
    if (img.dataset.fallback === "1") { img.onerror = null; return; }
    img.dataset.fallback = "1";
    img.src = spriteFor(id, { shiny: opts.shiny });
  };
  img.src = spriteFor(id, opts);
}

function officialArtFor(id, shiny = false) {
  const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
  return shiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`;
}
function setAccent(typeName) {
  const rgb = TYPE_RGB[typeName] || TYPE_RGB.normal;
  document.documentElement.style.setProperty("--accent",   `rgb(${rgb.join(",")})`);
  document.documentElement.style.setProperty("--accent-r", rgb[0]);
  document.documentElement.style.setProperty("--accent-g", rgb[1]);
  document.documentElement.style.setProperty("--accent-b", rgb[2]);
}
function pulseLight() {
  bigLight.classList.remove("pulse");
  void bigLight.offsetWidth;
  bigLight.classList.add("pulse");
}
function regionForId(id) {
  for (const [name, [mn, mx]] of Object.entries(REGIONS)) {
    if (id >= mn && id <= mx) return name;
  }
  return "kanto";
}

// ════════════════════════════════════════════════════════
//  CACHÉ PERSISTENTE  (IndexedDB)
//  La fair-use policy de PokéAPI pide explícitamente cachear en local todo lo
//  que se solicite. Los datos son estáticos, así que guardamos las respuestas
//  y solo salimos a la red la primera vez. Si IndexedDB falla o no existe,
//  degrada a un fetch normal sin romper nada.
// ════════════════════════════════════════════════════════
const IDB_NAME    = "pokedex-cache";
const IDB_STORE   = "api";
const IDB_VERSION = 1;
const CACHE_TTL   = 30 * 24 * 3600 * 1000;   // 30 días

let idbPromise = null;
function idb() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise(resolve => {
    if (!("indexedDB" in window)) return resolve(null);
    let req;
    try { req = indexedDB.open(IDB_NAME, IDB_VERSION); } catch { return resolve(null); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => resolve(null);
  });
  return idbPromise;
}
function idbGet(key) {
  return idb().then(db => new Promise(resolve => {
    if (!db) return resolve(undefined);
    try {
      const r = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror   = () => resolve(undefined);
    } catch { resolve(undefined); }
  }));
}
function idbSet(key, value) {
  return idb().then(db => {
    if (!db) return;
    try { db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(value, key); }
    catch {}
  });
}

// Fetch a la API con caché persistente + deduplicación de peticiones en vuelo
// (dos sitios pidiendo el mismo recurso a la vez comparten una sola llamada).
const inflight = new Map();
async function apiFetch(url) {
  const hit = await idbGet(url);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  if (inflight.has(url)) return inflight.get(url);
  const p = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    const data = await res.json();
    idbSet(url, { ts: Date.now(), data });
    return data;
  })().finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

// ════════════════════════════════════════════════════════
//  INTRO
// ════════════════════════════════════════════════════════
window.addEventListener("load", () => {
  setTimeout(() => introOverlay.classList.add("open"), 350);
  setTimeout(() => {
    introOverlay.style.transition = "opacity 0.25s";
    introOverlay.style.opacity = "0";
  }, 950);
  setTimeout(() => introOverlay.style.display = "none", 1220);
});

// ════════════════════════════════════════════════════════
//  CATALOG
// ════════════════════════════════════════════════════════
// Los modos quiz/duelo/equipo/ruleta leen state.allPokemon; si se abren antes
// de que llegue el catálogo revientan (y como TOOL_INITED ya quedó marcado,
// se quedaban rotos hasta recargar). Esperan a esta promesa.
let markCatalogReady;
const catalogReady = new Promise(res => { markCatalogReady = res; });

async function loadCatalog() {
  catalogLoading.classList.remove("hidden");
  catalogError.classList.add("hidden");
  try {
    const data = await apiFetch("https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0");
    state.allPokemon = data.results.map(p => ({ id: getId(p.url), name: p.name }));
    catalogLoading.classList.add("hidden");
    pagTotal.textContent = state.allPokemon.length;
    // El subtítulo decía "1025 ENTRIES" a mano; ahora sale del catálogo real
    const sub = $("subtitle");
    if (sub) sub.textContent = `NATIONAL DEX · ${state.allPokemon.length} ENTRIES`;
    pdexRenderRecent();
    pdexRenderProgress();
    markCatalogReady(true);
    await applyFilters({ resetIndex: true });
    // Enlace compartido: restaurar lo que pida la URL
    if (location.hash.replace(/^#\/?/, "")) applyRoute(location.hash);
  } catch {
    catalogLoading.classList.add("hidden");
    catalogError.classList.remove("hidden");
    markCatalogReady(false);
  }
}

// ── Filters ────────────────────────────────────────────
let filterTimer = null;
function debouncedFilter(reset = true) {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => applyFilters({ resetIndex: reset }), 220);
}
let filterSeq = 0;
async function applyFilters({ resetIndex = false } = {}) {
  const seq = ++filterSeq;
  const typeVal   = filterType.value;
  const regionVal = state.region;
  const sortVal   = filterSort.value;
  const rawName   = filterName.value.trim().toLowerCase();

  const type2Val = $("filterType2") ? $("filterType2").value : "";
  await ensureTypeCache(typeVal);
  await ensureTypeCache(type2Val);
  // Si mientras se descargaba el tipo el usuario cambió los filtros otra vez,
  // esta pasada ya está obsoleta: escribirla pisaría la más reciente.
  if (seq !== filterSeq) return;
  const typeIds  = typeVal  ? state.typeCache[typeVal]  : null;
  const type2Ids = type2Val ? state.typeCache[type2Val] : null;
  const numericSearch = rawName && /^\d+$/.test(rawName) ? parseInt(rawName, 10) : null;
  const sf = pdexStatFilter();

  let list = state.allPokemon.filter(p => {
    if (typeIds  && !typeIds.has(p.id))  return false;
    if (type2Ids && !type2Ids.has(p.id)) return false;
    if (regionVal) {
      const [mn, mx] = REGIONS[regionVal];
      if (p.id < mn || p.id > mx) return false;
    }
    if (numericSearch !== null && p.id !== numericSearch) return false;
    if (pdexUI.favOnly    && !PDEX.favs.has(p.id))   return false;
    if (pdexUI.caughtOnly && !PDEX.caught.has(p.id)) return false;
    if (sf.active) {
      const st = state.statIndex[p.id];
      if (!st) return false;
      for (const k in sf.ranges) {
        const [mn, mx] = sf.ranges[k];
        if (st[k] < mn || st[k] > mx) return false;
      }
    }
    return true;
  });

  const fuzzyActive = rawName && numericSearch === null;
  if (fuzzyActive) {
    // Fuzzy name search — tolerates typos ("charzrd" → charizard); ordered by relevance.
    const scored = [];
    for (const p of list) {
      const sc = fuzzyScore(rawName, p.name);
      if (sc >= 0) scored.push([sc, p]);
    }
    scored.sort((a, b) => b[0] - a[0] || a[1].id - b[1].id);
    list = scored.map(x => x[1]);
  } else {
    list.sort((a, b) => {
      switch (sortVal) {
        case "id-asc":    return a.id - b.id;
        case "id-desc":   return b.id - a.id;
        case "name-asc":  return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        default:          return a.id - b.id;
      }
    });
  }

  state.filtered = list;
  if (resetIndex || state.current >= list.length) state.current = 0;
  filterCount.textContent = `${list.length} Pokémon`;

  pdexRenderProgress();
  if (list.length === 0) {
    stage.innerHTML = "";
    cardWrapper.classList.add("hidden");
    pagination.classList.add("hidden");
    $("compactList").classList.add("hidden");
    noResults.classList.remove("hidden");
    return;
  }
  noResults.classList.add("hidden");
  pagination.classList.remove("hidden");
  pagTotal.textContent = list.length;

  renderStage();
  scheduleDetailLoad();
  pdexApplyViewMode();
}

// ════════════════════════════════════════════════════════
//  STAGE  CAROUSEL
// ════════════════════════════════════════════════════════
function posClass(off) {
  if (off === 0) return "pos-c";
  if (off > 0)   return "pos-r" + off;
  return "pos-l" + Math.abs(off);
}
function createStageItem(p, off) {
  const div = document.createElement("div");
  div.className = `stage-item ${posClass(off)}${state.shinyMode ? " shiny" : ""}`;
  div.dataset.id = p.id;
  div.dataset.lastOff = off;
  div.innerHTML = `
    <div class="stage-screen">
      <div class="screen-corner tl"></div>
      <div class="screen-corner tr"></div>
      <div class="screen-corner bl"></div>
      <div class="screen-corner br"></div>
      <div class="stage-screen-inner">
        <img alt="${p.name}" loading="lazy"/>
      </div>
    </div>`;
  applySprite(div.querySelector("img"), p.id,
              { shiny: state.shinyMode, animated: state.animatedMode });
  div.addEventListener("click", () => {
    const o = parseInt(div.dataset.lastOff, 10);
    if (o !== 0) navigate(o);
  });
  return div;
}
function renderStage() {
  const list = state.filtered;
  if (list.length === 0) return;

  const offsets = [-2, -1, 0, 1, 2];
  const visible = offsets.map(off => ({ off, item: list[state.current + off] }))
                         .filter(x => x.item);
  const visibleIds = new Set(visible.map(x => x.item.id));

  Array.from(stage.children).forEach(el => {
    if (el.classList.contains("sparkle-layer")) return;
    const id = parseInt(el.dataset.id, 10);
    if (!visibleIds.has(id)) {
      if (el._exitTimer) return;              // ya está saliendo, no reprogramar
      const lastOff = parseInt(el.dataset.lastOff, 10);
      el.className = `stage-item ${lastOff < 0 ? "pos-out-l" : "pos-out-r"}`;
      el._exitTimer = setTimeout(() => el.remove(), 520);
    }
  });
  visible.forEach(({ off, item }) => {
    let el = stage.querySelector(`.stage-item[data-id="${item.id}"]`);
    // Si vuelve a entrar antes de que termine la animación de salida, reutilizamos
    // el nodo — pero hay que cancelar su borrado o desaparecería igualmente.
    if (el && el._exitTimer) {
      clearTimeout(el._exitTimer);
      el._exitTimer = null;
    }
    if (!el) {
      el = createStageItem(item, off);
      el.className = `stage-item ${off < 0 ? "pos-out-l" : "pos-out-r"}${state.shinyMode ? " shiny" : ""}`;
      stage.appendChild(el);
      void el.offsetWidth;
    }
    el.className = `stage-item ${posClass(off)}${state.shinyMode ? " shiny" : ""}`;
    el.dataset.lastOff = off;
  });
  updatePagination();
}
function refreshSprites() {
  stage.querySelectorAll(".stage-item").forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    const img = el.querySelector("img");
    if (img) applySprite(img, id, { shiny: state.shinyMode, animated: state.animatedMode });
    el.classList.toggle("shiny", state.shinyMode);
  });
  const cur = state.filtered[state.current];
  if (cur) {
    const img = $("pokemonSprite");
    img.src = officialArtFor(cur.id, state.shinyMode);
  }
}
function updatePagination() {
  const len = state.filtered.length;
  const cur = state.current;
  pagCurrent.textContent = padId(cur + 1);
  pagTotal.textContent   = len;
  navPrev.disabled = cur === 0;
  navNext.disabled = cur >= len - 1;
  pagFirst.disabled = cur === 0;
  pagBack10.disabled = cur === 0;
  pagFwd10.disabled = cur >= len - 1;
  pagLast.disabled = cur >= len - 1;
}

function navigate(delta) {
  const len = state.filtered.length;
  if (len === 0) return;
  const next = clamp(state.current + delta, 0, len - 1);
  if (next === state.current) return;
  state.current = next;
  state.currentVariety = null;
  renderStage();
  scheduleDetailLoad();
}
function navigateTo(idx) {
  const len = state.filtered.length;
  if (len === 0) return;
  state.current = clamp(idx, 0, len - 1);
  state.currentVariety = null;
  renderStage();
  scheduleDetailLoad();
}
function navigateRandom() {
  const len = state.filtered.length;
  if (len === 0) return;
  state.current = Math.floor(Math.random() * len);
  state.currentVariety = null;
  renderStage();
  scheduleDetailLoad();
  pulseLight();
}
// Jump to a Pokémon by its species id (used by evolution chain clicks)
function jumpToId(id) {
  const idx = state.filtered.findIndex(p => p.id === id);
  if (idx >= 0) { navigateTo(idx); return; }

  // No está en la vista actual. Hay que relajar TODOS los filtros que puedan
  // estarlo ocultando —antes solo se limpiaban tres y el salto fallaba en
  // silencio con "★ Favoritos", "◉ Capturados", 2.º tipo o el filtro de stats.
  filterName.value = "";
  filterType.value = "";
  state.region     = "";
  const type2 = $("filterType2");
  if (type2) type2.value = "";

  pdexUI.favOnly = false;
  pdexUI.caughtOnly = false;
  $("chipFav")?.classList.remove("on");
  $("chipCaught")?.classList.remove("on");

  const statPanel = $("statFilterPanel");
  if (statPanel && !statPanel.classList.contains("hidden")) {
    statPanel.classList.add("hidden");
    $("chipStats")?.classList.remove("on");
  }
  pdexSyncGenTabs();

  applyFilters({ resetIndex: true }).then(() => {
    const i2 = state.filtered.findIndex(p => p.id === id);
    if (i2 >= 0) navigateTo(i2);
  });
}

navPrev.addEventListener("click",  () => navigate(-1));
navNext.addEventListener("click",  () => navigate(+1));
pagFirst.addEventListener("click", () => navigateTo(0));
pagLast.addEventListener("click",  () => navigateTo(state.filtered.length - 1));
pagBack10.addEventListener("click",() => navigate(-10));
pagFwd10.addEventListener("click", () => navigate(+10));
randomBtn.addEventListener("click", navigateRandom);

// ── Touch swipe on the stage carousel ───────────────────
// On mobile, drag horizontally with your finger to navigate.
// Vertical movement still scrolls the page normally.
(function setupSwipe() {
  const target = document.querySelector(".stage-section");
  if (!target) return;
  let startX = null, startY = null, locked = null, baseIdx = 0;
  const stepPx = 90;     // how many px = 1 navigation step
  const minSwipe = 35;   // minimum movement before we treat it as a swipe

  target.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    locked = null;       // not yet decided: horizontal vs vertical
    baseIdx = state.current;
  }, { passive: true });

  target.addEventListener("touchmove", e => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // First few px decide whether this gesture is a horizontal swipe
    if (locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (locked === "v") return;     // let the page scroll normally

    // Horizontal: prevent page side-scroll / iOS back gesture
    e.preventDefault();

    // Live navigation: step by 90px chunks while dragging
    const steps = Math.trunc(-dx / stepPx);    // dx<0 → swipe left → next
    const target2 = baseIdx + steps;
    if (target2 !== state.current &&
        target2 >= 0 && target2 < state.filtered.length) {
      state.current = target2;
      state.currentVariety = null;
      renderStage();
      scheduleDetailLoad();
    }
  }, { passive: false });

  target.addEventListener("touchend", e => {
    if (startX === null) return;
    // If we never crossed a 'step' but moved enough, do a final ±1 navigation
    if (locked === "h") {
      const dx = (e.changedTouches[0].clientX) - startX;
      if (state.current === baseIdx && Math.abs(dx) >= minSwipe) {
        navigate(dx < 0 ? +1 : -1);
      }
    }
    startX = startY = null; locked = null;
  });
  target.addEventListener("touchcancel", () => {
    startX = startY = null; locked = null;
  });
})();

filterType.addEventListener("change",   () => applyFilters({ resetIndex: true }));
filterSort.addEventListener("change",   () => applyFilters({ resetIndex: true }));
filterName.addEventListener("input",    () => debouncedFilter(true));

document.addEventListener("keydown", e => {
  // Ctrl/Cmd+K funciona desde cualquier sitio, incluso escribiendo en un campo
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    togglePalette();
    return;
  }
  const pal = document.getElementById("paletteOverlay");
  if (pal && !pal.classList.contains("hidden")) {
    handlePaletteKeys(e);   // antes del check de input: la paleta ES un input
    return;
  }
  if (e.target.matches("input, select, textarea")) {
    if (e.key === "Escape") e.target.blur();
    return;
  }
  if (!modalOverlay.classList.contains("hidden")) {
    if (e.key === "Escape") closeModal();
    else trapFocus(modalOverlay.querySelector(".modal-card"), e);
    return;
  }
  const helpEl = document.getElementById("helpOverlay");
  if (helpEl && !helpEl.classList.contains("hidden")) {
    if (e.key === "Escape" || e.key === "?") pdexToggleHelp();
    else trapFocus(helpEl.querySelector(".help-card"), e);
    return;
  }
  const dataEl = document.getElementById("dataOverlay");
  if (dataEl && !dataEl.classList.contains("hidden")) {
    if (e.key === "Escape") closeDialog(dataEl);
    else trapFocus(dataEl.querySelector(".help-card"), e);
    return;
  }
  const recentEl = document.getElementById("recentPanel");
  if (recentEl && recentEl.classList.contains("open")) {
    if (e.key === "Escape") pdexCloseRecent();
    return;
  }
  // Estos atajos manejan el carrusel: fuera del modo Pokédex estarían pilotando
  // una vista oculta (pulsar R en el quiz movía la Pokédex y lanzaba fetches).
  if (state.mode !== "pokedex") {
    if (e.key === "?") { e.preventDefault(); pdexToggleHelp(); }
    return;
  }
  switch (e.key) {
    case "ArrowLeft":  e.preventDefault(); navigate(-1); break;
    case "ArrowRight": e.preventDefault(); navigate(+1); break;
    case "ArrowUp":    e.preventDefault(); navigate(-10); break;
    case "ArrowDown":  e.preventDefault(); navigate(+10); break;
    case "Home":       e.preventDefault(); navigateTo(0); break;
    case "End":        e.preventDefault(); navigateTo(state.filtered.length - 1); break;
    case "r": case "R": navigateRandom(); break;
    case "c": case "C": playCurrentCry(); break;
    case "s": case "S": toggleShiny(); break;
    case "a": case "A": toggleAnimated(); break;
    case "m": case "M": toggleMusic(); break;
    case "f": case "F": pdexToggleFav(); break;
    case "g": case "G": pdexToggleCaught(); break;
    case "l": case "L": pdexToggleView(); break;
    case "?":          e.preventDefault(); pdexToggleHelp(); break;
    case "/":          e.preventDefault(); filterName.focus(); break;
  }
});

// ════════════════════════════════════════════════════════
//  DETAIL  loader
// ════════════════════════════════════════════════════════
let detailTimer = null;
let detailRequestSeq = 0;

function scheduleDetailLoad() {
  if (detailTimer) clearTimeout(detailTimer);
  const cur = state.filtered[state.current];
  if (!cur) return;
  stageNum.textContent  = `#${padId(cur.id)}`;
  stageName.textContent = cur.name.toUpperCase();
  pdexUpdateForCurrent(cur);
  syncHash();

  const newRegion = regionForId(cur.id);
  if (newRegion !== state.currentRegion) {
    state.currentRegion = newRegion;
    if (state.musicOn) updateMusicChord(newRegion);
  }
  detailTimer = setTimeout(loadCenterDetail, 380);
}

async function fetchPokemonByName(nameOrId) {
  const key = String(nameOrId);
  if (state.detailCache[key]) return state.detailCache[key];
  const data = await apiFetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
  state.detailCache[key]    = data;
  state.detailCache[data.id] = data;
  return data;
}

// Un solo punto de entrada para /move (lo pedían por separado el modal y el
// selector de movimientos del duelo, con el mismo fetch duplicado).
async function fetchMove(name) {
  if (state.moveCache[name]) return state.moveCache[name];
  const data = await apiFetch(`https://pokeapi.co/api/v2/move/${name}`);
  state.moveCache[name] = data;
  return data;
}

async function loadCenterDetail() {
  const cur = state.filtered[state.current];
  if (!cur) return;
  const seq = ++detailRequestSeq;

  cardWrapper.classList.add("fading");
  cardLoading.classList.remove("hidden");

  try {
    // 1. Pokémon endpoint (cached)
    const data = await fetchPokemonByName(cur.id);

    // 2. Species endpoint (cached) — for genus, flavor text, varieties, evolution
    let species = state.speciesCache[cur.id];
    if (!species) {
      const sd = await apiFetch(data.species.url);
      const g  = sd.genera.find(x => x.language.name === "es")
              || sd.genera.find(x => x.language.name === "en");
      let entries = sd.flavor_text_entries.filter(e => e.language.name === "es");
      if (entries.length === 0) entries = sd.flavor_text_entries.filter(e => e.language.name === "en");
      const byVer = {};
      entries.forEach(e => {
        if (!byVer[e.version.name]) byVer[e.version.name] = e.flavor_text.replace(/[\n\f\r]+/g, " ");
      });
      species = {
        genus: g ? g.genus : "Pokémon",
        flavors: Object.entries(byVer).map(([v, t]) => ({ version: v, text: t })),
        varieties: sd.varieties || [],
        evolutionUrl: sd.evolution_chain?.url || null,
        // Campos que ya venían en esta misma respuesta y se descartaban
        captureRate:   sd.capture_rate,
        genderRate:    sd.gender_rate,
        eggGroups:     (sd.egg_groups || []).map(e => e.name),
        hatchCounter:  sd.hatch_counter,
        growthRate:    sd.growth_rate?.name || null,
        baseHappiness: sd.base_happiness,
        habitat:       sd.habitat?.name || null,
        isLegendary:   sd.is_legendary,
        isMythical:    sd.is_mythical,
        isBaby:        sd.is_baby,
        // Número de este Pokémon en cada Pokédex regional. Ya venía aquí.
        dexNumbers:    (sd.pokedex_numbers || [])
                         .map(x => ({ dex: x.pokedex.name, num: x.entry_number })),
      };
      state.speciesCache[cur.id] = species;
    }

    if (seq !== detailRequestSeq) return;

    // 3. Render base data
    renderAll(data, species);
    pdexRecordRecent(cur.id);
    pdexIndexStats(data);   // opportunistically cache stats for the stat-range filter

    // 4. Lazy load evolution chain
    if (species.evolutionUrl) {
      loadEvolutionChain(species.evolutionUrl, data.id, seq);
    } else {
      evoChainEl.innerHTML = '<span class="evo-empty">Sin evolución</span>';
    }

    // 5. Lazy load locations (for the BASE species id)
    loadLocations(cur.id, seq);

  } catch {
    /* network error */
  } finally {
    if (seq === detailRequestSeq) {
      cardLoading.classList.add("hidden");
      cardWrapper.classList.remove("fading");
    }
  }
}

// ════════════════════════════════════════════════════════
//  RENDER  Detail card
// ════════════════════════════════════════════════════════
function renderAll(data, species) {
  // En modo generación el Pokémon puede tener otro tipado (Clefairy era Normal
  // hasta gen V, Magnemite no era Acero en gen I…).
  const types = typesForGeneration(data, state.gen);
  const primaryType = types[0].type.name;
  setAccent(primaryType);

  stageNum.textContent   = `#${padId(data.id)}`;
  stageName.textContent  = data.name.toUpperCase();
  stageGenus.textContent = species.genus || "Pokémon";
  renderTypeBadges(stageTypes, types);

  $("pokeNumber").textContent = `#${padId(data.id)}`;
  $("pokeName").textContent   = data.name.toUpperCase();
  $("pokeGenus").textContent  = species.genus || "Pokémon";

  const img = $("pokemonSprite");
  img.src = officialArtFor(data.id, state.shinyMode);
  img.alt = data.name;

  $("pokeHeight").textContent = `${(data.height / 10).toFixed(1)} m`;
  $("pokeWeight").textContent = `${(data.weight / 10).toFixed(1)} kg`;
  $("pokeExp").textContent    = data.base_experience ?? "—";

  renderTypeBadges($("typesRow"), types);
  renderGenNote(data, types);
  renderDescription(species.flavors || []);
  renderAbilities(data.abilities);
  renderStats(data.stats);
  renderBreeding(species);
  renderDexNumbers(species);
  renderMoves(data);
  renderWeaknesses(types);
  renderVarieties(species.varieties || [], data.name);
}

// Aviso cuando la ficha se está mostrando con reglas de otra época
function renderGenNote(data, types) {
  const note = $("genNote");
  if (!note) return;
  if (state.gen >= CURRENT_GEN) { note.classList.add("hidden"); return; }
  const ahora = typeNamesOf(data).map(t => TYPE_LABELS_ES[t] || t.toUpperCase());
  const antes = types.map(t => TYPE_LABELS_ES[t.type.name] || t.type.name.toUpperCase());
  const cambio = ahora.join("/") !== antes.join("/")
    ? ` · Tipo actual: <b>${ahora.join(" / ")}</b>`
    : "";
  note.innerHTML = `⏳ Viendo con reglas de <b>${GEN_LABELS[state.gen]}</b>${cambio}`;
  note.classList.remove("hidden");
}

// ── Crianza y captura ──────────────────────────────────
const EGG_GROUP_LABELS = {
  monster:"Monstruo", water1:"Agua 1", water2:"Agua 2", water3:"Agua 3",
  bug:"Bicho", flying:"Volador", ground:"Campo", fairy:"Hada", plant:"Planta",
  humanshape:"Humanoide", mineral:"Mineral", indeterminate:"Amorfo",
  ditto:"Ditto", dragon:"Dragón", "no-eggs":"Sin huevos",
};
const GROWTH_LABELS = {
  slow:"Lento", medium:"Medio", fast:"Rápido", "medium-slow":"Medio-lento",
  "slow-then-very-fast":"Errático", "fast-then-very-slow":"Fluctuante",
};

// Probabilidad de captura por lanzamiento (gen V+), a PS máximo, sin estado
// alterado y con Poké Ball normal:  a = ratio/3  →  P = (a/255)^(3/4)
function captureChance(rate) {
  const a = rate / 3;
  return Math.min(100, Math.pow(a / 255, 0.75) * 100);
}

function renderBreeding(species) {
  const grid = $("breedGrid");
  if (!grid) return;
  const cells = [];
  const cell = (label, value, hint) => cells.push(
    `<div class="breed-cell">
       <span class="breed-label">${label}</span>
       <span class="breed-val">${value}</span>
       ${hint ? `<span class="breed-hint">${hint}</span>` : ""}
     </div>`);

  if (species.captureRate != null) {
    cell("Ratio de captura", species.captureRate,
         `≈ ${captureChance(species.captureRate).toFixed(1)}% por Poké Ball a PS máx.`);
  }
  const gr = species.genderRate;
  if (gr === -1) {
    cell("Género", "Sin género");
  } else if (gr != null) {
    const f = gr / 8 * 100;
    cell("Género", `♂ ${(100 - f).toFixed(1)}% · ♀ ${f.toFixed(1)}%`);
  }
  if (species.eggGroups?.length) {
    cell("Grupos huevo",
         species.eggGroups.map(g => EGG_GROUP_LABELS[g] || prettyName(g)).join(" · "));
  }
  if (species.hatchCounter != null) {
    cell("Incubación", `${(species.hatchCounter + 1) * 255} pasos`,
         `${species.hatchCounter + 1} ciclos de huevo`);
  }
  if (species.growthRate) {
    cell("Curva de EXP", GROWTH_LABELS[species.growthRate] || prettyName(species.growthRate));
  }
  if (species.baseHappiness != null) cell("Felicidad base", species.baseHappiness);
  if (species.habitat) cell("Hábitat", prettyName(species.habitat));

  const tags = [];
  if (species.isLegendary) tags.push('<span class="breed-tag legendary">★ LEGENDARIO</span>');
  if (species.isMythical)  tags.push('<span class="breed-tag mythical">✦ SINGULAR</span>');
  if (species.isBaby)      tags.push('<span class="breed-tag baby">◗ BEBÉ</span>');

  grid.innerHTML = (tags.length ? `<div class="breed-tags">${tags.join("")}</div>` : "")
                 + (cells.length ? cells.join("") : '<span class="moves-empty">Sin datos.</span>');
}

// Una sola función: renderStageTypes y renderTypes eran idénticas salvo el
// contenedor de destino.
function renderTypeBadges(container, types) {
  if (!container) return;
  container.innerHTML = "";
  types.forEach(t => {
    const s = document.createElement("span");
    s.className = `type-badge type-${t.type.name}`;
    s.textContent = t.type.name.toUpperCase();
    container.appendChild(s);
  });
}
function renderAbilities(abilities) {
  const list = $("pokeAbilities");
  list.innerHTML = "";
  abilities.forEach(a => {
    const s = document.createElement("span");
    s.className = "ability-tag" + (a.is_hidden ? " hidden-ability" : "");
    s.textContent = cap(a.ability.name.replace(/-/g, " "));
    s.dataset.name = a.ability.name;
    s.addEventListener("click", () => openAbilityModal(a.ability.name));
    list.appendChild(s);
  });
}
function renderStats(stats) {
  const list = $("pokeStats");
  list.innerHTML = "";
  stats.forEach(s => {
    const key = s.stat.name;
    const val = s.base_stat;
    const pct = Math.round((val / 255) * 100);
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="stat-name">${STAT_NAMES[key] || key.toUpperCase()}</span>
      <span class="stat-val">${val}</span>
      <div class="stat-bar-bg">
        <div class="stat-bar-fill ${STAT_CLASS[key] || ""}" style="width:0%" data-pct="${pct}"></div>
      </div>`;
    list.appendChild(row);
  });
  requestAnimationFrame(() => {
    list.querySelectorAll(".stat-bar-fill").forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.pct + "%"; }, 80);
    });
  });
}
// ── Números de Pokédex regional ─────────────────────────
// Ojo: esto NO es lo mismo que la región de las pestañas. Esas filtran por
// generación de origen (Vulpix es de gen I, luego Kanto), mientras que aquí se
// listan todas las Pokédex regionales donde aparece —Vulpix sale en 16, entre
// ellas Alola, porque tiene forma regional—. Son dos ejes distintos.
const DEX_LABELS = {
  kanto:"Kanto", "letsgo-kanto":"Kanto (Let's Go)",
  "original-johto":"Johto (O/P/C)", "updated-johto":"Johto (HG/SS)",
  hoenn:"Hoenn (R/Z/E)", "updated-hoenn":"Hoenn (ROZA)",
  "original-sinnoh":"Sinnoh (D/P)", "extended-sinnoh":"Sinnoh (Pt)",
  "original-unova":"Teselia (N/B)", "updated-unova":"Teselia (N2/B2)",
  "kalos-central":"Kalos Centro", "kalos-coastal":"Kalos Costa",
  "kalos-mountain":"Kalos Montaña",
  "original-alola":"Alola (S/L)", "updated-alola":"Alola (US/UL)",
  galar:"Galar", "isle-of-armor":"Isla Armadura", "crown-tundra":"Tundra Corona",
  hisui:"Hisui", paldea:"Paldea", kitakami:"Kitakami", blueberry:"Área Azul",
  "conquest-gallery":"Conquest", "lumiose-city":"Ciudad Luminalia",
  hyperspace:"Hiperespacio", champions:"Champions",
};
// Las Pokédex de isla de Alola son subdivisiones de las de Alola: sobran aquí.
const DEX_SKIP = /^(national|original-|updated-)?(melemele|akala|ulaula|poni)$/;

function renderDexNumbers(species) {
  const host = $("dexNumbers");
  if (!host) return;
  const list = (species.dexNumbers || [])
    .filter(d => d.dex !== "national" && !DEX_SKIP.test(d.dex));
  if (list.length === 0) {
    host.innerHTML = '<span class="moves-empty">Solo aparece en la Pokédex Nacional.</span>';
    return;
  }
  host.innerHTML = list.map(d => `
    <span class="dexnum">
      <span class="dexnum-dex">${DEX_LABELS[d.dex] || prettyName(d.dex)}</span>
      <span class="dexnum-val">#${padId(d.num)}</span>
    </span>`).join("");
}

// ── Movimientos por juego y método de aprendizaje ───────
// Esta información ya venía dentro de cada /pokemon (version_group_details) y
// se estaba tirando: antes se mostraban los 16 primeros por orden alfabético.
const VERSION_GROUP_ORDER = [
  "red-green-japan","blue-japan","red-blue","yellow",
  "gold-silver","crystal",
  "ruby-sapphire","emerald","firered-leafgreen","colosseum","xd",
  "diamond-pearl","platinum","heartgold-soulsilver",
  "black-white","black-2-white-2",
  "x-y","omega-ruby-alpha-sapphire",
  "sun-moon","ultra-sun-ultra-moon","lets-go-pikachu-lets-go-eevee",
  "sword-shield","the-isle-of-armor","the-crown-tundra",
  "brilliant-diamond-shining-pearl","legends-arceus",
  "scarlet-violet","the-teal-mask","the-indigo-disk",
  "legends-za","mega-dimension","champions",
];
const VERSION_GROUP_LABELS = {
  "red-green-japan":"Rojo/Verde (JP)", "blue-japan":"Azul (JP)",
  "red-blue":"Rojo/Azul", "yellow":"Amarillo",
  "gold-silver":"Oro/Plata", "crystal":"Cristal",
  "ruby-sapphire":"Rubí/Zafiro", "emerald":"Esmeralda",
  "firered-leafgreen":"Rojo Fuego/Verde Hoja",
  "colosseum":"Colosseum", "xd":"XD",
  "diamond-pearl":"Diamante/Perla", "platinum":"Platino",
  "heartgold-soulsilver":"HeartGold/SoulSilver",
  "black-white":"Negro/Blanco", "black-2-white-2":"Negro 2/Blanco 2",
  "x-y":"X/Y", "omega-ruby-alpha-sapphire":"Rubí Omega/Zafiro Alfa",
  "sun-moon":"Sol/Luna", "ultra-sun-ultra-moon":"Ultrasol/Ultraluna",
  "lets-go-pikachu-lets-go-eevee":"Let's Go",
  "sword-shield":"Espada/Escudo",
  "the-isle-of-armor":"Isla de la Armadura", "the-crown-tundra":"Tundra Corona",
  "brilliant-diamond-shining-pearl":"Diamante Bri./Perla Rel.",
  "legends-arceus":"Leyendas Arceus",
  "scarlet-violet":"Escarlata/Púrpura",
  "the-teal-mask":"Máscara Turquesa", "the-indigo-disk":"Disco Índigo",
  "legends-za":"Leyendas Z-A", "mega-dimension":"Mega Dimensión",
  "champions":"Champions",
};
// La API tiene más métodos de aprendizaje que los cuatro clásicos (p. ej.
// "train" en Champions o "stadium-surfing-pikachu"), y va añadiendo más con
// cada juego. En vez de una lista fija, mostramos los que realmente aparecen
// y traducimos los que conocemos.
const MOVE_METHOD_LABELS = {
  "level-up":"NIVEL", "machine":"MT/MO", "egg":"HUEVO", "tutor":"TUTOR",
  "train":"ENTRENO", "form-change":"CAMBIO DE FORMA",
  "light-ball-egg":"HUEVO (BOLA LUZ)", "stadium-surfing-pikachu":"STADIUM: SURF",
  "colosseum-purification":"PURIFICACIÓN", "xd-shadow":"OSCURO (XD)",
  "xd-purification":"PURIFICACIÓN (XD)", "zygarde-cube":"CUBO ZYGARDE",
};
const MOVE_METHOD_ORDER = ["level-up", "machine", "egg", "tutor", "train"];
const methodLabel = k => MOVE_METHOD_LABELS[k] || prettyName(k).toUpperCase();

function methodsPresent(methods) {
  return Object.keys(methods)
    .filter(k => methods[k].length > 0)
    .sort((a, b) => {
      const ia = MOVE_METHOD_ORDER.indexOf(a), ib = MOVE_METHOD_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
}

const moveset = { byVg: {}, vg: null, method: "level-up" };

function groupMovesByVersion(data) {
  const byVg = {};
  data.moves.forEach(m => {
    m.version_group_details.forEach(d => {
      const vg     = d.version_group.name;
      const method = d.move_learn_method.name;
      if (!byVg[vg])         byVg[vg] = {};
      if (!byVg[vg][method]) byVg[vg][method] = new Map();
      const prev = byVg[vg][method].get(m.move.name);
      // Un mismo movimiento puede aparecer repetido: nos quedamos con el nivel más bajo
      if (!prev || d.level_learned_at < prev.level) {
        byVg[vg][method].set(m.move.name, { name: m.move.name, level: d.level_learned_at });
      }
    });
  });
  Object.values(byVg).forEach(methods => {
    Object.keys(methods).forEach(k => {
      methods[k] = [...methods[k].values()].sort((a, b) => k === "level-up"
        ? (a.level - b.level || a.name.localeCompare(b.name))
        : a.name.localeCompare(b.name));
    });
  });
  return byVg;
}

function renderMoves(data) {
  moveset.byVg = groupMovesByVersion(data);
  // Solo juegos con algún movimiento: si no, el desplegable tendría opciones
  // que al elegirlas no muestran nada.
  const hasMoves = vg => methodsPresent(moveset.byVg[vg] || {}).length > 0;
  const available = VERSION_GROUP_ORDER.filter(vg => moveset.byVg[vg] && hasMoves(vg));
  // Cualquier juego que no esté en nuestra lista (la API añade nuevos), al final
  Object.keys(moveset.byVg).forEach(vg => {
    if (!available.includes(vg) && hasMoves(vg)) available.push(vg);
  });

  const sel  = $("moveVersionSel");
  const tabs = $("moveMethodTabs");
  if (available.length === 0) {
    if (sel)  sel.innerHTML = "<option>—</option>";
    if (tabs) tabs.innerHTML = "";
    $("pokeMoves").innerHTML = '<span class="moves-empty">Sin datos de movimientos.</span>';
    return;
  }
  moveset.vg = available[available.length - 1];   // por defecto, el juego más reciente
  if (sel) {
    sel.innerHTML = available.map(vg =>
      `<option value="${vg}">${VERSION_GROUP_LABELS[vg] || prettyName(vg)}</option>`).join("");
    sel.value = moveset.vg;
    sel.onchange = () => { moveset.vg = sel.value; renderMovesetTabs(); };
  }
  renderMovesetTabs();
}

function renderMovesetTabs() {
  const methods = moveset.byVg[moveset.vg] || {};
  const tabs    = $("moveMethodTabs");
  const present = methodsPresent(methods);
  // Al cambiar de juego el método activo puede no existir allí
  if (!present.includes(moveset.method)) moveset.method = present[0] || "level-up";
  if (tabs) {
    tabs.innerHTML = present.map(k => `
      <button class="mm-tab${k === moveset.method ? " active" : ""}" data-method="${k}">
        ${methodLabel(k)}<span class="mm-count">${methods[k].length}</span>
      </button>`).join("");
    tabs.querySelectorAll(".mm-tab").forEach(b => {
      b.addEventListener("click", () => { moveset.method = b.dataset.method; renderMovesetTabs(); });
    });
  }
  renderMovesetList(methods[moveset.method] || []);
}

function renderMovesetList(list) {
  const el = $("pokeMoves");
  el.innerHTML = "";
  if (list.length === 0) {
    el.innerHTML = '<span class="moves-empty">Sin movimientos en esta categoría.</span>';
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(mv => {
    const s = document.createElement("span");
    s.className = "move-tag";
    s.dataset.name = mv.name;
    s.innerHTML = (moveset.method === "level-up" && mv.level > 0)
      ? `<span class="move-lv">Nv.${mv.level}</span>${cap(mv.name.replace(/-/g, " "))}`
      : cap(mv.name.replace(/-/g, " "));
    s.addEventListener("click", () => openMoveModal(mv.name));
    frag.appendChild(s);
  });
  el.appendChild(frag);
}

// ── Description ────────────────────────────────────────
function renderDescription(flavors) {
  if (!flavors || flavors.length === 0) {
    versionSel.innerHTML = '<option>—</option>';
    pokeDescription.textContent = "Sin entrada de Pokédex disponible.";
    return;
  }
  versionSel.innerHTML = flavors
    .map(f => `<option value="${f.version}">${prettyVersion(f.version)}</option>`)
    .join("");
  versionSel.value = flavors[0].version;
  pokeDescription.textContent = flavors[0].text;
  versionSel.onchange = () => {
    const found = flavors.find(f => f.version === versionSel.value);
    if (found) pokeDescription.textContent = found.text;
  };
}

// ════════════════════════════════════════════════════════
//  WEAKNESSES & RESISTANCES
// ════════════════════════════════════════════════════════
function calcWeaknesses(defenderTypes) {
  const result = {};
  activeTypes().forEach(attacker => {
    result[attacker] = effectiveness(attacker, defenderTypes);
  });
  return result;
}
function renderWeaknesses(types) {
  const defenderTypes = types.map(t => t.type.name);
  const matchups = calcWeaknesses(defenderTypes);

  // Order: from most damaging to least
  const order = ["x4", "x2", "x1", "x0_5", "x0_25", "x0"];
  const buckets = { "x4":[], "x2":[], "x1":[], "x0_5":[], "x0_25":[], "x0":[] };
  Object.entries(matchups).forEach(([type, m]) => {
    if (m === 4)        buckets.x4.push(type);
    else if (m === 2)   buckets.x2.push(type);
    else if (m === 1)   buckets.x1.push(type);
    else if (m === 0.5) buckets.x0_5.push(type);
    else if (m === 0.25)buckets.x0_25.push(type);
    else if (m === 0)   buckets.x0.push(type);
  });

  weaknessesGrid.innerHTML = "";
  // Render only non-1x cells (those are "neutral", less interesting)
  order.filter(k => k !== "x1").forEach(key => {
    buckets[key].forEach(type => {
      const cell = document.createElement("div");
      cell.className = `weak-cell ${key} type-${type}`;
      cell.innerHTML = `
        <span>${TYPE_LABELS_ES[type] || type.toUpperCase()}</span>
        <span class="weak-mult">${formatMult(key)}</span>`;
      weaknessesGrid.appendChild(cell);
    });
  });
  if (weaknessesGrid.children.length === 0) {
    weaknessesGrid.innerHTML = '<span class="evo-empty">Sin debilidades ni resistencias notables.</span>';
  }
}
function formatMult(key) {
  return { "x4":"×4", "x2":"×2", "x1":"×1", "x0_5":"×½", "x0_25":"×¼", "x0":"×0" }[key];
}

// ════════════════════════════════════════════════════════
//  EVOLUTION CHAIN
// ════════════════════════════════════════════════════════
async function loadEvolutionChain(url, currentId, seq) {
  const cacheKey = url;
  let chain = state.evoCache[cacheKey];
  if (!chain) {
    try {
      chain = await apiFetch(url);
      state.evoCache[cacheKey] = chain;
    } catch {
      if (seq === detailRequestSeq) {
        evoChainEl.innerHTML = '<span class="evo-empty">No se pudo cargar la evolución.</span>';
      }
      return;
    }
  }
  // Puede haber llegado tarde: si ya estamos en otro Pokémon, no pintar.
  if (seq !== undefined && seq !== detailRequestSeq) return;
  evoChainEl.innerHTML = "";
  evoChainEl.appendChild(buildEvolutionTree(chain.chain, currentId));
}

function buildEvolutionTree(node, currentId) {
  const wrapper = document.createElement("div");
  wrapper.className = "evo-node";

  const id = getId(node.species.url);
  const isCurrent = id === currentId;

  const poke = document.createElement("div");
  poke.className = "evo-poke" + (isCurrent ? " current" : "");
  poke.title = "Saltar a " + node.species.name;
  poke.innerHTML = `
    <img src="${spriteFor(id)}" alt="${node.species.name}" loading="lazy"
         onerror="this.style.opacity='0.2'"/>
    <span class="evo-name">${node.species.name}</span>
    <span class="evo-num">#${padId(id)}</span>`;
  poke.addEventListener("click", () => {
    if (!isCurrent) jumpToId(id);
  });
  wrapper.appendChild(poke);

  if (node.evolves_to.length > 0) {
    const branches = document.createElement("div");
    branches.className = "evo-branches";
    node.evolves_to.forEach(child => {
      const branch = document.createElement("div");
      branch.className = "evo-branch";
      const arrow = document.createElement("div");
      arrow.className = "evo-arrow";
      const method = parseEvolutionMethod(child.evolution_details[0]);
      arrow.innerHTML = `<span>→</span><small>${method}</small>`;
      branch.appendChild(arrow);
      branch.appendChild(buildEvolutionTree(child, currentId));
      branches.appendChild(branch);
    });
    wrapper.appendChild(branches);
  }
  return wrapper;
}

function parseEvolutionMethod(d) {
  if (!d) return "?";
  const parts = [];
  if (d.min_level)   parts.push(`Nv. ${d.min_level}`);
  if (d.item)        parts.push(prettyName(d.item.name));
  if (d.held_item)   parts.push("c/" + prettyName(d.held_item.name));
  if (d.known_move)  parts.push("sabe " + prettyName(d.known_move.name));
  if (d.location)    parts.push("en " + prettyName(d.location.name));
  if (d.min_happiness) parts.push("Felicidad");
  if (d.min_affection) parts.push("Afecto");
  if (d.min_beauty)    parts.push("Belleza");
  if (d.time_of_day && d.time_of_day !== "") parts.push(d.time_of_day === "day" ? "Día" : d.time_of_day === "night" ? "Noche" : d.time_of_day);
  if (d.gender === 1) parts.push("♀");
  if (d.gender === 2) parts.push("♂");
  if (d.trigger?.name === "trade") parts.push("Intercambio");
  if (d.trigger?.name === "shed") parts.push("Hueco");
  if (d.needs_overworld_rain) parts.push("lluvia");
  return parts.join(" + ") || (d.trigger?.name ? prettyName(d.trigger.name) : "?");
}
function prettyName(s) {
  return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ════════════════════════════════════════════════════════
//  LOCATIONS (where to find it)
// ════════════════════════════════════════════════════════
async function loadLocations(id, seq) {
  const stale = () => seq !== undefined && seq !== detailRequestSeq;
  if (state.locationCache[id]) {
    renderLocations(state.locationCache[id]);
    return;
  }
  locationsList.innerHTML = '<span class="loc-empty">Buscando ubicaciones…</span>';
  try {
    const data = state.detailCache[id] || await fetchPokemonByName(id);
    const arr  = await apiFetch(data.location_area_encounters);
    state.locationCache[id] = arr;
    if (stale()) return;          // ya navegamos a otro Pokémon
    renderLocations(arr);
  } catch {
    if (stale()) return;
    locationsList.innerHTML = '<span class="loc-empty">No se pudieron cargar las ubicaciones.</span>';
  }
}
function renderLocations(arr) {
  if (!arr || arr.length === 0) {
    locationsList.innerHTML = '<span class="loc-empty">No se encuentra en estado salvaje.</span>';
    return;
  }
  locationsList.innerHTML = "";
  arr.slice(0, 30).forEach(entry => {
    const row = document.createElement("div");
    row.className = "loc-row";
    const versions = [...new Set(entry.version_details.map(v => v.version.name))];
    row.innerHTML = `
      <span class="loc-name">${prettyName(entry.location_area.name)}</span>
      <span class="loc-versions">
        ${versions.slice(0, 4).map(v => `<span class="loc-ver">${prettyVersion(v)}</span>`).join("")}
      </span>`;
    locationsList.appendChild(row);
  });
  if (arr.length > 30) {
    const more = document.createElement("div");
    more.className = "loc-row";
    more.innerHTML = `<span class="loc-name">...y ${arr.length - 30} ubicaciones más</span>`;
    locationsList.appendChild(more);
  }
}

// ════════════════════════════════════════════════════════
//  VARIETIES (alternate forms)
// ════════════════════════════════════════════════════════
function renderVarieties(varieties, currentName) {
  if (varieties.length <= 1) {
    varietiesWrap.classList.add("hidden");
    return;
  }
  varietiesWrap.classList.remove("hidden");
  varietiesList.innerHTML = "";
  varieties.forEach(v => {
    const chip = document.createElement("button");
    chip.className = "variety-chip" + (v.pokemon.name === currentName ? " active" : "");
    chip.textContent = v.is_default ? "Forma base" : prettyVarietyName(v.pokemon.name, varieties[0].pokemon.name);
    chip.addEventListener("click", () => loadVariety(v.pokemon.name));
    varietiesList.appendChild(chip);
  });
}
function prettyVarietyName(name, baseName) {
  // "raichu-alola" → "Alola"; "venusaur-mega" → "Mega"; "necrozma-dawn-wings" → "Dawn Wings"
  if (!name.startsWith(baseName)) return prettyName(name);
  const tail = name.slice(baseName.length).replace(/^-/, "");
  return tail ? prettyName(tail) : "Forma base";
}

async function loadVariety(name) {
  state.currentVariety = name;
  cardWrapper.classList.add("fading");
  cardLoading.classList.remove("hidden");
  try {
    const data = await fetchPokemonByName(name);
    const cur  = state.filtered[state.current];
    // Las formas comparten especie; si por lo que sea no está cacheada,
    // renderAll reventaría al leer species.genus.
    const species = (cur && state.speciesCache[cur.id])
                 || { genus: "Pokémon", flavors: [], varieties: [] };
    renderAll(data, species);
  } catch {} finally {
    cardLoading.classList.add("hidden");
    cardWrapper.classList.remove("fading");
  }
}

// ════════════════════════════════════════════════════════
//  MODAL  (shared between abilities & moves)
// ════════════════════════════════════════════════════════
// ── Foco en diálogos ─────────────────────────────────────
// Guardar de dónde veníamos, atrapar el Tab dentro del diálogo y devolver el
// foco al cerrar. Sin esto, con teclado te quedabas navegando por detrás.
let lastFocused = null;

function trapFocus(container, e) {
  if (e.key !== "Tab" || !container) return;
  const list = [...container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);
  if (list.length === 0) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function openDialog(overlay, focusTarget) {
  if (!overlay) return;
  lastFocused = document.activeElement;
  overlay.classList.remove("hidden");
  (focusTarget || overlay.querySelector("button"))?.focus();
}
function closeDialog(overlay) {
  if (!overlay) return;
  overlay.classList.add("hidden");
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}

function openModal() {
  lastFocused = document.activeElement;
  modalOverlay.classList.remove("hidden");
  modalContent.classList.add("hidden");
  modalLoading.classList.remove("hidden");
  modalClose.focus();
}
function closeModal() {
  modalOverlay.classList.add("hidden");
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

async function openAbilityModal(abilityName) {
  openModal();
  let data = state.abilityCache[abilityName];
  if (!data) {
    try {
      data = await apiFetch(`https://pokeapi.co/api/v2/ability/${abilityName}`);
      state.abilityCache[abilityName] = data;
    } catch {
      modalContent.innerHTML = `<p style="padding:20px;color:#ff8888">Error al cargar la habilidad.</p>`;
      modalLoading.classList.add("hidden");
      modalContent.classList.remove("hidden");
      return;
    }
  }
  // Pretty Spanish name if available
  const nameEntry = data.names.find(n => n.language.name === "es") || data.names.find(n => n.language.name === "en");
  const displayName = nameEntry ? nameEntry.name : prettyName(data.name);

  // Effect entry (Spanish preferred)
  let desc = data.effect_entries.find(e => e.language.name === "es");
  if (!desc) desc = data.flavor_text_entries.find(e => e.language.name === "es");
  if (!desc) desc = data.effect_entries.find(e => e.language.name === "en");
  if (!desc) desc = data.flavor_text_entries.find(e => e.language.name === "en");
  const text = desc ? (desc.short_effect || desc.effect || desc.flavor_text || "") : "Sin descripción.";

  modalContent.innerHTML = `
    <div class="modal-title">${displayName}</div>
    <div class="modal-meta-row">
      <span class="modal-cat">HABILIDAD</span>
      ${data.is_main_series ? "" : '<span class="modal-cat">SERIE PARALELA</span>'}
    </div>
    <div class="modal-section-title">◆ EFECTO</div>
    <div class="modal-description">${text.replace(/[\n\f\r]+/g, " ")}</div>`;
  modalLoading.classList.add("hidden");
  modalContent.classList.remove("hidden");
}

async function openMoveModal(moveName) {
  openModal();
  let data;
  try {
    data = await fetchMove(moveName);
  } catch {
    modalContent.innerHTML = `<p style="padding:20px;color:#ff8888">Error al cargar el movimiento.</p>`;
    modalLoading.classList.add("hidden");
    modalContent.classList.remove("hidden");
    return;
  }
  const nameEntry = data.names.find(n => n.language.name === "es") || data.names.find(n => n.language.name === "en");
  const displayName = nameEntry ? nameEntry.name : prettyName(data.name);

  let desc = data.flavor_text_entries.find(e => e.language.name === "es");
  if (!desc) desc = data.flavor_text_entries.find(e => e.language.name === "en");
  const text = desc ? desc.flavor_text.replace(/[\n\f\r]+/g, " ") : "Sin descripción.";

  const cat = data.damage_class?.name || "status";
  const power    = data.power     ?? "—";
  const accuracy = data.accuracy  ?? "—";
  const pp       = data.pp        ?? "—";

  modalContent.innerHTML = `
    <div class="modal-title">${displayName}</div>
    <div class="modal-meta-row">
      <span class="type-badge type-${data.type.name}">${data.type.name.toUpperCase()}</span>
      <span class="modal-cat cat-${cat}">${cat === "physical" ? "FÍSICO" : cat === "special" ? "ESPECIAL" : "ESTADO"}</span>
    </div>
    <div class="modal-stats-row">
      <div class="modal-stat">
        <span class="modal-stat-label">Potencia</span>
        <span class="modal-stat-val">${power}</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">Precisión</span>
        <span class="modal-stat-val">${accuracy === "—" ? "—" : accuracy + "%"}</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">PP</span>
        <span class="modal-stat-val">${pp}</span>
      </div>
    </div>
    <div class="modal-section-title">◆ DESCRIPCIÓN</div>
    <div class="modal-description">${text}</div>`;
  modalLoading.classList.add("hidden");
  modalContent.classList.remove("hidden");
}

// ════════════════════════════════════════════════════════
//  CRY
// ════════════════════════════════════════════════════════
let currentCryAudio = null;
function playCurrentCry() {
  const cur = state.filtered[state.current];
  if (!cur) return;
  const data = state.detailCache[cur.id];
  if (!data) return;
  const url = data.cries?.latest || data.cries?.legacy;
  if (!url) return;
  if (currentCryAudio) { currentCryAudio.pause(); currentCryAudio = null; }
  currentCryAudio = new Audio(url);
  currentCryAudio.volume = 0.18;
  currentCryAudio.play().catch(() => {});
  cryBtn.classList.remove("ringing");
  void cryBtn.offsetWidth;
  cryBtn.classList.add("ringing");
}
cryBtn.addEventListener("click", playCurrentCry);

// ════════════════════════════════════════════════════════
//  SHINY  +  ANIMATED  toggles
// ════════════════════════════════════════════════════════
function toggleShiny() {
  state.shinyMode = !state.shinyMode;
  shinyBtn.classList.toggle("active", state.shinyMode);
  refreshSprites();
  if (state.shinyMode) emitSparkles();
}
shinyBtn.addEventListener("click", toggleShiny);

function emitSparkles() {
  let layer = stage.querySelector(".sparkle-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "sparkle-layer";
    stage.appendChild(layer);
  }
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.className = "sparkle" + (Math.random() < 0.5 ? " tiny" : "");
    s.style.left = `calc(50% + ${(Math.random() - 0.5) * 360}px)`;
    s.style.top  = `calc(50% + ${(Math.random() - 0.5) * 220}px)`;
    s.style.animationDelay = (Math.random() * 0.4) + "s";
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

function toggleAnimated() {
  state.animatedMode = !state.animatedMode;
  animBtn.classList.toggle("active", state.animatedMode);
  refreshSprites();
}
animBtn.addEventListener("click", toggleAnimated);

// ════════════════════════════════════════════════════════
//  MUSIC  (procedural ambient)
// ════════════════════════════════════════════════════════
let audioCtx = null;
let musicNodes = [];
let musicGain = null;
let musicFilter = null;

function startMusic() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0;
  musicFilter = audioCtx.createBiquadFilter();
  musicFilter.type = "lowpass";
  musicFilter.frequency.value = 1100;
  musicFilter.Q.value = 0.6;
  musicFilter.connect(musicGain).connect(audioCtx.destination);
  buildChord(REGION_CHORDS[state.currentRegion] || REGION_CHORDS.kanto);
  const now = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(0, now);
  musicGain.gain.linearRampToValueAtTime(0.012, now + 1.6);
}
function buildChord(freqs) {
  musicNodes.forEach(n => { try { n.stop(); } catch {} });
  musicNodes = [];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08 + i * 0.04;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 2.5;
    lfo.connect(lfoGain).connect(osc.detune);
    osc.connect(musicFilter);
    osc.start();
    lfo.start();
    musicNodes.push(osc, lfo);
  });
}
function updateMusicChord(region) {
  if (!audioCtx) return;
  buildChord(REGION_CHORDS[region] || REGION_CHORDS.kanto);
}
function stopMusic() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(0, now + 0.6);
  setTimeout(() => {
    musicNodes.forEach(n => { try { n.stop(); } catch {} });
    musicNodes = [];
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  }, 700);
}
function toggleMusic() {
  state.musicOn = !state.musicOn;
  musicBtn.classList.toggle("active", state.musicOn);
  musicBtn.classList.toggle("music-on", state.musicOn);
  musicLabel.textContent = state.musicOn ? "ON" : "OFF";
  if (state.musicOn) startMusic();
  else stopMusic();
}
musicBtn.addEventListener("click", toggleMusic);

// ════════════════════════════════════════════════════════
//  PERSONAL  DEX   (favoritos · capturados · notas · historial)
//  +  filtros avanzados  (gen tabs · multi-tipo · stats · fuzzy · vista)
// ════════════════════════════════════════════════════════
state.statIndex   = {};
state.statAllLoaded = false;

const PDEX = { favs: new Set(), caught: new Set(), notes: {}, recent: [] };
const pdexUI = { favOnly: false, caughtOnly: false, listView: false };

const REGION_META = {
  kanto:  { label: "Kanto",  roman: "I",    color: "#E3350D" },
  johto:  { label: "Johto",  roman: "II",   color: "#C7A008" },
  hoenn:  { label: "Hoenn",  roman: "III",  color: "#2AA35B" },
  sinnoh: { label: "Sinnoh", roman: "IV",   color: "#6C8CC7" },
  unova:  { label: "Unova",  roman: "V",    color: "#5A5A6E" },
  kalos:  { label: "Kalos",  roman: "VI",   color: "#8E44AD" },
  alola:  { label: "Alola",  roman: "VII",  color: "#F39C12" },
  galar:  { label: "Galar",  roman: "VIII", color: "#C0392B" },
  paldea: { label: "Paldea", roman: "IX",   color: "#16A085" },
};
const STAT_ORDER = ["hp","attack","defense","special-attack","special-defense","speed"];

// ── storage ──────────────────────────────────────────────
function pdexLoad() {
  try { PDEX.favs   = new Set(JSON.parse(localStorage.getItem("pdex_favs")   || "[]")); } catch {}
  try { PDEX.caught = new Set(JSON.parse(localStorage.getItem("pdex_caught") || "[]")); } catch {}
  try { PDEX.notes  = JSON.parse(localStorage.getItem("pdex_notes")  || "{}") || {}; } catch {}
  try { PDEX.recent = JSON.parse(localStorage.getItem("pdex_recent") || "[]") || []; } catch {}
}
function pdexSave(key) {
  try {
    if (key === "favs")   localStorage.setItem("pdex_favs",   JSON.stringify([...PDEX.favs]));
    if (key === "caught") localStorage.setItem("pdex_caught", JSON.stringify([...PDEX.caught]));
    if (key === "notes")  localStorage.setItem("pdex_notes",  JSON.stringify(PDEX.notes));
    if (key === "recent") localStorage.setItem("pdex_recent", JSON.stringify(PDEX.recent));
  } catch {}
}

// ── fuzzy search ─────────────────────────────────────────
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}
function fuzzyScore(q, name) {
  q = q.toLowerCase(); name = name.toLowerCase();
  if (name === q) return 1000;
  if (name.startsWith(q)) return 900 - (name.length - q.length);
  const idx = name.indexOf(q);
  if (idx >= 0) return 700 - idx - (name.length - q.length);
  // subsequence (in order, gaps allowed)
  let qi = 0;
  for (let i = 0; i < name.length && qi < q.length; i++) if (name[i] === q[qi]) qi++;
  if (qi === q.length && q.length >= 3) return 400 - (name.length - q.length);
  // typo tolerance
  const d = lev(q, name);
  const tol = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
  if (d <= tol) return 300 - d * 60;
  return -1;
}

// ── type caches (used by primary + secondary type filters) ──
async function ensureTypeCache(tv) {
  if (!tv || state.typeCache[tv]) return;
  typeLoading.classList.remove("hidden");
  try {
    const d = await apiFetch(`https://pokeapi.co/api/v2/type/${tv}`);
    state.typeCache[tv] = new Set(
      d.pokemon.map(p => getId(p.pokemon.url)).filter(id => id >= 1 && id <= 1025)
    );
  } catch { state.typeCache[tv] = new Set(); }
  typeLoading.classList.add("hidden");
}

// ── stat index (for stat-range filter) ───────────────────
function pdexIndexStats(data) {
  if (!data || !data.stats || state.statIndex[data.id]) return;
  const rec = {};
  data.stats.forEach(s => rec[s.stat.name] = s.base_stat);
  rec.bst = STAT_ORDER.reduce((t, k) => t + (rec[k] || 0), 0);
  state.statIndex[data.id] = rec;
}
// Los stats de los 1025 en UNA sola petición vía GraphQL.
// Antes eran 1025 peticiones REST con 24 workers en paralelo y sin reintentos:
// cualquier fallo dejaba huecos en statIndex que el filtro descartaba en
// silencio, y esa ráfaga contradice la fair-use policy de PokéAPI.
const GRAPHQL_URL     = "https://beta.pokeapi.co/graphql/v1beta";
const STATS_CACHE_KEY = "stats:all:v1";

async function fetchAllStatsGraphQL() {
  const query = `query AllStats {
    pokemon_v2_pokemon(where: {id: {_lte: 1025}}, order_by: {id: asc}, limit: 2000) {
      id
      pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
    }
  }`;
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL: " + (json.errors[0]?.message || "error"));
  const rows = json.data?.pokemon_v2_pokemon || [];
  if (rows.length === 0) throw new Error("GraphQL devolvió 0 filas");
  return rows;
}

// Plan B si GraphQL no está disponible (es un endpoint beta): REST, pero con
// muchos menos workers y devolviendo si se completó de verdad o no.
async function pdexLoadAllStatsREST(setBar) {
  const ids   = state.allPokemon.map(p => p.id).filter(id => !state.statIndex[id]);
  const total = state.allPokemon.length;
  let done = total - ids.length, failed = 0;
  const queue = ids.slice();
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      try { pdexIndexStats(await fetchPokemonByName(id)); }
      catch { failed++; }
      done++;
      if (done % 25 === 0) setBar(Math.round(done / total * 100));
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return failed === 0;
}

async function pdexLoadAllStats() {
  if (state.statAllLoaded || state._statLoading) return;
  state._statLoading = true;
  const bar    = $("statLoadBar");
  const status = $("statLoadStatus");
  const setBar = pct => { if (bar) bar.style.width = pct + "%"; };
  setBar(5);

  let ok = false;
  try {
    const entry = await idbGet(STATS_CACHE_KEY);
    let rows;
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
      rows = entry.data;                       // segunda visita: sin red
    } else {
      rows = await fetchAllStatsGraphQL();
      idbSet(STATS_CACHE_KEY, { ts: Date.now(), data: rows });
    }
    setBar(70);
    rows.forEach(row => {
      const rec = {};
      row.pokemon_v2_pokemonstats.forEach(s => { rec[s.pokemon_v2_stat.name] = s.base_stat; });
      rec.bst = STAT_ORDER.reduce((t, k) => t + (rec[k] || 0), 0);
      state.statIndex[row.id] = rec;
    });
    ok = true;
  } catch {
    if (status) status.textContent = "GraphQL no disponible, cargando por REST…";
    ok = await pdexLoadAllStatsREST(setBar);
  }
  setBar(100);

  // Solo damos por buenos los datos si están COMPLETOS: con huecos, el filtro
  // haría desaparecer Pokémon sin explicar por qué.
  state.statAllLoaded = ok;
  state._statLoading  = false;

  const panel = $("statFilterPanel");
  if (ok) {
    if (panel)  panel.classList.remove("stats-locked");
    if (status) status.textContent = "✓ Datos de stats listos";
    // resetIndex:false — cargar datos no debe echarte del Pokémon que estabas viendo
    applyFilters({ resetIndex: false });
  } else {
    if (status) status.textContent = "⚠ No se pudieron cargar todos los stats. Inténtalo de nuevo.";
    const btn = $("statLoadBtn");
    if (btn) btn.disabled = false;
  }
}
function pdexStatFilter() {
  const panel = $("statFilterPanel");
  if (!panel || panel.classList.contains("hidden") || !state.statAllLoaded)
    return { active: false, ranges: {} };
  const ranges = {};
  let active = false;
  panel.querySelectorAll(".stat-slider-row").forEach(row => {
    const key = row.dataset.key;
    const mn = parseInt(row.querySelector(".ss-min").value, 10);
    const mx = parseInt(row.querySelector(".ss-max").value, 10);
    const cap = key === "bst" ? 800 : 255;
    if (mn > 0 || mx < cap) { ranges[key] = [mn, mx]; active = true; }
  });
  return { active, ranges };
}

// ── favoritos / capturados / notas / recientes ───────────
function pdexToggleFav() {
  const cur = state.filtered[state.current]; if (!cur) return;
  if (PDEX.favs.has(cur.id)) PDEX.favs.delete(cur.id); else PDEX.favs.add(cur.id);
  pdexSave("favs"); pdexUpdateForCurrent(cur); pdexRenderProgress();
  if (pdexUI.favOnly) applyFilters({ resetIndex: false });
  else pdexRefreshCompactRow(cur.id);
}
function pdexToggleCaught() {
  const cur = state.filtered[state.current]; if (!cur) return;
  if (PDEX.caught.has(cur.id)) PDEX.caught.delete(cur.id); else PDEX.caught.add(cur.id);
  pdexSave("caught"); pdexUpdateForCurrent(cur); pdexRenderProgress();
  if (pdexUI.caughtOnly) applyFilters({ resetIndex: false });
  else pdexRefreshCompactRow(cur.id);
}
function pdexUpdateForCurrent(cur) {
  if (!cur) return;
  const favBtn = $("favBtn"), caughtBtn = $("caughtBtn"), note = $("pokeNote");
  if (favBtn)    favBtn.classList.toggle("on", PDEX.favs.has(cur.id));
  if (caughtBtn) caughtBtn.classList.toggle("on", PDEX.caught.has(cur.id));
  if (note) { note.value = PDEX.notes[cur.id] || ""; note.dataset.id = cur.id; }
}
function pdexRecordRecent(id) {
  PDEX.recent = [id, ...PDEX.recent.filter(x => x !== id)].slice(0, 10);
  pdexSave("recent");
  pdexRenderRecent();
}

// ── progress bar (capturados por región) ─────────────────
function pdexRenderProgress() {
  const wrap = $("dexProgressWrap"); if (!wrap) return;
  const total = state.allPokemon.length || 1025;
  const caught = PDEX.caught.size;
  const regVal = state.region;
  let regHtml = "";
  if (regVal && REGION_META[regVal]) {
    const [mn, mx] = REGIONS[regVal];
    let c = 0; for (const id of PDEX.caught) if (id >= mn && id <= mx) c++;
    const rt = mx - mn + 1;
    regHtml = `<span class="dexp-region" style="--rc:${REGION_META[regVal].color}">
      ${REGION_META[regVal].label}: <b>${c}/${rt}</b></span>`;
  }
  const pct = Math.round(caught / total * 100);
  wrap.innerHTML = `
    <div class="dexp-head">
      <span class="dexp-title">◉ POKÉDEX PERSONAL</span>
      <span class="dexp-count"><b>${caught}</b> / ${total} capturados (${pct}%)</span>
      ${regHtml}
      <span class="dexp-fav">★ ${PDEX.favs.size} favoritos</span>
    </div>
    <div class="dexp-bar"><div class="dexp-fill" style="width:${pct}%"></div></div>`;
}

// ── recientes (panel lateral) ────────────────────────────
function pdexRenderRecent() {
  const list = $("recentList"); if (!list) return;
  const badge = $("recentBadge");
  if (badge) badge.textContent = PDEX.recent.length;
  if (!PDEX.recent.length) { list.innerHTML = `<p class="recent-empty">Aún no has visto ninguno.</p>`; return; }
  list.innerHTML = "";
  PDEX.recent.forEach(id => {
    const p = state.allPokemon.find(x => x.id === id);
    const name = p ? p.name : "#" + id;
    const row = document.createElement("button");
    row.className = "recent-item";
    row.innerHTML = `
      <img src="${spriteFor(id)}" alt="" loading="lazy"/>
      <span class="ri-num">#${padId(id)}</span>
      <span class="ri-name">${cap(name)}</span>
      ${PDEX.caught.has(id) ? '<span class="ri-tag">◉</span>' : ''}
      ${PDEX.favs.has(id)   ? '<span class="ri-tag ri-fav">★</span>' : ''}`;
    row.addEventListener("click", () => { jumpToId(id); pdexCloseRecent(); });
    list.appendChild(row);
  });
}
function pdexOpenRecent()  { $("recentPanel").classList.add("open"); }
function pdexCloseRecent() { $("recentPanel").classList.remove("open"); }

// ── vista compacta (lista densa) ─────────────────────────
function pdexToggleView() { pdexUI.listView = !pdexUI.listView; pdexApplyViewMode(); }
function pdexApplyViewMode() {
  const chip = $("chipView");
  if (chip) chip.classList.toggle("on", pdexUI.listView);
  const stageSection = document.querySelector(".stage-section");
  const compact = $("compactList");
  if (pdexUI.listView) {
    if (stageSection) stageSection.classList.add("hidden");
    pagination.classList.add("hidden");
    cardWrapper.classList.add("hidden");
    compact.classList.remove("hidden");
    pdexRenderCompact();
  } else {
    if (stageSection) stageSection.classList.remove("hidden");
    pagination.classList.remove("hidden");
    cardWrapper.classList.remove("hidden");
    compact.classList.add("hidden");
  }
}
function pdexRenderCompact() {
  const compact = $("compactList");
  const list = state.filtered;
  compact.innerHTML = "";
  const frag = document.createDocumentFragment();
  list.forEach((p, i) => {
    const row = document.createElement("button");
    row.className = "cl-row" + (i === state.current ? " current" : "");
    row.dataset.id = p.id;
    row.innerHTML = `
      <img class="cl-sprite" src="${spriteFor(p.id)}" alt="" loading="lazy"/>
      <span class="cl-num">#${padId(p.id)}</span>
      <span class="cl-name">${cap(p.name)}</span>
      <span class="cl-flags">
        <span class="cl-flag cl-caught ${PDEX.caught.has(p.id) ? 'on' : ''}" title="Capturado">◉</span>
        <span class="cl-flag cl-fav ${PDEX.favs.has(p.id) ? 'on' : ''}" title="Favorito">★</span>
      </span>`;
    row.querySelector(".cl-caught").addEventListener("click", e => {
      e.stopPropagation();
      if (PDEX.caught.has(p.id)) PDEX.caught.delete(p.id); else PDEX.caught.add(p.id);
      pdexSave("caught"); pdexRefreshCompactRow(p.id); pdexRenderProgress();
    });
    row.querySelector(".cl-fav").addEventListener("click", e => {
      e.stopPropagation();
      if (PDEX.favs.has(p.id)) PDEX.favs.delete(p.id); else PDEX.favs.add(p.id);
      pdexSave("favs"); pdexRefreshCompactRow(p.id); pdexRenderProgress();
    });
    row.addEventListener("click", () => {
      navigateTo(i);
      pdexUI.listView = false; pdexApplyViewMode();
    });
    frag.appendChild(row);
  });
  compact.appendChild(frag);
}
function pdexRefreshCompactRow(id) {
  const row = $("compactList")?.querySelector(`.cl-row[data-id="${id}"]`);
  if (!row) return;
  row.querySelector(".cl-caught").classList.toggle("on", PDEX.caught.has(id));
  row.querySelector(".cl-fav").classList.toggle("on", PDEX.favs.has(id));
}
// ── panel de ayuda (atajos) ──────────────────────────────
function pdexToggleHelp() {
  const ov = $("helpOverlay"); if (!ov) return;
  if (ov.classList.contains("hidden")) openDialog(ov, $("helpClose"));
  else closeDialog(ov);
}

// ── build UI ─────────────────────────────────────────────
function pdexBuildControls() {
  // secondary type select (clone options from primary)
  const typeOpts = filterType.innerHTML;
  const controls = $("pdexControls");
  controls.innerHTML = `
    <div class="pdex-row">
      <div class="filter-group">
        <span class="filter-label">▸ 2.º TIPO</span>
        <select class="filter-sel" id="filterType2">${typeOpts}</select>
      </div>
      <div class="pdex-chips">
        <button class="filter-chip" id="chipFav" title="Ver solo favoritos">★ Favoritos</button>
        <button class="filter-chip" id="chipCaught" title="Ver solo capturados">◉ Capturados</button>
        <button class="filter-chip" id="chipStats" title="Filtro por estadísticas">📊 Stats</button>
        <button class="filter-chip" id="chipView" title="Vista de lista compacta (L)">☰ Lista</button>
        <button class="filter-chip" id="chipData" title="Exportar / importar tu Pokédex">⇄ Datos</button>
        <button class="filter-chip" id="chipHelp" title="Atajos de teclado (?)">? Ayuda</button>
      </div>
    </div>
    <div class="gen-tabs" id="genTabs"></div>`;

  // generation tabs
  const genTabs = $("genTabs");
  const mkTab = (val, label, sub, color) => {
    const b = document.createElement("button");
    b.className = "gen-tab";
    b.dataset.region = val;
    b.style.setProperty("--gc", color || "#888");
    b.innerHTML = `<span class="gt-label">${label}</span>${sub ? `<span class="gt-sub">${sub}</span>` : ""}`;
    b.addEventListener("click", () => {
      state.region = val;
      pdexSyncGenTabs();
      applyFilters({ resetIndex: true });
    });
    genTabs.appendChild(b);
  };
  mkTab("", "TODAS", "Nacional", "#CFCFCF");
  Object.entries(REGION_META).forEach(([k, m]) => mkTab(k, m.label, "Gen " + m.roman, m.color));

  // stat filter panel
  const STAT_UI = [
    ["hp", "PS", 255], ["attack", "ATAQUE", 255], ["defense", "DEFENSA", 255],
    ["special-attack", "AT. ESP.", 255], ["special-defense", "DEF. ESP.", 255],
    ["speed", "VELOCIDAD", 255], ["bst", "TOTAL (BST)", 800],
  ];
  const panel = $("statFilterPanel");
  panel.classList.add("stats-locked");
  panel.innerHTML = `
    <div class="sfp-head">
      <span class="sfp-title">📊 FILTRO POR ESTADÍSTICAS</span>
      <div class="sfp-presets">
        <button class="sfp-preset" data-preset="fast">⚡ Más rápidos</button>
        <button class="sfp-preset" data-preset="strong">💪 Más fuertes</button>
        <button class="sfp-preset" data-preset="weak">🍃 Más débiles</button>
        <button class="sfp-preset" data-preset="reset">↺ Reiniciar</button>
      </div>
    </div>
    <div class="sfp-status">
      <span id="statLoadStatus">Se necesitan los datos de stats de los 1025 Pokémon.</span>
      <button class="sfp-load" id="statLoadBtn">Cargar datos</button>
      <div class="sfp-progress"><div class="sfp-progress-fill" id="statLoadBar"></div></div>
    </div>
    <div class="sfp-grid">
      ${STAT_UI.map(([key, label, cap]) => `
        <div class="stat-slider-row" data-key="${key}" data-cap="${cap}">
          <span class="ssr-label">${label}</span>
          <div class="ssr-controls">
            <input type="range" class="ss-min" min="0" max="${cap}" value="0" step="5"/>
            <input type="range" class="ss-max" min="0" max="${cap}" value="${cap}" step="5"/>
          </div>
          <span class="ssr-val"><b class="ssv-min">0</b>–<b class="ssv-max">${cap}</b></span>
        </div>`).join("")}
    </div>`;

  // recent panel + toggle button
  const recentBtn = document.createElement("button");
  recentBtn.className = "recent-fab";
  recentBtn.id = "recentFab";
  recentBtn.innerHTML = `🕘 <span class="recent-badge" id="recentBadge">0</span>`;
  recentBtn.title = "Vistos recientemente";
  const recentPanel = document.createElement("aside");
  recentPanel.className = "recent-panel";
  recentPanel.id = "recentPanel";
  recentPanel.innerHTML = `
    <div class="recent-head">
      <span>🕘 VISTOS RECIENTEMENTE</span>
      <button class="recent-close" id="recentClose">✕</button>
    </div>
    <div class="recent-list" id="recentList"></div>`;
  document.querySelector(".app-root").appendChild(recentBtn);
  document.querySelector(".app-root").appendChild(recentPanel);

  // panel de datos (exportar / importar)
  const dataOv = document.createElement("div");
  dataOv.className = "help-overlay hidden";
  dataOv.id = "dataOverlay";
  dataOv.innerHTML = `
    <div class="help-card" role="dialog" aria-modal="true" aria-label="Tus datos">
      <button class="help-close" id="dataClose">✕</button>
      <h3 class="help-title">⇄ TUS DATOS</h3>
      <p class="data-desc">
        Todo lo tuyo (favoritos, capturados, notas, equipo, récord del quiz) vive
        solo en este navegador. Expórtalo para no perderlo o llevarlo a otro sitio.
      </p>
      <div class="data-actions">
        <button class="data-btn" id="dataExport">⬇ Exportar a archivo</button>
        <button class="data-btn" id="dataImportBtn">⬆ Importar archivo</button>
        <input type="file" id="dataImportFile" accept="application/json,.json" hidden />
      </div>
      <div class="data-status" id="dataStatus"></div>
    </div>`;
  document.body.appendChild(dataOv);

  // help overlay
  const help = document.createElement("div");
  help.className = "help-overlay hidden";
  help.id = "helpOverlay";
  help.innerHTML = `
    <div class="help-card" role="dialog" aria-modal="true" aria-label="Atajos de teclado">
      <button class="help-close" id="helpClose">✕</button>
      <h3 class="help-title">⌨ ATAJOS DE TECLADO</h3>
      <div class="help-grid">
        <div><kbd>←</kbd> <kbd>→</kbd></div><span>Navegar Pokémon</span>
        <div><kbd>↑</kbd> <kbd>↓</kbd></div><span>Saltar de 10 en 10</span>
        <div><kbd>Inicio</kbd> <kbd>Fin</kbd></div><span>Primero / último</span>
        <div><kbd>R</kbd></div><span>Aleatorio</span>
        <div><kbd>C</kbd></div><span>Reproducir grito</span>
        <div><kbd>S</kbd></div><span>Variante shiny</span>
        <div><kbd>A</kbd></div><span>Sprite animado</span>
        <div><kbd>M</kbd></div><span>Música ambiente</span>
        <div><kbd>F</kbd></div><span>Marcar favorito ★</span>
        <div><kbd>G</kbd></div><span>Marcar capturado ◉</span>
        <div><kbd>L</kbd></div><span>Vista lista / carrusel</span>
        <div><kbd>/</kbd></div><span>Buscar en la lista</span>
        <div><kbd>Ctrl</kbd> <kbd>K</kbd></div><span>Buscador rápido (todo)</span>
        <div><kbd>?</kbd></div><span>Esta ayuda</span>
      </div>
    </div>`;
  document.body.appendChild(help);

  // stage tools: favorito + capturado
  const tools = document.querySelector(".stage-tools");
  if (tools) {
    const favBtn = document.createElement("button");
    favBtn.className = "stage-tool"; favBtn.id = "favBtn";
    favBtn.title = "Favorito (F)";
    favBtn.innerHTML = `<span class="st-icon">★</span><span class="st-label">FAV</span>`;
    favBtn.addEventListener("click", pdexToggleFav);
    const linkBtn = document.createElement("button");
    linkBtn.className = "stage-tool"; linkBtn.id = "linkBtn";
    linkBtn.title = "Copiar enlace a este Pokémon";
    linkBtn.innerHTML = `<span class="st-icon">🔗</span><span class="st-label">ENLACE</span>`;
    linkBtn.addEventListener("click", copyShareLink);
    tools.appendChild(linkBtn);
    const caughtBtn = document.createElement("button");
    caughtBtn.className = "stage-tool"; caughtBtn.id = "caughtBtn";
    caughtBtn.title = "Capturado (G)";
    caughtBtn.innerHTML = `<span class="st-icon">◉</span><span class="st-label">TENGO</span>`;
    caughtBtn.addEventListener("click", pdexToggleCaught);
    tools.appendChild(favBtn);
    tools.appendChild(caughtBtn);
  }
}
function pdexSyncGenTabs() {
  const val = state.region;
  document.querySelectorAll(".gen-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.region === val));
}

function pdexBindControls() {
  $("filterType2").addEventListener("change", () => applyFilters({ resetIndex: true }));
  $("chipFav").addEventListener("click", () => {
    pdexUI.favOnly = !pdexUI.favOnly;
    $("chipFav").classList.toggle("on", pdexUI.favOnly);
    applyFilters({ resetIndex: true });
  });
  $("chipCaught").addEventListener("click", () => {
    pdexUI.caughtOnly = !pdexUI.caughtOnly;
    $("chipCaught").classList.toggle("on", pdexUI.caughtOnly);
    applyFilters({ resetIndex: true });
  });
  $("chipStats").addEventListener("click", () => {
    const panel = $("statFilterPanel");
    const nowHidden = panel.classList.toggle("hidden");
    $("chipStats").classList.toggle("on", !nowHidden);
    // Re-filter on both show and hide so the list never keeps a stale stat filter.
    applyFilters({ resetIndex: true });
  });
  $("chipView").addEventListener("click", pdexToggleView);
  $("chipHelp").addEventListener("click", pdexToggleHelp);
  $("chipData").addEventListener("click", () => {
    const ov = $("dataOverlay");
    if (ov.classList.contains("hidden")) openDialog(ov, $("dataExport"));
    else closeDialog(ov);
  });
  $("dataClose").addEventListener("click", () => closeDialog($("dataOverlay")));
  $("dataOverlay").addEventListener("click", e => {
    if (e.target === $("dataOverlay")) closeDialog($("dataOverlay"));
  });
  $("dataExport").addEventListener("click", exportData);
  $("dataImportBtn").addEventListener("click", () => $("dataImportFile").click());
  $("dataImportFile").addEventListener("change", e => {
    const f = e.target.files?.[0];
    if (f) importData(f);
    e.target.value = "";                      // permite reimportar el mismo archivo
  });

  // Época (modo generación)
  $("filterGen").addEventListener("change", async e => {
    const g = parseInt(e.target.value, 10);
    const sel = e.target;
    if (g < CURRENT_GEN) {
      sel.disabled = true;
      const ok = await ensureTypeInfo();
      sel.disabled = false;
      if (!ok) {
        sel.value = String(state.gen);
        alert("No se pudo cargar la tabla de tipos histórica. Revisa tu conexión.");
        return;
      }
    }
    state.gen   = g;
    activeChart = chartForGeneration(g);
    document.body.classList.toggle("retro-gen", g < CURRENT_GEN);
    loadCenterDetail();                       // repinta la ficha con las nuevas reglas
    if (TOOL_INITED.team && teamState.members.length) renderTeamAnalysis();
    if (TOOL_INITED.duel && duelState.A && duelState.B) runBattle();
  });

  // stat panel controls
  const panel = $("statFilterPanel");
  $("statLoadBtn").addEventListener("click", () => {
    $("statLoadBtn").disabled = true;
    $("statLoadStatus").textContent = "Cargando datos de stats…";
    pdexLoadAllStats();
  });
  panel.querySelectorAll(".stat-slider-row").forEach(row => {
    const min = row.querySelector(".ss-min"), max = row.querySelector(".ss-max");
    const vMin = row.querySelector(".ssv-min"), vMax = row.querySelector(".ssv-max");
    const upd = () => {
      let a = parseInt(min.value, 10), b = parseInt(max.value, 10);
      if (a > b) { if (document.activeElement === min) max.value = a, b = a; else min.value = b, a = b; }
      vMin.textContent = a; vMax.textContent = b;
    };
    const commit = () => { upd(); if (state.statAllLoaded) applyFilters({ resetIndex: true }); };
    min.addEventListener("input", upd); max.addEventListener("input", upd);
    min.addEventListener("change", commit); max.addEventListener("change", commit);
  });
  panel.querySelectorAll(".sfp-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const setRow = (key, mn, mx) => {
        const r = panel.querySelector(`.stat-slider-row[data-key="${key}"]`);
        if (!r) return;
        const cap = parseInt(r.dataset.cap, 10);
        r.querySelector(".ss-min").value = mn;
        r.querySelector(".ss-max").value = mx == null ? cap : mx;
        r.querySelector(".ssv-min").textContent = mn;
        r.querySelector(".ssv-max").textContent = mx == null ? cap : mx;
      };
      const reset = () => STAT_ORDER.concat("bst").forEach(k => setRow(k, 0, null));
      reset();
      const p = btn.dataset.preset;
      if (p === "fast")   setRow("speed", 100, null);
      if (p === "strong") setRow("bst", 500, null);
      if (p === "weak")   setRow("bst", 0, 320);
      if (!state.statAllLoaded && !state._statLoading) { $("statLoadBtn").click(); }
      else if (state.statAllLoaded) applyFilters({ resetIndex: true });
    });
  });

  // recent + help wiring
  $("recentFab").addEventListener("click", pdexOpenRecent);
  $("recentClose").addEventListener("click", pdexCloseRecent);
  $("helpClose").addEventListener("click", pdexToggleHelp);
  $("helpOverlay").addEventListener("click", e => { if (e.target === $("helpOverlay")) pdexToggleHelp(); });

  // notes (autosave, debounced)
  const note = $("pokeNote");
  if (note) {
    let noteTimer = null;
    note.addEventListener("input", () => {
      const id = parseInt(note.dataset.id, 10);
      if (!id) return;
      if (noteTimer) clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        const v = note.value.trim();
        if (v) PDEX.notes[id] = v; else delete PDEX.notes[id];
        pdexSave("notes");
        const cur = state.filtered[state.current];
        if (cur) pdexRefreshCompactRow(cur.id);
      }, 400);
    });
  }
}

function pdexInit() {
  pdexLoad();
  // Antes que pdexBuildControls: el 2.º tipo clona las opciones de filterType
  fillTypeSelect(filterType, "Todos");
  fillTypeSelect($("rouType"), "Cualquiera");
  const gsel = $("filterGen");
  if (gsel) {
    gsel.innerHTML = [9,8,7,6,5,4,3,2,1]
      .map(g => `<option value="${g}">${genOptionLabel(g)}</option>`).join("");
  }
  pdexBuildControls();
  buildPalette();
  pdexBindControls();
  pdexSyncGenTabs();
  pdexRenderProgress();
  pdexRenderRecent();
}

// ════════════════════════════════════════════════════════
//  ENLACES COMPARTIBLES  +  EXPORTAR / IMPORTAR
// ════════════════════════════════════════════════════════
const MODE_ROUTES = { pokedex:"pokedex", quiz:"quiz", duel:"batalla", team:"equipo", roulette:"ruleta" };
const ROUTE_MODES = Object.fromEntries(Object.entries(MODE_ROUTES).map(([m, r]) => [r, m]));

function currentRoute() {
  if (state.mode === "pokedex") {
    const cur = state.filtered[state.current];
    return cur ? `#/pokemon/${cur.id}` : "#/pokedex";
  }
  if (state.mode === "team" && teamState.members.length) {
    return `#/equipo/${teamState.members.map(m => m.id).join(",")}`;
  }
  return `#/${MODE_ROUTES[state.mode] || "pokedex"}`;
}
// replaceState y no push: navegar por el carrusel no debe llenar el historial
function syncHash() {
  const route = currentRoute();
  if (location.hash !== route) history.replaceState(null, "", route);
}

let applyingRoute = false;
async function applyRoute(hash) {
  if (applyingRoute) return;
  applyingRoute = true;
  try {
    const parts = String(hash || "").replace(/^#\/?/, "").split("/");
    const head  = parts[0] || "";
    if (head === "pokemon" && parts[1]) {
      if (state.mode !== "pokedex") await switchMode("pokedex");
      const id = parseInt(parts[1], 10);
      if (Number.isFinite(id)) jumpToId(id);
      return;
    }
    if (head === "equipo") {
      if (parts[1]) {
        const ids = parts[1].split(",").map(n => parseInt(n, 10))
                      .filter(Number.isFinite).slice(0, 6);
        const arr = (await Promise.all(ids.map(id => fetchPokemonByName(id).catch(() => null))))
                      .filter(Boolean);
        if (arr.length) { teamState.members = arr; saveTeam(); }
      }
      await switchMode("team");
      renderTeamSlots(); renderTeamAnalysis();
      return;
    }
    if (ROUTE_MODES[head]) await switchMode(ROUTE_MODES[head]);
  } finally { applyingRoute = false; }
}
window.addEventListener("hashchange", () => applyRoute(location.hash));

function toast(msg) {
  let el = $("toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast"; el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

async function copyShareLink() {
  syncHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast("Enlace copiado ✓");
  } catch {
    window.prompt("Copia el enlace:", url);   // sin permiso de portapapeles
  }
}

// ── Exportar / importar el Pokédex personal ──────────────
const DATA_VERSION = 1;
function buildExport() {
  let quizBest = 0;
  try { quizBest = parseInt(localStorage.getItem("pokequiz_best") || "0", 10) || 0; } catch {}
  return {
    app: "pokedex", version: DATA_VERSION, exportedAt: new Date().toISOString(),
    favs:   [...PDEX.favs],
    caught: [...PDEX.caught],
    notes:  PDEX.notes,
    recent: PDEX.recent,
    team:   teamState.members.map(m => m.id),
    quizBest,
  };
}

function exportData() {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `pokedex-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const st = $("dataStatus");
  if (st) st.textContent = `✓ Exportados ${PDEX.caught.size} capturados y ${PDEX.favs.size} favoritos.`;
}

async function importData(file) {
  const st   = $("dataStatus");
  const fail = msg => { if (st) st.innerHTML = `<span class="data-err">✕ ${msg}</span>`; };
  let json;
  try { json = JSON.parse(await file.text()); }
  catch { return fail("El archivo no es un JSON válido."); }
  if (!json || json.app !== "pokedex" || !Array.isArray(json.favs) || !Array.isArray(json.caught)) {
    return fail("No parece un archivo exportado desde esta Pokédex.");
  }
  const nums = a => (Array.isArray(a) ? a : []).map(Number).filter(Number.isFinite);

  PDEX.favs   = new Set(nums(json.favs));
  PDEX.caught = new Set(nums(json.caught));
  PDEX.notes  = (json.notes && typeof json.notes === "object") ? json.notes : {};
  PDEX.recent = nums(json.recent).slice(0, 10);
  ["favs", "caught", "notes", "recent"].forEach(pdexSave);

  if (Number.isFinite(json.quizBest)) {
    try { localStorage.setItem("pokequiz_best", String(json.quizBest)); } catch {}
    quizState.score.best = json.quizBest;
    const qb = $("quizBest"); if (qb) qb.textContent = json.quizBest;
  }
  const teamIds = nums(json.team).slice(0, 6);
  if (teamIds.length) {
    const arr = (await Promise.all(teamIds.map(id => fetchPokemonByName(id).catch(() => null)))).filter(Boolean);
    if (arr.length) {
      teamState.members = arr; saveTeam();
      if (TOOL_INITED.team) { renderTeamSlots(); renderTeamAnalysis(); }
    }
  }
  pdexRenderProgress();
  pdexRenderRecent();
  const cur = state.filtered[state.current];
  if (cur) pdexUpdateForCurrent(cur);
  await applyFilters({ resetIndex: false });
  const nNotas = Object.keys(PDEX.notes).length;
  if (st) st.textContent = `✓ Importados ${PDEX.caught.size} capturados, `
        + `${PDEX.favs.size} favoritos y ${nNotas} ${nNotas === 1 ? "nota" : "notas"}.`;
}

// ════════════════════════════════════════════════════════
//  PALETA DE COMANDOS  (Ctrl / Cmd + K)
//  Buscador único sobre Pokémon, movimientos, habilidades y acciones.
//  Reutiliza fuzzyScore, que ya tolera erratas.
// ════════════════════════════════════════════════════════
const PALETTE_MAX = 12;
const paletteIndex = { moves: null, abilities: null };
let paletteResults = [], paletteSel = 0, paletteTimer = null;

function paletteActions() {
  return [
    { grupo:"Ir a",   icono:"📖", texto:"Pokédex",                 run:() => switchMode("pokedex") },
    { grupo:"Ir a",   icono:"❓", texto:"Quién es ese Pokémon",     run:() => switchMode("quiz") },
    { grupo:"Ir a",   icono:"⚔️", texto:"Simulador de batalla",     run:() => switchMode("duel") },
    { grupo:"Ir a",   icono:"🛡️", texto:"Constructor de equipo",    run:() => switchMode("team") },
    { grupo:"Ir a",   icono:"🎲", texto:"Ruleta",                   run:() => switchMode("roulette") },
    { grupo:"Acción", icono:"⌬",  texto:"Pokémon aleatorio",        run:() => { switchMode("pokedex"); navigateRandom(); } },
    { grupo:"Acción", icono:"✦",  texto:"Alternar shiny",           run:toggleShiny },
    { grupo:"Acción", icono:"▶",  texto:"Alternar sprite animado",  run:toggleAnimated },
    { grupo:"Acción", icono:"♪",  texto:"Alternar música",          run:toggleMusic },
    { grupo:"Acción", icono:"🔊", texto:"Reproducir grito",         run:playCurrentCry },
    { grupo:"Acción", icono:"🔗", texto:"Copiar enlace",            run:copyShareLink },
    { grupo:"Acción", icono:"⇄",  texto:"Exportar o importar datos", run:() => openDialog($("dataOverlay"), $("dataExport")) },
    { grupo:"Acción", icono:"⌨",  texto:"Atajos de teclado",        run:pdexToggleHelp },
  ];
}

async function ensurePaletteIndex() {
  if (paletteIndex.moves && paletteIndex.abilities) return;
  try {
    const [mv, ab] = await Promise.all([
      apiFetch("https://pokeapi.co/api/v2/move?limit=2000"),
      apiFetch("https://pokeapi.co/api/v2/ability?limit=1000"),
    ]);
    paletteIndex.moves     = mv.results.map(r => r.name);
    paletteIndex.abilities = ab.results.map(r => r.name);
  } catch {
    paletteIndex.moves     = paletteIndex.moves     || [];
    paletteIndex.abilities = paletteIndex.abilities || [];
  }
}

function paletteSearch(q) {
  if (!q) return paletteActions().slice(0, PALETTE_MAX);
  const scored = [];
  // El sesgo por grupo hace que, a igual parecido, mande el Pokémon:
  // es una Pokédex, es lo que se busca el 90% de las veces.
  state.allPokemon.forEach(p => {
    const s = fuzzyScore(q, p.name);
    if (s >= 0) scored.push({ s: s + 60, grupo:"Pokémon", id:p.id,
      texto: cap(p.name), sub: "#" + padId(p.id),
      run: () => { switchMode("pokedex"); jumpToId(p.id); } });
  });
  paletteActions().forEach(a => {
    const s = fuzzyScore(q, a.texto.toLowerCase());
    if (s >= 0) scored.push({ ...a, s: s + 30 });
  });
  (paletteIndex.moves || []).forEach(n => {
    const s = fuzzyScore(q, n);
    if (s >= 0) scored.push({ s, grupo:"Movimiento", icono:"⚔",
      texto: prettyName(n), run: () => openMoveModal(n) });
  });
  (paletteIndex.abilities || []).forEach(n => {
    const s = fuzzyScore(q, n);
    if (s >= 0) scored.push({ s, grupo:"Habilidad", icono:"✧",
      texto: prettyName(n), run: () => openAbilityModal(n) });
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, PALETTE_MAX);
}

function renderPalette() {
  const list = $("paletteList");
  if (paletteResults.length === 0) {
    list.innerHTML = '<div class="pal-empty">Sin resultados</div>';
    return;
  }
  list.innerHTML = paletteResults.map((r, i) => `
    <button class="pal-row${i === paletteSel ? " sel" : ""}" data-i="${i}">
      ${r.grupo === "Pokémon"
        ? `<img class="pal-sprite" src="${spriteFor(r.id)}" alt="" loading="lazy"/>`
        : `<span class="pal-icon">${r.icono || "•"}</span>`}
      <span class="pal-text">${r.texto}</span>
      ${r.sub ? `<span class="pal-sub">${r.sub}</span>` : ""}
      <span class="pal-group">${r.grupo}</span>
    </button>`).join("");
  list.querySelectorAll(".pal-row").forEach(b => {
    b.addEventListener("mouseenter", () => {
      paletteSel = parseInt(b.dataset.i, 10);
      list.querySelectorAll(".pal-row").forEach((x, i) => x.classList.toggle("sel", i === paletteSel));
    });
    b.addEventListener("click", () => runPalette(parseInt(b.dataset.i, 10)));
  });
  const sel = list.querySelector(".pal-row.sel");
  if (sel) sel.scrollIntoView({ block: "nearest" });
}

function refreshPalette() {
  paletteResults = paletteSearch($("paletteInput").value.trim().toLowerCase());
  paletteSel = 0;
  renderPalette();
}

function runPalette(i) {
  const r = paletteResults[i];
  if (!r) return;
  closePalette();
  r.run();
}

function openPalette() {
  const ov = $("paletteOverlay");
  lastFocused = document.activeElement;
  ov.classList.remove("hidden");
  const inp = $("paletteInput");
  inp.value = "";
  refreshPalette();
  inp.focus();
  ensurePaletteIndex().then(() => {
    // El índice llega después: si sigue abierta y hay texto, repintamos
    if (!ov.classList.contains("hidden") && inp.value.trim()) refreshPalette();
  });
}
function closePalette() {
  $("paletteOverlay").classList.add("hidden");
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}
function togglePalette() {
  const ov = $("paletteOverlay");
  if (!ov) return;
  if (ov.classList.contains("hidden")) openPalette(); else closePalette();
}

function handlePaletteKeys(e) {
  if (e.key === "Escape")      { e.preventDefault(); closePalette(); return; }
  if (e.key === "ArrowDown")   { e.preventDefault(); paletteSel = Math.min(paletteSel + 1, paletteResults.length - 1); renderPalette(); return; }
  if (e.key === "ArrowUp")     { e.preventDefault(); paletteSel = Math.max(paletteSel - 1, 0); renderPalette(); return; }
  if (e.key === "Enter")       { e.preventDefault(); runPalette(paletteSel); return; }
  if (e.key === "Tab")         { trapFocus($("paletteOverlay").querySelector(".pal-card"), e); }
}

function buildPalette() {
  const ov = document.createElement("div");
  ov.className = "palette-overlay hidden";
  ov.id = "paletteOverlay";
  ov.innerHTML = `
    <div class="pal-card" role="dialog" aria-modal="true" aria-label="Buscador rápido">
      <div class="pal-input-row">
        <span class="pal-prompt">⌕</span>
        <input class="pal-input" id="paletteInput" autocomplete="off" spellcheck="false"
               placeholder="Busca un Pokémon, movimiento, habilidad o acción…"/>
        <kbd class="pal-esc">Esc</kbd>
      </div>
      <div class="pal-list" id="paletteList"></div>
      <div class="pal-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> moverse</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Ctrl</kbd>+<kbd>K</kbd> abrir o cerrar</span>
      </div>
    </div>`;
  document.body.appendChild(ov);
  $("paletteInput").addEventListener("input", () => {
    if (paletteTimer) clearTimeout(paletteTimer);
    paletteTimer = setTimeout(refreshPalette, 90);
  });
  ov.addEventListener("click", e => { if (e.target === ov) closePalette(); });
}

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
const yearEl = $("footerYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

pdexInit();
loadCatalog();

// Service worker: caché offline (solo sobre http/https, no en file://)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}


// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//   INTERACTIVE  TOOLS  /  MODES
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════

const TOOL_INITED = {};

async function switchMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-tab").forEach(t => {
    const on = t.dataset.mode === mode;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  const ids = {
    pokedex:"modePokedex", quiz:"modeQuiz", duel:"modeDuel",
    team:"modeTeam", roulette:"modeRoulette",
  };
  Object.entries(ids).forEach(([m, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", m !== mode);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  syncHash();

  // Lazy init — pero nunca antes de tener el catálogo cargado
  if (mode !== "pokedex") {
    const ok = await catalogReady;
    if (!ok) return;
    if (state.mode !== mode) return;   // el usuario cambió de modo mientras esperaba
  }
  if (mode === "quiz"     && !TOOL_INITED.quiz)     initQuiz();
  if (mode === "duel"     && !TOOL_INITED.duel)     initDuel();
  if (mode === "team"     && !TOOL_INITED.team)     initTeam();
  if (mode === "roulette" && !TOOL_INITED.roulette) initRoulette();
}
document.querySelectorAll(".mode-tab").forEach(tab => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

// ════════════════════════════════════════════════════════
//  SHARED  POKEMON  PICKER
// ════════════════════════════════════════════════════════
function buildPicker(container, onSelect, opts = {}) {
  container.innerHTML = `
    <input class="pkm-picker-input" placeholder="${opts.placeholder || 'Pikachu, 25...'}" autocomplete="off"/>
    <div class="pkm-picker-dropdown hidden"></div>`;
  const input = container.querySelector(".pkm-picker-input");
  const dropdown = container.querySelector(".pkm-picker-dropdown");

  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { dropdown.classList.add("hidden"); return; }
    const numQ = /^\d+$/.test(q) ? parseInt(q, 10) : null;
    const matches = state.allPokemon.filter(p =>
      numQ ? p.id === numQ : p.name.includes(q)
    ).slice(0, 8);
    if (matches.length === 0) { dropdown.classList.add("hidden"); return; }
    dropdown.innerHTML = matches.map(p => `
      <div class="pkm-suggestion" data-id="${p.id}">
        <img src="${spriteFor(p.id)}" alt="" loading="lazy"/>
        <div class="pkm-suggestion-text">
          <span class="pkm-suggestion-num">#${padId(p.id)}</span>
          <span class="pkm-suggestion-name">${p.name}</span>
        </div>
      </div>`).join("");
    dropdown.classList.remove("hidden");
    dropdown.querySelectorAll(".pkm-suggestion").forEach(el => {
      el.addEventListener("mousedown", async () => {
        const id = parseInt(el.dataset.id, 10);
        try {
          const data = await fetchPokemonByName(id);
          input.value = data.name;
          dropdown.classList.add("hidden");
          onSelect(data);
        } catch {}
      });
    });
  };
  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("blur", () => {
    setTimeout(() => dropdown.classList.add("hidden"), 200);
  });
  return {
    setValue: name => { input.value = name; },
    clear: () => { input.value = ""; dropdown.classList.add("hidden"); }
  };
}

// ════════════════════════════════════════════════════════
//  TOOL 1:  ¿QUIÉN ES ESE POKÉMON?
// ════════════════════════════════════════════════════════
const QUIZ_MODES = {
  silueta:     { label: "🖼 Silueta",      hint: "¿Quién es ese Pokémon?" },
  grito:       { label: "🔊 Grito",        hint: "¿De quién es este grito?" },
  descripcion: { label: "📖 Descripción",  hint: "¿De quién habla esta entrada?" },
  stats:       { label: "📊 Estadísticas", hint: "¿A quién pertenecen estos datos?" },
};
const QUIZ_SECONDS = 10;

const quizState = {
  answer: null,
  options: [],
  done: false,
  mode: "silueta",
  timed: false,
  timer: null, deadline: 0, raf: null,
  score: { correct: 0, total: 0, streak: 0, best: 0 },
};

function initQuiz() {
  TOOL_INITED.quiz = true;

  $("quizMode").innerHTML = Object.entries(QUIZ_MODES)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");

  // Restore best from localStorage
  try {
    const saved = localStorage.getItem("pokequiz_best");
    if (saved) quizState.score.best = parseInt(saved, 10) || 0;
  } catch {}
  $("quizBest").textContent = quizState.score.best;

  $("quizNext").addEventListener("click", newQuizRound);
  $("quizDifficulty").addEventListener("change", newQuizRound);
  $("quizMode").addEventListener("change", e => {
    quizState.mode = e.target.value;
    newQuizRound();
  });
  $("quizTimed").addEventListener("change", e => {
    quizState.timed = e.target.checked;
    newQuizRound();
  });
  newQuizRound();
}

// ── Temporizador del modo contrarreloj ───────────────────
function stopQuizTimer() {
  if (quizState.timer) { clearTimeout(quizState.timer); quizState.timer = null; }
  if (quizState.raf)   { cancelAnimationFrame(quizState.raf); quizState.raf = null; }
  $("quizTimer").classList.add("hidden");
}
function startQuizTimer() {
  stopQuizTimer();
  if (!quizState.timed) return;
  const bar = $("quizTimerFill");
  $("quizTimer").classList.remove("hidden");
  quizState.deadline = performance.now() + QUIZ_SECONDS * 1000;
  const tick = () => {
    const left = Math.max(0, quizState.deadline - performance.now());
    bar.style.width = (left / (QUIZ_SECONDS * 1000) * 100) + "%";
    bar.classList.toggle("urgent", left < 3000);
    if (left > 0 && !quizState.done) quizState.raf = requestAnimationFrame(tick);
  };
  tick();
  // Se acabó el tiempo: cuenta como fallo
  quizState.timer = setTimeout(() => { if (!quizState.done) answerQuiz(null); },
                               QUIZ_SECONDS * 1000);
}

function quizPool() {
  const diff = $("quizDifficulty").value;
  if (diff === "kanto") return state.allPokemon.filter(p => p.id <= 151);
  if (diff === "gen5")  return state.allPokemon.filter(p => p.id <= 649);
  return state.allPokemon;
}

async function newQuizRound() {
  stopQuizTimer();
  quizState.done = false;
  $("quizNext").classList.add("hidden");
  $("quizPrompt").className = "quiz-prompt";
  $("quizPrompt").textContent = QUIZ_MODES[quizState.mode]?.hint || "¿Quién es ese Pokémon?";
  $("quizSilhouette").classList.remove("revealed");

  const pool = quizPool();
  if (pool.length < 4) return;
  const target = pool[Math.floor(Math.random() * pool.length)];
  quizState.answer = target;

  // 3 distractors
  const distractors = new Set();
  while (distractors.size < 3) {
    const d = pool[Math.floor(Math.random() * pool.length)];
    if (d.id !== target.id) distractors.add(d);
  }
  quizState.options = [target, ...distractors].sort(() => Math.random() - 0.5);

  // Set silhouette image — clear src first and force a reflow so the
  // brightness(0) filter is committed before the new sprite paints.
  const qImg = $("quizImg");
  qImg.removeAttribute("src");
  void $("quizSilhouette").offsetWidth;   // reflow → guarantees non-revealed state is applied
  qImg.alt = target.name;
  qImg.src = spriteFor(target.id);

  // Render options
  const opts = $("quizOptions");
  opts.innerHTML = "";
  quizState.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    btn.textContent = opt.name;
    btn.addEventListener("click", () => answerQuiz(opt));
    opts.appendChild(btn);
  });

  const seq = ++quizRoundSeq;
  await renderQuizHint(target, seq);
  if (seq === quizRoundSeq && !quizState.done) startQuizTimer();
}

// Las pistas de grito/descripción/stats necesitan una petición; si el usuario
// pasa de ronda antes de que llegue, esta secuencia descarta la respuesta vieja.
let quizRoundSeq = 0;

async function renderQuizHint(target, seq) {
  const alt  = $("quizAlt");
  const sil  = $("quizSilhouette");
  const mode = quizState.mode;

  // La silueta solo se ve en su modo; en el resto se revela al responder
  sil.classList.toggle("hidden", mode !== "silueta");
  alt.classList.toggle("hidden", mode === "silueta");
  if (mode === "silueta") { alt.innerHTML = ""; return; }

  alt.innerHTML = '<div class="quiz-alt-loading">Cargando pista…</div>';

  try {
    if (mode === "grito") {
      const data = await fetchPokemonByName(target.id);
      if (seq !== quizRoundSeq) return;
      const url = data.cries?.latest || data.cries?.legacy;
      if (!url) { alt.innerHTML = '<div class="quiz-alt-loading">Sin grito disponible.</div>'; return; }
      alt.innerHTML = `<button class="quiz-cry" id="quizCryBtn">🔊<span>REPRODUCIR</span></button>`;
      const play = () => {
        if (quizCryAudio) { quizCryAudio.pause(); }
        quizCryAudio = new Audio(url);
        quizCryAudio.volume = 0.35;
        quizCryAudio.play().catch(() => {});
      };
      $("quizCryBtn").addEventListener("click", play);
      play();   // suena una vez al empezar la ronda

    } else if (mode === "descripcion") {
      const data = await fetchPokemonByName(target.id);
      const sd   = await apiFetch(data.species.url);
      if (seq !== quizRoundSeq) return;
      let ents = sd.flavor_text_entries.filter(e => e.language.name === "es");
      if (ents.length === 0) ents = sd.flavor_text_entries.filter(e => e.language.name === "en");
      if (ents.length === 0) { alt.innerHTML = '<div class="quiz-alt-loading">Sin entrada disponible.</div>'; return; }
      const pick = ents[Math.floor(Math.random() * ents.length)];
      // Algunas entradas nombran al propio Pokémon: hay que taparlo
      const oculto = pick.flavor_text.replace(/[\n\f\r]+/g, " ")
        .replace(new RegExp(target.name, "gi"), "???")
        .replace(new RegExp(sd.name, "gi"), "???");
      alt.innerHTML = `
        <div class="quiz-desc">
          <span class="quiz-desc-ver">${prettyVersion(pick.version.name)}</span>
          <p>${oculto}</p>
        </div>`;

    } else if (mode === "stats") {
      let rec = state.statIndex[target.id];
      if (!rec) {
        const data = await fetchPokemonByName(target.id);
        pdexIndexStats(data);
        rec = state.statIndex[target.id];
      }
      if (seq !== quizRoundSeq) return;
      alt.innerHTML = `
        <div class="quiz-stats">
          ${STAT_ORDER.map(k => `
            <div class="qs-row">
              <span class="qs-name">${STAT_NAMES[k]}</span>
              <div class="qs-bar"><div class="qs-fill ${STAT_CLASS[k]}"
                   style="width:${Math.min(100, (rec[k] / 255) * 100)}%"></div></div>
              <span class="qs-num">${rec[k]}</span>
            </div>`).join("")}
          <div class="qs-bst">TOTAL <b>${rec.bst}</b></div>
        </div>`;
    }
  } catch {
    if (seq === quizRoundSeq) {
      alt.innerHTML = '<div class="quiz-alt-loading">No se pudo cargar la pista.</div>';
    }
  }
}
let quizCryAudio = null;

// picked === null → se acabó el tiempo en modo contrarreloj
function answerQuiz(picked) {
  if (quizState.done) return;
  quizState.done = true;
  stopQuizTimer();
  const correct = !!picked && picked.id === quizState.answer.id;
  quizState.score.total++;
  if (correct) {
    quizState.score.correct++;
    quizState.score.streak++;
    if (quizState.score.streak > quizState.score.best) {
      quizState.score.best = quizState.score.streak;
      try { localStorage.setItem("pokequiz_best", String(quizState.score.best)); } catch {}
    }
  } else {
    quizState.score.streak = 0;
  }
  // Update HUD
  $("quizCorrect").textContent = quizState.score.correct;
  $("quizTotal").textContent   = quizState.score.total;
  $("quizStreak").textContent  = quizState.score.streak;
  $("quizBest").textContent    = quizState.score.best;

  // Al responder siempre se enseña el Pokémon, en cualquier modalidad
  const sil = $("quizSilhouette");
  sil.classList.remove("hidden");
  sil.classList.add("revealed");
  $("quizAlt").classList.add("hidden");

  // Mark options
  document.querySelectorAll(".quiz-opt").forEach(b => {
    b.disabled = true;
    if (b.textContent === quizState.answer.name) b.classList.add("correct");
    else if (picked && b.textContent === picked.name) b.classList.add("wrong");
  });

  // Prompt
  const prompt = $("quizPrompt");
  if (correct) {
    prompt.textContent = `✓  ¡Es ${quizState.answer.name.toUpperCase()}!`;
    prompt.className = "quiz-prompt correct";
  } else if (!picked) {
    prompt.textContent = `⏱  ¡Tiempo! Era ${quizState.answer.name.toUpperCase()}`;
    prompt.className = "quiz-prompt wrong";
  } else {
    prompt.textContent = `✗  Era ${quizState.answer.name.toUpperCase()}`;
    prompt.className = "quiz-prompt wrong";
  }

  $("quizNext").classList.remove("hidden");
}

// ════════════════════════════════════════════════════════
//  TOOL 2:  SIMULADOR DE BATALLA  (Duelo + Daño fusionados)
// ════════════════════════════════════════════════════════
const duelState = {
  A: null, B: null,
  level: 50,
  moveA: null, moveB: null,
  weather: "", crit: false,
  cfg: {
    A: { nature: "hardy", ivs: 31, evs: {}, item: "", status: "" },
    B: { nature: "hardy", ivs: 31, evs: {}, item: "", status: "" },
  },
};
const EV_MAX_TOTAL = 510, EV_MAX_STAT = 252;

function buildDuelConfig(side) {
  const host = $("duelCfg" + side);
  if (!host) return;
  const natOpts = (NATURES || []).map(n => {
    const detail = n.up && n.down && n.up !== n.down
      ? ` (+${STAT_NAMES[n.up] || n.up} / −${STAT_NAMES[n.down] || n.down})`
      : " (neutra)";
    return `<option value="${n.name}">${n.es}${detail}</option>`;
  }).join("");
  host.innerHTML = `
    <div class="dcfg-grid">
      <label class="dcfg-f">NATURALEZA<select class="dcfg-sel dcfg-nature">${natOpts}</select></label>
      <label class="dcfg-f">OBJETO<select class="dcfg-sel dcfg-item">
        ${Object.entries(BATTLE_ITEMS).map(([k, v]) =>
          `<option value="${k}">${v.label}</option>`).join("")}
      </select></label>
      <label class="dcfg-f">ESTADO<select class="dcfg-sel dcfg-status">
        ${Object.entries(STATUS_OPTS).map(([k, v]) =>
          `<option value="${k}">${v}</option>`).join("")}
      </select></label>
      <label class="dcfg-f">IVs<input type="number" class="dcfg-num dcfg-iv" min="0" max="31" value="31"/></label>
    </div>
    <div class="dcfg-evs">
      <div class="dcfg-evs-head">
        <span>EVs</span>
        <span><b class="dcfg-ev-total">0</b> / ${EV_MAX_TOTAL}</span>
        <button class="dcfg-ev-reset" type="button">↺</button>
      </div>
      <div class="dcfg-ev-grid">
        ${STAT_ORDER.map(k => `
          <label class="dcfg-ev"><span>${STAT_NAMES[k]}</span>
            <input type="number" class="dcfg-num dcfg-ev-in" data-stat="${k}"
                   min="0" max="${EV_MAX_STAT}" step="4" value="0"/>
          </label>`).join("")}
      </div>
    </div>`;

  const cfg = duelState.cfg[side];
  const total = () => STAT_ORDER.reduce((t, k) => t + (cfg.evs[k] || 0), 0);
  const paintTotal = () => {
    const el = host.querySelector(".dcfg-ev-total");
    el.textContent = total();
    el.classList.toggle("over", total() > EV_MAX_TOTAL);
  };

  host.querySelector(".dcfg-nature").addEventListener("change", e => {
    cfg.nature = e.target.value; runBattle();
  });
  host.querySelector(".dcfg-item").addEventListener("change", e => {
    cfg.item = e.target.value; runBattle();
  });
  host.querySelector(".dcfg-status").addEventListener("change", e => {
    cfg.status = e.target.value; runBattle();
  });
  host.querySelector(".dcfg-iv").addEventListener("input", e => {
    cfg.ivs = clamp(parseInt(e.target.value, 10) || 0, 0, 31);
    e.target.value = cfg.ivs; runBattle();
  });
  host.querySelectorAll(".dcfg-ev-in").forEach(inp => {
    inp.addEventListener("input", e => {
      const k = e.target.dataset.stat;
      let v = clamp(parseInt(e.target.value, 10) || 0, 0, EV_MAX_STAT);
      // No dejamos pasar del tope global de 510
      const otros = STAT_ORDER.reduce((t, s) => t + (s === k ? 0 : (cfg.evs[s] || 0)), 0);
      v = Math.min(v, EV_MAX_TOTAL - otros);
      cfg.evs[k] = v; e.target.value = v;
      paintTotal(); runBattle();
    });
  });
  host.querySelector(".dcfg-ev-reset").addEventListener("click", () => {
    cfg.evs = {};
    host.querySelectorAll(".dcfg-ev-in").forEach(i => { i.value = 0; });
    paintTotal(); runBattle();
  });
  paintTotal();
}

async function initDuel() {
  TOOL_INITED.duel = true;
  await ensureNatures();
  buildDuelConfig("A");
  buildDuelConfig("B");
  $("duelWeather").addEventListener("change", e => {
    duelState.weather = e.target.value; runBattle();
  });
  $("duelCrit").addEventListener("change", e => {
    duelState.crit = e.target.checked; runBattle();
  });
  buildPicker($("duelPickerA"), async data => {
    duelState.A = data; duelState.moveA = null;
    renderDuelPreview("A");
    await populateDuelMoves("A", data);
    runBattle();
  });
  buildPicker($("duelPickerB"), async data => {
    duelState.B = data; duelState.moveB = null;
    renderDuelPreview("B");
    await populateDuelMoves("B", data);
    runBattle();
  });
  $("duelLvl").addEventListener("input", e => {
    duelState.level = parseInt(e.target.value, 10);
    $("duelLvlVal").textContent = duelState.level;
    runBattle();
  });
  $("duelMoveA").addEventListener("change", e => onMoveSelect("A", e.target.value));
  $("duelMoveB").addEventListener("change", e => onMoveSelect("B", e.target.value));
}

function renderDuelPreview(side) {
  const data = duelState[side];
  const target = $("duelPreview" + side);
  if (!data) { target.innerHTML = '<span class="duel-empty">Selecciona un Pokémon</span>'; return; }
  target.innerHTML = `
    <img src="${officialArtFor(data.id)}" alt="${data.name}"/>
    <div class="duel-name">${data.name}</div>
    <div class="duel-types">
      ${data.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`).join("")}
    </div>`;
}

async function populateDuelMoves(side, atk) {
  const sel = $("duelMove" + side);
  // Todos los movimientos que aprende, no solo los 30 primeros: en un
  // simulador de combate cortar la lista arbitrariamente no tiene sentido.
  const names = [...new Set(atk.moves.map(m => m.move.name))].sort();
  sel.innerHTML = '<option value="">— Selecciona movimiento —</option>' +
    names.map(n => `<option value="${n}">${prettyName(n)}</option>`).join("");
  $("duelAtkLabel" + side).textContent = `${atk.name.toUpperCase()} → ${duelState[side === "A" ? "B" : "A"]?.name?.toUpperCase() || "..."}`;
}

async function onMoveSelect(side, moveName) {
  if (!moveName) { duelState["move" + side] = null; runBattle(); return; }
  let m;
  try { m = await fetchMove(moveName); } catch { return; }
  duelState["move" + side] = m;
  runBattle();
}

// ════════════════════════════════════════════════════════
//  NATURALEZAS  ·  ESTADÍSTICAS REALES  ·  DAÑO
// ════════════════════════════════════════════════════════
const NATURES_KEY = "natures:v1";
let NATURES = null;   // [{name, es, up, down}]

async function ensureNatures() {
  if (NATURES) return NATURES;
  try {
    const entry = await idbGet(NATURES_KEY);
    let rows;
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
      rows = entry.data;
    } else {
      const query = `query Natures {
        pokemon_v2_nature(order_by: {id: asc}) {
          name
          pokemonV2StatByIncreasedStatId { name }
          pokemon_v2_stat { name }
          pokemon_v2_naturenames(where: {language_id: {_eq: 7}}) { name }
        }
      }`;
      const res = await fetch(GRAPHQL_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error("GraphQL");
      rows = (json.data?.pokemon_v2_nature || []).map(n => ({
        name: n.name,
        es:   n.pokemon_v2_naturenames?.[0]?.name || cap(n.name),
        up:   n.pokemonV2StatByIncreasedStatId?.name || null,
        down: n.pokemon_v2_stat?.name || null,
      }));
      if (rows.length === 0) throw new Error("0 filas");
      idbSet(NATURES_KEY, { ts: Date.now(), data: rows });
    }
    NATURES = rows;
  } catch {
    // Sin naturalezas seguimos funcionando: todas cuentan como neutras
    NATURES = [{ name: "hardy", es: "Fuerte", up: null, down: null }];
  }
  return NATURES;
}

function natureByName(name) {
  return (NATURES || []).find(n => n.name === name) || null;
}
function natureMult(nature, statKey) {
  if (!nature || !nature.up || !nature.down) return 1;
  if (nature.up === nature.down) return 1;          // las cinco neutras
  if (nature.up   === statKey) return 1.1;
  if (nature.down === statKey) return 0.9;
  return 1;
}

// Objetos: la API describe su efecto en prosa, no publica los multiplicadores,
// así que esta tabla es curada a mano a propósito (no sale de PokéAPI).
const BATTLE_ITEMS = {
  "":              { label: "Ninguno" },
  "life-orb":      { label: "Vidasfera (×1.3, 10% retroceso)", mult: 1.3, recoilPct: 10 },
  "choice-band":   { label: "Cinta Elegida (×1.5 Ataque)",     atk: 1.5 },
  "choice-specs":  { label: "Gafas Elegidas (×1.5 At. Esp.)",  spa: 1.5 },
  "expert-belt":   { label: "Cinta Experto (×1.2 si es eficaz)", superMult: 1.2 },
  "muscle-band":   { label: "Cinta Fuerte (×1.1 físico)",      physMult: 1.1 },
  "wise-glasses":  { label: "Gafas Especiales (×1.1 especial)", specMult: 1.1 },
};
const STATUS_OPTS = {
  "":      "Sin estado",
  "burn":  "Quemadura (×0.5 físico)",
  "para":  "Parálisis (×0.5 velocidad)",
};

// Fórmula oficial de estadísticas (gen III+)
function computeStat(base, level, iv, ev, natMult, isHp) {
  const core = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100);
  if (isHp) return core + level + 10;
  return Math.floor((core + 5) * natMult);
}

function actualStatsFor(pokemon, level, cfg = {}) {
  const nature = natureByName(cfg.nature);
  const iv  = Number.isFinite(cfg.ivs) ? cfg.ivs : 31;
  const evs = cfg.evs || {};
  const map = Object.fromEntries(pokemon.stats.map(s => [s.stat.name, s.base_stat]));
  const out = {};
  STAT_ORDER.forEach(k => {
    const isHp = k === "hp";
    out[k] = computeStat(map[k] || 0, level, iv, evs[k] || 0,
                         isHp ? 1 : natureMult(nature, k), isHp);
  });
  if (cfg.status === "para") out.speed = Math.floor(out.speed * 0.5);
  return out;
}

// ──── Cálculo de daño (gen V+) ────
// Naturaleza, IVs/EVs, objeto, clima, crítico, quemadura, STAB, tipos y los
// metadatos del movimiento (multigolpe, drenaje/retroceso, estado).
function calcDamage(atk, def, move, level, opts = {}) {
  if (!move) return null;
  const power = move.power || 0;
  const cat   = move.damage_class?.name || "status";
  const meta  = move.meta || {};
  if (power === 0 || cat === "status") {
    return { isStatus: true, moveType: move.type?.name || "???", move, meta,
             priority: move.priority || 0 };
  }
  const cfgA = opts.atkCfg || {}, cfgD = opts.defCfg || {};
  const moveType = move.type.name;
  const aS = actualStatsFor(atk, level, cfgA);
  const dS = actualStatsFor(def, level, cfgD);

  let A    = cat === "physical" ? aS.attack : aS["special-attack"];
  const D  = Math.max(1, cat === "physical" ? dS.defense : dS["special-defense"]);
  const HP = dS.hp;

  const item = BATTLE_ITEMS[cfgA.item] || {};
  if (item.atk && cat === "physical") A = Math.floor(A * item.atk);
  if (item.spa && cat === "special")  A = Math.floor(A * item.spa);

  const stab = typeNamesOf(atk).includes(moveType) ? 1.5 : 1;
  const eff  = effectiveness(moveType, typeNamesOf(def));
  if (eff === 0) {
    return { isStatus: false, immune: true, moveType, cat, power, eff, HP, move, meta,
             priority: move.priority || 0, turnsToKO: Infinity };
  }

  let mods = 1;
  const weather = opts.weather || "";
  if (weather === "sun")  mods *= moveType === "fire"  ? 1.5 : moveType === "water" ? 0.5 : 1;
  if (weather === "rain") mods *= moveType === "water" ? 1.5 : moveType === "fire"  ? 0.5 : 1;
  if (opts.crit) mods *= 1.5;                                  // gen VI+
  if (item.mult) mods *= item.mult;
  if (item.physMult && cat === "physical") mods *= item.physMult;
  if (item.specMult && cat === "special")  mods *= item.specMult;
  if (item.superMult && eff > 1) mods *= item.superMult;
  const burned = cfgA.status === "burn" && cat === "physical";
  if (burned) mods *= 0.5;

  const base   = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * A / D) / 50) + 2;
  const hitMin = Math.max(1, Math.floor(base * stab * eff * mods * 0.85));
  const hitMax = Math.max(1, Math.floor(base * stab * eff * mods * 1.00));

  const minHits = meta.min_hits || 1;
  const maxHits = meta.max_hits || 1;
  const min = hitMin * minHits;
  const max = hitMax * maxHits;
  const avg = (min + max) / 2;

  return {
    isStatus: false, immune: false, moveType, cat, power, stab, eff, A, D, HP,
    min, max, hitMin, hitMax, minHits, maxHits, multiHit: maxHits > 1,
    weather, crit: !!opts.crit, burned, item,
    drain: meta.drain || 0,                    // >0 cura al atacante, <0 retroceso
    ailment: meta.ailment?.name && meta.ailment.name !== "none" ? meta.ailment.name : null,
    ailmentChance: meta.ailment_chance || 0,
    priority: move.priority || 0,
    turnsToKO: avg > 0 ? Math.ceil(HP / avg) : Infinity,
    minPct: HP > 0 ? Math.min(100, (min / HP) * 100) : 0,
    maxPct: HP > 0 ? Math.min(100, (max / HP) * 100) : 0,
    move, meta,
  };
}

// ──── Main battle render pipeline ────
function runBattle() {
  const A = duelState.A, B = duelState.B;
  if (!A || !B) {
    ["duelStatsSection","duelMatchupSection","duelAttackSection","duelVerdictSection","duelLevelBar"]
      .forEach(id => $(id).classList.add("hidden"));
    return;
  }
  // Show all sections
  ["duelStatsSection","duelMatchupSection","duelAttackSection","duelVerdictSection","duelLevelBar"]
    .forEach(id => $(id).classList.remove("hidden"));

  // Refresh move labels (now both sides are known)
  $("duelAtkLabelA").textContent = `${A.name.toUpperCase()} → ${B.name.toUpperCase()}`;
  $("duelAtkLabelB").textContent = `${B.name.toUpperCase()} → ${A.name.toUpperCase()}`;

  renderBattleStats(A, B);
  renderBattleMatchup(A, B);
  renderBattleAttack("A", A, B, duelState.moveA);
  renderBattleAttack("B", B, A, duelState.moveB);
  renderBattleVerdict(A, B);
}

function renderBattleStats(A, B) {
  const body = $("duelStatsBody");
  const order = ["hp","attack","defense","special-attack","special-defense","speed"];
  // Stats reales con la configuración de cada lado (naturaleza, IVs y EVs)
  const sa = actualStatsFor(A, duelState.level, duelState.cfg.A);
  const sb = actualStatsFor(B, duelState.level, duelState.cfg.B);
  const resumen = side => {
    const c = duelState.cfg[side];
    const n = natureByName(c.nature);
    const evs = STAT_ORDER.reduce((t, k) => t + (c.evs[k] || 0), 0);
    return `${n ? n.es : "—"} · IV ${c.ivs} · ${evs} EVs`;
  };
  let html = `<div class="duel-stats-note">Stats reales al nivel <strong>${duelState.level}</strong>
    — A: ${resumen("A")} · B: ${resumen("B")}</div>`;
  let totalA = 0, totalB = 0;
  order.forEach(key => {
    const va = sa[key] || 0, vb = sb[key] || 0;
    totalA += va; totalB += vb;
    const max = Math.max(va, vb, 1);
    const pa = (va / max) * 100, pb = (vb / max) * 100;
    const wA = va > vb, wB = vb > va;
    html += `
      <div class="duel-stat-row">
        <div class="duel-bar-side left ${wA ? "winner" : ""}">
          <div class="duel-bar-fill" style="width:${pa}%"></div>
        </div>
        <div class="duel-stat-info">
          <div class="duel-stat-name">${STAT_NAMES[key]}</div>
          <div class="duel-stat-vals">
            <span class="${wA ? "winner-mark" : ""}">${va}</span>
            <span style="opacity:0.4">·</span>
            <span class="${wB ? "winner-mark" : ""}">${vb}</span>
          </div>
        </div>
        <div class="duel-bar-side right ${wB ? "winner" : ""}">
          <div class="duel-bar-fill" style="width:${pb}%"></div>
        </div>
      </div>`;
  });
  html += `
    <div class="duel-totals">
      <div>
        <div class="duel-total-side ${totalA > totalB ? "winner" : ""}" data-side="A">${totalA}</div>
        <div class="duel-total-label">${A.name.toUpperCase()}</div>
      </div>
      <div class="duel-total-label">TOTAL AL NV. ${duelState.level}</div>
      <div>
        <div class="duel-total-side ${totalB > totalA ? "winner" : ""}">${totalB}</div>
        <div class="duel-total-label">${B.name.toUpperCase()}</div>
      </div>
    </div>`;
  body.innerHTML = html;
}

function renderBattleMatchup(A, B) {
  const body = $("duelMatchupBody");
  // For each side, calc multipliers from THEIR types AS ATTACKER against opponent's types
  function side(att, defender) {
    const buckets = { x4:[], x2:[], x1:[], x05:[], x025:[], x0:[] };
    const defTypes = typeNamesOf(defender);
    typeNamesOf(att).forEach(tn => {
      const mult = effectiveness(tn, defTypes);
      if (mult === 4) buckets.x4.push(tn);
      else if (mult === 2) buckets.x2.push(tn);
      else if (mult === 1) buckets.x1.push(tn);
      else if (mult === 0.5) buckets.x05.push(tn);
      else if (mult === 0.25) buckets.x025.push(tn);
      else if (mult === 0) buckets.x0.push(tn);
    });
    return buckets;
  }
  const ab = side(A, B);
  const ba = side(B, A);
  const order = [["x4","×4"],["x2","×2"],["x1","×1"],["x05","×½"],["x025","×¼"],["x0","×0"]];
  function render(buckets) {
    return order.filter(([k]) => buckets[k].length > 0).map(([k, lbl]) => `
      <div class="duel-matchup-row">
        <div class="duel-matchup-mult ${k}">${lbl}</div>
        <div class="duel-matchup-types-list">
          ${buckets[k].map(t => `<span class="type-badge type-${t}">${t.toUpperCase()}</span>`).join("")}
        </div>
      </div>`).join("") || '<div class="duel-matchup-row"><span style="opacity:0.4;font-size:11px">Sin movimientos STAB con ventaja clara</span></div>';
  }
  body.innerHTML = `
    <div class="duel-matchup-side">
      <h4><span style="color:#ff8888">${A.name.toUpperCase()}</span> <span class="arrow">→</span> <span style="color:#88b0ff">${B.name.toUpperCase()}</span></h4>
      ${render(ab)}
    </div>
    <div class="duel-matchup-side">
      <h4><span style="color:#88b0ff">${B.name.toUpperCase()}</span> <span class="arrow">→</span> <span style="color:#ff8888">${A.name.toUpperCase()}</span></h4>
      ${render(ba)}
    </div>`;
}

const AILMENT_LABELS = {
  paralysis:"parálisis", burn:"quemadura", freeze:"congelación", poison:"envenenamiento",
  sleep:"sueño", confusion:"confusión", infatuation:"enamoramiento", trap:"atrapado",
  "leech-seed":"drenadoras", flinch:"retroceso", torment:"tormento", disable:"anulación",
  "yawn":"bostezo", "no-ailment":null,
};

function damageOptsFor(side) {
  const other = side === "A" ? "B" : "A";
  return {
    atkCfg:  duelState.cfg[side],
    defCfg:  duelState.cfg[other],
    weather: duelState.weather,
    crit:    duelState.crit,
  };
}

function renderBattleAttack(side, atk, def, move) {
  const target = $("duelDmg" + side);
  if (!move) {
    target.innerHTML = '<div class="das-empty">Selecciona un movimiento para calcular el daño</div>';
    return;
  }
  const r = calcDamage(atk, def, move, duelState.level, damageOptsFor(side));

  if (r.isStatus) {
    const ail = AILMENT_LABELS[r.ailment] || null;
    target.innerHTML = `
      <div class="das-headline">SIN DAÑO</div>
      <div class="das-meta">
        <span>${prettyName(move.name)}</span>
        <span class="type-badge type-${r.moveType}">${r.moveType.toUpperCase()}</span>
        <span>Movimiento de estado</span>
        ${r.priority ? `<span>Prioridad ${r.priority > 0 ? "+" : ""}${r.priority}</span>` : ""}
      </div>`;
    return;
  }
  if (r.immune) {
    target.innerHTML = `
      <div class="das-headline">SIN EFECTO</div>
      <div class="das-meta">
        <span class="type-badge type-${r.moveType}">${r.moveType.toUpperCase()}</span>
        <span>${prettyName(move.name)}</span>
        <span class="das-eff-none">${cap(def.name)} es inmune (×0)</span>
      </div>`;
    return;
  }

  let effLabel = "Daño normal", effClass = "";
  if (r.eff >= 4)      { effLabel = `¡SUPER eficaz ×${r.eff}!`; effClass = "das-eff-super"; }
  else if (r.eff >= 2) { effLabel = `Muy eficaz ×${r.eff}`;      effClass = "das-eff-super"; }
  else if (r.eff < 1)  { effLabel = `Poco eficaz ×${r.eff}`;     effClass = "das-eff-not"; }

  const ko = r.minPct >= 100 ? "💀 K.O. SEGURO"
           : r.maxPct >= 100 ? "⚠ POSIBLE K.O."
           : `Necesita ~${r.turnsToKO} turno${r.turnsToKO === 1 ? "" : "s"}`;

  const extras = [];
  if (r.multiHit) extras.push(`Multigolpe ×${r.minHits}–${r.maxHits} (${r.hitMin}–${r.hitMax} por golpe)`);
  if (r.drain > 0)  extras.push(`Drena el ${r.drain}% del daño`);
  if (r.drain < 0)  extras.push(`Retroceso ${Math.abs(r.drain)}% del daño`);
  if (r.item.recoilPct) extras.push(`${r.item.label.split(" (")[0]}: −${r.item.recoilPct}% PS propios`);
  const ail = AILMENT_LABELS[r.ailment];
  if (ail && r.ailmentChance > 0) extras.push(`${r.ailmentChance}% de ${ail}`);
  if (r.burned) extras.push("Quemado: daño físico a la mitad");

  target.innerHTML = `
    <div class="das-headline">${r.min} – ${r.max} HP</div>
    <div class="das-bar">
      <div class="das-bar-fill" style="width:${r.maxPct}%"></div>
      <div class="das-bar-text">${r.minPct.toFixed(1)}% – ${r.maxPct.toFixed(1)}% del HP</div>
    </div>
    <div class="das-meta">
      <span class="type-badge type-${r.moveType}">${r.moveType.toUpperCase()}</span>
      <span>${prettyName(move.name)}</span>
      <span>Pot. ${r.power}</span>
      <span>${r.cat === "physical" ? "Físico" : "Especial"}</span>
      ${r.stab === 1.5 ? '<span>STAB ×1.5</span>' : ''}
      ${r.priority ? `<span>Prioridad ${r.priority > 0 ? "+" : ""}${r.priority}</span>` : ""}
      ${r.crit ? '<span>Crítico ×1.5</span>' : ''}
      ${r.weather === "sun"  ? '<span>☀ Sol</span>'    : ''}
      ${r.weather === "rain" ? '<span>🌧 Lluvia</span>' : ''}
      <span class="${effClass}">${effLabel}</span>
    </div>
    ${extras.length ? `<ul class="das-extras">${extras.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}
    <div class="das-ko">${ko}</div>`;
}

function renderBattleVerdict(A, B) {
  const body = $("duelVerdictBody");
  const sa = actualStatsFor(A, duelState.level, duelState.cfg.A);
  const sb = actualStatsFor(B, duelState.level, duelState.cfg.B);

  // ── Con ambos movimientos elegidos hacemos la cuenta de verdad:
  //    quién ataca primero (prioridad, luego velocidad) y quién deja K.O. antes.
  const dA = duelState.moveA ? calcDamage(A, B, duelState.moveA, duelState.level, damageOptsFor("A")) : null;
  const dB = duelState.moveB ? calcDamage(B, A, duelState.moveB, duelState.level, damageOptsFor("B")) : null;

  if (dA && dB) {
    const prA = dA.priority || 0, prB = dB.priority || 0;
    const primero = prA !== prB ? (prA > prB ? "A" : "B")
                  : sa.speed !== sb.speed ? (sa.speed > sb.speed ? "A" : "B") : "tie";
    const motivo = prA !== prB
      ? `por prioridad (${prA > 0 ? "+" : ""}${prA} vs ${prB > 0 ? "+" : ""}${prB})`
      : `por velocidad (${sa.speed} vs ${sb.speed})`;

    const tA = dA.turnsToKO, tB = dB.turnsToKO;
    const txt = t => t === Infinity ? "nunca" : `${t} turno${t === 1 ? "" : "s"}`;

    let ganador = "tie", explica;
    if (tA < tB)      { ganador = "A"; explica = `deja K.O. en ${txt(tA)} frente a ${txt(tB)}`; }
    else if (tB < tA) { ganador = "B"; explica = `deja K.O. en ${txt(tB)} frente a ${txt(tA)}`; }
    else if (primero !== "tie") { ganador = primero; explica = `mismos turnos (${txt(tA)}), decide quién ataca primero`; }
    else              { explica = `mismos turnos (${txt(tA)}) y misma velocidad`; }

    const nombre = s => (s === "A" ? A.name : B.name).toUpperCase();
    const cellKO = (side, d, t) => `
      <div class="dv-cell">
        <div class="dv-label">${side === "A" ? "A → B" : "B → A"}</div>
        <div class="dv-winner side-${side}">${txt(t)}</div>
        <div class="dv-detail">${prettyName(d.move.name)} · ${d.immune ? "sin efecto" : `${d.min}–${d.max} HP`}</div>
      </div>`;

    body.innerHTML = `
      ${cellKO("A", dA, tA)}
      ${cellKO("B", dB, tB)}
      <div class="dv-cell">
        <div class="dv-label">⚡ ATACA PRIMERO</div>
        <div class="dv-winner ${primero === "tie" ? "tie" : "side-" + primero}">
          ${primero === "tie" ? "EMPATE" : nombre(primero)}
        </div>
        <div class="dv-detail">${motivo}</div>
      </div>
      <div class="dv-final">
        <div class="dv-label">VEREDICTO CON ESTOS MOVIMIENTOS</div>
        <div class="dv-winner ${ganador === "tie" ? "tie" : "side-" + ganador}">
          ${ganador === "tie" ? "🤝 COMBATE PAREJO" : "🏆 " + nombre(ganador)}
        </div>
        <div class="dv-detail">${ganador === "tie" ? explica : `${nombre(ganador)} ${explica}`}</div>
      </div>`;
    return;
  }

  // ── Sin movimientos elegidos: estimación por estadísticas y tipos ──
  const speedWinner = sa.speed > sb.speed ? "A" : sa.speed < sb.speed ? "B" : "tie";
  // Bulk (HP × avg(Def, SpDef))
  const bulkA = sa.hp * (sa.defense + sa["special-defense"]) / 2;
  const bulkB = sb.hp * (sb.defense + sb["special-defense"]) / 2;
  const bulkWinner = bulkA > bulkB * 1.1 ? "A" : bulkB > bulkA * 1.1 ? "B" : "tie";
  // Offense (max of Atk and SpAtk)
  const offA = Math.max(sa.attack, sa["special-attack"]);
  const offB = Math.max(sb.attack, sb["special-attack"]);
  const offWinner = offA > offB * 1.1 ? "A" : offB > offA * 1.1 ? "B" : "tie";
  // Type advantage: who has more super-effective options STAB
  const countSuper = (att, def) => {
    const defTypes = typeNamesOf(def);
    return typeNamesOf(att).filter(tn => effectiveness(tn, defTypes) >= 2).length;
  };
  const supA = countSuper(A, B), supB = countSuper(B, A);
  const typeWinner = supA > supB ? "A" : supB > supA ? "B" : "tie";

  // Final verdict: weighted score
  function score(side) {
    let s = 0;
    if (speedWinner === side) s += 1;
    if (bulkWinner  === side) s += 2;
    if (offWinner   === side) s += 2;
    if (typeWinner  === side) s += 3;
    return s;
  }
  const sA = score("A"), sB = score("B");
  const finalWinner = sA > sB ? "A" : sB > sA ? "B" : "tie";

  function cell(label, winner, detail) {
    const cls  = winner === "tie" ? "tie" : "side-" + winner;
    const name = winner === "tie" ? "EMPATE" : (winner === "A" ? A.name : B.name).toUpperCase();
    return `
      <div class="dv-cell">
        <div class="dv-label">${label}</div>
        <div class="dv-winner ${cls}">${name}</div>
        <div class="dv-detail">${detail}</div>
      </div>`;
  }
  body.innerHTML = `
    ${cell("⚡ VELOCIDAD", speedWinner, `${sa.speed} vs ${sb.speed}`)}
    ${cell("🛡️ AGUANTE", bulkWinner,  `${Math.round(bulkA)} vs ${Math.round(bulkB)} (HP × DEF)`)}
    ${cell("⚔️ OFENSIVA", offWinner,  `${offA} vs ${offB} (mejor stat ofensivo)`)}
    ${cell("🔥 VENTAJA DE TIPO", typeWinner, `${supA} vs ${supB} tipos super-eficaces`)}
    <div class="dv-final">
      <div class="dv-label">VEREDICTO ESTIMADO</div>
      <div class="dv-winner ${finalWinner === "tie" ? "tie" : "side-" + finalWinner}">
        ${finalWinner === "tie" ? "🤝 COMBATE PAREJO" : "🏆 " + (finalWinner === "A" ? A.name : B.name).toUpperCase()}
      </div>
      <div class="dv-detail">
        Puntaje: ${sA} a ${sB} (velocidad, aguante, ofensiva y tipos).
        Elige un movimiento en cada lado para calcular turnos hasta el K.O.
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════
//  TOOL 3:  CONSTRUCTOR DE EQUIPO
// ════════════════════════════════════════════════════════
const teamState = { members: [] };

function initTeam() {
  TOOL_INITED.team = true;
  // Restore from localStorage
  try {
    const saved = localStorage.getItem("poketeam");
    if (saved) {
      const ids = JSON.parse(saved);
      Promise.all(ids.map(id => fetchPokemonByName(id))).then(arr => {
        if (teamState.members.length) return;   // una URL compartida ya puso equipo
        teamState.members = arr;
        renderTeamSlots();
        renderTeamAnalysis();
      });
    }
  } catch {}

  buildPicker($("teamPicker"), data => {
    if (teamState.members.length >= 6) return;
    if (teamState.members.find(m => m.id === data.id)) return;
    teamState.members.push(data);
    saveTeam();
    renderTeamSlots();
    renderTeamAnalysis();
  });
  $("teamClear").addEventListener("click", () => {
    teamState.members = [];
    saveTeam();
    renderTeamSlots();
    renderTeamAnalysis();
  });
  renderTeamSlots();
}

function saveTeam() {
  try { localStorage.setItem("poketeam", JSON.stringify(teamState.members.map(m => m.id))); } catch {}
}

function renderTeamSlots() {
  const root = $("teamSlots");
  root.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const m = teamState.members[i];
    const slot = document.createElement("div");
    if (m) {
      slot.className = "team-slot filled";
      slot.innerHTML = `
        <button class="team-slot-remove" title="Quitar">✕</button>
        <img src="${spriteFor(m.id)}" alt="${m.name}"/>
        <div class="team-slot-name">${m.name}</div>
        <div class="team-slot-types">
          ${m.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`).join("")}
        </div>`;
      slot.querySelector(".team-slot-remove").addEventListener("click", e => {
        e.stopPropagation();
        teamState.members.splice(i, 1);
        saveTeam();
        renderTeamSlots();
        renderTeamAnalysis();
      });
    } else {
      slot.className = "team-slot empty";
      slot.innerHTML = `
        <span class="team-slot-empty-icon">＋</span>
        <span class="team-slot-empty-text">VACÍO</span>`;
    }
    root.appendChild(slot);
  }
}

function renderTeamAnalysis() {
  const wrap = $("teamAnalysis");
  if (teamState.members.length === 0) { wrap.classList.add("hidden"); return; }
  wrap.classList.remove("hidden");

  const members = teamState.members;
  const order  = ["hp","attack","defense","special-attack","special-defense","speed"];
  const labels = ["HP","ATK","DEF","SP.ATK","SP.DEF","VEL"];

  // Build per-member stat map
  const memberStats = members.map(m => Object.fromEntries(m.stats.map(s => [s.stat.name, s.base_stat])));
  const sums = order.map(() => 0);
  members.forEach((m, i) => order.forEach((k, j) => sums[j] += memberStats[i][k] || 0));
  const avgs = sums.map(s => Math.round(s / members.length));

  // ════ 1) Radar ════
  const svg = $("teamRadar");
  const cx = 140, cy = 140, r = 95, n = order.length;
  let svgInner = "";
  for (let ring = 1; ring <= 4; ring++) {
    const rr = r * ring / 4;
    const pts = Array.from({length: n}, (_, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(" ");
    svgInner += `<polygon class="radar-grid" points="${pts}"/>`;
  }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    svgInner += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}"/>`;
  }
  const pts = avgs.map((v, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const ratio = Math.min(v / 200, 1);
    return `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`;
  }).join(" ");
  svgInner += `<polygon class="radar-fill" points="${pts}"/>`;
  labels.forEach((lbl, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const lx = cx + (r + 22) * Math.cos(a);
    const ly = cy + (r + 22) * Math.sin(a);
    svgInner += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${lbl}</text>`;
    const vx = cx + (r * 0.55) * Math.cos(a);
    const vy = cy + (r * 0.55) * Math.sin(a);
    svgInner += `<text class="radar-val" x="${vx}" y="${vy}" text-anchor="middle">${avgs[i]}</text>`;
  });
  svg.innerHTML = svgInner;

  // Totals
  const allStats = members.map(m => m.stats.reduce((a, s) => a + s.base_stat, 0));
  const totalSum = allStats.reduce((a, b) => a + b, 0);
  $("teamTotals").innerHTML = `
    <div class="team-tot-cell"><span class="team-tot-label">PROMEDIO BST</span><span class="team-tot-val">${Math.round(totalSum / members.length)}</span></div>
    <div class="team-tot-cell"><span class="team-tot-label">TOTAL</span><span class="team-tot-val">${totalSum}</span></div>
    <div class="team-tot-cell"><span class="team-tot-label">MIEMBROS</span><span class="team-tot-val">${members.length}/6</span></div>`;

  // ════ 2) Per-stat breakdown (best/worst per stat) ════
  const detail = $("teamStatsDetail");
  const STAT_GRADIENTS = ["stat-hp","stat-atk","stat-def","stat-spatk","stat-spdef","stat-speed"];
  detail.innerHTML = order.map((key, i) => {
    let bestI = 0, worstI = 0;
    memberStats.forEach((s, idx) => {
      if ((s[key] || 0) > (memberStats[bestI][key] || 0)) bestI = idx;
      if ((s[key] || 0) < (memberStats[worstI][key] || 0)) worstI = idx;
    });
    const bestVal  = memberStats[bestI][key] || 0;
    const worstVal = memberStats[worstI][key] || 0;
    const avgVal   = avgs[i];
    const widthPct = Math.min((avgVal / 200) * 100, 100);
    const avgPct   = Math.min((avgVal / 255) * 100, 100);
    return `
      <div class="tsd-row">
        <div class="tsd-stat-name">${labels[i]}</div>
        <div class="tsd-bar">
          <div class="tsd-bar-fill ${STAT_GRADIENTS[i]}" style="width:${widthPct}%"></div>
          <div class="tsd-bar-avg" style="left:${avgPct}%" title="Promedio del equipo: ${avgVal}"></div>
        </div>
        <div class="tsd-info tsd-info-best">
          <span class="tsd-info-label">↑ Mejor</span>
          ${cap(members[bestI].name)} ${bestVal}
        </div>
        <div class="tsd-info tsd-info-worst">
          <span class="tsd-info-label">↓ Peor</span>
          ${cap(members[worstI].name)} ${worstVal}
        </div>
      </div>`;
  }).join("");

  // ════ 3) Roles & destacados ════
  const roleTopBy = (statKey) => {
    let best = 0;
    memberStats.forEach((s, i) => { if ((s[statKey] || 0) > (memberStats[best][statKey] || 0)) best = i; });
    return { idx: best, val: memberStats[best][statKey] || 0 };
  };
  const roleTopByFn = (fn) => {
    let best = 0;
    memberStats.forEach((s, i) => { if (fn(s) > fn(memberStats[best])) best = i; });
    return { idx: best, val: fn(memberStats[best]) };
  };
  const fastest      = roleTopBy("speed");
  const physAttacker = roleTopBy("attack");
  const specAttacker = roleTopBy("special-attack");
  const tank         = roleTopByFn(s => s.hp + s.defense + s["special-defense"]);
  const speedTier    = members
    .map((m, i) => ({ m, idx: i, sp: memberStats[i].speed || 0 }))
    .sort((a, b) => b.sp - a.sp);

  const roleCard = (icon, label, role) => `
    <div class="tr-card">
      <div class="tr-label">${icon} ${label}</div>
      <div class="tr-pokemon">
        <img src="${spriteFor(members[role.idx].id)}" alt=""/>
        <div>
          <div class="tr-pokemon-name">${members[role.idx].name}</div>
          <div class="tr-pokemon-val">${role.val}</div>
        </div>
      </div>
    </div>`;
  $("teamRoles").innerHTML = `
    ${roleCard("⚡", "MÁS RÁPIDO",      fastest)}
    ${roleCard("⚔️", "MEJOR ATK FÍSICO", physAttacker)}
    ${roleCard("✨", "MEJOR ATK ESPECIAL", specAttacker)}
    ${roleCard("🛡️", "MEJOR TANQUE (HP+DEF+SP.DEF)", tank)}
    <div class="tr-card" style="grid-column: span 2;">
      <div class="tr-label">📊 ORDEN DE TURNOS POR VELOCIDAD</div>
      <div class="tr-tier">
        ${speedTier.map((s, i) => `
          <div class="tr-tier-row">
            <div style="display:flex;align-items:center;gap:8px">
              <img src="${spriteFor(s.m.id)}" alt=""/>
              <span class="name">${i+1}. ${s.m.name}</span>
            </div>
            <span class="val">${s.sp}</span>
          </div>`).join("")}
      </div>
    </div>`;

  // ════ 4) Defensive coverage per member ════
  // For each attacking type, list members with their multiplier
  const defcov = {};
  activeTypes().forEach(att => defcov[att] = []);
  members.forEach(m => {
    const ts = typeNamesOf(m);
    activeTypes().forEach(att => {
      const mult = effectiveness(att, ts);
      if (mult >= 2) defcov[att].push({ member: m, mult });
    });
  });
  // Sort: types with most weak members first
  const defSorted = Object.entries(defcov)
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([_, arr]) => arr.length > 0);

  if (defSorted.length === 0) {
    $("teamDefCov").innerHTML = '<div class="tdc-empty">¡Tu equipo no tiene debilidades comunes! 💪</div>';
  } else {
    $("teamDefCov").innerHTML = defSorted.map(([type, arr]) => {
      const cls = arr.length >= 3 ? "danger" : arr.length === 2 ? "warn" : "";
      return `
        <div class="tdc-card ${cls}">
          <div class="tdc-card-header">
            <span class="tdc-type-badge type-${type}">${TYPE_LABELS_ES[type] || type.toUpperCase()}</span>
            <span class="tdc-count"><strong>${arr.length}</strong>/${members.length}</span>
          </div>
          <div class="tdc-members">
            ${arr.map(({member, mult}) => `
              <div class="tdc-member ${mult === 4 ? "x4" : "x2"}" title="${cap(member.name)}: ×${mult}">
                <img src="${spriteFor(member.id)}" alt="${member.name}"/>
                <span class="tdc-mult">×${mult}</span>
              </div>`).join("")}
          </div>
        </div>`;
    }).join("");
  }

  // ════ 5) Offensive coverage (STAB-based) ════
  // For each defensive type, count how many members have a STAB type that's super-effective vs it
  const offcov = {};
  activeTypes().forEach(d => offcov[d] = []);
  members.forEach(m => {
    const stabTypes = typeNamesOf(m);
    activeTypes().forEach(defType => {
      // ¿algún tipo STAB golpea a defType con ×2 o más?
      const best = Math.max(...stabTypes.map(att => effectiveness(att, [defType])));
      if (best >= 2) offcov[defType].push(m);
    });
  });
  $("teamOffCov").innerHTML = activeTypes().map(t => {
    const arr = offcov[t];
    const cls = arr.length >= 1 ? "covered" : "uncovered";
    return `
      <div class="toc-cell type-${t} ${cls}">
        <span>${TYPE_LABELS_ES[t] || t.toUpperCase()}</span>
        <span class="toc-count">${arr.length}</span>
        <div class="toc-by">
          ${arr.slice(0, 6).map(m => `<img src="${spriteFor(m.id)}" alt="${m.name}" title="${m.name}"/>`).join("")}
        </div>
      </div>`;
  }).join("");

  // ════ 6) Synergy / alerts ════
  const alerts = [];
  // Speed
  const fastestSp = memberStats[fastest.idx].speed;
  if (fastestSp >= 110) alerts.push({ kind: "ok", icon: "⚡", text: `Buena velocidad: ${cap(members[fastest.idx].name)} (${fastestSp}) abrirá la mayoría de los combates.` });
  else if (fastestSp < 75) alerts.push({ kind: "warn", icon: "🐢", text: `Equipo lento. El más rápido (${cap(members[fastest.idx].name)}, ${fastestSp}) suele atacar después.` });
  // Mixed offense
  const physBest = memberStats[physAttacker.idx].attack;
  const specBest = memberStats[specAttacker.idx]["special-attack"];
  if (Math.abs(physBest - specBest) < 25) alerts.push({ kind: "ok", icon: "🎯", text: `Ofensiva mixta sólida (${physBest} físico / ${specBest} especial) — difícil de muralizar.` });
  else if (physBest > specBest + 50) alerts.push({ kind: "info", icon: "💪", text: `Equipo muy físico. Cuidado con muros físicos como Skarmory o Toxapex.` });
  else if (specBest > physBest + 50) alerts.push({ kind: "info", icon: "✨", text: `Equipo muy especial. Cuidado con muros especiales como Blissey o Chansey.` });
  // Critical type weakness
  const worstDef = defSorted[0];
  if (worstDef && worstDef[1].length >= 4) {
    alerts.push({ kind: "bad", icon: "⚠️", text: `${TYPE_LABELS_ES[worstDef[0]]} es CRÍTICO: ${worstDef[1].length}/${members.length} miembros débiles. Considera revisar la composición.` });
  } else if (worstDef && worstDef[1].length >= 3) {
    alerts.push({ kind: "warn", icon: "⚠️", text: `Cuidado con tipo ${TYPE_LABELS_ES[worstDef[0]]}: ${worstDef[1].length} miembros débiles.` });
  }
  // Type diversity
  const usedTypes = new Set();
  members.forEach(m => m.types.forEach(t => usedTypes.add(t.type.name)));
  if (usedTypes.size >= members.length * 1.5) alerts.push({ kind: "ok", icon: "🌈", text: `Buena diversidad de tipos (${usedTypes.size} tipos representados).` });
  else if (usedTypes.size <= members.length) alerts.push({ kind: "warn", icon: "♻️", text: `Pocos tipos representados (${usedTypes.size}). Diversifica para mejor cobertura.` });
  // Offensive coverage gaps
  const uncovered = Object.entries(offcov).filter(([_, a]) => a.length === 0).map(([t]) => TYPE_LABELS_ES[t]);
  if (uncovered.length === 0) alerts.push({ kind: "ok", icon: "🎯", text: "¡Cobertura ofensiva STAB perfecta! Tu equipo puede golpear con ventaja a todos los tipos." });
  else if (uncovered.length <= 3) alerts.push({ kind: "info", icon: "🎯", text: `Sin ventaja STAB contra: ${uncovered.join(", ")}. Cubre con movimientos secundarios.` });
  else alerts.push({ kind: "warn", icon: "🎯", text: `${uncovered.length} tipos sin cobertura ofensiva STAB. Considera Pokémon con más variedad de tipos.` });
  // Full team
  if (members.length === 6) alerts.push({ kind: "ok", icon: "✅", text: "Equipo completo. ¡Listo para la liga!" });
  else alerts.push({ kind: "info", icon: "📦", text: `Equipo incompleto (${members.length}/6). Añade más miembros para análisis completo.` });

  $("teamSynergy").innerHTML = alerts.map(a => `
    <div class="ts-row ${a.kind}">
      <span class="ts-icon">${a.icon}</span>
      <span>${a.text}</span>
    </div>`).join("");
}

// ════════════════════════════════════════════════════════
//  TOOL 5:  RULETA  ALEATORIA
// ════════════════════════════════════════════════════════
// Legendarios y singulares según la propia API (is_legendary / is_mythical).
// Antes era una lista escrita a mano: incompleta y con Pokémon que no lo son.
const SPECIES_FLAGS_KEY = "species:flags:v1";
let legendarySet = null;

async function ensureLegendarySet() {
  if (legendarySet) return legendarySet;
  try {
    const entry = await idbGet(SPECIES_FLAGS_KEY);
    let rows;
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
      rows = entry.data;
    } else {
      const query = `query SpeciesFlags {
        pokemon_v2_pokemonspecies(where: {id: {_lte: 1025}}, order_by: {id: asc}, limit: 2000) {
          id is_legendary is_mythical
        }
      }`;
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error("GraphQL");
      rows = json.data?.pokemon_v2_pokemonspecies || [];
      if (rows.length === 0) throw new Error("0 filas");
      idbSet(SPECIES_FLAGS_KEY, { ts: Date.now(), data: rows });
    }
    legendarySet = new Set(rows.filter(r => r.is_legendary || r.is_mythical).map(r => r.id));
  } catch {
    legendarySet = null;   // no se pudo: el que llama decide qué hacer
  }
  return legendarySet;
}

function initRoulette() {
  TOOL_INITED.roulette = true;
  $("rouRoll").addEventListener("click", rollRoulette);
}

async function rollRoulette() {
  const count = clamp(parseInt($("rouCount").value, 10) || 6, 1, 12);
  const region = $("rouRegion").value;
  const type   = $("rouType").value;
  const unique = $("rouUnique").checked;
  const noLeg  = $("rouNoLegendary").checked;

  const btn = $("rouRoll");
  btn.disabled = true;
  btn.textContent = "🎲 ROLEANDO...";

  // Build pool
  const notes = [];
  let pool = [...state.allPokemon];
  if (region) {
    const [mn, mx] = REGIONS[region];
    pool = pool.filter(p => p.id >= mn && p.id <= mx);
  }
  if (noLeg) {
    const legs = await ensureLegendarySet();
    if (legs) pool = pool.filter(p => !legs.has(p.id));
    else notes.push("No se pudo comprobar qué Pokémon son legendarios; ese filtro se ha ignorado.");
  }
  // Type filter (lazy-fetch) — reutiliza el mismo caché que los filtros
  if (type) {
    await ensureTypeCache(type);
    pool = pool.filter(p => state.typeCache[type].has(p.id));
  }

  if (pool.length === 0) {
    $("rouResult").innerHTML = '<div class="rou-empty">No hay Pokémon que cumplan esos criterios.</div>';
    btn.disabled = false; btn.textContent = "🎲 GENERAR";
    return;
  }

  // Nunca se puede pedir más de lo que hay en el pool: si `count` lo supera,
  // el relleno de abajo no tendría candidatos nuevos y no terminaría nunca.
  const target = Math.min(count, pool.length);

  // Show animated placeholders
  const result = $("rouResult");
  result.innerHTML = "";
  for (let i = 0; i < target; i++) {
    const card = document.createElement("div");
    card.className = "rou-card spinning";
    card.innerHTML = `<img src="${spriteFor(pool[Math.floor(Math.random()*pool.length)].id)}"/>`;
    result.appendChild(card);
  }

  // Barajamos el pool una vez y lo recorremos: garantiza que termina y que no
  // hay repetidos, sin depender de la suerte de los intentos aleatorios.
  const bag = pool.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  const picked    = [];
  const usedTypes = new Set();
  const skipped   = [];      // descartados solo por repetir tipo
  for (const candidate of bag) {
    if (picked.length >= target) break;
    if (unique) {
      // Hace falta el detalle para conocer los tipos
      let data;
      try { data = await fetchPokemonByName(candidate.id); } catch { continue; }
      const ts = data.types.map(t => t.type.name);
      if (ts.some(t => usedTypes.has(t))) { skipped.push(data); continue; }
      ts.forEach(t => usedTypes.add(t));
      picked.push(data);
    } else {
      picked.push(candidate);
    }
  }
  // "Sin repetir tipos" puede ser imposible de cumplir (hay 18 tipos y pools
  // pequeños): completamos con los que habíamos descartado por tipo repetido.
  for (const data of skipped) {
    if (picked.length >= target) break;
    picked.push(data);
  }

  // Resolve full data for any that don't have it
  const final = await Promise.all(picked.map(p => p.types ? p : fetchPokemonByName(p.id)));

  // Reveal one by one
  for (let i = 0; i < final.length; i++) {
    await new Promise(r => setTimeout(r, 220));
    const data = final[i];
    const card = result.children[i];
    if (!card) continue;
    card.classList.remove("spinning");
    card.innerHTML = `
      <span class="rou-card-num">#${padId(data.id)}</span>
      <img src="${spriteFor(data.id)}" alt="${data.name}"/>
      <div class="rou-card-name">${data.name}</div>
      <div class="rou-card-types">
        ${data.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`).join("")}
      </div>`;
    card.addEventListener("click", () => {
      switchMode("pokedex");
      jumpToId(data.id);
    });
  }

  // Quitar placeholders sobrantes (p. ej. si algún fetch falló)
  while (result.children.length > final.length) result.lastElementChild.remove();

  if (final.length < count) {
    notes.unshift(`Solo hay ${final.length} Pokémon que cumplan esos criterios (pediste ${count}).`);
  }
  notes.forEach(text => {
    const note = document.createElement("div");
    note.className = "rou-note";
    note.textContent = text;
    result.appendChild(note);
  });
  btn.disabled = false; btn.textContent = "🎲 GENERAR";
}
