import { Engine } from "./engine/Engine.js";
import { Store } from "./engine/Store.js";
import { SceneManager } from "./engine/SceneManager.js";
import { Input } from "./engine/Input.js";
import { Assets } from "./engine/Assets.js";
import { I18n } from "./engine/I18n.js";

import { BootScene } from "./scenes/BootScene.js";
import { HomeScene } from "./scenes/HomeScene.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

const store = new Store({
  lang: "tr",
  coins: 0,
  premium: false,
});

const i18n = new I18n(store);
i18n.register({
  tr: {
    loading: "Yükleniyor...",
    home_title: "TonCrime",
    tap_to_earn: "Kazanmak için tıkla",
    coins: "Coin",
  },
  en: {
    loading: "Loading...",
    home_title: "TonCrime",
    tap_to_earn: "Tap to earn",
    coins: "Coins",
  },
});

const assets = new Assets();
const input = new Input(canvas);

const scenes = new SceneManager();
scenes.register("boot", new BootScene({ assets, i18n, scenes }));
scenes.register("home", new HomeScene({ store, input, i18n, assets }));

const engine = new Engine({ canvas, ctx, input, scenes });

scenes.go("boot");
engine.start();
