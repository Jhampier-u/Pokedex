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
  currentRegion: "kanto",
  currentVariety: null,    // alternate-form override (pokemon name); null = default
};

// ── DOM refs ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const introOverlay = $("introOverlay");
const bigLight     = $("bigLight");

const filterType   = $("filterType");
const filterRegion = $("filterRegion");
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
  if (animated && id <= 649) {
    return shiny
      ? `${base}/versions/generation-v/black-white/animated/shiny/${id}.gif`
      : `${base}/versions/generation-v/black-white/animated/${id}.gif`;
  }
  return shiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`;
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
async function loadCatalog() {
  catalogLoading.classList.remove("hidden");
  catalogError.classList.add("hidden");
  try {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0");
    if (!res.ok) throw new Error("fetch_failed");
    const data = await res.json();
    state.allPokemon = data.results.map(p => ({ id: getId(p.url), name: p.name }));
    catalogLoading.classList.add("hidden");
    pagTotal.textContent = state.allPokemon.length;
    await applyFilters({ resetIndex: true });
  } catch {
    catalogLoading.classList.add("hidden");
    catalogError.classList.remove("hidden");
  }
}

// ── Filters ────────────────────────────────────────────
let filterTimer = null;
function debouncedFilter(reset = true) {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => applyFilters({ resetIndex: reset }), 220);
}
async function applyFilters({ resetIndex = false } = {}) {
  const typeVal   = filterType.value;
  const regionVal = filterRegion.value;
  const sortVal   = filterSort.value;
  const rawName   = filterName.value.trim().toLowerCase();

  if (typeVal && !state.typeCache[typeVal]) {
    typeLoading.classList.remove("hidden");
    try {
      const r = await fetch(`https://pokeapi.co/api/v2/type/${typeVal}`);
      const d = await r.json();
      state.typeCache[typeVal] = new Set(
        d.pokemon.map(p => getId(p.pokemon.url)).filter(id => id >= 1 && id <= 1025)
      );
    } catch { state.typeCache[typeVal] = new Set(); }
    typeLoading.classList.add("hidden");
  }
  const typeIds = typeVal ? state.typeCache[typeVal] : null;
  const numericSearch = rawName && /^\d+$/.test(rawName) ? parseInt(rawName, 10) : null;

  let list = state.allPokemon.filter(p => {
    if (typeIds && !typeIds.has(p.id)) return false;
    if (regionVal) {
      const [mn, mx] = REGIONS[regionVal];
      if (p.id < mn || p.id > mx) return false;
    }
    if (rawName && numericSearch === null && !p.name.includes(rawName)) return false;
    if (numericSearch !== null && p.id !== numericSearch) return false;
    return true;
  });
  list.sort((a, b) => {
    switch (sortVal) {
      case "id-asc":    return a.id - b.id;
      case "id-desc":   return b.id - a.id;
      case "name-asc":  return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      default:          return a.id - b.id;
    }
  });

  state.filtered = list;
  if (resetIndex || state.current >= list.length) state.current = 0;
  filterCount.textContent = `${list.length} Pokémon`;

  if (list.length === 0) {
    stage.innerHTML = "";
    cardWrapper.classList.add("hidden");
    pagination.classList.add("hidden");
    noResults.classList.remove("hidden");
    return;
  }
  noResults.classList.add("hidden");
  cardWrapper.classList.remove("hidden");
  pagination.classList.remove("hidden");
  pagTotal.textContent = list.length;

  renderStage();
  scheduleDetailLoad();
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
        <img src="${spriteFor(p.id, { shiny: state.shinyMode, animated: state.animatedMode })}"
             alt="${p.name}" loading="lazy"
             onerror="this.src='${spriteFor(p.id, { shiny: state.shinyMode })}'"/>
      </div>
    </div>`;
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
      const lastOff = parseInt(el.dataset.lastOff, 10);
      el.className = `stage-item ${lastOff < 0 ? "pos-out-l" : "pos-out-r"}`;
      setTimeout(() => el.remove(), 520);
    }
  });
  visible.forEach(({ off, item }) => {
    let el = stage.querySelector(`.stage-item[data-id="${item.id}"]`);
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
    if (img) img.src = spriteFor(id, { shiny: state.shinyMode, animated: state.animatedMode });
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
  if (idx >= 0) {
    navigateTo(idx);
  } else {
    // Not in current filter — clear name filter and try again from full list
    filterName.value = "";
    filterType.value = "";
    filterRegion.value = "";
    applyFilters({ resetIndex: true }).then(() => {
      const i2 = state.filtered.findIndex(p => p.id === id);
      if (i2 >= 0) navigateTo(i2);
    });
  }
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
filterRegion.addEventListener("change", () => applyFilters({ resetIndex: true }));
filterSort.addEventListener("change",   () => applyFilters({ resetIndex: true }));
filterName.addEventListener("input",    () => debouncedFilter(true));

document.addEventListener("keydown", e => {
  if (e.target.matches("input, select, textarea")) {
    if (e.key === "Escape") e.target.blur();
    return;
  }
  if (!modalOverlay.classList.contains("hidden")) {
    if (e.key === "Escape") closeModal();
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
  animBtn.classList.toggle("disabled", cur.id > 649);

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
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
  const data = await res.json();
  state.detailCache[key]    = data;
  state.detailCache[data.id] = data;
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
      const sr = await fetch(data.species.url);
      const sd = await sr.json();
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
      };
      state.speciesCache[cur.id] = species;
    }

    if (seq !== detailRequestSeq) return;

    // 3. Render base data
    renderAll(data, species);

    // 4. Lazy load evolution chain
    if (species.evolutionUrl) {
      loadEvolutionChain(species.evolutionUrl, data.id);
    } else {
      evoChainEl.innerHTML = '<span class="evo-empty">Sin evolución</span>';
    }

    // 5. Lazy load locations (for the BASE species id)
    loadLocations(cur.id);

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
  const primaryType = data.types[0].type.name;
  setAccent(primaryType);

  stageNum.textContent   = `#${padId(data.id)}`;
  stageName.textContent  = data.name.toUpperCase();
  stageGenus.textContent = species.genus || "Pokémon";
  renderStageTypes(data.types);

  $("pokeNumber").textContent = `#${padId(data.id)}`;
  $("pokeName").textContent   = data.name.toUpperCase();
  $("pokeGenus").textContent  = species.genus || "Pokémon";

  const img = $("pokemonSprite");
  img.src = officialArtFor(data.id, state.shinyMode);
  img.alt = data.name;

  $("pokeHeight").textContent = `${(data.height / 10).toFixed(1)} m`;
  $("pokeWeight").textContent = `${(data.weight / 10).toFixed(1)} kg`;
  $("pokeExp").textContent    = data.base_experience ?? "—";

  renderTypes(data.types);
  renderDescription(species.flavors || []);
  renderAbilities(data.abilities);
  renderStats(data.stats);
  renderMoves(data.moves);
  renderWeaknesses(data.types);
  renderVarieties(species.varieties || [], data.name);
}

