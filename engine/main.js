import { Engine } from "./engine/Engine.js";
import { Store } from "./engine/Store.js";
import { SceneManager } from "./engine/SceneManager.js";
import { Input } from "./engine/Input.js";
import { Assets } from "./engine/Assets.js";
import { I18n } from "./engine/I18n.js";

import { BootScene } from "./scenes/BootScene.js";
import { HomeScene } from "./scenes/HomeScene.js";
import { SimpleScreenScene } from "./scenes/SimpleScreenScene.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

// Safe-area ölçüsü
function getSafeArea() {
  const safe = document.getElementById("safe");
  const r = safe.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

// Canvas fit (DPR)
function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = Math.floor(window.innerWidth);
  const cssH = Math.floor(window.innerHeight);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", () => fitCanvas());

// Telegram WebApp varsa genişlet
try {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
} catch (_) {}

fitCanvas();

// ===== CHAT (kalıcı) =====
function initChat(store) {
  const KEY_MSG = "toncrime_chat_messages_v1";
  const KEY_OPEN = "toncrime_chat_open_v1";

  const drawer = document.getElementById("chatDrawer");
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
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function send() {
    const text = (input.value || "").trim();
    if (!text) return;

    const msgs = loadMessages();
    msgs.push({ user: username(), text, time: nowHHMM() });

    // çok büyümesin: son 200 mesaj kalsın
    if (msgs.length > 200) msgs.splice(0, msgs.length - 200);

    saveMessages(msgs);
    input.value = "";
    renderMessages();
  }

  // Toggle
  toggleBtn.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));

  // Header’a tıklayınca da aç/kapat (buton hariç)
  document.getElementById("chatHeader").addEventListener("click", (e) => {
    if (e.target === toggleBtn) return;
    setOpen(!drawer.classList.contains("open"));
  });

  // Send
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });

  // İlk yükleme
  renderMessages();
  setOpen(getOpen());
}

// ===== STORE / I18N / SCENES =====
const store = new Store({
  lang: "tr",
  coins: 0,
  premium: false,
  ui: { safe: getSafeArea() },
});

const i18n = new I18n(store);
i18n.register({
  tr: {
    loading: "Yükleniyor...",
    home_title: "TonCrime",
    tap_to_earn: "Kazanmak için tıkla",
    coins: "Coin",
    tab_home: "Ana",
    tab_missions: "Görevler",
    tab_dealer: "Silah Kaçakçısı",
    tab_pvp: "PvP",
    tab_clan: "Klan",
  },
  en: {
    loading: "Loading...",
    home_title: "TonCrime",
    tap_to_earn: "Tap to earn",
    coins: "Coins",
    tab_home: "Home",
    tab_missions: "Missions",
    tab_dealer: "Arms Dealer",
    tab_pvp: "PvP",
    tab_clan: "Clan",
  },
});

const assets = new Assets();
const input = new Input(canvas);

const scenes = new SceneManager();
scenes.register("boot", new BootScene({ assets, i18n, scenes }));
scenes.register("home", new HomeScene({ store, input, i18n, assets, scenes }));

// placeholder scene’ler
scenes.register("missions", new SimpleScreenScene({ i18n, titleKey: "tab_missions" }));
scenes.register("dealer", new SimpleScreenScene({ i18n, titleKey: "tab_dealer" }));
scenes.register("pvp", new SimpleScreenScene({ i18n, titleKey: "tab_pvp" }));
scenes.register("clan", new SimpleScreenScene({ i18n, titleKey: "tab_clan" }));

const engine = new Engine({ canvas, ctx, input, scenes });

// Safe-area sürekli güncelle
function updateSafeAreaLoop() {
  store.set({ ui: { ...store.get().ui, safe: getSafeArea() } });
  requestAnimationFrame(updateSafeAreaLoop);
}
updateSafeAreaLoop();

// Chat’i başlat
initChat(store);

scenes.go("boot");
engine.start();
