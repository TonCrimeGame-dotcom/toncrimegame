import { Engine } from "./engine/Engine.js";
import { Store } from "./engine/Store.js";
import { SceneManager } from "./engine/SceneManager.js";
import { Input } from "./engine/Input.js";
import { Assets } from "./engine/Assets.js";
import { I18n } from "./engine/I18n.js";

import { BootScene } from "./scenes/BootScene.js";
import { HomeScene } from "./scenes/HomeScene.js";
import { SimpleScreenScene } from "./scenes/SimpleScreenScene.js";
import { CoffeeShopScene } from "./scenes/CoffeeShopScene.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function getSafeArea() {
  const safe = document.getElementById("safe");
  const r = safe.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = Math.floor(window.innerWidth);
  const cssH = Math.floor(window.innerHeight);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  // Draw in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", () => fitCanvas());

try {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
} catch (_) {}

fitCanvas();

/* =========================
   PERSISTENT STORE
========================= */
const STORE_KEY = "toncrime_store_v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function saveStore(state) {
  try {
    const copy = JSON.parse(JSON.stringify(state));
    // runtime-only
    if (copy.ui) delete copy.ui.safe;
    localStorage.setItem(STORE_KEY, JSON.stringify(copy));
  } catch {}
}

const defaultState = {
  lang: "tr",
  coins: 0,
  premium: false,
  player: {
    username: "Player",
    level: 1,
    xp: 30,
    xpToNext: 100,
    weaponName: "Silah Yok",
    weaponBonus: "+0%",
    energy: 10,
    energyMax: 10,
    energyIntervalMs: 5 * 60 * 1000,
    lastEnergyAt: Date.now(),
  },
  ui: { safe: getSafeArea() },
};

const loaded = loadStore();
const initial = loaded
  ? {
      ...defaultState,
      ...loaded,
      player: { ...defaultState.player, ...(loaded.player || {}) },
      ui: { safe: getSafeArea() },
    }
  : defaultState;

const store = new Store(initial);

// autosave (debounced)
let _lastSaveAt = 0;
function autosaveLoop() {
  const now = Date.now();
  if (now - _lastSaveAt > 300) {
    saveStore(store.get());
    _lastSaveAt = now;
  }
  requestAnimationFrame(autosaveLoop);
}
autosaveLoop();

/* =========================
   ENERGY REGEN (GLOBAL)
========================= */
function tickEnergy() {
  const s = store.get();
  const p = s.player;
  if (!p) return;

  const now = Date.now();
  const interval = Math.max(10_000, Number(p.energyIntervalMs || 300000));
  const maxE = Math.max(1, Number(p.energyMax || 10));
  let e = Math.max(0, Math.min(maxE, Number(p.energy || 0)));

  if (e >= maxE) {
    // keep lastEnergyAt fresh-ish
    if (p.lastEnergyAt !== now) {
      store.set({ player: { ...p, energy: maxE, lastEnergyAt: now } });
    }
    return;
  }

  const elapsed = now - Number(p.lastEnergyAt || now);
  if (elapsed < interval) return;

  const gained = Math.floor(elapsed / interval);
  if (gained <= 0) return;

  const newE = Math.min(maxE, e + gained);
  const newLast = Number(p.lastEnergyAt || now) + gained * interval;
  store.set({ player: { ...p, energy: newE, lastEnergyAt: newLast } });
}
setInterval(tickEnergy, 1000);

/* =========================
   HUD MOTOR (HTML OVERLAY)
========================= */
function HUDMotor(store) {
  const elUsername = document.getElementById("hudUsername");
  const elCoins = document.getElementById("hudCoins");
  const elWeaponName = document.getElementById("hudWeaponName");
  const elWeaponBonus = document.getElementById("hudWeaponBonus");
  const elXpFill = document.getElementById("hudXpFill");
  const elXpText = document.getElementById("hudXpText");
  const elEnergyFill = document.getElementById("hudEnergyFill");
  const elEnergyText = document.getElementById("hudEnergyText");

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }
  function fmtMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function render() {
    const s = store.get();
    const p = s.player || {};

    elUsername.textContent = p.username ?? "Player";
    elCoins.textContent = `Coin: ${s.coins ?? 0}`;
    elWeaponName.textContent = p.weaponName ?? "Silah Yok";
    elWeaponBonus.textContent = ` ${p.weaponBonus ?? "+0%"}`;

    const xp = Math.max(0, Number(p.xp || 0));
    const xpToNext = Math.max(1, Number(p.xpToNext || 100));
    const xpPct = clamp01(xp / xpToNext);
    elXpFill.style.width = `${Math.max(2, xpPct * 100)}%`;
    elXpText.textContent = `LVL ${p.level ?? 1} • XP ${xp}/${xpToNext}`;

    const e = Math.max(0, Number(p.energy || 0));
    const eMax = Math.max(1, Number(p.energyMax || 10));
    const ePct = clamp01(e / eMax);
    elEnergyFill.style.width = `${Math.max(2, ePct * 100)}%`;

    const interval = Math.max(10_000, Number(p.energyIntervalMs || 300000));
    const lastAt = Number(p.lastEnergyAt || Date.now());
    const now = Date.now();
    const untilNext = e >= eMax ? 0 : Math.max(0, interval - (now - lastAt));
    const timeText = e >= eMax ? "FULL" : fmtMMSS(untilNext);
    elEnergyText.textContent = `ENERJİ ${e}/${eMax} • ${timeText}`;

    requestAnimationFrame(render);
  }

  render();
}