function renderStageTypes(types) {
  stageTypes.innerHTML = "";
  types.forEach(t => {
    const s = document.createElement("span");
    s.className = `type-badge type-${t.type.name}`;
    s.textContent = t.type.name.toUpperCase();
    stageTypes.appendChild(s);
  });
}
function renderTypes(types) {
  const row = $("typesRow");
  row.innerHTML = "";
  types.forEach(t => {
    const s = document.createElement("span");
    s.className = `type-badge type-${t.type.name}`;
    s.textContent = t.type.name.toUpperCase();
    row.appendChild(s);
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
function renderMoves(moves) {
  const list = $("pokeMoves");
  list.innerHTML = "";
  moves.slice(0, 16).forEach(m => {
    const s = document.createElement("span");
    s.className = "move-tag";
    s.textContent = cap(m.move.name.replace(/-/g, " "));
    s.dataset.name = m.move.name;
    s.addEventListener("click", () => openMoveModal(m.move.name));
    list.appendChild(s);
  });
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
  Object.keys(TYPE_CHART).forEach(attacker => {
    let mult = 1;
    defenderTypes.forEach(d => {
      const m = TYPE_CHART[attacker][d];
      if (m !== undefined) mult *= m;
    });
    result[attacker] = mult;
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
async function loadEvolutionChain(url, currentId) {
  const cacheKey = url;
  let chain = state.evoCache[cacheKey];
  if (!chain) {
    try {
      const r = await fetch(url);
      chain = await r.json();
      state.evoCache[cacheKey] = chain;
    } catch {
      evoChainEl.innerHTML = '<span class="evo-empty">No se pudo cargar la evolución.</span>';
      return;
    }
  }
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
async function loadLocations(id) {
  if (state.locationCache[id]) {
    renderLocations(state.locationCache[id]);
    return;
  }
  locationsList.innerHTML = '<span class="loc-empty">Buscando ubicaciones…</span>';
  try {
    const data = state.detailCache[id] || await fetchPokemonByName(id);
    const url  = data.location_area_encounters;
    const r    = await fetch(url);
    const arr  = await r.json();
    state.locationCache[id] = arr;
    renderLocations(arr);
  } catch {
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
  const others = varieties.filter(v => v.pokemon.name !== varieties[0].pokemon.name || varieties.length > 1);
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
    const species = state.speciesCache[cur.id];   // reuse species (varieties share it)
    renderAll(data, species);
  } catch {} finally {
    cardLoading.classList.add("hidden");
    cardWrapper.classList.remove("fading");
  }
}

// ════════════════════════════════════════════════════════
//  MODAL  (shared between abilities & moves)
// ════════════════════════════════════════════════════════
function openModal() {
  modalOverlay.classList.remove("hidden");
  modalContent.classList.add("hidden");
  modalLoading.classList.remove("hidden");
}
function closeModal() {
  modalOverlay.classList.add("hidden");
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
      const r = await fetch(`https://pokeapi.co/api/v2/ability/${abilityName}`);
      data = await r.json();
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
  let data = state.moveCache[moveName];
  if (!data) {
    try {
      const r = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
      data = await r.json();
      state.moveCache[moveName] = data;
    } catch {
      modalContent.innerHTML = `<p style="padding:20px;color:#ff8888">Error al cargar el movimiento.</p>`;
      modalLoading.classList.add("hidden");
      modalContent.classList.remove("hidden");
      return;
    }
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
//  INIT
// ════════════════════════════════════════════════════════
loadCatalog();


// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//   INTERACTIVE  TOOLS  /  MODES
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════

const TOOL_INITED = {};

function switchMode(mode) {
  document.querySelectorAll(".mode-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.mode === mode);
  });
  const ids = {
    pokedex:"modePokedex", quiz:"modeQuiz", duel:"modeDuel",
    team:"modeTeam", roulette:"modeRoulette",
  };
  Object.entries(ids).forEach(([m, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", m !== mode);
  });
  // Lazy init
  if (mode === "quiz"     && !TOOL_INITED.quiz)     initQuiz();
  if (mode === "duel"     && !TOOL_INITED.duel)     initDuel();
  if (mode === "team"     && !TOOL_INITED.team)     initTeam();
  if (mode === "roulette" && !TOOL_INITED.roulette) initRoulette();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
const quizState = {
  answer: null,
  options: [],
  done: false,
  score: { correct: 0, total: 0, streak: 0, best: 0 },
};

function initQuiz() {
  TOOL_INITED.quiz = true;

  // Restore best from localStorage
  try {
    const saved = localStorage.getItem("pokequiz_best");
    if (saved) quizState.score.best = parseInt(saved, 10) || 0;
  } catch {}
  $("quizBest").textContent = quizState.score.best;

  $("quizNext").addEventListener("click", newQuizRound);
  $("quizDifficulty").addEventListener("change", newQuizRound);
  newQuizRound();
}

function quizPool() {
  const diff = $("quizDifficulty").value;
  if (diff === "kanto") return state.allPokemon.filter(p => p.id <= 151);
  if (diff === "gen5")  return state.allPokemon.filter(p => p.id <= 649);
  return state.allPokemon;
}

function newQuizRound() {
  quizState.done = false;
  $("quizNext").classList.add("hidden");
  $("quizPrompt").className = "quiz-prompt";
  $("quizPrompt").textContent = "¿Quién es ese Pokémon?";
  $("quizSilhouette").classList.remove("revealed");

  const pool = quizPool();
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
}

function answerQuiz(picked) {
  if (quizState.done) return;
  quizState.done = true;
  const correct = picked.id === quizState.answer.id;
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

  // Reveal silhouette
  $("quizSilhouette").classList.add("revealed");

  // Mark options
  document.querySelectorAll(".quiz-opt").forEach(b => {
    b.disabled = true;
    if (b.textContent === quizState.answer.name) b.classList.add("correct");
    else if (b.textContent === picked.name)      b.classList.add("wrong");
  });

  // Prompt
  const prompt = $("quizPrompt");
  if (correct) {
    prompt.textContent = `✓  ¡Es ${quizState.answer.name.toUpperCase()}!`;
    prompt.className = "quiz-prompt correct";
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
};

function initDuel() {
  TOOL_INITED.duel = true;
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
  // Show first 30 moves of the Pokémon
  sel.innerHTML = '<option value="">— Selecciona movimiento —</option>' +
    atk.moves.slice(0, 30).map(m =>
      `<option value="${m.move.name}">${prettyName(m.move.name)}</option>`
    ).join("");
  $("duelAtkLabel" + side).textContent = `${atk.name.toUpperCase()} → ${duelState[side === "A" ? "B" : "A"]?.name?.toUpperCase() || "..."}`;
}

async function onMoveSelect(side, moveName) {
  if (!moveName) { duelState["move" + side] = null; runBattle(); return; }
  let m = state.moveCache[moveName];
  if (!m) {
    try {
      const r = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
      m = await r.json();
      state.moveCache[moveName] = m;
    } catch { return; }
  }
  duelState["move" + side] = m;
  runBattle();
}

// ──── Actual stat at a given level (IV 31, EV 0, neutral nature) ────
function actualStat(base, level, isHp = false) {
  const iv = 31, ev = 0;
  const numerator = (2 * base + iv + Math.floor(ev / 4)) * level;
  if (isHp) return Math.floor(numerator / 100) + level + 10;
  return Math.floor(numerator / 100) + 5;
}
function actualStatsFor(pokemon, level) {
  const map = Object.fromEntries(pokemon.stats.map(s => [s.stat.name, s.base_stat]));
  return {
    hp:                actualStat(map.hp                || 0, level, true),
    attack:            actualStat(map.attack            || 0, level),
    defense:           actualStat(map.defense           || 0, level),
    "special-attack":  actualStat(map["special-attack"] || 0, level),
    "special-defense": actualStat(map["special-defense"]|| 0, level),
    speed:             actualStat(map.speed             || 0, level),
  };
}

// ──── Pure damage helper (used by battle + verdict) ────
function calcDamage(atk, def, move, level) {
  if (!move) return null;
  const power = move.power || 0;
  const cat   = move.damage_class?.name || "status";
  if (power === 0 || cat === "status") {
    return { isStatus: true, moveType: move.type?.name || "???" };
  }
  const moveType = move.type.name;
  // Actual battle stats at the chosen level (assume IV 31, EV 0, neutral nature)
  const atkStats = actualStatsFor(atk, level);
  const defStats = actualStatsFor(def, level);
  const A  = cat === "physical" ? atkStats["attack"]  : atkStats["special-attack"];
  const D  = cat === "physical" ? defStats["defense"] : defStats["special-defense"];
  const HP = defStats["hp"];
  const atkTypes = atk.types.map(t => t.type.name);
  const stab = atkTypes.includes(moveType) ? 1.5 : 1;
  const defTypes = def.types.map(t => t.type.name);
  let eff = 1;
  defTypes.forEach(d => {
    const x = TYPE_CHART[moveType] && TYPE_CHART[moveType][d];
    if (x !== undefined) eff *= x;
  });
  const base = (((2 * level / 5 + 2) * power * A) / Math.max(D, 1)) / 50 + 2;
  const min  = Math.floor(base * stab * eff * 0.85);
  const max  = Math.floor(base * stab * eff * 1.0);
  return { isStatus: false, moveType, cat, power, stab, eff, A, D, HP, min, max,
           minPct: HP > 0 ? Math.min(100, (min/HP)*100) : 0,
           maxPct: HP > 0 ? Math.min(100, (max/HP)*100) : 0 };
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
  // Use actual stats at the current level so the slider has visible effect
  const sa = actualStatsFor(A, duelState.level);
  const sb = actualStatsFor(B, duelState.level);
  let html = `<div class="duel-stats-note">Stats reales al nivel <strong>${duelState.level}</strong> (IV 31, EV 0, naturaleza neutra)</div>`;
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
        <div class="duel-total-side ${totalA > totalB ? "winner" : ""}">${totalA}</div>
        <div class="duel-total-label">${A.name.toUpperCase()}</div>
      </div>
      <div class="duel-total-label">TOTAL BASE</div>
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
    att.types.forEach(t => {
      const tn = t.type.name;
      let mult = 1;
      defender.types.forEach(d => {
        const x = TYPE_CHART[tn] && TYPE_CHART[tn][d.type.name];
        if (x !== undefined) mult *= x;
      });
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

function renderBattleAttack(side, atk, def, move) {
  const target = $("duelDmg" + side);
  if (!move) {
    target.innerHTML = '<div class="das-empty">Selecciona un movimiento para calcular el daño</div>';
    return;
  }
  const r = calcDamage(atk, def, move, duelState.level);
  if (r.isStatus) {
    target.innerHTML = `
      <div class="das-headline">SIN DAÑO</div>
      <div class="das-meta">
        <span>${prettyName(move.name)}</span>
        <span class="type-badge type-${r.moveType}">${r.moveType.toUpperCase()}</span>
        <span>Movimiento de estado</span>
      </div>`;
    return;
  }
  let effLabel = "Daño normal", effClass = "";
  if (r.eff >= 4)        { effLabel = `¡SUPER eficaz ×${r.eff}!`; effClass = "das-eff-super"; }
  else if (r.eff >= 2)   { effLabel = `Muy eficaz ×${r.eff}`;       effClass = "das-eff-super"; }
  else if (r.eff === 0)  { effLabel = `Sin efecto ×0`;              effClass = "das-eff-none"; }
  else if (r.eff < 1)    { effLabel = `Poco eficaz ×${r.eff}`;      effClass = "das-eff-not"; }

  const ko = r.minPct >= 100 ? "💀 K.O. SEGURO" : r.maxPct >= 100 ? "⚠ POSIBLE K.O." : "";

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
      <span class="${effClass}">${effLabel}</span>
    </div>
    ${ko ? `<div class="das-ko">${ko}</div>` : ""}`;
}

function renderBattleVerdict(A, B) {
  const body = $("duelVerdictBody");
  // Actual stats at current level — same scaling for both sides, but feels right with the slider
  const sa = actualStatsFor(A, duelState.level);
  const sb = actualStatsFor(B, duelState.level);

  // Speed
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
  function countSuper(att, def) {
    let n = 0;
    att.types.forEach(t => {
      let m = 1;
      def.types.forEach(d => {
        const x = TYPE_CHART[t.type.name] && TYPE_CHART[t.type.name][d.type.name];
        if (x !== undefined) m *= x;
      });
      if (m >= 2) n++;
    });
    return n;
  }
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
      <div class="dv-label">VEREDICTO FINAL</div>
      <div class="dv-winner ${finalWinner === "tie" ? "tie" : "side-" + finalWinner}">
        ${finalWinner === "tie" ? "🤝 COMBATE PAREJO" : "🏆 " + (finalWinner === "A" ? A.name : B.name).toUpperCase()}
      </div>
      <div class="dv-detail">Puntaje: ${sA} a ${sB} (basado en velocidad, aguante, ofensiva y tipos)</div>
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
  Object.keys(TYPE_CHART).forEach(att => defcov[att] = []);
  members.forEach(m => {
    const ts = m.types.map(t => t.type.name);
    Object.keys(TYPE_CHART).forEach(att => {
      let mult = 1;
      ts.forEach(d => {
        const x = TYPE_CHART[att][d];
        if (x !== undefined) mult *= x;
      });
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
  Object.keys(TYPE_CHART).forEach(d => offcov[d] = []);
  members.forEach(m => {
    const stabTypes = m.types.map(t => t.type.name);
    Object.keys(TYPE_CHART).forEach(defType => {
      // does any STAB type hit defType for >=2x?
      let bestMult = 0;
      stabTypes.forEach(att => {
        const x = TYPE_CHART[att][defType];
        const mult = x === undefined ? 1 : x;
        if (mult > bestMult) bestMult = mult;
      });
      if (bestMult >= 2) offcov[defType].push(m);
    });
  });
  $("teamOffCov").innerHTML = Object.keys(TYPE_CHART).map(t => {
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
// Approximate list of legendary/mythical IDs (covers most)
const LEGENDARY_IDS = new Set([
  144,145,146,150,151,
  243,244,245,249,250,251,
  377,378,379,380,381,382,383,384,385,386,
  480,481,482,483,484,485,486,487,488,489,490,491,492,493,
  494,638,639,640,641,642,643,644,645,646,647,648,649,
  716,717,718,719,720,721,
  772,773,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,
  888,889,890,891,892,893,894,895,896,897,898,
  905,
  1001,1002,1003,1004,1007,1008,1009,1010,1014,1015,1016,1017,1020,1021,1022,1023,1024,1025
]);

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
  let pool = [...state.allPokemon];
  if (region) {
    const [mn, mx] = REGIONS[region];
    pool = pool.filter(p => p.id >= mn && p.id <= mx);
  }
  if (noLeg) {
    pool = pool.filter(p => !LEGENDARY_IDS.has(p.id));
  }
  // Type filter (lazy-fetch)
  if (type) {
    if (!state.typeCache[type]) {
      try {
        const r = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const d = await r.json();
        state.typeCache[type] = new Set(
          d.pokemon.map(p => getId(p.pokemon.url)).filter(id => id >= 1 && id <= 1025)
        );
      } catch { state.typeCache[type] = new Set(); }
    }
    pool = pool.filter(p => state.typeCache[type].has(p.id));
  }

  if (pool.length === 0) {
    $("rouResult").innerHTML = '<div class="rou-empty">No hay Pokémon que cumplan esos criterios.</div>';
    btn.disabled = false; btn.textContent = "🎲 GENERAR";
    return;
  }

  // Show animated placeholders
  const result = $("rouResult");
  result.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "rou-card spinning";
    card.innerHTML = `<img src="${spriteFor(pool[Math.floor(Math.random()*pool.length)].id)}"/>`;
    result.appendChild(card);
  }

  // Fetch selected ones (with full data so we can show types)
  const picked = [];
  const usedTypes = new Set();
  const tries = 200;
  let attempts = 0;
  while (picked.length < count && attempts < tries && pool.length > 0) {
    attempts++;
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (picked.find(p => p.id === candidate.id)) continue;

    if (unique) {
      // Need full data to know types — fetch
      try {
        const data = await fetchPokemonByName(candidate.id);
        const ts = data.types.map(t => t.type.name);
        if (ts.some(t => usedTypes.has(t))) continue;
        ts.forEach(t => usedTypes.add(t));
        picked.push(data);
      } catch {}
    } else {
      picked.push(candidate);
    }
  }
  // If unique mode failed to fill, fill remainder normally
  while (picked.length < count) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (picked.find(p => p.id === candidate.id)) continue;
    picked.push(candidate);
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
  btn.disabled = false; btn.textContent = "🎲 GENERAR";
}
