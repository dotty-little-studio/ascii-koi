// Viewer-local clock only. No location lookup, network request, or external library.
export const THEME_STORAGE_KEY = "ascii-koi-theme-v1";
export const THEME_MODES = Object.freeze(["auto", "day", "dusk", "night"]);
const PACES = Object.freeze({ day: 1, dusk: 0.88, night: 0.72 });

export function themeForHour(hour) {
  return hour >= 6 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "dusk" : "night";
}

export function createThemeController({ now = () => new Date(), storage = null } = {}) {
  let saved = "auto";
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    if (THEME_MODES.includes(value)) saved = value;
  } catch { /* Storage is optional, including in restricted/private browsing. */ }
  const listeners = new Set();
  let lastNotifiedMode = saved;
  const state = {
    mode: saved,
    resolved: saved === "auto" ? themeForHour(now().getHours()) : saved,
    night: 0,
    dusk: 0,
    pace: 1,
    setMode(mode) {
      if (!THEME_MODES.includes(mode)) return false;
      state.mode = mode;
      try { storage?.setItem(THEME_STORAGE_KEY, mode); } catch { /* Keep working in memory. */ }
      state.refresh();
      return true;
    },
    get resolvedMode() { return state.resolved; },
    settle() {
      state.night = state.resolved === "night" ? 1 : 0;
      state.dusk = state.resolved === "dusk" ? 1 : 0;
      state.pace = PACES[state.resolved];
      return state;
    },
    refresh() {
      const previous = state.resolved;
      state.resolved = state.mode === "auto" ? themeForHour(now().getHours()) : state.mode;
      for (const fn of listeners) fn(state);
      if (previous !== state.resolved || lastNotifiedMode !== state.mode) {
        lastNotifiedMode = state.mode;
        if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
          window.dispatchEvent(new CustomEvent("koi-theme-change", { detail: { mode: state.mode, resolvedMode: state.resolved } }));
        }
      }
      return state.resolved;
    },
    update(dt) {
      // Wall-clock transitions remain gentle even when the swimming clock slows.
      const safeDt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.25)) : 0;
      const alpha = 1 - Math.exp(-safeDt / 2.4);
      state.night += ((state.resolved === "night" ? 1 : 0) - state.night) * alpha;
      state.dusk += ((state.resolved === "dusk" ? 1 : 0) - state.dusk) * alpha;
      state.pace += (PACES[state.resolved] - state.pace) * alpha;
      return state;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  state.night = state.resolved === "night" ? 1 : 0;
  state.dusk = state.resolved === "dusk" ? 1 : 0;
  state.pace = PACES[state.resolved];
  return state;
}

export function installThemeControls(state, doc = document) {
  if (!doc.body?.appendChild || doc.getElementById?.("koi-theme-controls")) return () => {};
  const style = doc.createElement("style");
  style.textContent = `
    #koi-theme-controls { position:fixed; right:max(12px,env(safe-area-inset-right)); bottom:max(12px,env(safe-area-inset-bottom)); display:flex; gap:3px; padding:4px; border:1px solid rgba(80,104,102,.2); border-radius:28px; background:rgba(253,254,253,.86); color:#425754; z-index:5; box-shadow:0 2px 14px rgba(23,44,47,.05); transition:background 2.4s,color 2.4s,border-color 2.4s; }
    #koi-theme-controls button { appearance:none; display:grid; place-items:center; width:40px; height:40px; padding:0; border:1px solid transparent; border-radius:50%; color:inherit; background:transparent; font:20px/1 system-ui,sans-serif; cursor:pointer; touch-action:manipulation; }
    #koi-theme-controls button[aria-pressed="true"] { background:rgba(77,109,104,.12); border-color:rgba(65,94,90,.35); }
    #koi-theme-controls button:hover { background:rgba(77,109,104,.16); }
    #koi-theme-controls button:focus-visible { outline:2px solid currentColor; outline-offset:2px; }
    #koi-theme-controls svg { width:21px; height:21px; fill:none; stroke:currentColor; stroke-width:1.65; stroke-linecap:round; stroke-linejoin:round; pointer-events:none; }
    html[data-koi-theme="dusk"] #koi-theme-controls { color:#674d43; background:rgba(245,225,205,.88); border-color:rgba(116,83,68,.28); }
    html[data-koi-theme="night"] #koi-theme-controls { color:#c1d6db; background:rgba(18,37,52,.9); border-color:rgba(161,194,202,.28); }
    html[data-koi-theme="night"] #koi-theme-controls button[aria-pressed="true"] { background:rgba(166,204,212,.17); border-color:rgba(185,219,225,.5); }
    html[data-koi-theme="night"] #koi-theme-controls button:hover { background:rgba(166,204,212,.22); }
    body > aside { max-width:calc(100vw - 220px); transition:color 2.4s; }
    html[data-koi-theme="night"] body > aside { color:#a6bdc4 !important; }
    html[data-koi-theme="dusk"] body > aside { color:#806154 !important; }
    @media(max-width:480px) { #koi-theme-controls { right:8px; bottom:max(8px,env(safe-area-inset-bottom)); } #koi-theme-controls button { width:38px; height:40px; } body > aside { max-width:calc(100vw - 198px); font-size:9px !important; left:10px !important; } }
    @media(prefers-reduced-motion:reduce) { #koi-theme-controls, body > aside { transition:none; } }
  `;
  (doc.head || doc.body).appendChild(style);
  const group = doc.createElement("div");
  group.id = "koi-theme-controls";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Pond light and pace / 池の明るさと泳ぎ");
  const items = [
    ["auto", "Automatic · device local time / 自動・端末の現地時刻", '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'],
    ["day", "Day / 昼", '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>'],
    ["dusk", "Evening / 夕方", '<path d="M3 16h18M5 20h14M7 16a5 5 0 0 1 10 0M12 4v3M4 9l2 2m12 0 2-2"/>'],
    ["night", "Night / 夜", '<path d="M19.8 14.2A8 8 0 0 1 9.8 4.2 8 8 0 1 0 19.8 14.2Z"/>']
  ];
  const buttons = new Map();
  for (const [mode, label, paths] of items) {
    const button = doc.createElement("button");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(state.mode === mode));
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
    button.addEventListener("click", () => state.setMode(mode));
    group.appendChild(button);
    buttons.set(mode, button);
  }
  for (const type of ["pointerdown", "pointermove"]) group.addEventListener(type, event => event.stopPropagation());
  doc.body.appendChild(group);
  const sync = () => {
    doc.documentElement.dataset.koiTheme = state.resolved;
    for (const [mode, button] of buttons) button.setAttribute("aria-pressed", String(mode === state.mode));
  };
  sync();
  const unsubscribe = state.subscribe(sync);
  const resume = () => { if (!doc.hidden) state.refresh(); };
  const interval = setInterval(() => state.refresh(), 30000);
  doc.addEventListener("visibilitychange", resume);
  return () => { clearInterval(interval); unsubscribe(); doc.removeEventListener("visibilitychange", resume); group.remove(); style.remove(); };
}

let storage = null;
try { storage = globalThis.localStorage; } catch { /* Unavailable storage is normal. */ }
export const koiTheme = createThemeController({ storage });
globalThis.koiTheme = koiTheme;
if (typeof document !== "undefined") installThemeControls(koiTheme, document);
