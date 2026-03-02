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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", () => fitCanvas());

try {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
} catch (_) {}

fitCanvas();

/* ===== CHAT MOTOR (kalıcı + her sayfada) ===== */
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
    } catch { return []; }
  }

  function saveMessages(arr) {
    try { localStorage.setItem(KEY_MSG, JSON.stringify(arr)); } catch {}
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
    try { localStorage.setItem(KEY_OPEN, isOpen ? "1" : "0"); } catch {}
  }

  function getOpen() {
    try { return localStorage.getItem(KEY_OPEN) === "1"; } catch { return false; }
  }

  function nowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

  /* ✅ KRİTİK: pointerdown + capture => engine input bozamasın */
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
    // butona basınca header toggle tekrar çalışmasın
    if (e.target === toggleBtn) return;
    setOpen(!drawer.classList.contains("open"));
  });

  // send button
  hardBindPointer(sendBtn, () => send());

  // input: yazı yazabilsin
  input.addEventListener("pointerdown", (e) => e.stopPropagation(), { capture: true });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });

  // ilk yükleme
  renderMessages();
  setOpen(getOpen());

  // dışarıdan kontrol için API
  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!drawer.classList.contains("open")),
  };
}

/* ===== STORE / I18N / SCENES ===== */
const store = new Store({
  lang: "tr",
  coins: 0,
  premium: false,
  ui: { safe: getSafeArea() },
});

const i18n = new I18n(store);
i18n.register({
  tr: { loading: "Yükleniyor...", home_title: "TonCrime", tap_to_earn: "Kazanmak için tıkla" },
  en: { loading: "Loading...", home_title: "TonCrime", tap_to_earn: "Tap to earn" },
});

const assets = new Assets();
const input = new Input(canvas);

const scenes = new SceneManager();
scenes.register("boot", new BootScene({ assets, i18n, scenes }));
scenes.register("home", new HomeScene({ store, input, i18n, assets, scenes }));

// placeholderlar
scenes.register("missions", new SimpleScreenScene({ i18n, titleKey: "Missions" }));
scenes.register("dealer", new SimpleScreenScene({ i18n, titleKey: "Dealer" }));
scenes.register("pvp", new SimpleScreenScene({ i18n, titleKey: "PvP" }));
scenes.register("clan", new SimpleScreenScene({ i18n, titleKey: "Clan" }));

const engine = new Engine({ canvas, ctx, input, scenes });

// Safe-area güncelle
function updateSafeAreaLoop() {
  store.set({ ui: { ...store.get().ui, safe: getSafeArea() } });
  requestAnimationFrame(updateSafeAreaLoop);
}
updateSafeAreaLoop();

// Chat motoru başlat (her sayfada)
ChatMotor(store);

scenes.go("boot");
engine.start();
