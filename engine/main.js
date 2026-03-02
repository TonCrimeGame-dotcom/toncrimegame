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

// Safe-area ölçülerini al
function getSafeArea() {
  const safe = document.getElementById("safe");
  const r = safe.getBoundingClientRect();
  return {
    x: r.left,
    y: r.top,
    w: r.width,
    h: r.height,
  };
}

// Canvas’ı tam ekran + dpr
function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // CSS px ölçüsü
  const cssW = Math.floor(window.innerWidth);
  const cssH = Math.floor(window.innerHeight);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  // Render’ı CSS px ile yapalım (kolay)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", () => {
  fitCanvas();
});

// Telegram WebApp varsa: ekranı büyütmeye çalış
try {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand(); // mümkünse tam ekran
  }
} catch (_) {}

fitCanvas();

const store = new Store({
  lang: "tr",
  coins: 0,
  premium: false,
  ui: {
    safe: getSafeArea(), // scene’ler buradan okuyacak
  },
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

scenes.register("missions", new SimpleScreenScene({ i18n, titleKey: "tab_missions" }));
scenes.register("dealer", new SimpleScreenScene({ i18n, titleKey: "tab_dealer" }));
scenes.register("pvp", new SimpleScreenScene({ i18n, titleKey: "tab_pvp" }));
scenes.register("clan", new SimpleScreenScene({ i18n, titleKey: "tab_clan" }));

const engine = new Engine({ canvas, ctx, input, scenes });

// Safe-area güncelle (resize, orientation)
function updateSafeAreaLoop() {
  store.set({ ui: { ...store.get().ui, safe: getSafeArea() } });
  requestAnimationFrame(updateSafeAreaLoop);
}
updateSafeAreaLoop();

scenes.go("boot");
engine.start();