/* =========================
   CHAT MOTOR (HTML OVERLAY)
========================= */
function ChatMotor(store) {
  const KEY_MSG = "toncrime_chat_messages_v1";
  const KEY_OPEN = "toncrime_chat_open_v1";

  const drawer = document.getElementById("chatDrawer");
  const header = document.getElementById("chatHeader");
  const toggleBtn = document.getElementById("chatToggle");
  const msgBox = document.getElementById("chatMessages");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");

  const username = () => store.get()?.player?.username ?? "Player";

  function loadMessages() {
    try {
      const raw = localStorage.getItem(KEY_MSG);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveMessages(arr) {
    try {
      localStorage.setItem(KEY_MSG, JSON.stringify(arr));
    } catch {}
  }
  function renderMessages() {
    const msgs = loadMessages();
    msgBox.innerHTML = "";
    for (const m of msgs) {
      const row = document.createElement("div");
      row.className = "msg";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = m.time ?? "--:--";

      const text = document.createElement("div");
      text.textContent = `${m.user ?? "?"}: ${m.text ?? ""}`;

      row.appendChild(meta);
      row.appendChild(text);
      msgBox.appendChild(row);
    }
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  function setOpen(isOpen) {
    if (isOpen) {
      drawer.classList.add("open");
      toggleBtn.textContent = "Kapat";
    } else {
      drawer.classList.remove("open");
      toggleBtn.textContent = "Aç";
    }
    try {
      localStorage.setItem(KEY_OPEN, isOpen ? "1" : "0");
    } catch {}
  }
  function getOpen() {
    try {
      return localStorage.getItem(KEY_OPEN) === "1";
    } catch {
      return false;
    }
  }

  function nowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
      2,
      "0"
    )}`;
  }

  function send() {
    const text = (input.value || "").trim();
    if (!text) return;

    const msgs = loadMessages();
    msgs.push({ user: username(), text, time: nowHHMM() });
    if (msgs.length > 200) msgs.splice(0, msgs.length - 200);

    saveMessages(msgs);
    input.value = "";
    renderMessages();
  }

  function hardBindPointer(el, handler) {
    el.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      },
      { capture: true }
    );
  }

  hardBindPointer(toggleBtn, () => setOpen(!drawer.classList.contains("open")));
  hardBindPointer(header, (e) => {
    if (e.target === toggleBtn) return;
    setOpen(!drawer.classList.contains("open"));
  });
  hardBindPointer(sendBtn, () => send());

  input.addEventListener("pointerdown", (e) => e.stopPropagation(), { capture: true });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });

  renderMessages();
  setOpen(getOpen());
}

/* =========================
   I18N
========================= */
const i18n = new I18n(store);
i18n.register({
  tr: { loading: "Yükleniyor..." },
  en: { loading: "Loading..." },
});

/* =========================
   ASSETS
========================= */
const assets = new Assets();

// Home background
assets.image("background", "./src/assets/ui/background.jpg");

// menu carousel images
assets.image("missions", "./src/assets/missions.jpg");
assets.image("pvp", "./src/assets/pvp.jpg");
assets.image("weapons", "./src/assets/weapons.jpg");
assets.image("nightclub", "./src/assets/nightclub.jpg");
assets.image("coffeeshop", "./src/assets/coffeeshop.jpg");
assets.image("xxx", "./src/assets/xxx.jpg");

// NOTE: coffeeshop_book.png ve coffeeshop_menu.png CoffeeShopScene içinde Image() ile yükleniyor
// logo/yton icon index.html'de img tag ile yüklü

/* =========================
   INPUT / SCENES / ENGINE
========================= */
const input = new Input(canvas);

const scenes = new SceneManager();
scenes.register("boot", new BootScene({ assets, i18n, scenes }));
scenes.register("home", new HomeScene({ store, input, i18n, assets, scenes }));

// CoffeeShop
scenes.register("coffeeshop", new CoffeeShopScene({ store, input, i18n, assets, scenes }));

// diğer sahneler şimdilik basit placeholder
scenes.register("missions", new SimpleScreenScene({ i18n, titleKey: "Missions" }));
scenes.register("dealer", new SimpleScreenScene({ i18n, titleKey: "Dealer" }));
scenes.register("pvp", new SimpleScreenScene({ i18n, titleKey: "PvP" }));
scenes.register("clan", new SimpleScreenScene({ i18n, titleKey: "Clan" }));
scenes.register("nightclub", new SimpleScreenScene({ i18n, titleKey: "Nightclub" }));
scenes.register("xxx", new SimpleScreenScene({ i18n, titleKey: "XXX" }));

const engine = new Engine({ canvas, ctx, input, scenes });

function updateSafeAreaLoop() {
  store.set({ ui: { ...store.get().ui, safe: getSafeArea() } });
  requestAnimationFrame(updateSafeAreaLoop);
}
updateSafeAreaLoop();

// Global HTML overlay motors
HUDMotor(store);
ChatMotor(store);

// Start
scenes.go("boot");
engine.start();
